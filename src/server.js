var express = require('express'),
    io = require('socket.io'),
    fs = require('fs'),
    server = express.createServer(),
    Clients = require('./lib/clients').Clients,
    World = require('./lib/world').World,
    Modul = require('./lib/modul').Modul,
    Ground = require('./lib/ground').Ground,
    sys = require('sys'),
    _ = require('underscore')._;

// Change current dir
process.chdir(__dirname);

server.configure(function(){
    server.use(express.methodOverride());
    server.use(express.bodyDecoder());
    //server.use(server.router);
    server.use(express.staticProvider(__dirname + '/static'));
});

// Dev environment
server.configure('development', function(){
    server.set('views', __dirname + '/views');
    server.set('view engine', 'ejs');
    server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Init world
var world = new World(160, 120);

// Raphael - modul
var raphModul = new Modul("raphael/default");
raphModul.updateCode(fs.readFileSync("fixtures/raphael.modul", "utf8"));
world.addModul(raphModul, 30, 20);

// Pierre - modul
var pierModul = new Modul("pierre/default");
pierModul.updateCode(fs.readFileSync("fixtures/pierre.modul", "utf8"));
world.addModul(pierModul, 140, 40);

// HTTP Requests

// Views global vars
var viewVars = {
    
};

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

// Modul page
server.get('/:user/:modul', function(req, res, next) {
    console.log(req.headers.host);
    res.render('modul.ejs', {
        layout: false,
        locals: {
            user: req.params.user,
            modul: req.params.modul,
            host: req.headers.host,
            domain: req.headers.host.slice(0,-5)
        }
    });
});

// Get a modul image
server.get('/:user/:modul/skin', function(req, res, next) {
    world.getModuls(function(moduls) {
        res.writeHead(200, {'Content-Type': 'image/png'});
        moduls[req.params.user + "/" + req.params.modul].getSkinPng(function(buf){
            res.end(buf);
        });
    });
});

// NotFound Exception
function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
};
sys.inherits(NotFound, Error);

// 404
server.get('/*', function(req, res, next){
    throw new NotFound;
});

// Errors
server.error(function(err, req, res, next) {
    if (err instanceof NotFound) {
        res.render('404.ejs');
    } else {
        console.log(err.stack);
        res.render('500.ejs');
    }
});

// socket.io
var socket = io.listen(server);

socket.on('connection', function(client){
    
    client.mio = {
        modul: null,
        gridSize: []
    };
    
    client.on('message', function(msg){
        console.log(msg);
        
        // modulId? > init client sesssion
        if (!!msg.modulId) {
            client.mio.modul = world.getModul(msg.modulId);
            if (!!client.mio.modul) {
                client.send({
                    "actions": client.mio.modul.getActions(),
                    "grounds": world.ground.groundIds
                });
            }
        }
        
        // Get client grid side
        if (!!msg.gridSize && !!client.mio.modul) {
            client.mio.gridSize = msg.gridSize;
            client.send({
                "gridFragment": world.getGridFragment(client.mio.modul.position, client.mio.gridSize)
            });
        }
        
        // Action? exec action on modul
        if (!!msg.action && !!client.mio.modul) {
            world.getModul(client.mio.modul.id).execAction(msg.action, function(modul){
                // Update all clients (need update to only send update to clients that displays the modul)
                for (var sessionId in socket.clients) {
                    var client = socket.clients[sessionId];
                    if (!!client.mio.modul && client.mio.gridSize.length > 0) {
                        client.send({
                            "gridFragment": world.getGridFragment(client.mio.modul.position, client.mio.gridSize)
                        });
                    }
                }
            });
        }
    });
    
    client.on('disconnect', function(){
        
    });
});

server.listen(3000);