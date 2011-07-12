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
            mio.ui.closeModulInfos();
        });
        
        // Modul move
        mio.socket.on('modulMove', function(modulId, newPosition) {
            mio.world.moveModul(modulId, newPosition);
        });
        
        // Moduls skins
        mio.socket.on('updateSkin', function(modulId, skinHash) {
            mio.world.updateModulSkin(modulId, skinHash);
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
            mio.world.realign();
            
            mio.ui.panels.refresh();
            mio.editor.refresh();
            mio.ui.refreshModulInfos();
        }, false);
        
        var hoveredBox = null;
        window.addEventListener('mousemove', function(e) {
            var x = Math.floor((e.clientX - mio.world.canvas.style.left.slice(0,-2)-0) / 50);
            var y = Math.floor((e.clientY - mio.world.canvas.style.top.slice(0,-2)-0) / 50);
            if (mio.world.grid[y] && mio.world.grid[y][x]) {
              hoveredBox = mio.world.grid[y][x];
              hoveredBox.x = x;
              hoveredBox.y = y;
              if (hoveredBox.modul) {
                  mio.world.canvas.className = 'hover';
              } else {
                  mio.world.canvas.className = '';
              }
            }
        }, false);
        
        mio.world.canvas.addEventListener('click', function() {
            if (hoveredBox && hoveredBox.modul) {
                mio.ui.modulInfos(hoveredBox.modul, {
                    x: hoveredBox.x,
                    y: hoveredBox.y
                });
            }
        });
    };
})();
