var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    vm = require('vm'),
    Canvas = require('canvas'),
    crypto = require('crypto'),
    _ = require('underscore')._,
    EnvWrapper = require('./env-wrapper').EnvWrapper,
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
    this.env = ( new EnvWrapper(this) ).getEnv();
    try {
        var script = vm.createScript(
          this.preScript.join('\n') + '\n' +
          this.code, 'modulCode');
        script.runInNewContext(this.env);
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
              clientPanels[panelName].push([buttons[i].label(), buttons[i].callback.length]);
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
      if (panelButtons[i].label() === action) {
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
Modul.prototype.execIntervals = function(currentDate) {
    var curModul = this,
        imgData = this.canvas.toDataURL('image/png');
    this.env.world.emit('interval', currentDate);
    setTimeout(function(){ // FIXME
      emitSkinChanges.call(curModul, imgData);
    }, 100);
};