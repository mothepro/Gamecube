// Browser only !
if(typeof window === 'undefined') // typeof module !== 'undefined' && module.exports
    throw Error('The package is for the Browser only');

// dependencies
const EventEmitter = require( 'events' ).EventEmitter;
const util = require( 'util' );

const FPS = Math.floor(1000 / 60); // 60 FPS

const buttons = ['a'];
const axes = ['stick'];

// Gamecube can emit events
util.inherits(Gamecube, EventEmitter);
util.inherits(Controller, EventEmitter);

/**
 * Clone myself
 */
Object.prototype.clone = function() {
    return JSON.parse(JSON.stringify(this));
};

/**
 * Quick Deep Compare
 */
Object.prototype.compare = function(other) {
    return JSON.stringify(this) === JSON.stringify(other);
};

/**
 * Base API constructor
 * Holds all gamecube controllers and give the events
 * @constructor
 */
function Gamecube() {
    EventEmitter.call(this);

    this.get = navigator.getGamepads || navigator.webkitGetGamepads;

    if(typeof this.get === 'undefined')
        throw Error('This browser does not support controllers');

    this.controllers = [];

    // disconnect on close
    process.on('exit', this.remove()); //Gamecube.remove.bind(this));
}

/**
 * Connect all controllers, and begin polling
 */
Gamecube.prototype.start = function (fps) {
    var me = this,
        test = function () { // Check for controller
            var gamepads = me.get.apply(navigator);
            for (var i = 0; i < gamepads.length; i++)
                if (gamepads[i])
                    if (!me.has(gamepads[i].index))
                        me.add(gamepads[i].index);
        };

    test();

    // Listen for the controller on the browser
    if('GamepadEvent' in window) {
        window.addEventListener("gamepadconnected", function (e) {
            me.add(e.gamepad.index);
        });
        window.addEventListener("gamepaddisconnected", function (e) {
            me.remove(e.gamepad.index);
        });
    } else
        setInterval(test, 1000);

    // Update Controllers
    var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame;

    if(rAF && typeof fps !== "number")
        rAF(function r() { // Request frame, then poll
            me.poll.call(me);
            rAF(r);
        });
    else {
        if (fps <= 0)
            fps = FPS;
        setInterval(this.poll.bind(this), fps);
    }
};

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
    var data = this.get.apply(navigator),
        me = this;

    this.controllers.forEach(function (controller, port) {
        controller.poll(data[port]);
    });
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

Controller.prototype.poll = function (data) {
    var me = this;

    // save current state
    this.prev = this.current.clone();

    // Check the buttons
    buttons.forEach(function (button, key) {
        var val = data.buttons[key];

        if(typeof val === 'object')
            val = val.pressed;

        // set new val
        me.current[ button ] = val;
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

    // check for changes
    this.change = !this.current.compare(this.prev);
};

// export new instance
module.exports = new Gamecube;