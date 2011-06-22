(function(){
    var mio = window.mio = window.mio || {};
    
    mio.actions = (function(){
        var pub = {},
            curPanels = {};
        
        function updatePanel(panel, buttons, callback) {
            panel.contentElt.innerHTML = "";
            for (var i in buttons) {
                (function(i) {
                    var button = mio.ui.makeButton(buttons[i][0], function() {
                        
                        var j = 0,
                            values = [];
                        while (j < buttons[i][1]) {
                            values[j] = window.prompt("Enter param #"+(j+1)+":");
                            j++;
                        }
                        mio.util.d(buttons[i]);
                        mio.socket.emit('action', {
                            "panel": panel.label,
                            "name": buttons[i][0],
                            "params": values
                        });
                    });
                    panel.contentElt.appendChild(button);
                })(i);
            }
            if (!!callback) {
                callback();
            }
        }
        
        pub.updatePanels = function(panels) {
            pub.removePanels();
            for (var i in panels) {
                curPanels[i] = mio.ui.panels.add(i, i, "br");
                updatePanel(curPanels[i], panels[i], function() {
                    mio.util.d("Actions updated.");
                });
            }
        };
        
        pub.removePanels = function() {
            for (var i in curPanels) {
                curPanels[i].remove();
                delete curPanels[i];
            }
        };
        
        return pub;
    })();
})();