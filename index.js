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

    /**
     * Shortcuts to emitter
     * @param name name of event
     * @private
     */
    var me = this,
        shortcut = function(name) {
        return function(cb) {
            return me.on(name, cb);
        }
    };

    // shortcuts
    Gamecube.prototype.connect = shortcut('any:plug:connected');
    Gamecube.prototype.disconnect = shortcut('any:plug:disconnected');
}

/**
 * Emit across gamecube
 * @param port
 * @param key
 * @param action
 * @param args
 * @private
 */
Gamecube.prototype._emit = function (port, key, action, args) {
    if(action !== 'idle') { // skip idles
        if(typeof args === 'undefined')
            args = [];

        var name = util.format('%s:%s', key, action);

        // Emit on the any port
        args.unshift(this.controllers[ port ]);
        args.unshift(util.format('any:%s', name));
        this.emit.apply(this, args);

        // Port specific
        args.splice(0, 2);
        args.unshift(util.format('%d:%s', port, name));
        this.emit.apply(this, args);

        // emit on the controller as well
        args[0] = name;
        this.controllers[port].emit.apply(this.controllers[port], args);

        // emit on the key on the controller as well
        if(key !== 'plug') {
            args[0] = action;
            this.controllers[port][key].emit.apply(this.controllers[port][key], args);
        }
    }
};

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

    return this;
};

/**
 * Add a controller
 */
Gamecube.prototype.add = function(index) {
    this.controllers[ index ] = new Controller(index);
    this._emit(index, 'plug', 'connected');
    return this;
};

/**
 * Remove a controller
 * If no index, remove all
 */
Gamecube.prototype.remove = function(index) {
    if(typeof index === 'number') {
        this.controllers.splice(index, 1);
        this._emit(index, 'plug', 'disconnected');
    } else {
        for(var i=0; i<this.controllers.length; i++)
            this._emit(i, 'plug', 'disconnected');
        this.controllers = [];
    }
    return this;
};

/**
 * Calibrate a controller
 * If no index, calibrate all
 */
Gamecube.prototype.calibrate = function(index) {
    if(typeof index === 'number')
        this.controllers[index].calibrate();

    this.controllers.forEach(function (c) {
        c.calibrate();
    });

    return this;
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
    var me = this,
        data = this.get.apply(navigator),
        status = [],
        emitList = [];

    // Poll and get controller stats
    this.controllers.forEach(function (controller, port) {
        controller.poll(data[port]);
        status[port] = controller.status();
    });

    // Emit based on controller status
    status.forEach(function (stat, port) {
        // Overall Change
        //emitList.push({
        //    port: port,
        //    key: 'change',
        //    action: stat.change,
        //});

        // Buttons
        buttons.forEach(function (button) {
            var action = 'idle';
            switch(stat[button]) {
                case 0: action = 'idle'; break;
                case 1: action = 'release'; break;
                case 2: action = 'press'; break;
                case 3: action = 'hold'; break;
            }

            emitList.push({
                port: port,
                key: button,
                action: action,
            });

            // report that a button has this event
            emitList.push({
                port: port,
                key: 'button',
                action: action,
                arg: [button]
            });

            if(stat[button] === 1 || stat[button] === 2) {
                emitList.push({
                    port: port,
                    key: button,
                    action: 'change',
                    arg: [stat[button]]
                });

                // a button is doing this change
                emitList.push({
                    port: port,
                    key: 'button',
                    action: 'change',
                    arg: [button, stat[button]]
                });
            }
        });

        // Shoulders
        ['l', 'r'].forEach(function (k) {
            var action = 'idle';
            switch (stat.pressure[k]) {
                case -1: action = 'decrease'; break;
                case 0:  action = 'idle'; break;
                case 1:  action = 'increase'; break;
            }
            emitList.push({
                port: port,
                key: k + ':pressure',
                action: action,
                arg: [me.controllers[port].current.pressure[k]],
            });

            if(stat.pressure[k])
                emitList.push({
                    port: port,
                    key: k + ':pressure',
                    action: 'change',
                    arg: [me.controllers[port].current.pressure[k]],
                });
        });

        // Sticks
        axes.forEach(function (s) {
            var action;
            [1, 2, 4, 8].forEach(function (direction) {
                if(stat.angle[s] & direction) { // only if you ware moving that direction
                    switch(direction) {
                        case 1: action = 'up'; break;
                        case 2: action = 'down'; break;
                        case 4: action = 'left'; break;
                        case 8: action = 'right'; break;
                    }
                    emitList.push({
                        port: port,
                        key: s,
                        action: action,
                        arg: [
                            me.controllers[port].current.angle[s],
                            me.controllers[port].current.pressure[s]
                        ],
                    });
                }
            });

            if(stat.angle[s]) { // any direction
                emitList.push({
                    port: port,
                    key: s,
                    action: 'move',
                    arg: [
                        me.controllers[port].current.angle[s],
                        me.controllers[port].current.pressure[s]
                    ],
                });
            }
        });
    });

    // Emit the Emit List
    // @TODO emit on elements of Gamecube instead
    emitList.forEach(function (e) {
        me._emit(e.port, e.key, e.action, e.arg);
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
    btnPlus = buttons.clone(); btnPlus.push('button');
    btnPlus.forEach(function (button) {
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
        ['move', 'up', 'down', 'left', 'right'].forEach(function (action) {
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