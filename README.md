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