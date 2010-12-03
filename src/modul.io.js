var express = require('express'),
    io = require('socket.io'),
    fs = require('fs'),
    server = express.createServer(),
    errors = require('./modul.io/errors'),
    World = require('./modul.io/world').World,
    Modul = require('./modul.io/modul').Modul,
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
var world = new World(16, 12);

// Raphael - modul
var raphModul = new Modul("raphael/default");
raphModul.updateCode(fs.readFileSync("fixtures/raphael.modul", "utf8"));
world.addModul(raphModul, 2, 3);

// Pierre - modul
var pierModul = new Modul("pierre/default");
pierModul.updateCode(fs.readFileSync("fixtures/pierre.modul", "utf8"));
world.addModul(pierModul, 10, 10);

//console.log(pierModul);


// HTTP Requests

// Views global vars
var viewVars = {
    
};

server.get('/', function(req, res, next) {
    res.writeHead(200);
    res.end("index");
});

// Modul page
server.get('/:user/:modul', function(req, res, next) {
    res.render('modul.ejs', {
        layout: false,
        locals: {
            user: req.params.user,
            modul: req.params.modul
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

// 404, 500…
errors.init(server);

// socket.io
var socket = io.listen(server);

socket.on('connection', function(client){
    
    var modulId = null;
    
    client.on('message', function(msg){
        
        // modulId? > init client sesssion
        if (!!msg.modulId) {
            modulId = msg.modulId;
            client.send({
                "grid": world.getGrid(),
                "actions": world.getModul(modulId).getActions()
            });
        }
        
        // Action? exec action on modul
        if (!!msg.action && modulId !== null) {
            world.getModul(modulId).execAction(msg.action, function(modul){
                socket.broadcast({
                    grid: world.getGrid()
                });
            });
        }
    });
    
    client.on('disconnect', function(){
        
    });
});

// Test Modul
// var currentFile = "";

// setInterval(function(){
//     fs.readFile('modultest.js', 'utf8', function (err, data) {
//         //if (currentFile !== data) {
//             //currentFile = data;
//             //for (var i = 40; i > 0; i--) console.log("");
//             sys.print('\033[2J');
//             sys.print('\033[40A');
//             var testModule = new Modul();
//             testModule.updateCode(data);
//             testModule.getSkinData(function(data) {
//                 socket.broadcast({
//                     "modulSkinData": data
//                 });
//             });
//         //}
//     });
// }, 500);


server.listen(3000);