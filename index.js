// Browser only !
if(typeof window === 'undefined') // typeof module !== 'undefined' && module.exports
    throw Error('The package is for the Browser only');

// dependencies
const EventEmitter = require( 'events' ).EventEmitter;
const util = require( 'util' );

const FPS = Math.floor(1000 / 60); // 60 FPS

const buttons = ['a', 'b', 'x', 'y', 'z', 'r', 'l', 'start', 'up', 'down', 'left', 'right'];
const axes = ['stick', 'cStick'];

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
        status = [];

    this.controllers.forEach(function (controller, port) {
        controller.poll(data[port]);
        status.push(controller.status());
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

/**
 * Store info from api into the controller
 * @param data API info on this controller
 */
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

    // Check Pressure of Shoulders
    this.current.pressure.l = data.axes[2];
    this.current.pressure.r = data.axes[5];

    // Check the sticks
    this.current.stick.x = data.axes[0];
    this.current.stick.y = data.axes[1];

    this.current.cStick.x = data.axes[3];
    this.current.cStick.y = data.axes[4];

    // Find Pressure and Angle on sticks
    axes.forEach(function(s) {
        if(me.current[s].compare(me.prev[s])) { // no change
            me.current.pressure[s]  = me.prev.pressure[s];
            me.current.angle[s]     = me.prev.angle[s];
        } else { // compute new values
            me.current.pressure[s]  = Math.sqrt(me.current[s].x*me.current[s].x + me.current[s].y*me.current[s].y);
            me.current.angle[s]     = Math.atan2(me.current[s].x, me.current[s].y);
        }
    });

    // check for changes
    this.change = !this.current.compare(this.prev);
};

/**
 * Find status of the controller
 * @TODO thresholds
 *
 * Buttons:
 *  0 = No change - Idle
 *  1 = Change    - Release
 *  2 = Change    - Press
 *  3 = No change - Hold
 *
 * Pressure (Shoulders & Sticks):
 *  -1 = Change    - Decrease in Pressure
 *  0  = No Change - No Pressure
 *  1  = Change    - Increase in Pressure
 *
 * Angles:
 *  bit 0 (RMB): Up
 *  bit 1: Down
 *  bit 2: Left
 *  bit 3: Right
 */
Controller.prototype.status = function () {
    var me = this,
        ret = {
            a: 0,
            b: 0,
            x: 0,
            y: 0,

            z: 0,
            l: 0,
            r: 0,

            start: 0,

            up: 0,
            down: 0,
            left: 0,
            right: 0,

            pressure: {
                l: 0,
                r: 0,
                stick: 0,
                cStick: 0
            },

            angle: {
                stick: 0,
                cStick: 0,
            },
        };

    ret.change = this.change;

    //if(this.change) {
        buttons.forEach(function (button) {
            ret[button] = (me.current[button] << 1) | me.prev[button];
        });

        ret.pressure.l = Math.sign(this.current.pressure.l - this.prev.pressure.l);
        ret.pressure.r = Math.sign(this.current.pressure.r - this.prev.pressure.r);

        axes.forEach(function (s) {
            if(me.current[s].y < -0.1) ret.angle[s] |= 1;
            if(me.current[s].y > 0.1) ret.angle[s] |= 2;
            if(me.current[s].x < -0.1) ret.angle[s] |= 4;
            if(me.current[s].x > 0.1) ret.angle[s] |= 8;
        });
    //}

    return ret;
};

// export new instance
module.exports = new Gamecube;