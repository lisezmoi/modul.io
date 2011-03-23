(function(){
    var mio = window.mio = window.mio || {};
    
    mio.editor = (function(){
        var pub = {},
            editorPanel,
            editor;
        
        pub.init = function(panel, code) {
            editorPanel = panel;
            
            // Save button
            var buttonContainer = mio.util.createElt("div");
            var button = mio.util.createElt("button", {textContent: "Save & Run", events: {
                click: function() {
                    mio.socket.send({
                        "code": editor.getCode()
                    });
                }
            }});
            buttonContainer.appendChild(button);
            panel.contentElt.appendChild(buttonContainer);
            
            // JS editor
            editor = new CodeMirror(panel.contentElt, {
                path: mio.conf.url + "codemirror/js/",
                parserfile: ["tokenizejavascript.js", "parsejavascript.js"],
                stylesheet: mio.conf.url + "codemirror/css/jscolors.css",
                lineNumbers: true,
                content: code,
                onLoad: function() {
                    pub.refresh();
                }
            });
        };
        
        pub.refresh = function() {
            if (!!editor) {
                var visible = editorPanel.isVisible();
                if (!visible) editorPanel.show();
                editor.wrapping.style.height = (window.innerHeight - editorPanel.titleElt.offsetHeight - editorPanel.contentElt.firstElementChild.offsetHeight - 1) + "px";
                if (!visible) editorPanel.hide();
            }
        };
        
        return pub;
    })();
})();