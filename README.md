# Gamecube Controller in JS
> Gamecube is an interface between a plugged in gamecube controller adapter and the browser. All made with simple events

# [Live Example](https://mothepro.github.io/Gamecube)

# How to use
## Install
```npm install gamecube browserify```

## Usage
After installing the package require it
```js
 var gc = require('gamecube');
```

Then start the connection with.
```js
 gc.start([poll]);
```
If an integer is passed then the package will poll on that interval

Finally bind listeners on the events.
```js
 gc.connect(callback);
```

# Events
## Connections
```js
 gc.connect(function(controller) {});
```
When a controller is connected

```js
 gc.disconnect(function(controller) {});
```
When a controller is disconnected

## Buttons

```js
 controller.button.change(function(button, state) {});
```
When any button changes state

 * 0 = No change - Idle
 * 1 = Change    - Release
 * 2 = Change    - Press
 * 3 = No change - Hold

```js
 controller.button.press(function(button) {});
```
When any button is pressed

```js
 controller.button.release(function(button) {});
```
When any button is released

```js
 controller.button.hold(function(button) {});
```
When any button is held

## Shoulders

```js
 controller['l:pressure'].change(function(state) {});
```
When the left trigger changes state (not fully pushed)
 *  -1 = Change    - Decrease in Pressure
 *  0  = No Change - No Pressure
 *  1  = Change    - Increase in Pressure

```js
 controller['l:pressure'].increase(function(state) {});
```
When the left trigger increases pressure

```js
 controller['l:pressure'].decrease(function(state) {});
```
When the left trigger decreases pressure

## Joysticks
