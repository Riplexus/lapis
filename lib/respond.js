var errors = require('../config/errors'),
    respond;

respond = function respond(request, code, callback) {
    callback = callback || function() {};

    var respond = {
        meta: {
            duration: new Date().getTime()-request.ts,
            error: null
        },
        result: {}
    };

    if (code !== 200) {
        respond.meta.error = errors[code];
    } else if (request.result.length === 1) {
        respond.result = request.result[0];
    } else {
        respond.result = request.result;
    }

    try {
        request.res.writeHead(code, {
            'Content-Type': 'application/json'
        });
        request.res.end(JSON.stringify(respond));

    } catch(err) {
        return callback(err);
    }

    callback();
};

module.exports = respond;