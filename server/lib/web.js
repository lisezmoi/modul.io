var http = require('http');
var express = require('express');
var compressAssets = require('./compress-assets');
var logger = require('./logger');
var world = require('./world').getWorld();
var util = require('util');

var webServer = null;

exports.start = function start() {

  // Already started
  if (webServer) return webServer;

  // Compress JS files before starting the server
  compressAssets.js();

  var app = express();
  var server = http.createServer(app);

  app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    //app.use(app.router);
    app.use(express.static(__dirname + '/../../client'));
    app.use(express.cookieParser());
    app.use(express.favicon(__dirname + '/../../client/favicon.ico'));
    app.use(express.session({ 'secret': 'goVfq36*jp586w%GMkW)7F#,x2>y_gPu)tUAZ`%$I:#4S.a!z-x[W6M?gn/I.}ks' }));
  });

  // Dev environment
  app.configure('dev', function(){
    app.set('views', __dirname + '/../views');
    app.set('view engine', 'ejs');
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  // Prod environment
  app.configure('prod', function(){
    app.set('views', __dirname + '/../views');
    app.set('view engine', 'ejs');
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  // Views global vars
  var viewVars = {};

  // Errors
  app.use(function(err, req, res, next) {
    var errCode = (err instanceof NotFound)? 404 : 500;
    res.statusCode = errCode;
    res.render(errCode + '.ejs');
  });

  // Home
  app.get('/', function(req, res, next) {
    res.render('index.ejs', {
      layout: false,
      host: req.headers.host,
      moduls: world.getModuls()
    });
  });

  // Get ground sprites
  app.get('/get/ground', function(req, res, next) {
    world.ground.getGroundsPng(function(buf) {
      res.writeHead(200, {'Content-Type': 'image/png'});
      res.end(buf);
    });
  });

  // Get a modul image
  app.get('/:user/:modul/skin', function(req, res, next) {
    var modul = world.getModul(req.params.user + "/" + req.params.modul);
    if (modul) {
      res.writeHead(200, {'Content-Type': 'image/png'});
      modul.getSkinPng(function(buf) {
        res.end(buf);
      });
    } else {
      next();
    }
  });

  // Modul page
  app.get('/:user/:modul', function(req, res, next) {

    if ( !world.getModul(req.params.user + '/' + req.params.modul) ) { // Modul exists?
      res.statusCode = 404;
      res.render('create-modul.ejs', {
        layout: false,
        host: req.headers.host,
        user: req.params.user,
        modul: req.params.modul
      });
    } else {
      res.render('modul.ejs', {
        layout: false,
        locals: {
          user: req.params.user,
          modul: req.params.modul,
          host: req.headers.host,
          domain: req.headers.host.split(':')[0],
          sessionID: req.sessionID
        }
      });
    }
  });

  // Modul creation
  app.post('/:user/:modul', function(req, res, next) {
    var modulId = req.params.user + '/' + req.params.modul;
    if (!world.getModul(modulId)) {
      var dManager = require('./data-manager').getDataManager();
      dManager.createDefaultModul(modulId, function(modul) {
        res.redirect('/' + modulId);
      });
    } else {
      res.redirect('/' + modulId);
    }
  });

  // NotFound Exception
  function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
  }
  util.inherits(NotFound, Error);

  // 404
  app.get('/*', function(req, res, next){
    throw new NotFound();
  });

  return {
    app: app,
    http: server
  };
};
