(function(){
    var mio = window.mio = window.mio || {};
    
    mio.world = (function(){
        var pub = {},
            canvas,
            ctx,
            moduls = {};
        
        var addModule = function(mid, x, y) {
            moduls[mid] = [y, x];
            mio.util.loadImage(mio.conf.url + mid + "/skin", function(image) {
                ctx.drawImage(image, x, y);
            });
        };
        
        var clearModules = function() {
            for (var mid in moduls) {
                ctx.clearRect(moduls[mid][1], moduls[mid][0], 50, 50)
            }
        };
        
        pub.init = function(canvasId) {
            canvas = mio.util.gid("world");
            ctx = canvas.getContext("2d");
        };
        
        pub.updateGrid = function(grid) {
            clearModules();
            for (var col in grid) {
                for (var cell in grid[col]) {
                    var mid = grid[col][cell];
                    if (typeof mid === "string") {
                        addModule(mid, cell*50, col*50);
                    }
                }
            }
        };
        
        return pub;
    })();
})();