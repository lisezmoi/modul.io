(function(){
    var mio = window.mio = window.mio || {};
    
    mio.ws = (function(){
        var pub = {},
            socket,
            onMessage = [],
            sendTypes = ["init"];
        
        pub.init = function(domain) {
            socket = new io.Socket(mio.conf.domain);
        };
        
        pub.send = function(type, data) {
            if (sendTypes.indexOf(type) !== -1) {
                socket.send({
                    type: "init",
                    data: data
                });
            } else {
                throw new Error("send: wrong type");
            }
        };
        
        pub.connect = function() {
            socket.connect();
        };
        
        return pub;
    })();
})();