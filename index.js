//vi foo/index.js
var fis = module.exports = require('fis3');

fis.require.prefixes.unshift('ljr2');
fis.cli.name = 'ljr2';
fis.cli.info = require('./package.json');
fis.cli.version = require('./version.js');

var frameWork = require('./plugin/frame-work.js');

var plugins = {

};
var plugin = function (name, options) {
    var localPlugin = plugins[name]
    if (typeof localPlugin === 'function') {
        localPlugin.options = options
        return localPlugin
    } else {
        return fis.plugin.apply(fis, arguments)
    }
}

fis.set('project.ignore', ['node_modules/**', '.gitignore', '**/_*.scss', '.docs/**', '.dist/**', '.git/**', '.svn/**', '.idea/**', 'fis-conf.js']);
// 启用插件
fis.hook('relative');

// 让所有文件，都使用相对路径。
fis.match('**', {
    relative: true
})
//代码检查
fis.config.set('modules.lint.js', 'jshint');
//configure plugin settings
fis.config.set('settings.lint.jshint', {
    //ignored some files
    //ignored : 'static/libs/**.js',
    ignored: ['lib/**'],

    //using Chinese reporter
    i18n: 'zh-CN',

    //jshint options
    camelcase: true,
    curly: true,
    eqeqeq: true,
    forin: true,
    immed: true,
    latedef: true,
    newcap: true,
    noarg: true,
    noempty: true,
    node: true,
    esnext: "esversion: 6"
});

fis.config.set('modules.spriter', 'csssprites');

// 替换插件资源路径插件
function replacer(opt) {
    if (!Array.isArray(opt)) {
        opt = [opt];
    }
    var r = [];
    opt.forEach(function (raw) {
        r.push(fis.plugin('replace', raw));
    });
    return r;
};

