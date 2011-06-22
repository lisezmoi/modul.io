var sys = require('sys'),
    web = require('./lib/web'),
    sio = require('socket.io'),
    DataManager = require('./lib/data-manager').DataManager,
    ClientDisplay = require('./lib/client-display').ClientDisplay,
    getWorld = require('./lib/world').getWorld,
    Modul = require('./lib/modul').Modul,
    Ground = require('./lib/ground').Ground,
    util = require('util'),
    _ = require('underscore')._,
    ENV = process.env.NODE_ENV,
    isStarted = false;

exports.start = function(startCallback) {
    
    if (isStarted && startCallback) startCallback();
    
    // 'prod' is the default environment
    if (!ENV) {
        ENV = process.env.NODE_ENV = 'prod';
    }
    
    // Data Manager
    var dManager = new DataManager();
    
    // Init world
    var world = getWorld();
    
    // Load moduls
    if (ENV === 'dev') {
        dManager.loadFixtures();
    } else {
        dManager.loadAllModuls();
    }
    
    // HTTP server
    var webServer = web.start(3000);
    
    // Socket.IO server (all this code will move somewhere)
    
    console.log('Start Socket.IO server...');
    var io = sio.listen(webServer);
    io.configure(function() {
        io.set('log level', 1);
    });
    console.log('Socket.IO server started.');
    
    // Update moduls
    (function initModulsPush() {
        
        function onChange(modul, updates) {
            
            // Get clients displaying this modul
            ClientDisplay.getDisplaysByModulId(modul.id, function(displays) {
                var skinsToRefresh = (!!updates.skinHash)? [{'mid': modul.id, 'hash': updates.skinHash}] : [];
                var i = displays.length;
                while(i--) {
                    // Refresh displays
                    var refreshObj = {};
                    if (!!skinsToRefresh) {
                        refreshObj.skinsToRefresh = skinsToRefresh;
                    }
                    if (!!updates.updateGrid) {
                        refreshObj.updateGrid = updates.updateGrid;
                    }
                    if (!!updates.updatePanels) {
                        refreshObj.updatePanels = updates.updatePanels;
                    }
                    displays[i].refresh(refreshObj);
                }
            });
        }
        
        _.each(world.moduls, function(modul) {
            modul.on('change', function(updates) {
                onChange(modul, updates);
            });
            modul.on('panelsUpdate', function(modul) {
                onChange(modul, { updatesPanels: true });
            });
        });
    })();
    
    io.sockets.on('connection', function(socket) {
        
        // Modul and client display
        var modul = null,
            display = null;
        
        // Send grounds IDs
        socket.emit('grounds', world.ground.groundIds);
        
        // Init modul
        socket.on('modulId', function(modulId) {
            
            // Get modul
            if (!( modul = world.getModul(modulId) )) return;
            
            // One init (modulId) / connection
            socket.removeAllListeners('modulId');
            
            // Send code and panels
            socket.emit('code', modul.getCode());
            socket.emit('panels', modul.getPanels());
            
            // Log errors
            function logError(err) {
                socket.emit('log', err.message + '\n' + err.stack);
            }
            modul.on('error', logError);
            socket.on('disconnect', function() {
                modul.removeListener('error', logError);
            });
            
            // Update display size
            socket.on('gridSize', function(gridSize) {
                if (!display) {
                    
                    // Init display
                    display = new ClientDisplay(socket, modul, world, gridSize);
                    
                    // On gridUpdate event, send a new grid fragment
                    display.on('gridUpdate', function(gridFragment) {
                        socket.emit('gridFragment', gridFragment);
                    });
                    
                    // On panelsUpdate event, send all panels
                    display.on('panelsUpdate', function(panels) {
                        socket.emit('panels', panels);
                    });
                    
                    // On skinsUpdate, update moduls skins
                    display.on('skinsUpdate', function(moduls) {
                        socket.emit('updateSkins', moduls);
                    });
                    
                    // Updates grid fragment
                    display.getGridFragment(function(gridFragment) {
                        socket.emit('gridFragment', gridFragment);
                    });
                    
                } else {
                    // Just update display
                    display.setGridSize(gridSize);
                }
            });
            
            // Executes an action on the modul
            socket.on('action', function(action) {
                if (action.panel && action.name && action.params) {
                    modul.execAction(action.panel, action.name, action.params);
                }
            });
            
            // Update modul's code
            socket.on('code', function(code) {
                modul.updateCode(code, function() {
                    dManager.saveModul(modul, function() { // Save code
                        socket.emit('log', '[info] modul saved.');
                    });
                });
            });
            
        });
        
        socket.on('disconnect', function(){
            if (display) {
                ClientDisplay.remove(display);
                display = null;
            }
        });
    });
    
    isStarted = true;
    console.log('modul.io started.');
    if (startCallback) return startCallback();
};

// Main module
if (require.main === module) {
    exports.start();
}