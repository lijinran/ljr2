'use strict';
var minify = require('html-minifier').minify;
module.exports = function (ret, conf, settings, opt) {
    var frame = fis.config.get('frame', {}),
        map = frame.framework;
    var aliasConfig = frame.paths || {};
    map.combo = map.combo || !!opt.pack;
    map.urlPattern = map.urlPattern || '';
    map.comboPattern = map.comboPattern || '??';
    map.hash = fis.util.md5(Date.now() + '-' + Math.random());
    map.alias = {};
    map.deps = {};
    //makeAlias(ret.src['/package.json'], map, ret);

    function relative(url) {
        if (url) {
            var reg = new RegExp('\/?' + frame.prefix + '/', "i");
            return url.replace(reg, "")
        }
    }

    fis.util.map(aliasConfig, function (name, subpath) {
        var file = ret.src['/' + subpath.replace(/^\//, '').replace(/\.js$/, "") + ".js"];
        if (file) {

            map.alias[file.moduleId || file.getId()] = file.domain ? file.domain + subpath : (relative(file.map.uri));
        } else {
            map.alias[name] = subpath;
        }
    });

    var aliased = {};
    fis.util.map(map.alias, function (alias, id) {
        aliased[id] = alias;
    });


    function dealRequire(subPath, file, placeholder) {
        let addJs = "",
            addCss = "",
            realPath = subPath.split("?")[0];
        let isJs = /.*\.js$/i.test(realPath),
            isCss = /.*\.css$/i.test(realPath),
            $url = file.url;

        if (isJs) {
            addJs = `<script src="${subPath}" type="text/javascript"></script>\r\n`;
            file.setContent(
                placeholder ? file.getContent().replace(/([\s\S]*<\/script\s?>\s*)/i, function ($1) { return $1 + `${addJs}` }) : file.getContent().replace(/(<script[^>]*?>.*|<\/body>)/i, function ($1) { return addJs + $1 })
            );
        } else if (isCss) {
            addCss = `<link href="${subPath}" rel="stylesheet">\r\n`;
            file.setContent(
                file.getContent().replace(/(<\/head>)/i, addCss + '$1')
            );
        }

    }

    var views = [],
        LINKS = {},
        REPLACE_LINK_FILES = [];
    //获取release后的url
    let getReleaseUrl = function (url) {
        let urlFile = ret.src['/' + url.replace(/^\//, '')];
        if (!urlFile) {
            urlFile = fis.file(url)
        }

        if (urlFile.map && urlFile.map.pkg) {
            let _pkg = urlFile.map.pkg
            return relative(ret.map.pkg[_pkg].uri)
        } else {
            // return urlFile.domain ? urlFile.domain + relative(urlFile.map.uri) : relative(urlFile.map.uri)
            return urlFile.domain ? urlFile.domain + urlFile.subpath : relative(urlFile.map.uri)
        }
    };
    fis.util.map(ret.src, function (subpath, file) {
        var id = file.moduleId || file.getId(); let test = 0;


        if (file.isViews && file.isText()) {
            let s = new Set();
            views.push(file);
            LINKS[file.filename] = relative(file.url);
            file.base && file.base.forEach(url => {
                s.add(getReleaseUrl(url))
            });

            Array.from(s).forEach(url => {
                dealRequire(url, file)
            });
            if (file.requires.length) {
                file.setContent(
                    file.getContent().replace(/(.*<\/script\s?>\s*)/i, '$1' + `<script>require.config(__FRAMEWORK_CONFIG__)</script>\r\n`)
                );
                let _requ = new Set();
                file.requires.forEach(url => {
                    if (url !== undefined && url !== null) {
                        _requ.add(getReleaseUrl(url))
                    }

                });
                let urls = new Set(Array.from(_requ).filter(x => !s.has(x)));
                Array.from(urls).forEach(url => dealRequire(url, file, 1));
            }


        } else if (file.isMod && (file.isJsLike || file.isCssLike)) {
            if (file.isJsLike && !map.alias.hasOwnProperty(id)) {

                map.alias[id] = file.domain ? file.domain + subpath : relative(file.map.uri);
            }
            if (file.requires.length) {
                map.deps[id] = file;
            }
        } else if (id in aliased) {
            if (file.requires.length) {
                map.deps[id] = file;
            }
        }

        if (file.isLink) {
            REPLACE_LINK_FILES.push(file)
        }
        if (file.isPack) {
            file.release = frame.prefix + "/i.txt";
        }
    });


    fis.util.map(map.deps, function (id, file) {
        var deps = [];
        file.requires.forEach(function (depId) {
            var _depId = /\.js$/.test(depId) ? depId.replace(/\.js$/, "") : depId + ".js";
            if (map.alias.hasOwnProperty(depId)) {
                deps.push(depId);
            } else if (map.alias.hasOwnProperty(_depId)) {
                deps.push(_depId);
            } else if (aliased.hasOwnProperty(depId)) {
                deps.push(aliased[depId]);
            } else if (ret.ids.hasOwnProperty(depId)) {
                deps.push(ret.ids[depId].getId());
            } else {
                fis.log.warning('undefined module [' + depId + '] require from [' + file.subpath + ']');
            }
        });
        if (deps.length) {
            map.deps[id] = deps;
        } else {
            delete map.deps[id];
        }
    });

    if (map.cache) {
        var callback = map.defineCSSCallback || 'require.defineCSS';
        fis.util.map(ret.src, function (subpath, file) {
            if (file.isCssLike && file.isMod) {
                var content = file.getContent();
                content = callback + "('" + file.getId() + "', " + JSON.stringify(content) + ');';
                var f = fis.file(file.realpath);
                f.setContent(content);
                f.compiled = true;
                f.release = file.release + '.js';
                ret.pkg[subpath + '.js'] = f;
            }
        });
    }

    var stringify = JSON.stringify(map, null, opt.optimize ? null : 4),
        sLink = JSON.stringify(LINKS);
    views.forEach(function (file) {
        var content = file.getContent();
        var hasChange = false;

        content = content.replace(/\b__FRAMEWORK_CONFIG__\b/g, function () {
            hasChange = true;
            return stringify;
        });

        content = content.replace(/\b__FRAMEWORK_NAME__\b/g, function () {
            hasChange = true;
            return map.name;
        });

        if (hasChange) {
            file.setContent(content);
            opt.beforeCompile(file);
        }
        if (file.isProd) {
            content = minify(content, {
                removeComments: true,
                collapseWhitespace: true,
                conservativeCollapse: true,
                removeAttributeQuotes: true,
                minifyJS: true,
                minifyCSS: true
            });
            file.setContent(content);
        }
    });
    REPLACE_LINK_FILES.forEach(File => {
        var content = File.getContent();
        File.setContent(content.replace(/\b_LINK_\b/g, sLink));
        opt.beforeCompile(File);
    })
};

