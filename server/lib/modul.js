var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Script = require('vm').Script,
    Canvas = require('canvas'),
    crypto = require('crypto'),
    _ = require('underscore')._;
    ClientDisplay = require('./client-display').ClientDisplay;

// Modul Class
function Modul(id) {
    // Modul is an EventEmitter
    EventEmitter.call(this);
    
    this.id = id;
    this.canvas = new Canvas(50,50);
    this.ctx = this.canvas.getContext('2d');
    delete this.ctx.canvas; // do not expose canvas
    this.env = getEnv.call(this);
    this.code = '';
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
        this.emit('error', e);
        console.log('============');
        console.log('MODUL ERROR: ', e.message);
        console.log('ERROR STACK: ', e.stack);
    }
}

function emitChanges(oldImgData) {
    var updateSkin = false;
    
    var newImgData = this.canvas.toDataURL('image/png');
    if (oldImgData !== newImgData) {
        this.emit('updateSkin', this.getSkinHash(newImgData));
    }
}

function getEnv() {
    var curModul = this;
    
    /* Base Panel */
    function Panel(name, buttons) {
        this.name = name;
        this.buttons = buttons;
        curModul.panels[name] = this; // Add panel to modul panels
    }
    
    /* ButtonsPanel */
    function ButtonsPanel(panelName, buttons) {
        this.panel = curModul.panels[panelName] = new Panel(panelName, {});
        if (!!buttons) {
            var buttonsLen = buttons.length;
            for (var i = 0; i < buttonsLen; i++) {
                this.add(buttons[i]);
            }
        }
    }
    ButtonsPanel.prototype.add = function(button) {
        this.panel.buttons[button.label] = button;
        curModul.emit('panelsUpdate', curModul.getPanels());
    };
    
    /* Button */
    function Button(label, callback) {
        this.label = label;
        this.callback = callback;
    }
    
    /* Modul */
    var modul = {};
    modul.say = function(text) {
        // Display a message in the text bubble
        console.log('Modul says: "'+ text +'"');
    };
    modul.selected = function() {
        // Return selected modul
    };
    modul.getOtherMods = function() {
        
    };
    modul.onMessage = function(func) {
        // Action to execute when the modul receives a message
    };
    modul.getCoordinates = function() {
        return [curModul.position.x, curModul.position.y];
    };
    modul.getCanvas = function() {
        // Return a 2D context
        return curModul.ctx;
    };
    modul.move = function(direction) {
        // Move the modul (direction = [top,right,bottom,left])
        curModul.world.moveModul(curModul, direction);
        curModul.emit('move', curModul.position); // move event
    };
    // modul.actions: {
        // Exposed functions in UI buttons and HTTP API
    // };
    
    function onInterval(fn) {
        curModul.intervalFunctions.push(fn);
    }
    
    var env = {
        'ButtonsPanel': ButtonsPanel,
        'Button': Button,
        'modul': modul,
        'onInterval': onInterval
    };
    
    return env;
}

Modul.prototype.updateCode = function(modulCode, callback) {
    this.code = modulCode;
    compileScript.call(this);
    
    // Send modul skin
    this.emit('change', {
        skinHash: this.getSkinHash(this.canvas.toDataURL('image/png'))
    });
    
    if (!!callback) callback();
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
    var hash = crypto.createHash('sha1'),
        hashData = data || this.canvas.toDataURL('image/png'),
        digest;
        
    hash.update(hashData);
    digest = hash.digest('hex');
    
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
    var curAction = this.panels[panel].buttons[action].callback;
    if (typeof curAction === 'function') {
        var imgData = this.canvas.toDataURL('image/png');
        this.panels[panel].buttons[action].callback.apply(this, params); // execute action
        emitChanges.call(this, imgData);
    }
};
Modul.prototype.execIntervals = function() {
    var i = this.intervalFunctions.length;
    while (i--) {
        var imgData = this.canvas.toDataURL('image/png');
        this.intervalFunctions[i]();
        emitChanges.call(this, imgData);
    }
};