var fs = require('fs'),
    path = require('path'),
    world = require('./world').getWorld(),
    world = require('./world').getWorld(),
    dManager = null;

// DataManager Class
var DataManager = function() {
};

DataManager.prototype.loadAllModuls = function(callback) {
    var self = this;
    
    // List moduls
    var modulsList = [];
    var dirs = fs.readdirSync(__dirname + '/../data');
    for (var i in dirs) {
        if (dirs.hasOwnProperty(i)) {
            try {
                var files = fs.readdirSync(__dirname + '/../data/' + dirs[i]);
                for (var j in files) {
                    if (files.hasOwnProperty(j)) {
                        modulsList.push(dirs[i] + '/' + files[j]);
                    }
                }
            } catch(e) {
                if (e.code === 'ENOTDIR') {
                    continue;
                } else {
                    throw e;
                }
            }
        }
    }
    
    // Load the moduls list
    var loadModulCount = modulsList.length;
    for (var k in modulsList) {
        if (modulsList.hasOwnProperty(k)) {
            self.loadModul(modulsList[k], function(){
                loadModulCount--;
                if (!loadModulCount && callback) {
                    callback();
                }
            });
        }
    }
};
DataManager.prototype.loadFixtures = function(callback) {
    require('../fixtures/load-fixtures');
    if (callback) callback();
};
DataManager.prototype.createDefaultModul = function(modulId, callback) {
    var Modul = require('./modul').Modul;
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    var modul = new Modul(modulId);
    var modulAdded = null;
    if (!modulAdded) {
        modulAdded = world.addModul(
                         modul,
                         getRandomInt(1, world.width-1),
                         getRandomInt(1, world.height-1)
                     );
    }
    modul.updateCode(
        fs.readFileSync(__dirname + '/../fixtures/default-default.modul', 'utf8')
    );
    
    return callback(modul);
};
DataManager.prototype.loadModul = function(name, callback) {
    var Modul = require('./modul').Modul;
    
    var modulPath = path.normalize(__dirname + '/../data/' + name);
    var modulCode = null;
    
    try {
        modulCode = fs.readFileSync(modulPath, 'utf8');
    } catch(e) {
        if (e.code === 'EISDIR') {
            return callback();
        }
    }
    
    if (modulCode) {
        var curModul = new Modul(name);
        curModul.updateCode(modulCode, function(){
            
            // Temp
            function getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            
            var x = 0, y = 0;
            (function A(){
                x = getRandomInt(1, world.width-1);
                y = getRandomInt(1, world.height-1);
                if ( !world.addModul(curModul, x,y) ) {
                    A();
                }
            })();
            
            return callback();
        });
    }
};
DataManager.prototype.saveModul = function(modul, callback) {
    var splitId = modul.id.split('/');
    if (splitId.length === 2) {
        var userPath = path.join(__dirname, '../data', splitId[0]);
        path.exists(userPath, function(exists) {
            if (!exists) {
                fs.mkdirSync(userPath, 0777);
            }
            fs.writeFileSync(path.join(userPath, splitId[1]), modul.getCode(), encoding='utf8');
            callback();
        });
    }
};

exports.getDataManager = function() {
    if (!dManager) {
        dManager = new DataManager();
    }
    return dManager;
};