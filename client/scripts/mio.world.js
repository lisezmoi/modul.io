(function(){
  var mio = window.mio = window.mio || {};

  mio.world = (function(){
    var pub = {};
    var canvas;
    var ctx;
    var moduls = {};
    var grid = [];
    var gridSize;
    var grounds = [];
    var groundSprite;
    var screenDims = [];
    var modulWidth = mio.modul.dims[0];
    var modulHeight = mio.modul.dims[1];
    var bordersVisible = false;
    var currentBorders = [];

    var removeModul = function(modulId) {
      eraseModul(modulId);
      delete moduls[modulId];
    };

    var addModul = function(modulId, x, y) {
      if (!modulId[modulId]) {
        moduls[modulId] = {
          pos: {x: x, y: y}
        };
        drawModul(modulId, x, y);
      }
    };

    // Draw a modul detection zone
    var showModulZone = function(x, y) {
      ctx.strokeStyle = '#99f';
      ctx.strokeRect(x-150.5, y-150.5, 350, 350);
    };

    // Draw a single modul
    var drawModul = function(modulId, skinHash) {
      // showModulZone(x, y);

      if (!moduls[modulId] || !moduls[modulId].pos) return;

      if (!skinHash && !moduls[modulId].skin) return;

      function draw() {
        eraseModul(modulId);
        ctx.drawImage(moduls[modulId].skin, moduls[modulId].pos.x*50, moduls[modulId].pos.y*50);
      }

      if (!moduls[modulId].skin) {
        mio.util.loadImage(mio.conf.url + modulId + '/skin?'+skinHash, function(img) {
          if (!!moduls[modulId]) {
            moduls[modulId].skin = img;
            draw();
          }
        });
      } else {
        draw();
      }
    };

    // Erase (display only) a modul
    var eraseModul = function(modulId) {
      if (!!moduls[modulId] && !!moduls[modulId].pos) {
        ctx.clearRect(moduls[modulId].pos.x*50, moduls[modulId].pos.y*50, modulWidth, modulHeight);
      }
    };

    // Draw a single ground
    var drawGround = function(box, x, y) {

      // Ground ids loaded?
      if (grounds.length == 0) return;

      var draw = function(groundSprite) {
        var spriteX = (box.x * modulWidth) % groundSprite.width;
        var spriteY = (box.y * modulHeight) % groundSprite.height;
        ctx.drawImage(groundSprite,
                      spriteX, spriteY, modulWidth, modulHeight,
                      x*modulWidth, y*modulHeight, modulWidth, modulHeight);
        //ctx.drawImage(groundSprite, grounds.indexOf(gid)*50, 0, 50, 50, x, y, 50, 50);
        // ctx.fillStyle = '#ffffff';
        // ctx.font = 'bold 9px Arial';
        // ctx.fillText(grid[y/50][x/50].x+','+grid[y/50][x/50].y, x, y+10);
      };

      // Grounds sprite loaded?
      if (!!groundSprite) {
        draw(groundSprite);
      } else {
        mio.util.loadImage('http://scri.ch/ji9.png', function(image) {
          groundSprite = image;
          draw(groundSprite);
        });
      }
    };

    // Iterate over each box
    var eachBox = function(callback) {
      for (var y = grid.length - 1; y >= 0; y--) {
        for (var x = grid[y].length - 1; x >= 0; x--) {
          callback(grid[y][x], x, y);
        }
      }
    };

    // Set styles on canvas element
    var setWorldStyles = function(resize) {
      var screenPxWidth = screenDims[0];
      var screenPxHeight = screenDims[1];
      var worldPxWidth = gridSize[0] * modulWidth;
      var worldPxHeight = gridSize[1] * modulHeight;

      if (resize) {
        canvas.width = worldPxWidth;
        canvas.height = worldPxHeight;
      }

      canvas.style.right = 'auto';
      canvas.style.bottom = 'auto';
      canvas.style.left = ( (screenPxWidth - worldPxWidth) / 2 ) + 'px';
      canvas.style.top = ( (screenPxHeight - worldPxHeight) / 2 ) + 'px';
    };

    // Returns the border side (or false if it's not a border)
    var getBorderSide = function(box, x, y) {
      if (box.type === 'border') {
        // left / right?
        if (y !== 0 && y !== grid.length-1) {
          if (x === 0) {
            return 'left';
          }
          if (x === grid[0].length-1) {
            return 'right';
          }
        }
        // top / bottom?
        if (x !== 0 && x !== grid[0].length-1) {
          if (y === 0) {
            return 'top';
          }
          if (y === grid.length-1) {
            return 'bottom';
          }
        }
      }
      return false;
    };

    // If a border is visible, the world is positionned to see it
    var stickToBorder = function() {
      for (var i = this.currentBorders.length - 1; i >= 0; i--){
        switch (this.currentBorders[i]) {
          case 'left':
            canvas.style.left = 0;
          break;
          case 'right':
            canvas.style.left = 'auto';
          canvas.style.right = 0;
          break;
          case 'top':
            canvas.style.top = 0;
          break;
          case 'bottom':
            canvas.style.top = 'auto';
          canvas.style.bottom = 0;
          break;
        }
      }

      bordersVisible = (this.currentBorders.length > 0);
    };

    // Returns screen dimensions
    var getScreenDims = function() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      if (window.MIO_DEBUG) {
        var w = mio.util.gid("world-container");
        width = w.clientWidth;
        height = w.clientHeight;
      }
      return [width, height];
    };

    // Init world
    pub.init = function() {
      canvas = pub.canvas = mio.util.gid('world');
      ctx = canvas.getContext('2d');
      screenDims = getScreenDims.call(this);
      if (window.MIO_DEBUG) {
        canvas.style.outline = '1px solid red';
      }
    };

    // Update ground images
    pub.updateGrounds = function(newGrounds) {
      grounds = newGrounds;
      this.draw();
    };

    // Update grid size
    pub.updateGrid = function(newGrid, newSize) {
      grid = this.grid = newGrid;
      gridSize = newSize;
      this.realign(true);
      this.draw();
    };

    // Update modul skin
    pub.updateModulSkin = function(modulId, skinHash) {
      if (!!moduls[modulId]) {
        delete moduls[modulId].skin;
        drawModul.call(this, modulId, skinHash);
      }
    };

    // Move a modul
    pub.moveModul = function(modulId, position) {
      if (!!moduls[modulId]) {

        eraseModul(modulId);

        // Remove modul
        if ( position.x === -1 || position.x > gridSize[0]-1 ||
            position.y === -1 || position.y > gridSize[1]-1 ) {
          removeModul(modulId);

        // Redraw modul
        } else {
          moduls[modulId].pos = position;
          drawModul(modulId);
        }
      }
    };

    // Draw the world fragment
    pub.draw = function() {
      var self = this;
      // moduls = {}; // reset moduls references
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
      self.currentBorders = [];
      eachBox.call(self, function(box, x, y) {

        // Check border side
        var borderSide = getBorderSide.call(self, box, x, y);
        if (!!borderSide && self.currentBorders.indexOf(borderSide) === -1) {
          self.currentBorders.push(borderSide);
        }

        // Draw ground
        drawGround.call(self, box, x, y);

        // Add / draw modul
        if (typeof box.modul === 'string') {
          if (!moduls[box.modul]) {
            addModul.call(self, box.modul, x, y);
          } else {
            pub.moveModul.call(self, box.modul, {x: x, y: y});
          }
        }
      });
      // Reposition canvas if borders are displayed
      stickToBorder.call(this);
    };

    // Returns grid size
    pub.getGridSize = function() {
      var width = Math.floor(screenDims[0] / mio.modul.dims[0]) + 2;
      var height = Math.floor(screenDims[1] / mio.modul.dims[1]) + 2;
      // Always odd
      if (width % 2 === 0) width += 1;
      if (height % 2 === 0) height += 1;
      return [ width, height ];
    };

    // Realign world
    pub.realign = function(resize) {
      screenDims = getScreenDims.call(this);
      setWorldStyles.call(this, resize);
      if (bordersVisible) {
        stickToBorder.call(this);
      }
    };

    return pub;
  })();
})();
