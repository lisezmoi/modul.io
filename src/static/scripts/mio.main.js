(function(){
    var mio = window.mio = window.mio || {};
    
    mio.main = function(config){
        
        // Configuration
        mio.conf = config;
        
        // World init
        mio.world.init("world");
        
        // UI
        mio.ui.init();
        
        // Socket.IO
        mio.socket = new io.Socket(mio.conf.domain);
        
        mio.socket.on("connect", function(){
            mio.socket.send({
                modulId: mio.conf.modulId
            });
        });
        
        mio.socket.connect();
        
        mio.socket.on("message", function(msg){
            mio.util.d(msg);
            
            if (!!msg.grid) {
                mio.world.updateGrid(msg.grid);
            }
            if (!!msg.actions) {
                mio.actions.update(msg.actions);
            }
        });
    };
})();