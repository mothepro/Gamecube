var gc = require('../index');

gc.on('any:a:press', function () {
    console.log('press')
});