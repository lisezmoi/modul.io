(function(){
    var mio = window.mio = window.mio || {};
    
    mio.world = (function(){
        var pub = {},
            canvas,
            ctx,
            moduls = {},
            grid = [],
            grounds = [],
            groundSprite;
        
        var showModulZone = function(x, y) {
            ctx.strokeStyle = "#fff";
            ctx.strokeRect(x-150.5, y-150.5, 350, 350);
        };
        
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
        
        pub.init = function(canvasId) {
            canvas = mio.ui.elements.world;
            ctx = canvas.getContext("2d");
        };
        
        pub.updateGrounds = function(newGrounds) {
            grounds = newGrounds;
            this.draw();
        };
        
        pub.updateGrid = function(newGrid) {
            grid = newGrid;
            this.draw();
        };
        
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
        
        pub.realign = function() {
            var modulDims = mio.modul.dims,
                worldElt = mio.ui.elements.world;
            
            screenDims = getScreenDims.call(this);
            this.gridSize = getGridSize.call(this);
            
            worldElt.width  = this.gridSize[0] * modulDims[0];
            worldElt.height = this.gridSize[1] * modulDims[1];
            worldElt.style.left = "-"+ (modulDims[0] + (screenDims[0] % modulDims[0]) / 2) +"px";
            worldElt.style.top  = "-"+ (modulDims[1] + (screenDims[1] % modulDims[1]) / 2) +"px";
            
            // Refresh
            mio.world.draw();
        };
        
        return pub;
    })();
})();