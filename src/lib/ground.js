var Script = process.binding('evals').Script,
    Canvas = require('canvas'),
    _ = require('underscore')._;

// Ground Class
(function() {
    
    var Ground = exports.Ground = function() {
        this.grounds = {
            white: function(ctx, x, y, callback) {
                ctx.fillStyle="#fff";
                ctx.fillRect(x+23.5, y+23.5, 2, 2);
                callback();
            },
            whiteMini: function(ctx, x, y, callback) {
                ctx.fillStyle="#fff";
                ctx.fillRect(x+24.5, y+24.5, 1, 1);
                callback();
            },
            blank: function(ctx, x, y, callback) {
                ctx.fillStyle="#fff";
                callback();
            }
        };
        this.groundIds = _.keys(this.grounds);
        this.canvas = new Canvas(this.groundIds.length*50, 50);
        this.ctx = this.canvas.getContext('2d');
        this.png = null;
    };
    
    function createPng(callback) {
        var count = 0,
            that = this;
        _.each(that.grounds, function(groundFunction, groundId) {
            groundFunction(that.ctx, that.groundIds.indexOf(groundId)*50, 0, function() {
                count++;
                if (count === that.groundIds.length) {
                    callback();
                }
            });
        });
    };
    
    Ground.prototype = {
        getGroundsPng: function(callback) {
            var that = this;
            if (!this.png) {
                createPng.call(this, function() {
                    that.canvas.toBuffer(function(err, buf){
                        that.png = buf;
                        callback(buf);
                    });
                });
            } else {
                callback(this.png);
            }
        },
        getKeyPos: function() {
            return this.groundIds;
        },
        getRandGroundId: function() {
            var max = this.groundIds.length-1;
            if (Math.floor(Math.random() * 40) > 1) {
                return "blank";
            }
            return this.groundIds[ Math.floor(Math.random() * max) ];
        }
    };
})();