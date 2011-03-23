// The ClientDisplay class handle all the client screen data:
// Grid size, displayed moduls, etc.

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore')._,
    clientDisplayList = [];

// ## ClientDisplay Constructor
function ClientDisplay(modul, world, gridSize) {
    // ClientDisplay is an instance of EventEmitter
    EventEmitter.call(this);
    
    this.displayedModuls = [];
    this.modul = modul;
    this.world = world;
    
    this.setGridSize(gridSize);
    
    clientDisplayList.push(this);
}
util.inherits(ClientDisplay, EventEmitter);
exports.ClientDisplay = ClientDisplay;

// Update grid size
ClientDisplay.prototype.setGridSize = function(gridSize) {
    var self = this;
    self.gridSize = gridSize;
    getGridFragment.call(self, function(gridFragment) {
        if (gridFragment !== false) {
            self.emit("gridUpdate", gridFragment);
        }
    });
};

// Returns a list of currently displayed moduls
ClientDisplay.prototype.getDisplayedModuls = function(callback) {
    var dispModuls = [];
    getGridFragment.call(this, function(gridFragment){
        for (var i in gridFragment) {
            for (var j in gridFragment[i]) {
                if (gridFragment[i][j].modul) {
                    dispModuls.push(gridFragment[i][j].modul);
                }
            }
        }
        callback(dispModuls);
    });
};

ClientDisplay.prototype.refresh = function(settings) {
    var self = this;
    getGridFragment.call(this, function(gridFragment){
        if (!!settings.updateGrid) {
            self.emit("gridUpdate", gridFragment);
        }
        if (!!settings.updatePanels) {
            self.emit("panelsUpdate", self.modul.getPanels());
        }
        if (!!settings.skinsToRefresh && settings.skinsToRefresh.length !== 0) {
            self.emit("skinsUpdate", settings.skinsToRefresh);
        }
    });
};

// Returns a grid fragment
function getGridFragment(callback) {
    if (!this.world || !this.gridSize || !this.modul) {
        callback(false);
    } else {
        callback(this.world.getGridFragment(this.modul.position, this.gridSize));
    }
}

/* Static */
ClientDisplay.getDisplaysByModulId = function(mid, callback){
    var modulClients = [],
        i = clientDisplayList.length,
        iterations = 0;
    
    function getDisplayCallback(dispModuls) {
        if (dispModuls.indexOf(mid) !== -1) {
            modulClients.push(clientDisplayList[i]);
        }
        iterations++;
        if (iterations === clientDisplayList.length) {
            callback(modulClients);
        }
    }
    
    while (i--) {
        clientDisplayList[i].getDisplayedModuls(getDisplayCallback);
    }
};

ClientDisplay.isValidGridSize = function(gridSize) {
    return (_.isArray(gridSize) && gridSize.length === 2 && _.isNumber(gridSize[0]) && _.isNumber(gridSize[1]));
};

// Removes a client display from the list
ClientDisplay.remove = function(display) {
  var dispIndex = clientDisplayList.indexOf(display);
  if (dispIndex !== -1) {
    clientDisplayList.splice(dispIndex, 1);
  }
};