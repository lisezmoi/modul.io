(function(){
    var mio = window.mio = window.mio || {};
    
    mio.main = function(config){
        
        // Init debug
        if (typeof MIO_DEBUG !== 'undefined' && MIO_DEBUG === true) {
            mio.debug.init();
        }
        
        // Configuration
        mio.conf = config;
        
        // Init UI
        mio.ui.init();
        mio.ui.waitFor('gridfragment', 'panels', 'grounds', 'code');
        
        // Actions
        //var actionsPanel = mio.ui.panels.add('actions', 'Actions', 'br');
        //if (actionsPanel !== false) {
        //    mio.actions.init(actionsPanel);
        //}
        
        // Editor
        var editorPanel = mio.ui.panels.add('codepad', 'Code Pad', 'tr', {overlap: true});
        
        // Console
        var consolePanel = mio.ui.panels.add('console', 'Console', 'tl', {overlap: true});
        mio.console.init(consolePanel, 'Console ready.');
        
        // World init
        mio.world.init();
        
        // Socket.IO
        mio.socket = io.connect('http://' + mio.conf.domain);
        mio.socket.on('connect', function(){
            mio.socket.emit('modulId', mio.conf.modulId);
            mio.socket.emit('gridSize', mio.world.getGridSize());
        });
        
        // Ground textures
        mio.socket.on('grounds', function(grounds){
            mio.world.updateGrounds(grounds);
            mio.ui.justGot('grounds');
        });
        
        // Panels
        mio.socket.on('panels', function(panels) {
            mio.actions.updatePanels(panels);
            mio.ui.justGot('panels');
        });
        
        // Grid
        mio.socket.on('gridFragment', function(gridFragment) {
            mio.world.updateGrid(gridFragment);
            mio.ui.justGot('gridfragment');
        });
        
        // Moduls skins
        mio.socket.on('updateSkins', function(updateSkins) {
            var i = updateSkins.length;
            while (i--) {
                mio.world.updateModulSkin(updateSkins[i]);
            }
        });
        
        // Code
        mio.socket.on('code', function(code) {
            if (editorPanel !== false) {
                editorPanel.bind('show', function() {
                    var e = document.createEvent('UIEvents');
                    e.initUIEvent('resize', true, true, window, 1);
                    window.dispatchEvent(e);
                });
                mio.editor.init(editorPanel, code);
            }
            mio.ui.justGot('code');
        });
        
        // Log console
        mio.socket.on('log', function(msg) {
            mio.console.log(msg);
        });
        
        // On browser resize
        window.addEventListener('resize', function(){
            mio.world.realignWorld();
            mio.socket.emit('gridSize', mio.world.getGridSize());
            mio.ui.panels.refresh();
            mio.editor.refresh();
        }, false);
    };
})();
