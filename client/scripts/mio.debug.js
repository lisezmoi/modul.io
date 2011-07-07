(function(){
    var mio = window.mio = window.mio || {};
    
    mio.debug = (function(){
        var pub = {};
        
        var showScreen = function(marginX, marginY) {
            document.getElementById("world").style.outline = "1px solid white";
            pub.debugScreen = document.getElementById("world-container");
            pub.debugScreen.style.position = "absolute";
            pub.debugScreen.style.top = (marginY) + "px";
            pub.debugScreen.style.left = (marginX) + "px";
            pub.debugScreen.style.width = (window.innerWidth-marginX*2) + "px";
            pub.debugScreen.style.height = (window.innerHeight-marginY*2) + "px";
            pub.debugScreen.style.border = "1px solid green";
            pub.debugScreen.style.overflow = "visible";
            
            window.addEventListener("resize", function(){
                pub.debugScreen.style.width = (window.innerWidth-marginX*2)+"px";
                pub.debugScreen.style.height = (window.innerHeight-marginY*2)+"px";
            }, false);
        };
        
        pub.init = function() {
            showScreen(200, 200);
        };
        
        return pub;
    })();
})();