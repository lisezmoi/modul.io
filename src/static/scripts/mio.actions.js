(function(){
    var mio = window.mio = window.mio || {};
    
    mio.actions = (function(){
        var pub = {};
        
        pub.update = function(names) {
            var actions = {};
            for (var i in names) {
                actions[names[i]] = function(name) {
                    mio.util.d(name);
                    mio.socket.send({
                        action: name
                    });
                };
            }
            mio.ui.updateActionsPanel(actions, function() {
                mio.util.d("Actions updated.");
            });
        };
        
        return pub;
    })();
})();