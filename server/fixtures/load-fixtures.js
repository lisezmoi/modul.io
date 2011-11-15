var fs = require('fs');
var world = require('../lib/world').getWorld();
var Modul = require('../lib/modul').Modul;
var _ = require('underscore')._;

function loadFixture(user, modul, x, y, filename) {
    if (!filename) filename = user + '-' + modul + '.modul';
    var curModul = new Modul(user + '/' + modul);
    var modulAdded = world.addModul(curModul, x, y);
    if (modulAdded) {
        curModul.updateCode(fs.readFileSync(__dirname + '/' + filename, 'utf8'));
    }
    return modulAdded? curModul : null;
}

function loadDefaults(count) {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function addModul(num) {
        if (!loadFixture('default', num,
                         getRandomInt(1, world.width-1),
                         getRandomInt(1, world.height-1),
                         'default-automove.modul')) {
            addModul(num);
        }
    }
    while (count--) {
        addModul(count+1);
    }
}

loadFixture('raphael', 'default', 30, 20);
// loadFixture('raphael', 'test', 33, 22);
// loadFixture('caroline', 'default', 29, 19);
// loadFixture('aude', 'default', 29, 20);
loadFixture('pierre', 'default', 5, 5);

var apiTestModul = loadFixture('pierre', 'api', 10, 10);
loadFixture('pierre', 'api2', 12, 12);


// var zoneBlocks = apiTestModul.getZoneBlocks();
//
// function eachBlock(blocks, callback) {
//   for (var i=0; i < zoneBlocks.length; i++) {
//     var line = zoneBlocks[i];
//     for (var j=0; j < line.length; j++) {
//       callback(line[j]);
//     }
//   }
// }
//
//
// var otherModuls = [];
// eachBlock(zoneBlocks, function(block) {
//   if (block.modul !== null) {
//     otherModuls.push(block.modul);
//   }
// });
// // console.log(otherModuls);
// for (var i=0; i < otherModuls.length; i++) {
//   console.log(world.getModul(otherModuls[i]));
// }
//
// var output = '';
// var curLine = null;
// eachBlock(zoneBlocks, function(block){
//   if (block.y !== curLine) {
//     output += '\n';
//   }
//   curLine = block.y;
//   if (block.modul) {
//     output += '\033[31mo\033[39m';
//   } else {
//     output += '#';
//   }
// });
// console.log(output);


loadDefaults(100);