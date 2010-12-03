var sys = require('sys');

exports.init = function(server) {
    
    /* NotFound Exception */
    function NotFound(msg){
        this.name = 'NotFound';
        Error.call(this, msg);
        Error.captureStackTrace(this, arguments.callee);
    };
    sys.inherits(NotFound, Error);
    
    // 404
    server.get('/*', function(req, res, next){
        throw new NotFound;
    });
    
    /* Errors */
    server.error(function(err, req, res, next) {
        if (err instanceof NotFound) {
            res.render('404.ejs');
        } else {
            console.log(err.stack);
            res.render('500.ejs');
        }
    });
};