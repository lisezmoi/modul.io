var Script = require('vm').Script,
    Canvas = require('canvas');

// Modul Class
(function() {
    
    var Modul = exports.Modul = function(id) {
        this.id = id;
        this.canvas = new Canvas(50,50);
        this.ctx = this.canvas.getContext('2d');
        delete this.ctx.canvas; // do not expose canvas
        this.env = getEnv.call(this);
        this.code = "";
        this.position = {x: 0, y: 0};
        this.panels = {};
        this.panelsUpdate = false;
        this.intervalFunctions = [];
    };
    
    function compileScript() {
        this.panels = {};
        this.intervalFunctions = [];
        try {
            Script.runInNewContext(this.code, this.env);
        } catch (e) {
            console.log("MODUL ERROR: ", e);
        }
    }
    
    function getEnv() {
        var curModul = this;
        
        /* Base Panel */
        function Panel(name, buttons) {
            this.name = name;
            this.buttons = buttons;
        }
        
        /* ButtonsPanel */
        function ButtonsPanel(panelName, buttons) {
            this.panel = curModul.panels[panelName] = new Panel(panelName, {});
            if (!!buttons) {
                for (var i in buttons) {
                    this.add(buttons[i]);
                }
            }
        }
        ButtonsPanel.prototype.add = function(button) {
            curModul.panelsUpdate = true;
            this.panel.buttons[button.label] = button;
        };
        
        /* Button */
        function Button(label, callback) {
            this.label = label;
            this.callback = callback;
            console.log(callback.length);
        }
        
        /* Modul */
        var modul = {};
        modul.say = function(text) {
            // Affiche un message dans la bulle de texte
            console.log("Modul says: \""+text+"\"");
        };
        modul.selected = function() {
            // Retourne othermod sélectionné
        };
        modul.getOtherMods = function() {
            
        };
        modul.onMessage = function(func) {
            // Action à exécuter lorsque le modul reçoit un message
        };
        modul.onFrame = function() {
            // Action à exécuter en boucle
        };
        modul.getCanvas = function() {
            // Retourne l'objet canvas et ses méthodes de dessin
            return curModul.ctx;
        };
        modul.move = function(direction) {
            // Permet de déplacer le modul (direction = [top,right,bottom,left])
            curModul.world.moveModul(curModul, direction);
        };
        // modul.actions: {
            // Exposed functions in UI buttons and HTTP API
        // };
        
        function onInterval(fn) {
            curModul.intervalFunctions.push(fn);
        }
        
        var env = {
            "ButtonsPanel": ButtonsPanel,
            "Button": Button,
            "modul": modul,
            "onInterval": onInterval
        };
        
        return env;
    }
    
    Modul.prototype = {
        updateCode: function(modulCode, callback) {
            this.code = modulCode;
            compileScript.call(this);
            if (!!callback) {
                callback();
            }
        },
        getSkinData: function() {
            return this.canvas.toBuffer();
        },
        getSkinPng: function(callback) {
            this.canvas.toBuffer(function(err, buf){
                callback(buf);
            });
        },
        getPanels: function() {
            var clientPanels = {};
            for (var panelName in this.panels) {
                clientPanels[panelName] = [];
                var buttons = this.panels[panelName].buttons;
                for (var i in buttons) {
                    clientPanels[panelName].push(buttons[i].label);
                }
            }
            this.panelsUpdate = false; // reset panels update state
            return clientPanels;
        },
        getCode: function() {
            return this.code;
        },
        execAction: function(panel, action, callback) {
            var curAction = this.panels[panel].buttons[action].callback,
                oldX = this.position.x,
                oldY = this.position.y;
            if (typeof curAction === "function") {
                var imgData = this.canvas.toDataURL('image/png');
                curAction();
                callback({
                    "updateSkin": imgData !== this.canvas.toDataURL('image/png'), // true if the image has changed
                    "updateGrid": (oldX !== this.position.x || oldY !== this.position.y), // true if the modul has moved
                    "updatePanels": this.panelsUpdate // true if panels changed
                });
            }
        }
    };
})();
