(function(){
    var mio = window.mio = window.mio || {};
    
    mio.ui = (function(){
        var pub = {},
            waitList = [],
            waitElt;
        
        // Show loader
        var startWait = function() {
            waitElt = document.createElement("p");
            waitElt.id = "loading";
            document.body.appendChild(waitElt);
        };
        
        var updateWaitList = function() {
            waitElt.textContent = "loading " + waitList.join(", ") + "…";
        };
        
        // Hide loader
        var stopWait = function() {
            waitElt.parentNode.removeChild(waitElt);
        };
        
        // HTML Elements
        pub.elements = {};
        
        // Init UI
        pub.init = function() {
            
        };
        
        // Make and returns an HTML button
        pub.makeButton = function(label, callback) {
            var button = document.createElement("button");
            button.innerHTML = label;
            button.onclick = function() {
                callback();
            };
            return button;
        };
        
        // Add a new component to the waiting list
        pub.waitFor = function() {
            for (var i = arguments.length-1; i > -1; i--) {
                waitList.push(arguments[i]);
            }
            if (waitList.length === arguments.length) {
                startWait();
            }
            updateWaitList();
        };
        
        // Remove a component from the waiting list
        pub.justGot = function(component) {
            var componentPos;
            if (waitList.length === 0) { return; }
            
            if ( (componentPos = waitList.indexOf(component)) !== -1) {
                waitList.splice(componentPos, 1);
            }
            if (waitList.length === 0) {
                stopWait.call(this);
            } else {
                updateWaitList();
            }
        };
        
        return pub;
    })();
    
    /* Generic panels */
    mio.ui.panels = (function(){
        var pub = {},
            panels = {},
            stacks = {
                tl: [], // tl = top left
                tr: [],
                br: [],
                bl: []
            };
        
        var Panel = function(id, label, position, opts) {
            this.id = id;
            this.label = label;
            this.position = position;
            this.opts = opts || {};
            this.elt = createPanel.call(this);
            stackPanel.call(this);
            this.hide();
        };
        
        Panel.prototype.remove = function() {
            var stack = stacks[this.position];
            stack.splice(stack.indexOf(this.id), 1);
            this.elt.parentNode.removeChild(this.elt);
            delete panels[this.id];
        };
        
        Panel.prototype.show = function() {
            this.contentElt.style.display = "block";
            stylePanel.call(this);
        };
        
        Panel.prototype.hide = function() {
            this.contentElt.style.display = "none";
            stylePanel.call(this);
        };
        
        Panel.prototype.toggle = function() {
            if (this.isVisible()) {
                this.hide();
            } else {
                this.show();
            }
        };
        
        Panel.prototype.isVisible = function() {
            return (this.contentElt.style.display !== "none");
        };
        
        function createPanel() {
            var panelElt = document.createElement("section");
            panelElt.className = "panel panel-position-"+this.position;
            panelElt.id = "panel-" + this.id;
            document.body.appendChild(panelElt);
            
            this.contentElt = document.createElement("div");
            this.contentElt.className = "content";
            this.titleElt = createTitle.call(this, this.contentElt);
            panelElt.appendChild(this.titleElt);
            panelElt.appendChild(this.contentElt);
            
            return panelElt;
        }
        
        function createTitle(contentElt) {
            var panel = this;
            return mio.util.createElt("h1", {
                textContent: this.label,
                events: {click: function() {
                    panel.toggle();
                }}
            });
        }
        
        function stackPanel() {
            var stack = stacks[this.position];
            stack.push(this.id);
            stylePanel.call(this);
        }
        
        function stylePanel() {
            var stackOrder = stacks[this.position].indexOf(this.id)+1,
                topPos = ((this.position.charAt(0) === "t")? 0 : window.innerHeight - this.elt.offsetHeight),
                leftPos = (
                    (this.position.charAt(1) === "l")?
                        (stackOrder-1) * this.elt.clientWidth :
                        window.innerWidth - stackOrder * this.elt.offsetWidth),
                styleRules = {
                    position: "absolute",
                    left: leftPos+"px",
                    top: topPos+"px"
                };
            
            if (this.opts.overlap === true) {
                this.contentElt.style.height = (window.innerHeight - this.titleElt.offsetHeight - 1) + "px"; // -1 = border, quick fix
                styleRules.zIndex = "9";
            }
            
            // Apply styles
            for (var i in styleRules) {
                this.elt.style[i] = styleRules[i];
            }
        }
        
        // Add a new panel on a stack
        pub.add = function(id, label, position, opts) {
            if (!panels[id] && !!stacks[position]) {
                panels[id] = new Panel(id, label, position, opts);
                return panels[id];
            }
            return false;
        };
        
        // Refresh positions
        pub.refresh = function() {
            for (var i in panels) {
                stylePanel.call(panels[i]);
            }
        };
        
        pub.get = function(id) {
            return panels[id];
        };
        
        return pub;
    })();
    
    mio.ui.console = (function(){
        var pub = {};
        
        var Console = function() {
            
        };
        
        Console.prototype.write = function(text) {
            this.lines.push(text);
            if (this.lines.length > 5) {
                this.lines.shift();
            }
            this.elt.innerHTML = this.lines.join("\n");
        };
    });
    
    mio.consoles = (function(){
        
    });
})();