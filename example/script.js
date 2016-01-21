var gc = require('..');

gc.start();

gc.on('2:a:press', function () {
    console.log('.press')
}).on('2:a:release', function () {
    console.log('.release')
}).on('2:a:hold', function () {
    console.log('.hold')
}).on('2:a:idle', function () {
    console.log('.idle')
});