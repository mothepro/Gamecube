var fs = require('fs');
var gc = require('../..');

// blank gamecube controller image
var file = fs.readFileSync(__dirname+'/' + 'Gamecube.svg', 'utf8'),
    parser = new DOMParser(),
    svg = parser.parseFromString(file, 'text/xml');

gc.start();

gc.on('any:plug:connect', function(port) {
    alert('Welcome Player ', port)
}).on('any:a:press', function (port) {
    temp = path3203.style.fill;
    path3203.style.fill = 'white'
}).on('any:a:release', function (port) {
    path3203.style.fill = temp;
}).on('any:stick:move', function (port, angle, pressure) {
    console.log(port, angle, pressure)
});


// make the gc global
if(typeof window !== 'undefined')
    window.gc = gc;