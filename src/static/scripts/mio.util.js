(function(){
    var mio = window.mio = window.mio || {};
    
    mio.util = (function(){
        var pub = {},
            loadImageCallbacks = {};
        
        pub.gid = function(eId) {
            return document.getElementById(eId);
        };
        
        window.d = pub.d = function() {
            if (typeof console !== "undefined") {
                try {
                    console.log.apply(this, arguments);
                } catch (e) {
                    if (e.name === "TypeError") {
                        console.log(arguments);
                    }
                }
            }
        };
        
        pub.loadImage = function(url, callback) {
            if (!loadImageCallbacks[url]) {
                loadImageCallbacks[url] = [];
                
                var image = new Image();
                image.onload = function() {
                    for (var i in loadImageCallbacks[url]) {
                        loadImageCallbacks[url][i](image);
                    }
                    delete loadImageCallbacks[url]; // Delete image from loadActions
                };
                image.src = url+"?"+Date.now();
            }
            // Call each callback for this URL
            loadImageCallbacks[url].push(callback);
        };
        
        pub.getSprite = function(img, callback) {
            callback(img);
        };
        
        return pub;
    })();
})();