// The ClientDisplay class handle all the client screen data:
// Grid size, displayed moduls, etc.

// ## ClientDisPlay Class
var EventEmitter = require('events').EventEmitter,
    util = require('util');

function ClientDisplay() {
    // ClientDisplay is an instance of EventEmitter
    EventEmitter.call(this);
}
util.inherits(ClientDisplay, EventEmitter);
exports.ClientDisplay = ClientDisplay;

// Update World
ClientDisplay.prototype.setWorld = function(world) {
    this.world = world;
};

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

// Update modul
ClientDisplay.prototype.setModul = function(modul) {
    this.modul = modul;
    if (this.modul) {
        this.emit("modulUpdate", this.modul);
    }
};

// Returns a grid fragment
function getGridFragment(callback) {
    if (!this.world || !this.gridSize || !this.modul) {
        callback(false);
    } else {
        callback(this.world.getGridFragment(this.modul.position, this.gridSize));
    }
}

// Returns a list of currently displayed moduls
ClientDisplay.prototype.getDisplayedModuls = function(callback) {
    getGridFragment.call(this, function(gridFragment){
        callback(gridFragment);
    });
};