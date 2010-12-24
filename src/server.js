var express = require('express'),
    io = require('socket.io'),
    fs = require('fs'),
    server = express.createServer(),
    ClientDisplay = require('./lib/clientDisplay').ClientDisplay,
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
    
    server.use(express.cookieDecoder());
    server.use(express.session());
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

// ## HTTP server

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

// ## socket.io (websockets) server
var socket = io.listen(server);

socket.on('connection', function(client){
    
    // Modul reference
    var modul;
    
    // Send grounds to the client
    client.send({
        "grounds": world.ground.groundIds
    });
    
    // client.display will manage all components displayed on the client: grid, modul skin, etc.
    client.display = new ClientDisplay();
    client.display.setWorld(world);
    
    // On resize:
    // 
    // - send a new grid fragment
    client.display.on("gridUpdate", function(gridFragment) {
        client.send({
            "gridFragment": gridFragment
        });
    });
    
    // On modul update:
    // 
    // - send new actions
    // - requests a new modul image
    client.display.on("modulUpdate", function(modul) {
        client.send({
            "actions": modul.getActions()
        });
    });
    
    client.on('message', function(msg){
        console.log(msg);
        
        // ### `modulId` message
        // if modul exists, send it to client.display
        if (!!msg.modulId) {
            modul = world.getModul(msg.modulId);
            if (!!modul) {
                client.display.setModul(modul);
            }
        }
        
        // ### `gridSize` message
        // Send the new grid size to client.display
        if (!!msg.gridSize) {
            client.display.setGridSize(msg.gridSize);
        }
        
        // ### `action` message
        // Executes action on modul
        if (!!msg.action && !!modul) {
            modul.execAction(msg.action, function(){
                // Update all clients (need update to only send update to clients that displays the modul)
                for (var sessionId in socket.clients) {
                    var client = socket.clients[sessionId];
                    client.display.getDisplayedModuls(function(gridFragment) {
                        // TEMP
                        client.send({
                            "gridFragment": gridFragment
                        });
                    });
                }
            });
        }
    });
    
    client.on('disconnect', function(){
        delete client.display;
    });
});

server.listen(3000);