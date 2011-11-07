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
    this.env = null;
    this.code = '';
    this.position = {x: 0, y: 0};
    this.panels = {};
    this.intervalFunctions = [];
    this.preScript = [
        '"use strict";',
        'Error.prepareStackTrace = prepareStackTrace;',
        'Object.freeze(Error);'
    ];
    this.connectedAt = false;
}
util.inherits(Modul, EventEmitter);
exports.Modul = Modul;

function compileScript() {
    this.panels = {};
    this.intervalFunctions = [];
    this.env = getEnv.call(this);

    try {
        Script.runInNewContext(
            this.preScript.join('\n') + '\n' + this.code,
            this.env,
            'modulCode'
        );
    } catch (e) {
        this.emit('codeError', e);
    }
}

function emitSkinChanges(oldImgData) {
    var updateSkin = false;

    var newImgData = this.canvas.toDataURL('image/png');
    if (oldImgData !== newImgData) {
        this.emit('skinUpdate', this.getSkinHash(newImgData));
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
    function ButtonsPanel(name, buttons) {
        this.panel = curModul.panels[name] = new Panel(name, []);
        if (!!buttons) {
            var buttonsLen = buttons.length;
            for (var i = 0; i < buttonsLen; i++) {
                this.add(buttons[i]);
            }
        }
    }
    ButtonsPanel.prototype.add = function(button) {
        this.panel.buttons.push(button);
        curModul.emit('panelsUpdate', curModul.getPanels());
    };

    /* Button */
    function Button(label, callback) {
        this.label = label;
        this.callback = callback;
    }
    Button.prototype.setLabel = function(label) {
      this.label = label;
      curModul.emit('panelsUpdate', curModul.getPanels());
    };

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
        var oldPosition = curModul.position;

        // Move the modul (direction = [top,right,bottom,left])
        var hasMoved = curModul.world.moveModul(curModul, direction);

        if (hasMoved) {
            curModul.emit('move', oldPosition, curModul.position); // move event
        }
    };
    modul.getDimensions = function() {
      return [50, 50];
    };

    modul.getUpTime = function() {
      return curModul.connectedAt;
    };
    // modul.actions: {
        // Exposed functions in UI buttons and HTTP API
    // };

    function onInterval(fn) {
        curModul.intervalFunctions.push(fn);
    }

    var env = {};
    env.ButtonsPanel = ButtonsPanel;
    env.Button = Button;
    env.modul = modul;
    env.onInterval = onInterval;
    env.world = {
        getDimensions: function() {
            return [curModul.world.width, curModul.world.height];
        }
    };

    // Special stack trace
    env.prepareStackTrace = function(e, structuredStack) {
        var stack = '';
        for (var i=0; i < structuredStack.length; i++) {
            if (structuredStack[i].getFileName() === 'modulCode') {
                stack += '  at';
                var fnName = structuredStack[i].getFunctionName();
                if (fnName.length > 0) {
                    stack += ' ' + fnName;
                }
                stack += ' line ' + (structuredStack[i].getLineNumber() - curModul.preScript.length);
                stack += ' col ' + structuredStack[i].getColumnNumber();
                stack += '\n';
            }
        }
        return stack;
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
        for (var i=0; i < buttons.length; i++) {
          clientPanels[panelName].push([buttons[i].label, buttons[i].callback.length]);
        }
    }
    return clientPanels;
};
Modul.prototype.getCode = function() {
    return this.code;
};
Modul.prototype.execAction = function(panel, action, params, callback) {
    // Search for the action in the buttons list
    var panelButtons = this.panels[panel].buttons;
    var curAction = null;
    for (var i=0; i < panelButtons.length; i++) {
      if (panelButtons[i].label === action) {
        curAction = panelButtons[i].callback;
      }
    }
    // If an action is found, try to execute it
    if (typeof curAction === 'function') {
        var imgData = this.canvas.toDataURL('image/png');
        try {
            curAction.apply(this, params); // execute action
        } catch (e) {
            this.emit('codeError', e);
        }
        emitSkinChanges.call(this, imgData);
    }
};
Modul.prototype.execIntervals = function() {
    var i = this.intervalFunctions.length;
    while (i--) {
        var imgData = this.canvas.toDataURL('image/png');
        try {
            this.intervalFunctions[i]();
        } catch (e) {
            this.emit('codeError', e);
        }
        emitSkinChanges.call(this, imgData);
    }
};