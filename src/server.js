var express = require('express'),
    io = require('socket.io'),
    fs = require('fs'),
    server = express.createServer(),
    DataManager = require('./lib/dataManager').DataManager,
    ClientDisplay = require('./lib/clientDisplay').ClientDisplay,
    World = require('./lib/world').World,
    Modul = require('./lib/modul').Modul,
    Ground = require('./lib/ground').Ground,
    util = require('util'),
    _ = require('underscore')._;

// Change current dir
process.chdir(__dirname);

server.configure(function(){
    server.use(express.methodOverride());
    server.use(express.bodyParser());
    //server.use(server.router);
    server.use(express.static(__dirname + '/static'));
    
    server.use(express.cookieParser());
    server.use(express.session({ 'secret': 'goVfq36*jp586w%GMkW)7F#,x2>y_gPu)tUAZ`%$I:#4S.a!z-x[W6M?gn/I.}ks' }));
});

// Dev environment
server.configure('development', function(){
    server.set('views', __dirname + '/views');
    server.set('view engine', 'ejs');
    server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Data Manager
var dManager = new DataManager();

// Init world
var world = new World(160, 120);

// Raphael - modul
var raphModul = new Modul("raphael/default");
raphModul.updateCode(fs.readFileSync("fixtures/raphael.modul", "utf8"));
world.addModul(raphModul, 30, 20);

// Raphael - test modul
var raphTestModul = new Modul("raphael/test");
raphTestModul.updateCode(fs.readFileSync("fixtures/raphael-test.modul", "utf8"));
world.addModul(raphTestModul, 33, 22);

// Caroline - modul
var caroModul = new Modul("caroline/default");
caroModul.updateCode(fs.readFileSync("fixtures/caroline.modul", "utf8"));
world.addModul(caroModul, 29, 19);

// Pierre - modul
var pierModul = new Modul("pierre/default");
pierModul.updateCode(fs.readFileSync("fixtures/pierre.modul", "utf8"));
world.addModul(pierModul, 31, 21);

function loadTestModuls() {
    var testCount = 200;
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function addTestModul(num) {
        var testModul = new Modul("default/"+num);
        testModul.updateCode(fs.readFileSync("fixtures/default.modul", "utf8"));
        var x = getRandomInt(1,159),
            y = getRandomInt(1,129);
        if (!world.addModul(testModul, x, y)) {
            addTestModul(num);
        }
        return true;
    }
    while (testCount--) {
        addTestModul(testCount+1);
    }
}
loadTestModuls();

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

// ## socket.io (websockets) server
var socket = io.listen(server, {
    transports: ['websocket', 'flashsocket']
});

// Update moduls
(function initModulsPush() {
    
    function onChange(modul, updates) {
        // Get clients displaying this modul
        ClientDisplay.getDisplaysByModulId(modul.id, function(displays) {
            var skinsToRefresh = (!!updates.skinHash)? [{"mid": modul.id, "hash": updates.skinHash}] : [];
            
            var i = displays.length;
            while(i--) {
                // Refresh displays
                var refreshObj = {};
                if (!!skinsToRefresh) {
                    refreshObj.skinsToRefresh = skinsToRefresh;
                }
                if (!!updates.updateGrid) {
                    refreshObj.updateGrid = updates.updateGrid;
                }
                if (!!updates.updatePanels) {
                    refreshObj.updatePanels = updates.updatePanels;
                }
                displays[i].refresh(refreshObj);
            }
        });
    }
    
    for (var i in world.moduls) {
        (function(modul){
            modul.on("change", function(updates){
                onChange(modul, updates);
            });
            modul.on("panelsUpdate", function() {
                onChange(modul, { updatesPanels: true });
            });
        })(world.moduls[i]);
    }
})();

socket.on('connection', function(client){
    
    // Modul reference
    var modul;
    
    // Send grounds to the client
    client.send({
        "grounds": world.ground.groundIds
    });
    
    client.on('message', function(msg){
        //console.log(msg);
        
        // New display
        if (!!msg.initDisplay && !!msg.modulId && msg.gridSize) {
            
            modul = world.getModul(msg.modulId);
            
            if (!!modul && ClientDisplay.isValidGridSize(msg.gridSize)) {
                
                // client.display will manage all components displayed on the client: grid, modul skin, etc.
                client.display = new ClientDisplay(modul, world, msg.gridSize);
                client.modulId = msg.modulId;
                
                // Send basic
                client.send({
                    "code": modul.getCode(),
                    "panels": modul.getPanels()
                });
                
                // On gridUpdate event, send a new grid fragment
                client.display.on("gridUpdate", function(gridFragment) {
                    client.send({
                        "gridFragment": gridFragment
                    });
                });
                
                // On panelsUpdate event, send all panels
                client.display.on("panelsUpdate", function(panels) {
                    client.send({
                        "panels": panels
                    });
                });
                
                // On gridUpdate event, send a new grid fragment
                client.display.on("skinsUpdate", function(moduls) {
                    client.send({
                        "updateSkins": moduls
                    });
                });
            }
        }
        
        // ### `gridSize` message
        // Send the new grid size to client.display
        if (!!msg.gridSize && !!client.display) {
            client.display.setGridSize(msg.gridSize);
        }
        
        // ### `action` message
        // Executes action on modul
        if (!!msg.action && !!msg.action.panelName && !!msg.action.actionName && !!msg.action.actionParams && !!client.display) {
            modul.execAction(msg.action.panelName, msg.action.actionName, msg.action.actionParams);
        }
        
        // ### `code` message
        // Update modul's code
        if (!!msg.code && !!client.display) {
            modul.updateCode(msg.code, function() {
                dManager.saveModul(modul, function(){
                    client.send({
                        "panels": modul.getPanels() // TODO: send panels only if needed + refresh avatar if needed.
                    });
                });
            });
        }
    });
    
    client.on('disconnect', function(){
        ClientDisplay.remove(client.display);
        delete client.display;
    });
});

server.listen(3000);