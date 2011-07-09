var express = require('express'),
    world = require('./world').getWorld(),
    util = require('util'),
    server = null;

exports.start = function(port) {
    
    if (server) {
        return server;
    }
    
    server = express.createServer();
    
    server.configure(function(){
        server.use(express.methodOverride());
        server.use(express.bodyParser());
        //server.use(server.router);
        server.use(express.static(__dirname + '/../../client'));
        server.use(express.cookieParser());
        server.use(express.favicon(__dirname + '/../../client/favicon.ico'));
        server.use(express.session({ 'secret': 'goVfq36*jp586w%GMkW)7F#,x2>y_gPu)tUAZ`%$I:#4S.a!z-x[W6M?gn/I.}ks' }));
    });
    
    // Dev environment
    server.configure('dev', function(){
        server.set('views', __dirname + '/../views');
        server.set('view engine', 'ejs');
        server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });
    
    // Prod environment
    server.configure('prod', function(){
        server.set('views', __dirname + '/../views');
        server.set('view engine', 'ejs');
        server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });
    
    // Views global vars
    var viewVars = {
        
    };
    
    // Home
    server.get('/', function(req, res, next) {
        res.writeHead(200);
        res.end("index");
    });
    
    // Get ground sprites
    server.get('/get/ground', function(req, res, next) {
        world.ground.getGroundsPng(function(buf) {
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(buf);
        });
    });
    
    // Get a modul image
    server.get('/:user/:modul/skin', function(req, res, next) {
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
    server.get('/:user/:modul', function(req, res, next) {
        
        if ( !world.getModul(req.params.user + '/' + req.params.modul) ) { // Modul exists?
            res.render('create-modul.ejs', {
                layout: false,
                status: 404,
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
                    domain: req.headers.host.slice(0,-5),
                    sessionID: req.sessionID
                }
            });
        }
    });
    
    // Modul creation
    server.post('/:user/:modul', function(req, res, next) {
        var modulId = req.params.user + '/' + req.params.modul;
        if (!world.getModul(modulId)) {
            var dManager = require('./data-manager').getDataManager();
            dManager.createDefaultModul(modulId, function(modul) {
                res.redirect('/'+modulId);
            });
        } else {
            next();
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
    server.get('/*', function(req, res, next){
        throw new NotFound();
    });
    
    // Errors
    server.error(function(err, req, res, next) {
        if (err instanceof NotFound) {
            res.render('404.ejs', {
                status: 404
            });
        } else {
            console.log(err.stack);
            res.render('500.ejs', {
                status: 500
            });
        }
    });
    
    server.listen(port);
    console.log('webserver started: http://127.0.0.1:'+port);
    
    return server;
};