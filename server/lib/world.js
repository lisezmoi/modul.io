var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Ground = require('./ground').Ground,
    curWorld = null,
    borderWidth = 2;

function initInterval(interval) {
    var self = this;
    setInterval(function(){
        for (var i in self.moduls) {
            if (self.moduls.hasOwnProperty(i)) {
                self.moduls[i].execIntervals();
            }
        }
    }, interval);
}

function initGrid(w, h) {
    var grid = []; // Cols
    for (var i = 0; i < h; i++) {
        grid[i] = []; // Cells
        for (var j = 0; j < w; j++) {
            grid[i][j] = {
                type: null,
                ground: this.ground.getRandGroundId(),
                modul: null,
                y: i,
                x: j
            };
            if (i < borderWidth || j < borderWidth || i > h-borderWidth*2 || j > w-borderWidth*2) {
                grid[i][j].type = 'border';
                grid[i][j].ground = 'wall';
            }
        }
    }
    
    return grid;
}

// World 'Class'
function World(width, height, interval) {
    // Modul is an EventEmitter
    EventEmitter.call(this);
    
    this.width = width;
    this.height = height;
    this.moduls = {};
    this.ground = new Ground();
    this.grid = initGrid.call(this, width, height);
    initInterval.call(this, interval);
}
util.inherits(World, EventEmitter);

function isOut(pos) {
    return (pos.x < 0 || pos.y < 0 || pos.x > this.width-1 || pos.y > this.height-1);
}

function isOccupied(pos) {
    return (!!this.grid[pos.y][pos.x].modul || this.grid[pos.y][pos.x].type === 'border');
}

World.prototype.addModul = function(modul, x, y) {
    if (isOut.call(this, {x:x, y:y})) {
        return false; // Out!
    }
    if (isOccupied.call(this, {x:x, y:y})) {
        return false; // Occupied
    }
    this.grid[y][x].modul = modul.id;
    this.moduls[modul.id] = modul;
    this.moduls[modul.id].position = {x: x, y: y};
    modul.world = this;
    this.emit('modulAdded', modul);
    return true;
};
World.prototype.moveModul = function(modul, dir) {
    if (!!this.moduls[modul.id]) {
        var curPos = this.moduls[modul.id].position;
        var newPos = {};
        
        switch (dir) {
            case "top":
                newPos = {x: curPos.x, y: curPos.y-1};
                break;
            case "right":
                newPos = {x: curPos.x+1, y: curPos.y};
                break;
            case "bottom":
                newPos = {x: curPos.x, y: curPos.y+1};
                break;
            case "left":
                newPos = {x: curPos.x-1, y: curPos.y};
                break;
            default:
                // Error: incorrect direction
                break;
        }
        if (!isOut.call(this, newPos) && !isOccupied.call(this, newPos)) {
            this.grid[curPos.y][curPos.x].modul = null; // Remove modul from current location
            this.grid[newPos.y][newPos.x].modul = modul.id; // Add modul to new location
            modul.position = newPos;
        }
    } else {
        // Error: modul not listed
    }
};
World.prototype.getGrid = function() {
    return this.grid;
};
World.prototype.getGridFragment = function(position, dims) {
    var xSlice = position.x - (dims[0]-1)/2;
    var ySlice = position.y - (dims[1]-1)/2;
    
    if (xSlice < 0) { // Left border
        xSlice = 0;
    } else if (xSlice+dims[0] > this.width) { // Right border
        xSlice = this.width-dims[0];
    }
    if (ySlice < 0) { // Top border
        ySlice = 0;
    } else if (ySlice+dims[1] > this.height) { // Bottom border
        ySlice = this.height-dims[1];
    }
    
    var gridFrag = this.grid.slice(ySlice, ySlice+dims[1]-1);
    var gridFragLen = gridFrag.length;
    for (var i = 0; i < gridFragLen; i++) {
        gridFrag[i] = gridFrag[i].slice(xSlice , xSlice+dims[0]-1);
    }
    return gridFrag;
};
World.prototype.getModuls = function(callback) {
    callback(this.moduls);
};
World.prototype.getModul = function(modulId) {
    return this.moduls[modulId];
};
World.prototype.getModulsInfo = function(callback) {
    var moduls = this.moduls;
    var pubModuls = {};
    for (var i in moduls) {
        pubModuls[i] = {
            //"skin": moduls[i].getSkinData()
        };
    }
    callback(pubModuls);
};

exports.getWorld = function() {
    if (!curWorld) {
        curWorld = new World(160, 120, 1000);
    }
    return curWorld;
};