fis.ljr = function (options) {
    var framework = {
        cache: false, //开启localstorage缓存
        combo: false, // 开启合并
        comboPattern: "",
        urlPattern: "", // 静态资源加载路径模式
        urlPrefix: "" // 静态资源加载路径模式
    };
    var OPTIONS = fis.util.merge({
        framework: framework
    }, options);

    var _u = "",
        _ary = Array.of(OPTIONS.name, OPTIONS.version);
    _ary.forEach(str => str && (_u += '/' + str));
    fis.set("frame", {
        framework: framework,
        paths: OPTIONS.paths,
        prefix: _u
    });


    fis.match('**', {
            useHash: false,
            release: false
        })
        .match(/^\/(?!lib).*\/[^/]+\.js$/i, {
            // 设置js文件为babel解析，支持es6的写法。
            isJsLike: true,
            lint: plugin('jshint', {
                ignored: ['lib/**.js'],
            }),
            parser: plugin('babel2', {
                // babel options
            })
        })
        .match(/\.scss$/i, {
            rExt: '.css', // from .scss to .css
            parser: plugin('sass3', {
                //fis-parser-sass option
            })
        })
        .match('::package', {
            // npm install [-g] fis3-postpackager-loader
            // 分析 __RESOURCE_MAP__ 结构，来解决资源加载问题
            spriter: plugin('csssprites', {
                htmlUseSprite: true,
                layout: 'matrix',
                scale: 0.5,
                margin: '15',
                styleReg: /(<style(?:(?=\s)[\s\S]*?["'\s\w\/\-]>|>))([\s\S]*?)(<\/style\s*>|$)/ig
            }),
            postpackager: frameWork
        })
        .match('/{views,components,modules}/**', {
            //query: '?=t' + Date.now()
        })
        .match('/components/common/common.js', {
            isLink: true,
            isMod: true,
            useCache: false,
            release: _u + "/static/common.js"
        })
        .match(/^\/views\/.*?([^/]+\.js)$/, {
            release: _u + "/static/$1"
        })
        .match(/^\/(?:views\/modules|components\/widget|modules)\/.*?([^/]+)\.js$/, {
            isMod: true,
            moduleId: "$1",
            id: '$1',
            release: _u + "/static/$1"
        })
        .match(/^\/views\/(?!modules).*\.js$/, {
            postprocessor: function (content, file) {
                return content.replace(/require(\(.*\))/g, 'require.async$1');
            },
        })
        .match('reset.(css|scss)', {
            packOrder: -100 //用来控制合并时的顺序，值越小越在前面。配合 packTo 一起使用。
        })
        .match(/^\/components\/widget\/.*\.(?:css|scss)$/i, {
            packOrder: 10
        })
        .match(/^\/components\/.*\.(?:css|scss)$/i, {
            packOrder: 20
        })
        .match(/^\/views\/.*\.(?:css|scss)$/i, {
            packOrder: 30
        })
        .match(/^\/(?:views|components|vue)\/.*?([^/]+)(\.vue)$/i, {
            isMod: true,
            moduleId: "$1",
            id: '$1',
            rExt: '.js',
            parser: plugin('vue'),
            release: _u + "/static/vue/$1"
        })
        .match(/^\/(?:views|components).*\.(?:css|scss)$/, {
            useSprite: true,
            isCssLike: true,
            packTo: "/modules/style.css",
            isPack: true,
            release: true
        })
        .match(/.*\/([^/]+)\.css\.map$/i, {
            isPack: true,
            release: true
        })
        .match('/modules/(**.css)', {
            release: _u + '/static/$1'
        })
        .match('/lib/**', {
            release: _u + "/$0"
        })
        .match(/.*?([^/]+\.(?:svg|tif|tiff|wbmp|png|bmp|fax|gif|ico|jfif|jpe|jpeg|jpg|woff|cur))$/, {
            //useHash: true,
            release: _u + '/static/images/$1'
        })
        .match(/.*?([^/]+\.(?:mp3|ogg|wav))$/, {
            //useHash: true,
            release: _u + '/static/audio/$1'
        })
        .match('/views/tpl/**.html', {
            isPack: true
        })
        .match('/views/tpl/**.js', {
            isPack: true

        })
        .match(/^(?!.*tpl).*\/([^/]+\.html)$/i, {
            isViews: true,
            useCache: false,
            postprocessor: function (content, file, settings) {
                file.base = OPTIONS.base;
                return content.replace(/<!--([\s\S]*?)-->/g, '')
            },
            release: _u + '/$1'
        })
        .match(/^.*tpl.*\/([^/]+\.js)$/i, {
            packTo: "/views/tpl.js",
            isPack: true,
            release: true
        })
        .hook('amd', {
            paths: OPTIONS.paths,
            shim: OPTIONS.shim,
            forwardDeclaration: true,
            skipBuiltinModules: true
        });



    fis.match('**', {

        deploy: plugin('local-deliver', {
            to: OPTIONS.deploy
        })
        // deploy: replacer([{
        //     from: 'static/',
        //     to: OPTIONS.domain + 'static/',
        // }]).concat(fis.plugin('local-deliver', {
        //     to: OPTIONS.deploy
        // }))

    });


    fis.media('prod')
        .match('/lib/**', {
            domain: OPTIONS.domain
        })
        .match(/^\/(?!lib).*\/[^/]+\.js$/i, {
            useHash: true,
            query: "",
            optimizer: plugin('uglify-js', {
                // option of uglify-js
                mangle: {
                    except: 'exports, module, require, define,$'
                },
                compress: {
                    drop_console: true
                }
            })

        })
        .match(/\.(css|scss)$/i, {
            optimizer: plugin('clean-css')
        })
        .match('/modules/(**.css)', {
            useHash: true
        })
        .match(/\.png$/i, {
            optimizer: plugin('png-compressor')
        })
        .match(/.*?([^/]+\.(?:svg|tif|tiff|wbmp|png|bmp|fax|gif|ico|jfif|jpe|jpeg|jpg|woff|cur))$/, {
            useHash: true
        })
        .match(/^(?!.*tpl).*\/([^/]+\.html)$/i, {
            isProd: true,
        }).match('**', {
            deploy: plugin('local-deliver', {
                to: OPTIONS.prodPloay || OPTIONS.deploy
            })
        })
    // ---oss版
    fis.media('prodoss')
        .match('/lib/**', {
            domain: OPTIONS.ossDomain,
        })
        .match(/^\/(?!lib).*\/[^/]+\.js$/i, {
            useHash: true,
            query: "",
            optimizer: plugin('uglify-js', {
                // option of uglify-js
                mangle: {
                    except: 'exports, module, require, define,$'
                },
                compress: {
                    drop_console: true
                }
            })

        })
        .match(/\.(css|scss)$/i, {
            optimizer: plugin('clean-css')
        })
        .match('/modules/(**.css)', {
            useHash: true
        })
        .match(/\.png$/i, {
            optimizer: plugin('png-compressor')
        })
        .match(/.*?([^/]+\.(?:svg|tif|tiff|wbmp|png|bmp|fax|gif|ico|jfif|jpe|jpeg|jpg|woff|cur))$/, {
            useHash: true
        })
        .match(/^(?!.*tpl).*\/([^/]+\.html)$/i, {
            isProd: true,
        }).match('**', {
            // deploy: plugin('local-deliver', {
            //     to: OPTIONS.prodPloay || OPTIONS.prodOss
            // })
            // 增加OSS Domain Cdn前辍
            deploy: replacer([{
                from: 'static/',
                to: OPTIONS.ossDomain + 'static/',
            }, {
                from: '//lib/',
                to: '/lib/',
            }
            ]).concat(fis.plugin('local-deliver', {
                to: OPTIONS.prodPloay || OPTIONS.deploy
            })).concat(fis.plugin('obf', {
                compact: false,
                controlFlowFlattening: true
            }))



        })

};