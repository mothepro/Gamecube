const EventEmitter = require( 'events' ).EventEmitter;
const util = require( 'util' );

// Bring the controllers
var Controller  = require('./Controller').Controller;
const buttons   = require('./Controller').buttons;
const axes      = require('./Controller').axes;

// 60 FPS
const FPS = Math.floor(1000 / 60);

// Gamecube can emit events
util.inherits(Gamecube, EventEmitter);

// give constructor
module.exports = Gamecube;

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
    return typeof this.controllers[index] === 'undefined';
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
                if(stat.angle[s] & direction) { // only if you are moving that direction
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


                if(stat.relAngle[s] & direction) { // only if you are moving that direction
                    switch(direction) {
                        case 1: action = 'pushUp'; break;
                        case 2: action = 'pushDown'; break;
                        case 4: action = 'pushLeft'; break;
                        case 8: action = 'pushRight'; break;
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
            } else {
                emitList.push({
                    port: port,
                    key: s,
                    action: 'idle',
                });
            }

            if(stat.relAngle[s]) { // relative in any direction
                emitList.push({
                    port: port,
                    key: s,
                    action: 'change',
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
