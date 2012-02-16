(function(){
    var mio = window.mio = window.mio || {};
    
    mio.editor = (function(){
        var pub = {},
            editorPanel,
            editorPre,
            editor;
        
        function resizeEditor() {
            if (editorPre && editorPanel) {
                editorPre.style.height = ( window.innerHeight - editorPanel.titleElt.offsetHeight -
                                           editorPanel.contentElt.firstElementChild.offsetHeight - 1 ) + 'px';
            }
        }
        
        pub.init = function(panel, code) {
            editorPanel = panel;
            
            // Save button
            var buttonContainer = mio.util.createElt('div');
            var button = mio.util.createElt('button', {content: 'Save', events: {
                click: function() {
                    mio.socket.emit('code', editor.getSession().getValue());
                }
            }});
            buttonContainer.appendChild(button);
            panel.contentElt.appendChild(buttonContainer);
            
            // JS editor
            editorPre = mio.util.createElt('pre');
            editorPre.id = 'ace-editor';
            resizeEditor();
            
            panel.contentElt.appendChild(editorPre);
            
            editor = ace.edit('ace-editor');
            var editorSession = editor.getSession();
            editorSession.setUseSoftTabs(true);
            editorSession.setTabSize(2);
            editor.setTheme('ace/theme/twilight');
            editor.gotoLine(0);
            editorSession.setValue(code);
            
            var JavaScriptMode = require("ace/mode/javascript").Mode;
            editorSession.setMode(new JavaScriptMode());
        };
        
        pub.refresh = resizeEditor;
        
        return pub;
    })();
})();