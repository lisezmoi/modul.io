(function(){
  var mio = window.mio = window.mio || {};

  mio.util = (function(){
    var pub = {};
    var loadImageCallbacks = {};

    window.d = pub.d = function() {
      if (typeof console !== "undefined") {
        try {
          console.log.apply(this, arguments);
        } catch (e) {
          if (e.name === "TypeError") {
            console.log(arguments);
          }
        }
      }
    };

    pub.gid = function(eId) {
      return document.getElementById(eId);
    };

    pub.loadImage = function(url, callback) {
      if (!loadImageCallbacks[url]) {
        loadImageCallbacks[url] = [];

        var image = new Image();
        image.onload = function() {
          for (var i in loadImageCallbacks[url]) {
            loadImageCallbacks[url][i](image);
          }
          delete loadImageCallbacks[url]; // Delete URL from loadActions
        };
        image.src = url;
      }
      // Call each callback for this URL
      loadImageCallbacks[url].push(callback);
    };

    pub.createElt = function(tagName, opts) {
      var opts = opts || {};
      var elt = document.createElement(tagName);

      // InnerHTML / textContent
      if (opts.htmlContent) {
        elt.innerHTML = opts.htmlContent;

      } else if (opts.content) {
        if (typeof opts.content === 'string') {
          elt.innerHTML = opts.content;
        } else if (opts.content.nodeType == 1) {
          elt.appendChild(opts.content);
        }
      }

      // Events
      if (!!opts.events) {
        for (var eventName in opts.events) {
          elt.addEventListener(eventName, opts.events[eventName], false);
        }
      }

      // Id
      if (!!opts.id) {
        elt.id = opts.id;
      }

      // Attributes
      if (!!opts.attributes) {
        for (var attr in opts.attributes) {
          elt.setAttribute(attr, opts.attributes[attr]);
        }
      }

      return elt;
    };

    pub.getSprite = function(img, callback) {
      callback(img);
    };

    return pub;
  })();
})();
