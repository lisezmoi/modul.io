(function(){
    var mio = window.mio = window.mio || {};
    
    mio.ui = (function(){
        var pub = {},
            waitList = [];
        
        // Make and returns an HTML button
        var makeButton = function(label, callback) {
            var button = document.createElement("button");
            button.innerHTML = label;
            button.onclick = function() {
                callback();
            };
            return button;
        };
        
        // Show loader
        var startWait = function() {
            waitElt = document.createElement("p");
            waitElt.innerHTML = "loading…";
            waitElt.id = "loading";
            document.body.appendChild(waitElt);
        };
        
        // Hide loader
        var stopWait = function() {
            waitElt.parentNode.removeChild(waitElt);
        };
        
        // HTML Elements
        pub.elements = {};
        
        // Init UI
        pub.init = function() {
            
        };
        
        // Add a new component to the waiting list
        pub.waitFor = function() {
            for (var i = arguments.length-1; i > -1; i--) {
                waitList.push(arguments[i]);
            }
            if (waitList.length === arguments.length) {
                startWait();
            }
        };
        
        // Remove a component from the waiting list
        pub.justGot = function(component) {
            var componentPos;
            if (waitList.length === 0) { return; }
            
            if ( (componentPos = waitList.indexOf(component)) !== -1) {
                waitList.splice(componentPos, 1);
            }
            if (waitList.length === 0) {
                stopWait.call(this);
            }
        };
        
        // Action buttons generation
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