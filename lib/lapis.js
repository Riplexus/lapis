var EventEmitter2 = require('eventemitter2').EventEmitter2,
    defaultConfig = require('../config/default'),
    extend = require('node.extend'),
    util = require('util'),
    http = require('http'),
    url = require('url'),
    Server;

Server = function Server(config) {
    Server.super_.call(this, {
        wildcard: true,
        newListener: true,
        maxListeners: 1
    });

    this.on('data', function(event, data) {
        var index, request, id;

        for(id in this.requests) {
            request = this.requests[id];
            index = request.events.indexOf(event);

            if (index !== -1) {
                request.result.push(data);
                request.events.splice(index, 1);
            }

            if (request.events.length === 0) {
                try {
                    request.res.setHeader('Content-Type', 'application/json');
                    request.res.end(JSON.stringify(request.result));
                    delete this.requests[id];
                } catch(err) {
                    this.emit('error', err);
                }
            }
        }
    });

    this.config = extend({}, defaultConfig, config);
    this.requests = {};

    this.on = (function(self) {
        var oon = self.on;

        return function(path, fn) {
            if (path[0] !== '/') {
                oon.call(this, path, fn);
                return;
            }

            oon.call(this, path, function(arg) {
                var self = this;
                var data = fn(function(data) {
                    self.emit('data', self.event, data);
                }, arg);

                if (data) {
                    self.emit('data', self.event, data);
                }
            });
        };
    })(this);

    var self = this;
    this.http = http.createServer(function(req, res) {
        var request, i, l, ev;

        request = {
            id: 1,
            href: url.parse(req.url).href.split('/'),
            events: [],
            result: [],
            res: res
        };

        ev = '';
        for (i=0, l=request.href.length; i<l; i++) {
            if (request.href[i]==='') { continue; }
            ev += '/'+request.href[i];
            request.events.push(ev);
        }

        console.log(url.parse(req.url).href, request.href, request.events);

        self.requests[request.id] = request;

        for (i=0, l=request.events.length; i<l; i++) {
            self.emit(request.events[i], request);
        }
    });

    this.http.listen(this.config.port);
};

util.inherits(Server, EventEmitter2);

module.exports = Server;



// ------------------------------ //
var s = new Server();

s.on('error', function(err) {
    console.log(err);
});

s.on('/user', function(done, request) {
    return { path: '/user' };
});

s.on('/', function() {
    return { path: '/' };
});

//s.on('/', function(done) {
//    setTimeout(function() {
//        done({ data: true });
//    }, 200);
//});