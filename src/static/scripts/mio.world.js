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
            screenDims = [],
            hiddenBordersWidth = 0;
        
        // Draw a modul detection zone
        var showModulZone = function(x, y) {
            ctx.strokeStyle = "#fff";
            ctx.strokeRect(x-150.5, y-150.5, 350, 350);
        };
        
        // Draw a single modul
        var drawModul = function(mid, x, y, zone) {
            moduls[mid] = moduls[mid] || {};
            moduls[mid].pos = {x: x, y: y};
            
            if (!!zone) {
                showModulZone(x, y);
            }
            
            function draw() {
                ctx.drawImage(moduls[mid].skin, moduls[mid].pos.x, moduls[mid].pos.y);
            };
            
            if (!moduls[mid].skin) {
                mio.util.loadImage(mio.conf.url + mid + "/skin", function(image) {
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
                function draw(groundSprite) {
                    ctx.drawImage(groundSprite, grounds.indexOf(gid)*50, 0, 50, 50, x, y, 50, 50);
                    // ctx.fillStyle = "#ffffff";
                    // ctx.font = 'bold 9px Arial';
                    // ctx.fillText(grid[y/50][x/50].x+","+grid[y/50][x/50].y, x, y+10);
                };
                // Grounds sprite loaded?
                if (!!groundSprite) {
                    draw(groundSprite);
                } else {
                    mio.util.loadImage(mio.conf.url + "get/ground", function(image) {
                        groundSprite = image;
                        draw(groundSprite);
                    });
                }
            }
        };
        
        // Iterate over each box
        var eachBox = function(callback) {
            for (var y in grid) {
                for (var x in grid[y]) {
                    callback(grid[y][x], x, y);
                }
            }
        };
        
        // Set styles on canvas element
        var setWorldStyles = function() {
            var mDims = mio.modul.dims;
            
            canvas.width  = gridSize[0] * mDims[0];
            canvas.height = gridSize[1] * mDims[1];
            
            // (modul size) - ((screen width % modul size) / 2)
            canvas.style.left = -(mDims[0]*hiddenBordersWidth) + Math.floor((screenDims[0] % mDims[0])/2) +"px";
            canvas.style.top  = -(mDims[1]*hiddenBordersWidth) + Math.floor((screenDims[1] % mDims[1])/2) +"px";
        };
        
        // Returns screen dimensions
        var getScreenDims = function() {
            if (!!mio.debug && !!mio.debug.debugScreen) {
                return [mio.debug.debugScreen.offsetWidth, mio.debug.debugScreen.offsetHeight];
            }
            return [window.innerWidth, window.innerHeight];
        };
        
        // Init world
        pub.init = function(canvasId) {
            canvas = mio.util.gid("world");
            ctx = canvas.getContext("2d");
            this.realignWorld();
        };
        
        // Update ground images
        pub.updateGrounds = function(newGrounds) {
            grounds = newGrounds;
            this.draw();
        };
        
        // Update grid size
        pub.updateGrid = function(newGrid) {
            grid = newGrid;
            this.draw();
        };
        
        // Draw the world fragment
        pub.draw = function() {
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
                eachBox.call(this, function(box, x, y) {
                    drawGround.call(this, box.ground, x*50, y*50);
                    if (typeof box.modul === "string") {
                        drawModul.call(this, box.modul, x*50, y*50);
                    }
                });
            }
        };
        
        // Realign world
        pub.realign = function() {
            var modulDims = mio.modul.dims,
                worldElt = mio.ui.elements.world;
            
            screenDims = getScreenDims.call(this);
            
            worldElt.width  = gridSize[0] * modulDims[0];
            worldElt.height = gridSize[1] * modulDims[1];
            worldElt.style.left = "-"+ (modulDims[0] + (screenDims[0] % modulDims[0]) / 2) +"px";
            worldElt.style.top  = "-"+ (modulDims[1] + (screenDims[1] % modulDims[1]) / 2) +"px";
            
            // Refresh
            mio.world.draw();
        };
        
        // Returns grid size
        pub.getGridSize = function() {
            return [
                Math.floor(screenDims[0] / mio.modul.dims[0]) + hiddenBordersWidth*2,
                Math.floor(screenDims[1] / mio.modul.dims[1]) + hiddenBordersWidth*2
            ];
        };
        
        // Realign world
        pub.realignWorld = function() {
            screenDims = getScreenDims.call(this);
            gridSize = this.getGridSize();
            setWorldStyles.call(this);
        };
        
        return pub;
    })();
})();