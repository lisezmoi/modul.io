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
            rainbow: function(ctx, x, y, callback) {
                // The hue spectrum used by HSV color picker charts.
                var color, hue = [
                  [255,   0,   0 ], // 0, Red,       0°
                  [255, 255,   0 ], // 1, Yellow,   60°
                  [  0, 255,   0 ], // 2, Green,   120°
                  [  0, 255, 255 ], // 3, Cyan,    180°
                  [  0,   0, 255 ], // 4, Blue,    240°
                  [255,   0, 255 ], // 5, Magenta, 300°
                  [255,   0,   0]], // 6, Red,     360°
                  
                  // Create the linear gradient: sx, sy, dx, dy.
                  // That's the start (x,y) coordinates, followed by the destination (x,y).
                  gradient = ctx.createLinearGradient(x, y, x+50, y);
                  
                // Add the color stops.
                for (var i = 0; i <= 6; i++) {
                  color = 'rgb(' + hue[i][0] + ', ' + hue[i][1] + ', ' + hue[i][2] + ')';
                  gradient.addColorStop(i * 1/6, color);
                }
                
                // Use the gradient for the fillStyle.
                ctx.fillStyle = gradient;
                
                ctx.fillRect(x+19.5, y, 10, 50);
                ctx.fillRect(x, y+19.5, 50, 10);
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