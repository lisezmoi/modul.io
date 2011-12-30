var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore')._;

// EnvWrapper constr.
// This is the modul.io API
// An single environment is associatied with each modul
function EnvWrapper(modul) {
  // EnvWrapper is an EventEmitter
  EventEmitter.call(this);

  this.modul = modul;
  this.env = null;
}
util.inherits(EnvWrapper, EventEmitter);
exports.EnvWrapper = EnvWrapper;

EnvWrapper.prototype.getEnv = function() {
    var privateModul = this.modul;

    /* Console panel constr. */
    function ConsolePanel(name) {
        this.name = name;
        privateModul.panels[name] = this;
    }

    /* Buttons panel constr. */
    function ButtonsPanel(name, buttons) {
        // ButtonsPanel extends ConsolePanel
        ConsolePanel.call(this, name);

        this.buttons = [];
        if (buttons !== undefined) {
            this.add(buttons);
        }
    }

    /* Insert a Button into a ButtonsPanel */
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
        privateModul.emit('panelsUpdate', privateModul.getPanels());
    };

    /* Button */
    function Button(label, callback) {
        this._label = label;
        this.callback = callback;
    }

    /* Change the label of a Button */
    Button.prototype.label = function(label) {
      if (!label) {
        return this._label;
      } else {
        this._label = label;
        privateModul.emit('panelsUpdate', privateModul.getPanels());
      }
    };

    /* Modul */
    var Modul = function(){
      EventEmitter.call(this);
      this.context = privateModul.ctx;
    };
    util.inherits(Modul, EventEmitter);
    Modul.prototype.say = function(text) {
        // Display a message in the text bubble
        console.log('Modul says: "'+ text +'"');
    };
    Modul.prototype.selected = function() {
        // Return selected modul
    };

    // Returns the coordinates: [x, y]
    Modul.prototype.coordinates = function() {
        return [privateModul.position.x, privateModul.position.y];
    };

    // Move the modul
    Modul.prototype.move = function(direction) {
        var oldPosition = privateModul.position;

        // Move the modul (direction = [top,right,bottom,left])
        var hasMoved = privateModul.world.moveModul(privateModul, direction);

        if (hasMoved) {
            privateModul.emit('move', oldPosition, privateModul.position); // move event
        }
    };

    // Returns the dimensions of the Modul
    Modul.prototype.dimensions = function() {
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
      eachBlock(privateModul.getZoneBlocks(), function(block) {
        if (block.modul !== null && block.modul !== privateModul.id) {
          otherModuls.push(privateModul.world.getModul(block.modul).getExternalModul(privateModul));
        }
      });
      return otherModuls;
    };

    // Returns the modul uptime
    Modul.prototype.uptime = function() {
      return privateModul.connectedAt;
    };

    function World() {
      EventEmitter.call(this);
    }
    util.inherits(World, EventEmitter);

    World.prototype.onInterval = function(fn) {
        privateModul.intervalFunctions.push(fn);
    }

    // Returns the world dimension
    World.prototype.dimensions = function() {
        return [privateModul.world.width, privateModul.world.height];
    }

    function log(msg) {
      privateModul.emit('log', msg);
    }

    /* Exports the public API */
    var env = this.env = {};
    env.ui = {};
    env.ui.consolePanel = function(name) {
      return new ConsolePanel(name);
    };
    env.ui.buttonsPanel = function(name, buttons) {
      return new ButtonsPanel(name, buttons);
    };
    env.ui.button = function(label, callback){
      return new Button(label, callback);
    };
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
                stack += ' line ' + (structuredStack[i].getLineNumber() - privateModul.preScript.length);
                stack += ' col ' + structuredStack[i].getColumnNumber();
                stack += '\n';
            }
        }
        return stack;
    };

    return this.env;
};