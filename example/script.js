window.gc = require('..');

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
