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
            var button = mio.util.createElt("button", {content: "c", events: {
                click: pub.clear
            }});
            buttonContainer.appendChild(button);
            panel.contentElt.appendChild(buttonContainer);

            // Console element
            consoleElt = mio.util.createElt("div");
            consoleElt.className = "console";
            panel.contentElt.appendChild(consoleElt);

            pub.log(msg, true);
        };

        pub.log = function(msg, silent) {
            var line = mio.util.createElt("pre");
            line.textContent = msg;
            consoleElt.appendChild(line);
            if (!silent) {
              consolePanel.show();
            }
            consolePanel.contentElt.scrollTop = consolePanel.contentElt.scrollHeight;
        };

        pub.clear = function() {
            consoleElt.innerHTML = "";
        };

        return pub;
    })();
})();