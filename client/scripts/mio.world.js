(function(){
    var mio = window.mio = window.mio || {};
    
    mio.world = (function(){
        var pub = {},
            canvas,
            ctx,
            moduls = {},
            grid = [],
            gridSize,
            grounds = [],
            groundSprite,
            screenDims = [];
        
        // Draw a modul detection zone
        var showModulZone = function(x, y) {
            ctx.strokeStyle = '#99f';
            ctx.strokeRect(x-150.5, y-150.5, 350, 350);
        };
        
        // Draw a single modul
        var drawModul = function(skin, x, y, zone) {
            var mid = skin.mid,
                hash = Date.now();
            
            moduls[mid] = moduls[mid] || {};
            moduls[mid].pos = {x: x, y: y};
            
            if (!!zone) {
                showModulZone(x, y);
            }
            
            function draw() {
                ctx.clearRect(moduls[mid].pos.x, moduls[mid].pos.y, 50, 50);
                ctx.drawImage(moduls[mid].skin, moduls[mid].pos.x, moduls[mid].pos.y);
            }
            
            if (!moduls[mid].skin) {
                mio.util.loadImage(mio.conf.url + mid + '/skin?'+hash, function(image) {
                    moduls[mid].skin = image;
                    draw();
                });
            } else {
                draw();
            }
        };
        
        // Draw a single ground
        var drawGround = function(gid, x, y) {
            
            // Ground ids loaded?
            if (!!grounds) {
                
                var draw = function (groundSprite) {
                    ctx.drawImage(groundSprite, grounds.indexOf(gid)*50, 0, 50, 50, x, y, 50, 50);
                    // ctx.fillStyle = '#ffffff';
                    // ctx.font = 'bold 9px Arial';
                    // ctx.fillText(grid[y/50][x/50].x+','+grid[y/50][x/50].y, x, y+10);
                };
                
                // Grounds sprite loaded?
                if (!!groundSprite) {
                    draw(groundSprite);
                } else {
                    mio.util.loadImage(mio.conf.url + 'get/ground', function(image) {
                        groundSprite = image;
                        draw(groundSprite);
                    });
                }
            }
        };
        
        // Iterate over each box
        var eachBox = function(callback) {
            for (var y = grid.length - 1; y >= 0; y--) {
                for (var x = grid[y].length - 1; x >= 0; x--) {
                    callback(grid[y][x], x, y);
                }
            }
        };
        
        // Set styles on canvas element
        var setWorldStyles = function() {
            var screenPxWidth = screenDims[0],
                screenPxHeight = screenDims[1],
                worldPxWidth = gridSize[0] * mio.modul.dims[0],
                worldPxHeight = gridSize[1] * mio.modul.dims[1];
            
            canvas.width = worldPxWidth;
            canvas.height = worldPxHeight;
            canvas.style.left = ( (screenPxWidth - worldPxWidth) / 2 ) + 'px';
            canvas.style.top = ( (screenPxHeight - worldPxHeight) / 2 ) + 'px';
        };
        
        // Returns the border side (or false if it's not a border)
        var getBorderSide = function(box, x, y) {
            if (box.type === 'border') {
                // left / right?
                if (y !== 0 && y !== grid.length-1) {
                    if (x === 0) {
                        return 'left';
                    }
                    if (x === grid[0].length-1) {
                        return 'right';
                    }
                }
                // top / bottom?
                if (x !== 0 && x !== grid[0].length-1) {
                    if (y === 0) {
                        return 'top';
                    }
                    if (y === grid.length-1) {
                        return 'bottom';
                    }
                }
            }
            return false;
        };
        
        // If a border is visible, the world is positionned to see it
        var stickToBorder = function(borders) {
            for (var i = borders.length - 1; i >= 0; i--){
                switch (borders[i]) {
                    case 'left':
                        canvas.style.left = 0;
                    break;
                    case 'right':
                        canvas.style.left = (screenDims[0] - (gridSize[0] * mio.modul.dims[0])) + 'px';
                    break;
                    case 'top':
                        canvas.style.top = 0;
                    break;
                    case 'bottom':
                        canvas.style.top = (screenDims[1] - (gridSize[1] * mio.modul.dims[1])) + 'px';
                    break;
                }
            }
        };
        
        // Returns screen dimensions
        var getScreenDims = function() {
            var width = window.innerWidth;
            var height = window.innerHeight;
            
            if (window.MIO_DEBUG) {
                var w = document.getElementById("world-container");
                width = w.clientWidth;
                height = w.clientHeight;
            }
            return [width, height];
        };
        
        // Init world
        pub.init = function(canvasId) {
            canvas = mio.util.gid('world');
            ctx = canvas.getContext('2d');
            screenDims = getScreenDims.call(this);
            if (window.MIO_DEBUG) {
                canvas.style.outline = '1px solid red';
            }
        };
        
        // Update ground images
        pub.updateGrounds = function(newGrounds) {
            grounds = newGrounds;
            this.draw();
        };
        
        // Update grid size
        pub.updateGrid = function(newGrid, newSize) {
            gridSize = newSize;
            grid = newGrid;
            this.realignWorld();
        };
        
        // Update modul skin
        pub.updateModulSkin = function(skin) {
            if (!!moduls[skin.mid]) {
                delete moduls[skin.mid].skin;
                drawModul.call(this, skin, moduls[skin.mid].pos.x, moduls[skin.mid].pos.y);
            }
        };
        
        // Draw the world fragment
        pub.draw = function() {
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
                var borders = [];
                eachBox.call(this, function(box, x, y) {
                    if (!box) return;
                    
                    var borderSide = getBorderSide.call(this, box, x, y);
                    if (!!borderSide && borders.indexOf(borderSide) === -1) {
                        borders.push(borderSide);
                    }
                    
                    drawGround.call(this, box.ground, x*50, y*50);
                    if (typeof box.modul === 'string') {
                        drawModul.call(this, {'mid': box.modul}, x*50, y*50);
                    }
                });
                // Reposition canvas if borders are displayed
                stickToBorder.call(this, borders);
            }
        };
        
        // Returns grid size
        pub.getGridSize = function() {
            var width = Math.floor(screenDims[0] / mio.modul.dims[0]) + 2;
            var height = Math.floor(screenDims[1] / mio.modul.dims[1]) + 2;
            // Always odd
            if (width % 2 === 0) width += 1;
            if (height % 2 === 0) height += 1;
            return [ width, height ];
        };
        
        // Realign world
        pub.realignWorld = function() {
            screenDims = getScreenDims.call(this);
            setWorldStyles.call(this);
            
            // Refresh
            mio.world.draw();
        };
        
        return pub;
    })();
})();
