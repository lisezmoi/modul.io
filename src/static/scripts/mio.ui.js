(function(){
    var mio = window.mio = window.mio || {};
    
    mio.ui = (function(){
        var pub = {};
        
        function makeButton(label, callback) {
            var button = document.createElement("button");
            button.innerHTML = label;
            button.onclick = function() {
                callback();
            };
            return button;
        };
        
        pub.init = function() {
            
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