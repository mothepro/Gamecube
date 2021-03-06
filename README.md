# Gamecube Controller in JS
> Gamecube is an interface between a plugged in gamecube controller adapter and the browser. All made with simple events

## [Live Example](https://mothepro.github.io/Gamecube)

## Coming Soon
- [ ] Support in node environment

# How to use
## Install
```npm install gamecube```

## Usage
After installing the package require using `var gc = require('gamecube');`.  
Then start the connection with using `gc.start([poll]);`.  
_Note: If an integer is passed then the package will poll on that interval._

Finally bind listeners on the events, for example `gc.connect(callback);`.  
In your app require `gamecube` like a normal dependency. Run browserify on your app and the package will be browser-ready.


## Events
### Connection
`gc.connect(function(controller) {});` When a controller is connected.  
`gc.disconnect(function(controller) {});` When a controller is disconnected.  

### Buttons
+ button - any button
+ a
+ b
+ x
+ y
+ start
+ l
+ r
+ z
+ up - on d-pad
+ down - on d-pad
+ left - on d-pad
+ right - on d-pad

`controller.button.change(function(button, state) {});` When any button changes state.
 * 0 = No change - Idle
 * 1 = Change    - Release
 * 2 = Change    - Press
 * 3 = No change - Hold
 
`controller.button.press(function(button) {});` When any button is pressed.  
`controller.button.release(function(button) {});` When any button is released.  
`controller.button.hold(function(button) {});` When any button is held.  

### Shoulders
`controller['l:pressure'].change(function(state) {});` When the left trigger changes state (not fully pushed).  
 *  -1 = Change    - Decrease in Pressure
 *  0  = No Change - No Pressure
 *  1  = Change    - Increase in Pressure
 
`controller.l.pressure.increase(function(pressure) {});` When the left trigger increases pressure (Between 0 & 1).  
`controller.l.pressure.decrease(function(pressure) {});` When the left trigger decreases pressure.  

### Joysticks
+ stick - grey joystick
+ cStick - the C Stick

`controller.stick.move(function(angle, pressure) {});` When the stick is not in the neutral position.  
`controller.stick.change(function(angle, pressure) {});` When the stick has moved since its previous position.  
`controller.stick.up(function(angle, pressure) {});` When the stick is more upwards than downwards.  
`controller.stick.pushUp(function(angle, pressure) {});` When the stick has moved upwards since its previous position.  
`controller.stick.down(function(angle, pressure) {});` When the stick is more downwards than upwards.  
`controller.stick.pushDown(function(angle, pressure) {});` When the stick has moved downwards since its previous position.  
`controller.stick.left(function(angle, pressure) {});` When the stick is more left than right.  
`controller.stick.pushLeft(function(angle, pressure) {});` When the stick has moved left since its previous position.  
`controller.stick.right(function(angle, pressure) {});` When the stick is more right than left.  
`controller.stick.pushRight(function(angle, pressure) {});` When the stick has moved right since its previous position.  