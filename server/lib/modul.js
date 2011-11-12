var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Script = require('vm').Script,
    Canvas = require('canvas'),
    crypto = require('crypto'),
    _ = require('underscore')._,
    ClientDisplay = require('./client-display').ClientDisplay,
    ZONE_SIZE = [11, 11];

// Modul Class
function Modul(id) {
    // Modul is an EventEmitter
    EventEmitter.call(this);

    this.id = id;
    this.canvas = new Canvas(50,50);
    this.ctx = this.canvas.getContext('2d');
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

    /* Console panel */
    function ConsolePanel(name, buttons) {
        this.name = name;
        curModul.panels[name] = this;
    }

    /* Buttons panel */
    function ButtonsPanel(name, buttons) {
        this.name = name;
        this.buttons = [];
        if (buttons !== undefined) {
            this.add(buttons);
        }
        curModul.panels[name] = this;
    }

    /* Insert a Button to a ButtonsPanel */
    ButtonsPanel.prototype.add = function(button) {
        if (_.isArray(button)) {
            for (var i=0; i < button.length; i++) {
                if (button[i] instanceof Button) {
                    this.buttons.push(button[i]);
                }
            }
        } else if (button instanceof Button) {
            this.buttons.push(button);
        }
        curModul.emit('panelsUpdate', curModul.getPanels());
    };

    /* Button */
    function Button(label, callback) {
        this.label = label;
        this.callback = callback;
    }

    /* Change the label of a Button */
    Button.prototype.setLabel = function(label) {
      this.label = label;
      curModul.emit('panelsUpdate', curModul.getPanels());
    };

    /* Modul */
    var Modul = function(){
      EventEmitter.call(this);
    };
    util.inherits(Modul, EventEmitter);
    Modul.prototype.say = function(text) {
        // Display a message in the text bubble
        console.log('Modul says: "'+ text +'"');
    };
    Modul.prototype.selected = function() {
        // Return selected modul
    };
    Modul.prototype.getOtherMods = function() {

    };

    // Returns the coordinates: [x, y]
    Modul.prototype.getCoordinates = function() {
        return [curModul.position.x, curModul.position.y];
    };

    // Returns the canvas context
    Modul.prototype.getCanvas = function() {
        // Return a 2D context
        return curModul.ctx;
    };

    // Move the modul
    Modul.prototype.move = function(direction) {
        var oldPosition = curModul.position;

        // Move the modul (direction = [top,right,bottom,left])
        var hasMoved = curModul.world.moveModul(curModul, direction);

        if (hasMoved) {
            curModul.emit('move', oldPosition, curModul.position); // move event
        }
    };

    // Returns the dimensions of the Modul
    Modul.prototype.getDimensions = function() {
      return [50, 50];
    };

    // Returns moduls around the modul
    Modul.prototype.sonar = function() {
      var otherModuls = [];
      function eachBlock(blocks, callback) {
        for (var i=0; i < blocks.length; i++) {
          var line = blocks[i];
          for (var j=0; j < line.length; j++) {
            callback(line[j]);
          }
        }
      }
      eachBlock(curModul.getZoneBlocks(), function(block) {
        if (block.modul !== null && block.modul !== curModul.id) {
          otherModuls.push(curModul.world.getModul(block.modul).getExternalModul(curModul));
        }
      });
      return otherModuls;
    };

    // Returns the modul uptime
    Modul.prototype.getUpTime = function() {
      return curModul.connectedAt;
    };

    function World() {
      EventEmitter.call(this);
    }
    util.inherits(World, EventEmitter);

    World.prototype.onInterval = function(fn) {
        curModul.intervalFunctions.push(fn);
    }

    // Returns the world dimension
    World.prototype.getDimensions = function() {
        return [curModul.world.width, curModul.world.height];
    }

    function log(msg) {
      curModul.emit('log', msg);
    }

    /* Exports the public API */
    var env = {};
    env.ui = {};
    env.ui.ConsolePanel = ConsolePanel;
    env.ui.ButtonsPanel = ButtonsPanel;
    env.ui.Button = Button;
    env.ui.log = log;
    env.modul = new Modul();
    env.world = new World();

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

// Returns the blocks around the modul
Modul.prototype.getZoneBlocks = function() {
  return this.world.getGridFragment(this.position, ZONE_SIZE).fragment;
};

Modul.prototype.getExternalModul = function(fromModul) {
  var curModul = this;
  return {
    id: curModul.id,
    send: function(msg) {
      curModul.env.modul.emit('message', fromModul.getExternalModul(curModul), msg);
    },
    image: function() {
      return curModul.ctx.getImageData(0, 0, 50, 50);
    }
  };
};

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
        if (buttons) {
            for (var i=0; i < buttons.length; i++) {
              clientPanels[panelName].push([buttons[i].label, buttons[i].callback.length]);
            }
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