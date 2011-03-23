var fs = require('fs'),
    path = require('path');

// DataManager Class
(function() {
    
    var DataManager = exports.DataManager = function() {
        
    };
    
    DataManager.prototype = {
        loadAllModuls: function(callback) {
            
        },
        loadModulFixtures: function(callback) {
            
        },
        saveModul: function(modul, callback) {
            var splitId = modul.id.split('/');
            if (splitId.length === 2) {
                var userPath = path.join(__dirname, '../data', splitId[0]);
                path.exists(userPath, function(exists) {
                    if (!exists) {
                        fs.mkdirSync(userPath, 0666);
                    }
                    fs.writeFileSync(path.join(userPath, splitId[1]), modul.getCode(), encoding='utf8');
                    callback();
                });
            }
        }
    };
})();