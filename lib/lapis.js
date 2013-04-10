var EventEmitter2 = require('eventemitter2').EventEmitter2,
    defaultConfig = require('../config/default'),
    respond = require('./respond'),
    extend = require('node.extend'),
    util = require('util'),
    http = require('http'),
    url = require('url'),
    Server;

Server = function Server(config) {
    Server.super_.call(this, {
        wildcard: true,
        delimiter: '/',
        maxListeners: 1
    });

    this.on('data', function(event, data) {
        var index, request, id;

        for(id in this.requests) {
            request = this.requests[id];
            index = request.events.indexOf(event);

            if (index !== -1) {
                if (typeof data === 'number') {
                    respond(request, data);
                    continue;
                }

                request.result.push(data);

                var self = this;

                request.events.splice(index, 1);

                if (request.events.length === 0) {
                    respond(request, 200, function(err) {
                        if (err) {
                            self.emit('error', err);
                            return;
                        }
                        delete self.requests[id];
                    });
                }
            }
        }
    });

    this.on('illegal', respond);

    this.config = extend({}, defaultConfig, config);
    this.requests = {};
    this.var = {};

    this.on = (function(self) {
        var oon = self.on;

        return function on(path, fn) {
            var vIndex, i, l, sections;

            if (path[0] !== '/') {
                oon.call(this, path, fn);
                return;
            } else {
                path = path.slice(1);
            }

            sections = path.split('/');
            vIndex = [];
            for (i=0, l=sections.length; i<l; i++) {
                if (sections[i][0] === ':') {
                    vIndex[i] = sections[i].slice(1);
                    sections[i] = '*';
                }
            }

            oon.call(this, sections.join('/'), function(arg) {
                var ev, i, l, li, data, self;

                ev = this.event.split('/');
                for (i=0, l=ev.length, li=vIndex.length; i<l && i<li; i++) {
                    if (typeof vIndex[i] !== 'undefined') {
                        this.var[vIndex[i]] = ev[i];
                    }
                }

                self = this;
                data = fn.call(self, function(data) {
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
        var request, i, l, ev, scope;

        request = {
            id: 1,
            href: url.parse(req.url).href.split('/').slice(1),
            ts: new Date().getTime(),
            events: [],
            result: [],
            res: res
        };

        ev = '';
        scope = self.listenerTree;

        for (i=0, l=request.href.length; i<l; i++) {
            if (request.href[i]==='') { continue; }
            if (i!==0) { ev += '/'; }
            ev += request.href[i];

            if (request.href[i] in scope) {
                scope = scope[request.href[i]];
            } else if ('*' in scope) {
                scope = scope['*'];
            } else {
                break;
            }

            if ('_listeners' in scope) {
                request.events.push(ev);
            }
        }

        if (request.events.length === 0) {
            self.emit('illegal', request, 404);
            return;
        }

        self.requests[request.id] = request;

        for (i=0, l=request.events.length; i<l; i++) {
            (function(event) {
                setTimeout(function() {
                    self.emit(event, request);
                }, 1);
            })(request.events[i]);
        }
    });

    this.http.listen(this.config.port);
};

util.inherits(Server, EventEmitter2);

module.exports = Server;