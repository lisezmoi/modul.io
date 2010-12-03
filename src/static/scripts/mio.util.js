(function(){
    var mio = window.mio = window.mio || {};
    
    mio.util = (function(){
        var pub = {};
        
        pub.gid = function(eId) {
            return document.getElementById(eId);
        };
        
        pub.d = function(o) {
            if (typeof console !== "undefined") {
                console.log(o);
            }
        };
        
        pub.loadImage = function(url, callback) {
            var image = new Image();
            image.onload = function() {
                callback(image);
            };
            image.src = url;
        };
        
        return pub;
    })();
})();