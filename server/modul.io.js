var web = require('./lib/web'),
    io = require('socket.io'),
    fs = require('fs'),
    DataManager = require('./lib/dataManager').DataManager,
    ClientDisplay = require('./lib/clientDisplay').ClientDisplay,
    getWorld = require('./lib/world').getWorld,
    Modul = require('./lib/modul').Modul,
    Ground = require('./lib/ground').Ground,
    util = require('util'),
    _ = require('underscore')._;

// Change current dir
process.chdir(__dirname);

// Data Manager
var dManager = new DataManager();

// Init world
var world = getWorld();

// Raphael - modul
var raphModul = new Modul("raphael/default");
raphModul.updateCode(fs.readFileSync("data/raphael/default", "utf8"));
world.addModul(raphModul, 30, 20);

// Raphael - test modul
var raphTestModul = new Modul("raphael/test");
raphTestModul.updateCode(fs.readFileSync("data/raphael/test", "utf8"));
world.addModul(raphTestModul, 33, 22);

// Caroline - modul
var caroModul = new Modul("caroline/default");
caroModul.updateCode(fs.readFileSync("fixtures/caroline.modul", "utf8"));
world.addModul(caroModul, 29, 19);

// Aude - modul
var audeModul = new Modul("aude/default");
audeModul.updateCode(fs.readFileSync("fixtures/aude.modul", "utf8"));
world.addModul(audeModul, 29, 20);

// Pierre - modul
var pierModul = new Modul("pierre/default");
pierModul.updateCode(fs.readFileSync("fixtures/pierre.modul", "utf8"));
world.addModul(pierModul, 31, 21);

function loadTestModuls() {
    var testCount = 100;
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
var webServer = web.start(3000);

// ## socket.io (websockets) server
var socket = io.listen(webServer, {
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
    
    _.each(world.moduls, function(modul){
        modul.on("change", function(updates){
            onChange(modul, updates);
        });
        modul.on("panelsUpdate", function(modul){
            onChange(modul, { updatesPanels: true });
        });
    });
})();

socket.on('connection', function(client){
    
    // Modul reference
    var modul,
        display;
    
    function modulError(err) {
        if (display) {
            display.consoleLog(err.message + "\n" + err.stack);
        }
    }
    
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
                
                // the display will manage all components displayed on the client: grid, modul skin, etc.
                display = new ClientDisplay(client, modul, world, msg.gridSize);
                client.modulId = msg.modulId;
                
                // Log errors
                modul.on("error", modulError);
                
                // Send basic
                client.send({
                    "code": modul.getCode(),
                    "panels": modul.getPanels()
                });
                
                // On gridUpdate event, send a new grid fragment
                display.on("gridUpdate", function(gridFragment) {
                    client.send({
                        "gridFragment": gridFragment
                    });
                });
                
                // On panelsUpdate event, send all panels
                display.on("panelsUpdate", function(panels) {
                    client.send({
                        "panels": panels
                    });
                });
                
                // On gridUpdate event, send a new grid fragment
                display.on("skinsUpdate", function(moduls) {
                    client.send({
                        "updateSkins": moduls
                    });
                });
            }
        }
        
        // ### `gridSize` message
        // Send the new grid size to display
        if (!!msg.gridSize && !!display) {
            display.setGridSize(msg.gridSize);
        }
        
        // ### `action` message
        // Executes action on modul
        if (!!msg.action && !!msg.action.panelName && !!msg.action.actionName && !!msg.action.actionParams && !!display) {
            modul.execAction(msg.action.panelName, msg.action.actionName, msg.action.actionParams);
        }
        
        // ### `code` message
        // Update modul's code
        if (!!msg.code && !!display) {
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
        // modul.removeListener("on", modulError);
        ClientDisplay.remove(display);
        display = null;
    });
});