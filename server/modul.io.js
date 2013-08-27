var sio = require('socket.io');
var logger = require('./lib/logger');
var web = require('./lib/web');
var getDataManager = require('./lib/data-manager').getDataManager;
var getWorld = require('./lib/world').getWorld;
var ClientDisplay = require('./lib/client-display').ClientDisplay;
var ENV = process.env.NODE_ENV;
var isStarted = false;

function start(cb) {

  if (isStarted && cb) cb();

  // 'prod' is the default environment
  if (!ENV) {
    ENV = process.env.NODE_ENV = 'prod';
  }

  // Init data manager
  var dManager = getDataManager();

  // Init world
  var world = getWorld();

  // HTTP server
  var webServer = web.start();
  var port = 3000;
  var host = ENV === 'prod'? '127.0.0.1' : '0.0.0.0';

  // Socket.IO
  var io = sio.listen(webServer.http);

  // Start the HTTP server
  webServer.http.listen(port, host);
  logger.info('webapp started at http://'+ host +':'+ port);

  io.configure(function() {
    io.set('log level', 1);
  });
  io.sockets.on('connection', function(socket) {
    new ClientDisplay(socket);
  });

  // Moduls events
  world.on('modulAdded', function(modul) {
    logger.info('added ' + modul.id + ' at ['+modul.position.x + ',' + modul.position.y+']');

    modul.on('move', function(oldPosition, newPosition) {
      var displays = ClientDisplay.getDisplaysByMove(oldPosition, newPosition);
      for (var i = displays.length - 1; i >= 0; i--) {
        if (displays[i].modul.id === modul.id) {
          displays[i].sendGridFragment(); // Update full grid if it is the display's main modul
        } else {
          displays[i].sendModulMove(modul.id, newPosition); // Just move the modul
        }
      }
    });
    modul.on('skinUpdate', function(skinHash) {
      var displays = ClientDisplay.getDisplaysByPosition(modul.position);
      for (var i = displays.length - 1; i >= 0; i--) {
        displays[i].sendSkinUpdate(modul.id, skinHash);
      }
    });
    modul.on('panelsUpdate', function(panels) {
      var displays = ClientDisplay.getDisplaysByModulId(modul.id);
      for (var i = displays.length - 1; i >= 0; i--) {
        displays[i].sendPanels(panels);
      }
    });
    modul.on('codeError', function(err) { // Log errors
      var displays = ClientDisplay.getDisplaysByModulId(modul.id);
      for (var i = displays.length - 1; i >= 0; i--) {
        displays[i].logError(err);
      }
    });
    modul.on('log', function(msg) { // Log a message
      var displays = ClientDisplay.getDisplaysByModulId(modul.id);
      for (var i = displays.length - 1; i >= 0; i--) {
        displays[i].log(msg);
      }
    });
  });

  // Load moduls
  if (ENV === 'dev') {
    dManager.loadFixtures();
  } else {
    dManager.loadAllModuls();
  }

  isStarted = true;
  logger.info('modul.io started.');

  if (cb) return cb();
};

exports.start = start;

// Main module
if (require.main === module) {
  exports.start();
}
