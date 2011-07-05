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
    var webServer = web.start(3000);
    
    var io = sio.listen(webServer);
    io.configure(function() {
        io.set('log level', 1);
    });
    io.sockets.on('connection', function(socket) {
        new ClientDisplay(socket);
    });
    
    // Moduls events
    world.on('modulAdded', function(modul) {
        modul.on('move', function(position) {
            var displays = ClientDisplay.getDisplaysByPosition(position);
            for (var i = displays.length - 1; i >= 0; i--) {
                displays[i].sendGridFragment();
            }
        });
        modul.on('skinUpdate', function(modul) {
            var displays = ClientDisplay.getDisplaysByPosition(position);
            for (var i = displays.length - 1; i >= 0; i--) {
                displays[i].sendSkinUpdate(skin);
            }
        });
        modul.on('panelsUpdate', function(panels) {
            // console.log('receive panelsUpdate', panels.Actions);
            var displays = ClientDisplay.getDisplaysByModulId(modul.id);
            for (var i = displays.length - 1; i >= 0; i--) {
                displays[i].sendPanels(panels);
            }
        });
    });
    
    // Load moduls
    if (ENV === 'dev') {
        dManager.loadFixtures();
    } else {
        dManager.loadAllModuls();
    }
    
    // Socket.IO server
    // socket.start(webServer);
    
    isStarted = true;
    console.log('modul.io started.');
    
    if (startCallback) return startCallback();
};

// Main module
if (require.main === module) {
    exports.start();
}