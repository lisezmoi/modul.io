var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Script = require('vm').Script,
    Canvas = require('canvas'),
    crypto = require('crypto'),
    _ = require('underscore')._;

// Modul Class
(function() {
    
    function Modul(id) {
        // Modul is an instance of EventEmitter
        EventEmitter.call(this);
        
        this.id = id;
        this.canvas = new Canvas(50,50);
        this.ctx = this.canvas.getContext('2d');
        delete this.ctx.canvas; // do not expose canvas
        this.env = getEnv.call(this);
        this.code = "";
        this.position = {x: 0, y: 0};
        this.panels = {};
        this.intervalFunctions = [];
    }
    util.inherits(Modul, EventEmitter);
    exports.Modul = Modul;
    
    function compileScript() {
        this.panels = {};
        this.intervalFunctions = [];
        try {
            Script.runInNewContext(this.code, this.env);
        } catch (e) {
            this.emit("error", e);
            console.log("============");
            console.log("MODUL ERROR: ", e.message);
            console.log("ERROR STACK: ", e.stack);
            //throw e;
        }
    }
    
    function checkChanges(callback) {
        var oldX = this.position.x,
            oldY = this.position.y,
            imgData = this.canvas.toDataURL('image/png'),
            newImgData,
            updateSkin = false;
        callback.call(this);
        newImgData = this.canvas.toDataURL('image/png');
        var changeObj = {
            "updateGrid": (oldX !== this.position.x || oldY !== this.position.y) // true if the modul has moved
        };
        if (imgData !== newImgData) {
            changeObj.skinHash = this.getSkinHash(newImgData);
        }
        return changeObj;
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
            this.panel.buttons[button.label] = button;
            curModul.emit("panelsUpdate", curModul);
        };
        
        /* Button */
        function Button(label, callback) {
            this.label = label;
            this.callback = callback;
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
        modul.getCoordinates = function() {
            return [curModul.position.x, curModul.position.y];
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
    
    Modul.prototype.updateCode = function(modulCode, callback) {
        this.code = modulCode;
        compileScript.call(this);
        if (!!callback) {
            callback();
        }
    };
    Modul.prototype.getSkinData = function() {
        return this.canvas.toBuffer();
    };
    Modul.prototype.getSkinPng = function(callback) {
        this.canvas.toBuffer(function(err, buf){
            callback(buf);
        });
    };
    Modul.prototype.getSkinHash = function(data) {
        var hash = crypto.createHash("sha1"),
            hashData = data || this.canvas.toDataURL('image/png'),
            digest;
            
        hash.update(hashData);
        digest = hash.digest("hex");
        
        return digest;
    };
    Modul.prototype.getPanels = function() {
        var clientPanels = {};
        for (var panelName in this.panels) {
            clientPanels[panelName] = [];
            var buttons = this.panels[panelName].buttons;
            for (var i in buttons) {
                clientPanels[panelName].push([buttons[i].label, buttons[i].callback.length]);
            }
        }
        return clientPanels;
    };
    Modul.prototype.getCode = function() {
        return this.code;
    };
    Modul.prototype.execAction = function(panel, action, params, callback) {
        var self = this,
            curAction = self.panels[panel].buttons[action].callback;
        if (typeof curAction === "function") {
            var updates = checkChanges.call(self, function() {
                curAction.apply(self, params);
            });
            self.emit("change", updates);
        }
    };
    Modul.prototype.execIntervals = function() {
        var self = this,
            i = self.intervalFunctions.length;
        while (i--) {
            var updates = checkChanges.call(self, function() {
                self.intervalFunctions[i]();
            });
            self.emit("change", updates);
        }
    };
    
})();