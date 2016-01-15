// Browser only !
if(typeof window === 'undefined') // typeof module !== 'undefined' && module.exports
    throw Error('The package is for the Browser only');

// dependencies
const EventEmitter = require( 'events' ).EventEmitter;
const util = require( 'util' );

const buttons = ['a'];
const axes = ['stick'];

// export constructor
module.exports = Gamecube;

// Gamecube can emit events
util.inherits(Gamecube, EventEmitter);

/**
 * Base API constructor
 * Holds all gamecube controllers and give the events
 * @constructor
 * @param poll FPS [60]
 * @constructor
 */
function Gamecube(poll) {
    EventEmitter.call(this);

    if(typeof poll === 'undefined')
        poll = 60; // 60 FPS

    this.rAF = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.requestAnimationFrame;
    this.get = navigator.getGamepads || navigator.webkitGetGamepads;
    this.controllers = [];

    if(!this.get)
        throw Error('This browser does not support controllers');

    // Listen for the controller on the browser
    if('GamepadEvent' in window) {
        window.addEventListener("gamepadconnected", function (e) {
            Gamecube.add(e.gamepad.index);
        });
        window.addEventListener("gamepaddisconnected", function (e) {
            Gamecube.remove(e.gamepad.index);
        });
    } else {
        setInterval(function () { // Check for controller
            var me = this;
            var gamepads = me.get();
            for (var i = 0; i < gamepads.length; i++)
                if (gamepads[i])
                    if (!Gamecube.has(gamepads[i].index))
                        Gamecube.add(gamepads[i].index);
        }, 1000);
    }

    // Update Controllers
    if(this.rAF)
        this.rAF(Gamecube.poll);
    else
        setInterval(Gamecube.poll, Math.floor(1000 / poll));

    // disconnect on close
    process.on('exit', this.remove.bind(this));
}

/**
 * Add a controller
 */
Gamecube.prototype.add = function(index) {
    this.controllers[ index ] = new Controller(index);
};

/**
 * Remove a controller
 * If no index, remove all
 */
Gamecube.prototype.remove = function(index) {
    if(typeof index === 'number')
        this.controllers.splice(index, 1);
    else
        this.controllers = [];
};

/**
 * Check if we have a controller
 */
Gamecube.prototype.has = function(index) {
    return !!typeof this.controllers[index] === 'undefined';
};

/**
 * Number of connected controllers
 */
Gamecube.prototype.size = function() {
    return this.controllers.length;
};

/**
 * Update info for every controller
 */
Gamecube.prototype.poll = function () {
    data = this.get();

    this.controllers.forEach(function (controller, port) {

        // save current state
        controller.prev = controller.current;

        // Check the buttons
        buttons.forEach(function (button, key) {
            var val = data[port].buttons[key],
                prev;
            if(typeof val === 'object')
                val = val.pressed;

            // set new val
            if(button === 'l' || button === 'r') {
                controller.current[button].button = val;
                prev = controller.prev[ button].button;
            } else {
                controller.current[button] = val;
                prev = controller.prev[ button ];
            }

            // emit events
            if(val) {
                if(controller.prev[ button ]) {// Hold - Holding a button
                    this.emit(util.format('%d:%s:hold', port, button));
                    //this.emit(util.format('any:%s:hold', button));
                } else { // Press - Just tapped the button
                    this.emit(util.format('%d:%s:press', port, button));
                    //this.emit(util.format('any:%s:press', button));
                }
            } else {
                if(controller.prev[ button ]) { // Release - no longer holding button
                    this.emit(util.format('%d:%s:release', port, button));
                    //this.emit(util.format('any:%s:release', button));
                } else { // Idle - not pressing button
                    this.emit(util.format('%d:%s:idle', port, button));
                }
            }
        });
/*
        // Pressure of Shoulders
        controller.current.pressure.l = data[port].axes[2]

        // Check the stick
        controller.current.stick.x = data[port].axes[0];
        controller.current.stick.y = data[port].axes[1];

        if(controller.current.stick.y === controller.prev.stick.y
        && controller.current.stick.x === controller.prev.stick.x) { // no change
            controller.current.stick.pressure = controller.current.prev.pressure;
            controller.current.stick.angle = controller.prev.stick.angle;
        } else { // compute new values
            controller.current.stick.pressure = Math.sqrt(controller.current.stick.x*controller.current.stick.x + controller.current.stick.y*controller.current.stick.y);
            controller.current.stick.angle = Math.atan2(controller.current.stick.x, controller.current.stick.y);
        }
        axes.forEach(function (axis, key) {
            var val = ;
            if(typeof val === 'object')
                val = val.pressed;

            controller.current[ axis ] = val; // set new val

            // emit events
            if(val) {
                if(controller.prev[ axis ]) // Changes
                    this.emit(util.format('%d:%s:', port, axis));
                else // Press
                    this.emit(util.format('%d:%c:press', port, axis));
            } else {
                if(controller.prev[ axis ]) // Release
                    this.emit(util.format('%d:%c:release', port, axis));
            }
        });
*/
        // save current state
        this.controllers[port].prev = this.controllers[port].current;

        // update new state
        this.controllers[port].current = controller.current;

        // check for changes
        this.controllers[port].change = (controller.prev == controller.current);
    }, this);
};

/**
 * Base API for a controller
 * processes input directly
 * @param index
 * @constructor
 */
function Controller(index) {
    if(typeof index === 'undefined')
        throw Error('An index must be given');

    this.i = index;
    this.current = {
        a: false,
        b: false,
        x: false,
        y: false,

        z: false,
        l: false,
        r: false,

        start: false,

        up: false,
        down: false,
        left: false,
        right: false,

        pressure: {
            l: 0.0,
            r: 0.0,
            stick: 0.0,
            cStick: 0.0
        },

        angle: {
            stick: 0.0,
            cStick: 0.0
        },

        stick: {
            x: 0.0,
            y: 0.0,
        },
        cStick: {
            x: 0.0,
            y: 0.0,
        },
    };
    this.prev = this.current;
    this.change = false;
}