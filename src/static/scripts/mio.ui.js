(function(){
    var mio = window.mio = window.mio || {};
    
    mio.ui = (function(){
        var pub = {},
            waitList = [],
            screenDims = [],
            hiddenBordersNum = 0;
        
        var makeButton = function(label, callback) {
            var button = document.createElement("button");
            button.innerHTML = label;
            button.onclick = function() {
                callback();
            };
            return button;
        };
        
        var initResize = function() {
            var that = this;
            window.addEventListener("resize", function(){
                realignWorld.call(that);
            }, false);
            realignWorld.call(this);
        };
        
        var realignWorld = function() {
            screenDims = getScreenDims.call(this);
            this.gridSize = getGridSize.call(this);
            setWorldStyles.call(this);
            
            // Send new grid size
            if (!!mio.socket) {
                mio.ui.waitFor("gridfragment");
                mio.socket.send({ gridSize: mio.ui.gridSize });
            }
        };
        
        var setWorldStyles = function() {
            var mDims = mio.modul.dims,
                world = mio.ui.elements.world;
            
            world.width  = this.gridSize[0] * mDims[0];
            world.height = this.gridSize[1] * mDims[1];
            
            // (modul size) - ((screen width % modul size) / 2)
            world.style.left = -(mDims[0]*hiddenBordersNum) + Math.floor((screenDims[0] % mDims[0])/2) +"px";
            world.style.top  = -(mDims[1]*hiddenBordersNum) + Math.floor((screenDims[1] % mDims[1])/2) +"px";
        };
        
        var getScreenDims = function() {
            if (!!mio.debug && !!mio.debug.debugScreen) {
                return [mio.debug.debugScreen.offsetWidth, mio.debug.debugScreen.offsetHeight];
            }
            return [window.innerWidth, window.innerHeight];
        };
        
        var getGridSize = function() {
            return [
                Math.floor(screenDims[0] / mio.modul.dims[0]) + hiddenBordersNum*2,
                Math.floor(screenDims[1] / mio.modul.dims[1]) + hiddenBordersNum*2
            ];
        };
        
        var startWait = function() {
            waitElt = document.createElement("p");
            waitElt.innerHTML = "loading…";
            waitElt.id = "loading";
            document.body.appendChild(waitElt);
        };
        
        var stopWait = function() {
            waitElt.parentNode.removeChild(waitElt);
        };
        
        pub.elements = {};
        pub.gridSize = [];
        
        pub.init = function() {
            this.elements = {
                world: mio.util.gid("world")
            };
            initResize.call(this);
        };
        
        pub.getGridSize = function() {
            return gridSize;
        };
        
        pub.waitFor = function() {
            for (var i = arguments.length-1; i > -1; i--) {
                waitList.push(arguments[i]);
            }
            if (waitList.length === arguments.length) {
                startWait();
            }
        };
        
        pub.justGot = function(component) {
            var componentPos;
            if (waitList.length === 0) { return; }
            
            if ( (componentPos = waitList.indexOf(component)) !== -1) {
                waitList.splice(componentPos, 1);
            }
            if (waitList.length === 0) {
                stopWait.call(this);
            }
        };
        
        pub.updateActionsPanel = function(actions, callback) {
            var actionsPanel = mio.util.gid("actions");
            for (var i in actions) {
                (function(i) {
                    var button = makeButton(i, function() {
                        var button = i;
                        actions[i](i);
                    });
                    actionsPanel.appendChild(button);
                })(i);
            }
            if (!!callback) {
                callback();
            }
        };
        
        return pub;
    })();
})();