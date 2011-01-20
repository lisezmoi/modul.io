(function(){
    var mio = window.mio = window.mio || {};
    
    mio.main = function(config){
        
        // Configuration
        mio.conf = config;
        
        // Init UI
        mio.ui.init();
        mio.ui.waitFor("gridfragment", "actions", "grounds");
        
        // World init
        mio.world.init();
        
        // Socket.IO
        mio.socket = new io.Socket(mio.conf.domain);
        mio.socket.on("connect", function(){
            mio.socket.send({
                "modulId": mio.conf.modulId,
                "gridSize": mio.world.getGridSize()
            });
        });
        mio.socket.connect();
        
        mio.socket.on("message", function(msg){
            mio.util.d(msg);
            
            if (!!msg.grounds) {
                mio.world.updateGrounds(msg.grounds);
                mio.ui.justGot("grounds");
            }
            if (!!msg.actions) {
                mio.actions.update(msg.actions);
                mio.ui.justGot("actions");
            }
            if (!!msg.gridFragment) {
                mio.world.updateGrid(msg.gridFragment);
                mio.ui.justGot("gridfragment");
            }
        });
        
        // On browser resize…
        window.addEventListener("resize", function(){
            mio.world.realignWorld();
            mio.socket.send({
                "gridSize": mio.world.getGridSize()
            });
        }, false);
    };
})();