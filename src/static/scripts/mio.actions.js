(function(){
    var mio = window.mio = window.mio || {};
    
    mio.actions = (function(){
        var pub = {},
            curPanels = {};
        
        function updatePanel(panel, buttons, callback) {
            panel.contentElt.innerHTML = "";
            for (var i in buttons) {
                (function(i) {
                    var button = mio.ui.makeButton(buttons[i], function() {
                        mio.util.d(buttons[i]);
                        mio.socket.send({
                            "action": {
                                "panelName": panel.label,
                                "actionName": buttons[i]
                            }
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