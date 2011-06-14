(function(){
    var mio = window.mio = window.mio || {};
    
    mio.main = function(config){
        
        // Init debug
        if (typeof MIO_DEBUG !== "undefined" && MIO_DEBUG === true) {
            mio.debug.init();
        }
        
        // Configuration
        mio.conf = config;
        
        // Init UI
        mio.ui.init();
        mio.ui.waitFor("gridfragment", "panels", "grounds", "code");
        
        // Actions
        //var actionsPanel = mio.ui.panels.add("actions", "Actions", "br");
        //if (actionsPanel !== false) {
        //    mio.actions.init(actionsPanel);
        //}
        
        // Editor
        var editorPanel = mio.ui.panels.add("codepad", "Code Pad", "tr", {overlap: true});
        
        // Console
        var consolePanel = mio.ui.panels.add("console", "Console", "tl", {overlap: true});
        mio.console.init(consolePanel, "Console ready.");
        
        // World init
        mio.world.init();
        
        // Socket.IO
        mio.socket = new io.Socket(mio.conf.domain);
        mio.socket.on("connect", function(){
            mio.socket.send({
                "initDisplay": true,
                "modulId": mio.conf.modulId,
                "gridSize": mio.world.getGridSize()
            });
        });
        mio.socket.connect();
        
        mio.socket.on("message", function(msg){
            // mio.util.d(msg);
            
            if (!!msg.grounds) {
                mio.world.updateGrounds(msg.grounds);
                mio.ui.justGot("grounds");
            }
            if (!!msg.panels) {
                mio.actions.updatePanels(msg.panels);
                mio.ui.justGot("panels");
            }
            if (!!msg.gridFragment) {
                mio.world.updateGrid(msg.gridFragment);
                mio.ui.justGot("gridfragment");
            }
            if (!!msg.updateSkins) {
                mio.util.d(msg.updateSkins);
                var i = msg.updateSkins.length;
                while (i--) {
                    mio.world.updateModulSkin(msg.updateSkins[i]);
                }
            }
            
            if (!!msg.code) {
                if (editorPanel !== false) {
                    editorPanel.bind('show', function(){
                        var e = document.createEvent("UIEvents");
                        e.initUIEvent("resize", true, true, window, 1);
                        window.dispatchEvent(e);
                    });
                    mio.editor.init(editorPanel, msg.code);
                }
                mio.ui.justGot("code");
            }
            
            if (!!msg.log) {
                mio.console.log(msg.log);
            }
        });
        
        // On browser resize...
        window.addEventListener("resize", function(){
            mio.world.realignWorld();
            mio.socket.send({
                "gridSize": mio.world.getGridSize()
            });
            mio.ui.panels.refresh();
            mio.editor.refresh();
        }, false);
    };
})();
