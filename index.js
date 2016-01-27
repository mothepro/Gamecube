// Browser only !
// @TODO use "node-hid" for node env
if(typeof window === 'undefined') // typeof module !== 'undefined' && module.exports
    throw Error('The package is for the Browser only');

// dependencies
var Gamecube = require('./lib/Gamecube');

// export new instance
module.exports = new Gamecube;