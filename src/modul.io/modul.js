var Script = process.binding('evals').Script,
    Canvas = require('canvas');

// Modul Class
(function() {
    
    var Modul = exports.Modul = function(id) {
        this.id = id;
        this.canvas = new Canvas(50,50);
        this.ctx = this.canvas.getContext('2d');
        delete this.ctx.canvas; // do not expose canvas
        this.env = getEnv.call(this);
    };
    
    function compileScript(modulCode) {
        return Script.runInNewContext(modulCode, this.env);
    };
    
    function getEnv() {
        
        var curModul = this;
        
        return {
            
            // Objet modul
            modul: {
                say: function(text) {
                    // Affiche un message dans la bulle de texte
                    console.log("Modul says: \""+text+"\"");
                },
                actions: {
                    // Fonctions exposées dans les boutons et l’API HTTP
                },
                selected: function() {
                    // Retourne othermod sélectionné
                },
                getOtherMods: function() {
                    
                },
                onMessage: function(func) {
                    // Action à exécuter lorsque le modul reçoit un message
                },
                onDisplay: function(func) {
                    // Action à exécuter lorsque le modul est affiché
                },
                onFrame: function() {
                    // Action à exécuter en boucle
                },
                getCanvas: function() {
                    // Retourne l’objet canvas et ses méthodes de dessin
                    return curModul.ctx;
                },
                move: function(direction) {
                    // Permet de déplacer le modul (direction = [top,right,bottom,left])
                    curModul.world.moveModul(curModul, direction);
                }
            }
        };
    };
    
    Modul.prototype = {
        updateCode: function(modulCode) {
            compileScript.call(this, modulCode);
        },
        getSkinData: function() {
            return this.ctx.getImageData(0,0,50,50);
        },
        getSkinPng: function(callback) {
            this.canvas.toBuffer(function(err, buf){
                callback(buf);
            });
        },
        getActions: function() {
            var actions = [];
            for (var action in this.env.modul.actions) {
                actions.push(action);
            }
            return actions;
        },
        execAction: function(action, callback) {
            var curAction = this.env.modul.actions[action];
            if (typeof curAction === "function") {
                curAction();
                callback(this);
            }
        }
    };
})();