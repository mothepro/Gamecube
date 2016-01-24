var fs = require('fs');
var gc = require('../..');

// blank gamecube controller image
var file = fs.readFileSync(__dirname+'/' + 'Gamecube.svg', 'utf8'),
    svgs = [],
    svgBlank = document.createElement('div'); svgBlank.innerHTML = file;


gc
.start() // check for controllers & begin polling
.connect(function(controller) { // we found a controller
    var port = controller.port,
        svg;

    // copy default svgBlank
    svg = svgs[port] = svgBlank.cloneNode(true);

    // customize for this port
    svg.className = ['controller', port].join(' ');
    svg.getElementsByClassName('port num').item(0).innerHTML = port+1;

    // add it to HTML
    document.getElementById('controllers').appendChild(svg);

    // check for press of any button on the controller
    controller.on('button:press', function (button) {
        svg.getElementsByClassName('button '+ button).item(0).style.fill = 'white';
    });

    // check for release on any button
    controller.button.on('release', function (button) {
        svg.getElementsByClassName('button '+ button).item(0).style.fill = '';
    });

    var changeStick = function(path, scale, stroke) {
        if(typeof stroke === 'undefined')
            stroke = 0;

        var centerStick = [];

        return function (angle, pressure) {
            var y = scale * pressure * Math.cos(angle),
                x = scale * pressure * Math.sin(angle),
                stroke_ = 1;

            // for Paths
            var paths = Array.prototype.slice.call(svg.getElementsByClassName(path +' path')); // HTMLCollection -> Array

            paths.forEach(function(path, i) {
                // save the center of the stick
                if(typeof centerStick[i] === 'undefined')
                    centerStick[i] = path.cloneNode().transform.baseVal.getItem(0).matrix;

                if(stroke)
                    stroke_ = stroke + parseFloat(path.getAttribute('stroke-width')); // make rings move together

                var w = centerStick[i].translate(x * stroke_, y * stroke_); // translate the center

                // based on the absolute position
                path.transform.baseVal.getItem(0).setMatrix(w);
            });

            // for text Paths
            var textPaths = Array.prototype.slice.call(svg.getElementsByClassName(path+' text')); // HTMLCollection -> Array

            textPaths.forEach(function(path, i) {
                if(stroke)
                    stroke_ = stroke + parseFloat(path.getAttribute('stroke-width')); // make rings move together

                // based on the absolute position
                path.setAttribute('transform', 'translate('+ x +','+ y +')');
            });
        };
    };

    controller.stick.change( changeStick('stick l', 25, -2)); // When stick changes position
    controller.cStick.change(changeStick('stick c', 50, -3)); // When C Stick changes position
}).disconnect(function(controller) { // Controller quit - Remove svgBlank
    svgs.splice(controller.port, 1)[0].remove();
});

// make the gc global
if(typeof window !== 'undefined') {
    window.gc = gc;
    window.svgs = svgs;
}