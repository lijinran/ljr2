module.exports = function(){
  var content = [
    '',
    '/////////                 '.bold.red+'             //////////  '.bold.blue+'  ////////////////////////    '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' //////////////////////////   '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' //////////////////////////   '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' ////////          ////////   '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' ////////          ////////   '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' ////////          ////////   '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' //////////////////////////   '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' //////////////////////////   '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' /////////////////////////    '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' /////////////////            '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' ////////  ////////           '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' ////////   ////////          '.bold.green,
    '/////////                 '.bold.red+'              ////////   '.bold.blue+' ////////    ////////         '.bold.green,
    '/////////                 '.bold.red+'  ////////    ////////   '.bold.blue+' ////////     ////////        '.bold.green,
    '/////////                 '.bold.red+'  ///////     ////////   '.bold.blue+' ////////      ////////       '.bold.green,
    '////////////////////////  '.bold.red+'  ///////     ////////   '.bold.blue+' ////////       ////////      '.bold.green,
    '////////////////////////  '.bold.red+'  ////////////////////   '.bold.blue+' ////////        ////////     '.bold.green,
    '////////////////////////  '.bold.red+'  ////////////////////   '.bold.blue+' ////////         ////////    '.bold.green,
    '////////////////////////  '.bold.red+'  ///////////////////    '.bold.blue+' ////////          ////////   '.bold.green,
    '',
    '              v' + fis.cli.info.version,
    ''
  ].join('\n');
  console.log(content);
};