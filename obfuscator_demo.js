var JavaScriptObfuscator = require('javascript-obfuscator');

var obfuscationResult = JavaScriptObfuscator.obfuscate(
    `
    console.log(11)
    `, {
        compact: false,
        controlFlowFlattening: true
    }
);

console.log(obfuscationResult.getObfuscatedCode());