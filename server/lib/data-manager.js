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
        
        function eachFile(dirname, callback) {
            fs.readdir(dirname, function(err, files) {
                for (var i in files) {
                    if (files.hasOwnProperty(i)) {
                        callback(files[i], files.length);
                    }
                }
            });
        }
        
        var dirsCallbackCount = 0;
        eachFile(__dirname + '/../data', function(dirname, dirsCount) {
            var filesCallbackCount = 0;
            eachFile(__dirname + '/../data/' + dirname, function(filename, filesCount) {
                self.loadModul(dirname + '/' + filename, function(){
                    filesCallbackCount++;
                    if (filesCallbackCount === filesCount) {
                        dirsCallbackCount++;
                    }
                    if (dirsCallbackCount === dirsCount && filesCallbackCount === filesCount) {
                        console.log('OK');
                        callback();
                    }
                });
            });
        });
    },
    loadFixtures: function(callback) {
        require('../fixtures/load-fixtures');
        callback();
    },
    loadModul: function(name, callback) {
        console.log('load ' + name + '...');
        var curModul = new Modul(name);
        curModul.updateCode(fs.readFileSync(__dirname + '/../data/' + name, 'utf8'));
        
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