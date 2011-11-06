(function(){
    var mio = window.mio = window.mio || {};
    
    mio.console = (function(){
        var pub = {},
            consolePanel,
            consoleElt,
            lines = [];
        
        pub.init = function(panel, msg) {
            consolePanel = panel;
            
            // Clear button
            var buttonContainer = mio.util.createElt("div");
            var button = mio.util.createElt("button", {textContent: "Clear", events: {
                click: pub.clear
            }});
            buttonContainer.appendChild(button);
            panel.contentElt.appendChild(buttonContainer);
            
            // Console element
            consoleElt = mio.util.createElt("div");
            consoleElt.className = "console";
            panel.contentElt.appendChild(consoleElt);
            
            pub.log(msg);
        };
        
        pub.log = function(msg) {
            var line = mio.util.createElt("pre");
            line.textContent = msg;
            consoleElt.appendChild(line);
            consolePanel.show();
        };
        
        pub.clear = function() {
            consoleElt.innerHTML = "";
        };
        
        return pub;
    })();
})();