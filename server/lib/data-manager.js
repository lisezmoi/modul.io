var fs = require('fs');
var path = require('path');
var world = require('./world').getWorld();
var Modul = require('./modul').Modul;

// DataManager Class
var DataManager = exports.DataManager = function() {
    
};

DataManager.prototype = {
    loadAllModuls: function(callback) {
        var self = this;
        
        // List moduls
        var modulsList = [];
        var dirs = fs.readdirSync(__dirname + '/../data');
        for (var i in dirs) {
            if (dirs.hasOwnProperty(i)) {
                var files = fs.readdirSync(__dirname + '/../data/' + dirs[i]);
                for (var j in files) {
                    if (files.hasOwnProperty(j)) {
                        modulsList.push(dirs[i] + '/' + files[j]);
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
                    if (!loadModulCount) {
                        callback();
                    }
                });
            }
        }
    },
    loadFixtures: function(callback) {
        require('../fixtures/load-fixtures');
        if (callback) callback();
    },
    loadModul: function(name, callback) {
        console.log('load ' + name + '...');
        var modulPath = path.normalize(__dirname + '/../data/' + name);
        var modulCode = fs.readFileSync(modulPath, 'utf8');
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
                
                console.log(name + ' loaded at ['+ x + ',' + y +'].');
                return callback();
            });
        }
    },
    saveModul: function(modul, callback) {
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
    }
};