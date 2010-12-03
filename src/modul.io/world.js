// World Class
(function () {
    
    var World = exports.World = function(width, height) {
        this.grid = initGrid.call(this, width, height);
        this.width = width;
        this.height = height;
        this.moduls = {};
    };
    
    function initGrid(w, h) {
        var grid = new Array(w); // Cols
        for (var i = grid.length-1; i > -1; i--){
            grid[i] = new Array(h); // Row of cells
        }
        return grid;
    };
    
    function isOut(pos) {
        return (pos.x < 0 || pos.y < 0 || pos.x > this.width-1 || pos.y > this.height-1);
    };
    
    function isOccupied(pos) {
        if (!this.grid[pos.y]) {
            // Error: out
        }
        return (!!this.grid[pos.y][pos.x]);
    };
    
    World.prototype = {
        addModul: function(modul, x, y) {
            if (isOut({x:x, y:y})) {
                // Error: Out!
            }
            this.grid[y][x] = modul.id;
            this.moduls[modul.id] = modul;
            this.moduls[modul.id].position = {x: x, y: y};
            modul.world = this;
        },
        moveModul: function(modul, dir) {
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
                    delete this.grid[curPos.y][curPos.x]; // Remove modul from current location
                    this.grid[newPos.y][newPos.x] = modul.id; // Add modul to new location
                    modul.position = newPos;
                }
            } else {
                // Error modul not listed
            }
        },
        getGrid: function() {
            return this.grid;
        },
        getModuls: function(callback) {
            callback(this.moduls);
        },
        getModul: function(modulId) {
            return this.moduls[modulId];
        },
        getModulsInfo: function(callback) {
            var moduls = this.moduls;
            var pubModuls = {};
            for (var i in moduls) {
                pubModuls[i] = {
                    //"skin": moduls[i].getSkinData()
                };
            }
            callback(pubModuls);
        }
    };
})();