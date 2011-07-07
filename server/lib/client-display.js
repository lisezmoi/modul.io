// The ClientDisplay class handle the client data (screen size etc.)
// and the Socket.IO messages

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore')._,
    dManager = require('./data-manager').getDataManager(),
    world = require('./world').getWorld(),
    clientsList = [];

function ClientDisplay(socket) {
    // ClientDisplay is an EventEmitter
    EventEmitter.call(this);
    
    this.socket = socket;
    this.modul = null;
    this.gridSize = null;
    
    initSocketEvents.call(this, socket);
    
    clientsList.push(this);
}
util.inherits(ClientDisplay, EventEmitter);
exports.ClientDisplay = ClientDisplay;

// Init Socket.IO events
function initSocketEvents(socket) {
    
    var self = this;
    
    // Send grounds IDs
    self.socket.emit('grounds', world.ground.groundIds);
    
    // Init socket transmission
    socket.on('modulId', function(modulId) {
        
        // Get modul
        if (!( self.modul = world.getModul(modulId) )) return; // Modul not found
        
        // Stop listening for 'modulId' event
        socket.removeAllListeners('modulId');
        
        // Send code and panels
        socket.emit('code', self.modul.getCode());
        socket.emit('panels', self.modul.getPanels());
        
        // Update grid size
        socket.on('gridSize', function(gridSize) {
            self.gridSize = gridSize;
            self.sendGridFragment();
        });
        
        // Executes an action on the modul
        socket.on('action', function(action) {
            if (action.panel && action.name && action.params) {
                self.modul.execAction(action.panel, action.name, action.params);
            }
        });
        
        // Update modul's code
        socket.on('code', function(code) {
            self.modul.updateCode(code, function() {
                dManager.saveModul(self.modul, function() { // Save code
                    socket.emit('log', '[info] modul saved.');
                });
            });
        });
    });
    
    socket.on('disconnect', function() {
        ClientDisplay.remove(self);
    });
}

// Send a new skin to the client
ClientDisplay.prototype.sendSkinUpdate = function(modulId, skinHash) {
    this.socket.emit('updateSkin', modulId, skinHash);
};

// Send a new grid fragment to the client
ClientDisplay.prototype.sendGridFragment = function() {
    this.socket.emit('gridFragment', world.getGridFragment(this.modul.position, this.gridSize).fragment, this.gridSize);
};

// Send panels to the client
ClientDisplay.prototype.sendPanels = function(panels) {
    this.socket.emit('panels', panels);
};

// Send a modul move
ClientDisplay.prototype.sendModulMove = function(modulId, newPosition) {
    if (modulId === this.modul.id) {
        this.sendGridFragment();
    } else {
        var fragPosition = this.getFragmentPosition();
        this.socket.emit('modulMove', modulId, {
            x: newPosition.x - fragPosition.x,
            y: newPosition.y - fragPosition.y
        });
    }
};

// Send log
ClientDisplay.prototype.sendLog = function(err) {
    this.socket.emit('log', err.message + '\n' + err.stack);
};

// Returns a list of currently displayed moduls
// ClientDisplay.prototype.getDisplayedModuls = function(callback) {
//     var dispModuls = [];
//     this.getGridFragment(function(gridFragment) {
//         var yLen = gridFragment.length;
//         for (var i = 0; i < yLen; i++) {
//             var xLen = gridFragment[i].length;
//             for (var j = 0; j < xLen; j++) {
//                 if (gridFragment[i][j].modul) {
//                     dispModuls.push(gridFragment[i][j].modul);
//                 }
//             }
//         }
//         callback(dispModuls);
//     });
// };

ClientDisplay.prototype.getFragmentPosition = function() {
    return world.getGridFragment(this.modul.position, this.gridSize).position;
};

// ** Static methods

// Returns a list of clients wich displays the given position
ClientDisplay.getDisplaysByPosition = function(position) {
    var displays = clientsList.filter(function(client) {
        if (!client.modul) return false;
        
        var xRange = [
            client.modul.position.x - (client.gridSize[0]-1) / 2,
            client.modul.position.x + (client.gridSize[0]-1) / 2
        ];
        var yRange = [
            client.modul.position.y - (client.gridSize[1]-1) / 2,
            client.modul.position.y + (client.gridSize[1]-1) / 2
        ];
        return ( position.x >= xRange[0] && position.x <= xRange[1] &&
                 position.y >= yRange[0] && position.y <= yRange[1] );
    });
    return displays;
};

// Returns a list of clients which displays one of the given positions
ClientDisplay.getDisplaysByMove = function(oldPosition, newPosition) {
    var oldPositionDisplays = ClientDisplay.getDisplaysByPosition(oldPosition);
    var newPositionDisplays = ClientDisplay.getDisplaysByPosition(newPosition);
    return _.uniq(oldPositionDisplays.concat(newPositionDisplays));
};

// Returns a list of clients which displays the given modul
ClientDisplay.getDisplaysByModulId = function(modulId) {
    var displays = [];
    for (var i = clientsList.length - 1; i >= 0; i--) {
        if (clientsList[i].modul.id === modulId) {
            displays.push(clientsList[i]);
        }
    }
    return displays;
};

// Removes a client display from the list
ClientDisplay.remove = function(display) {
    var i = clientsList.indexOf(display);
    if (i !== -1) {
        clientsList.splice(i, 1);
    }
};
