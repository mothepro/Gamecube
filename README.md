# Gamecube Controller in JS
> Gamecube is an interface between a plugged in gamecube controller adapter and the browser. All made with simple events

# [Live Example](https://mothepro.github.io/Gamecube)

# How to use
## Install
```npm install gamecube```

## Usage
After installing the package require it
```var gc = require('gamecube');```

Then start the connection with.
if an integer is passed then the package will poll on that interval
```gc.start()```

Finally bind listeners on the events.
```gc.connect(callback);```

# Events
## Connections
```gc.connect(function(controller) {});``` When a controller is connected

```gc.disconnect(function(controller) {});``` When a controller is disconnected

## Buttons
```controller.button.press(function(button) {});``` When any button is pressed
```controller.button.release(function(button) {});``` When any button is released
```controller.button.hold(function(button) {});``` When any button is held