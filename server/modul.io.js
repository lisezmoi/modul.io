var sys = require('sys'),
    sio = require('socket.io'),
    web = require('./lib/web'),
    getDataManager = require('./lib/data-manager').getDataManager,
    getWorld = require('./lib/world').getWorld,
    ClientDisplay = require('./lib/client-display').ClientDisplay,
    ENV = process.env.NODE_ENV,
    isStarted = false;
    
exports.start = function(startCallback) {
    
    if (isStarted && startCallback) startCallback();
    
    // 'prod' is the default environment
    if (!ENV) {
        ENV = process.env.NODE_ENV = 'prod';
    }
    
    // Init data manager
    var dManager = getDataManager();
    
    // Init world
    var world = getWorld();
    
    // HTTP server
    var webServer = null;
    if (ENV === 'prod') {
      webServer = web.start(3000, '127.0.0.1');
    } else {
      webServer = web.start(3000);
    }
    
    var io = sio.listen(webServer);
    io.configure(function() {
        io.set('log level', 1);
    });
    io.sockets.on('connection', function(socket) {
        new ClientDisplay(socket);
    });
    
    // Moduls events
    world.on('modulAdded', function(modul) {
        console.log('++ ' + modul.id + ' at ['+modul.position.x + ',' + modul.position.y+']');
        
        modul.on('move', function(oldPosition, newPosition) {
            var displays = ClientDisplay.getDisplaysByMove(oldPosition, newPosition);
            for (var i = displays.length - 1; i >= 0; i--) {
                if (displays[i].modul.id === modul.id) {
                    displays[i].sendGridFragment(); // Update full grid if it is the display's main modul
                } else {
                    displays[i].sendModulMove(modul.id, newPosition); // Just move the modul
                }
            }
        });
        modul.on('skinUpdate', function(skinHash) {
            var displays = ClientDisplay.getDisplaysByPosition(modul.position);
            for (var i = displays.length - 1; i >= 0; i--) {
                displays[i].sendSkinUpdate(modul.id, skinHash);
            }
        });
        modul.on('panelsUpdate', function(panels) {
            var displays = ClientDisplay.getDisplaysByModulId(modul.id);
            for (var i = displays.length - 1; i >= 0; i--) {
                displays[i].sendPanels(panels);
            }
        });
        modul.on('codeError', function(err) { // Log errors
            var displays = ClientDisplay.getDisplaysByModulId(modul.id);
            for (var i = displays.length - 1; i >= 0; i--) {
                displays[i].sendLog(err);
            }
        });
    });
    
    // Load moduls
    if (ENV === 'dev') {
        dManager.loadFixtures();
    } else {
        dManager.loadAllModuls();
    }
    
    isStarted = true;
    console.log('modul.io started.');
    
    if (startCallback) return startCallback();
};

// Main module
if (require.main === module) {
    exports.start();
}