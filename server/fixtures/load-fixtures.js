var fs = require('fs');
var world = require('../lib/world').getWorld();
var Modul = require('../lib/modul').Modul;

function loadFixture(user, modul, x, y, filename) {
    if (!filename) filename = user + '-' + modul + '.modul';
    var curModul = new Modul(user + '/' + modul);
    var modulAdded = world.addModul(curModul, x, y);
    if (modulAdded) {
        curModul.updateCode(fs.readFileSync(__dirname + '/' + filename, 'utf8'));
    }
    return modulAdded;
}

function loadDefaults(count) {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function addModul(num) {
        if (!loadFixture('default', num,
                         getRandomInt(1, world.width-1),
                         getRandomInt(1, world.height-1),
                         'default-default.modul')) {
            addModul(num);
        }
    }
    while (count--) {
        addModul(count+1);
    }
}

loadFixture('raphael', 'default', 30, 20);
loadFixture('raphael', 'test', 33, 22);
loadFixture('caroline', 'default', 29, 19);
loadFixture('aude', 'default', 29, 20);
loadFixture('pierre', 'default', 5, 5);
loadDefaults(100);