var errors = require('../config/errors'),
    respond;

respond = function respond(request, code, callback) {
    callback = callback || function() {};

    var respond = {
        meta: {
            duration: new Date().getTime()-request.ts,
            error: null
        },
        data: {}
    };

    if (code !== 200) {
        respond.meta.error = errors[code];
        respond.data = null;
    } else if (request.data.length === 1) {
        respond.data = request.data[0];
    } else {
        respond.data = request.data;
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