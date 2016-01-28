# Gamecube Controller in JS
> Gamecube is an interface between a plugged in gamecube controller adapter and the browser. All made with simple events

## Coming Soon
- [ ] Support in node environment

# [Live Example](https://mothepro.github.io/Gamecube)


# How to use
## Install
```npm install gamecube```

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

bind listeners on the events.
```js
 gc.connect(callback);
```

In your app require `gamecube` like a normal dependency. Run browserify on your app and the package will be browser-ready.


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
 controller['l:pressure'].increase(function(pressure) {});
```
When the left trigger increases pressure (Between 0 & 1)

```js
 controller['l:pressure'].decrease(function(pressure) {});
```
When the left trigger decreases pressure

## Joysticks

```js
 controller.stick.move(function(angle, pressure) {});
```
When the stick is not in the neutral position

```js
 controller.stick.change(function(angle, pressure) {});
```
When the stick has moved since its previous position

```js
 controller.stick.up(function(angle, pressure) {});
```
When the stick is more upwards than downwards

```js
 controller.stick.pushUp(function(angle, pressure) {});
```
When the stick has moved upwards since its previous position

```js
 controller.stick.down(function(angle, pressure) {});
```
When the stick is more downwards than upwards

```js
 controller.stick.pushDown(function(angle, pressure) {});
```
When the stick has moved downwards since its previous position

```js
 controller.stick.left(function(angle, pressure) {});
```
When the stick is more left than right

```js
 controller.stick.pushLeft(function(angle, pressure) {});
```
When the stick has moved left since its previous position

```js
 controller.stick.right(function(angle, pressure) {});
```
When the stick is more right than left

```js
 controller.stick.pushRight(function(angle, pressure) {});
```
When the stick has moved right since its previous position