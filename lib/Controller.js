const EventEmitter = require( 'events' ).EventEmitter;
const util = require( 'util' );

// controller options
const buttons = ['a', 'b', 'x', 'y', 'z', 'r', 'l', 'start', 'up', 'down', 'left', 'right'];
const axes = ['stick', 'cStick'];

module.exports = {
    Controller: Controller,
    buttons: buttons,
    axes: axes,
};

// Controller can emit events
util.inherits(Controller, EventEmitter);
/**
 * Base API for a controller
 * processes input directly
 * @param index
 * @constructor
 */
function Controller(index) {
    if(typeof index === 'undefined')
        throw Error('An index must be given');

    EventEmitter.call(this);

    this.port = index;
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
    this.offset = {
        l: 0.0,
        r: 0.0,
        stick: {
            x: 0.0,
            y: 0.0,
        },
        cStick: {
            x: 0.0,
            y: 0.0
        }
    };

    // shortcuts
    var me = this,
        shortcut = function(name) {
            return function(cb) {
                return me.on(name, cb);
            }
        };

    me.disconnect = shortcut('plug:disconnected');

    // aliases for buttons
    buttons.concat(['button']).forEach(function (button) {
        me[button] = new EventEmitter;
        ['change', 'press', 'hold', 'release'].forEach(function (action) {
            me[button][action] = shortcut(util.format('%s:%s', button, action));
        });
    });

    // shoulders
    ['l', 'r'].forEach(function(but) {
        me[but+':pressure'] = me[but].pressure = new EventEmitter;
        ['change', 'increase', 'decrease'].forEach(function (action) {
            me[but][action] = shortcut(util.format('%s:pressure:%s', but, action));
        });
    });

    // alias for sticks
    axes.forEach(function (axis) {
        me[axis] = new EventEmitter;
        ['move', 'change', 'idle', 'up', 'down', 'left', 'right', 'pushUp', 'pushDown', 'pushLeft', 'pushRight'].forEach(function (action) {
            me[axis][action] = shortcut(util.format('%s:%s', axis, action));
        });
    });
}

/**
 * Store info from api into the controller
 * @param data API info on this controller
 * @param calibrate will calibrate if true
 */
Controller.prototype.poll = function (data, calibrate) {
    var me = this;

    // save current state
    this.prev = this.current.clone();

    // Check the buttons
    buttons.forEach(function (button, key) {
        var val = data.buttons[key];

        if(typeof val === 'object')
        { //noinspection JSUnresolvedVariable
            val = val.pressed;
        }

        // set new val
        me.current[ button ] = val;
    });

    // Check Pressure of Shoulders
    this.current.pressure.l = data.axes[2] + this.offset.l;
    this.current.pressure.r = data.axes[5] + this.offset.r;

    // Check the sticks
    this.current.stick.x = data.axes[0] + this.offset.stick.x;
    this.current.stick.y = data.axes[1] + this.offset.stick.y;

    this.current.cStick.x = data.axes[3] + this.offset.cStick.x;
    this.current.cStick.y = data.axes[4] + this.offset.cStick.y;

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

    if(calibrate)
        this.calibrate();

    // check for changes
    this.change = !this.current.compare(this.prev);
};

/**
 * Reset axes neutral position to 0
 */
Controller.prototype.calibrate = function() {
    this.offset.l = -this.current.pressure.l;
    this.offset.r = -this.current.pressure.r;

    this.offset.stick.x = -this.current.stick.x;
    this.offset.stick.y = -this.current.stick.y;

    this.offset.cStick.x = -this.current.cStick.x;
    this.offset.cStick.y = -this.current.cStick.y;
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

            relAngle: {
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

        // Relative to current
        if(me.current[s].y < me.prev[s].y) ret.relAngle[s] |= 1;
        if(me.current[s].y > me.prev[s].y) ret.relAngle[s] |= 2;
        if(me.current[s].x < me.prev[s].x) ret.relAngle[s] |= 4;
        if(me.current[s].x > me.prev[s].x) ret.relAngle[s] |= 8;
    });
    //}

    return ret;
};

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
