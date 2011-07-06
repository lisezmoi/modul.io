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
        var gridSize = mio.world.getGridSize();
        
        // Socket.IO
        mio.socket = io.connect('http://' + mio.conf.domain);
        mio.socket.on('connect', function() {
            mio.socket.emit('modulId', mio.conf.modulId);
            mio.socket.emit('gridSize', gridSize);
        });
        
        // Ground textures
        mio.socket.on('grounds', function(grounds) {
            mio.ui.justGot('grounds');
            mio.world.updateGrounds(grounds);
        });
        
        // Panels
        mio.socket.on('panels', function(panels) {
            mio.ui.justGot('panels');
            mio.actions.updatePanels(panels);
        });
        
        // Grid
        mio.socket.on('gridFragment', function(gridFragment, size) {
            mio.ui.justGot('gridfragment');
            gridSize = size;
            mio.world.updateGrid(gridFragment, size);
        });
        
        // Moduls skins
        mio.socket.on('updateSkin', function(skin) {
            mio.world.updateModulSkin(skin);
        });
        
        // Code
        mio.socket.on('code', function(code) {
            mio.ui.justGot('code');
            if (editorPanel !== false) {
                editorPanel.bind('show', function() {
                    var e = document.createEvent('UIEvents');
                    e.initUIEvent('resize', true, true, window, 1);
                    window.dispatchEvent(e);
                });
                mio.editor.init(editorPanel, code);
            }
        });
        
        // Log console
        mio.socket.on('log', function(msg) {
            mio.console.log(msg);
        });
        
        // On browser resize
        window.addEventListener('resize', function() {
            
            var newGridSize = mio.world.getGridSize();
            
            if ( gridSize[0] !== newGridSize[0] ||
                 gridSize[1] !== newGridSize[1] ) {
                mio.ui.waitFor('gridfragment');
                mio.socket.emit('gridSize', newGridSize);
            }
            mio.world.realignWorld();
            
            mio.ui.panels.refresh();
            mio.editor.refresh();
        }, false);
    };
})();
