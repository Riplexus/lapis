var EventEmitter2 = require('eventemitter2').EventEmitter2,
    defaultConfig = require('../config/default'),
    respond = require('./respond'),
    extend = require('node.extend'),
    util = require('util'),
    http = require('http'),
    url = require('url'),
    Server;

Server = function Server(config) {
    var self = this;

    Server.super_.call(this, {
        wildcard: true,
        delimiter: '/',
        maxListeners: 5
    });

    this.on('data', function(event, data) {
        for(var id in this.requests) {
            if (!this.requests.hasOwnProperty(id)) { continue; }

            (function(request, id) {
                var answer;

                answer = function(code) {
                    respond(request, code, function(err) {
                        if (err) {
                            this.emit('error', err);
                            return;
                        }
                        delete this.requests[id];
                    }.bind(this));
                }.bind(this);

                if (typeof data === 'number') {
                    answer(data);
                    return;
                }

                request.data.push(data);

                if (request.calledEvents.length === request.data.length) {
                    answer(200);

                } else {
                    if (request.timeout) { clearTimeout(request.timeout); }
                    request.timeout = setTimeout(function() {
                        if (request.calledEvents.length !== request.data.length) {
                            answer(408);
                        }
                    }, 500);
                }
            }).bind(this)(this.requests[id], id);
        }
    });

    this.on('illegal', respond);

    this.config = extend({}, defaultConfig, config);
    this.requests = {};
    this.param = {};

    this.on = (function(self) {
        var oon = self.on;

        return function on(path, fn) {
            var vIndex, i, l, sections, method;

            if (!/^((GET|POST|DELETE|PUT)!)?\//.test(path)) {
                oon.call(this, path, fn);
                return;
            } else {
                path = path.match(/((GET|POST|DELETE|PUT)!)?(\/.*)/i);
                method = path[2];
                path = path[3].slice(1);
            }

            sections = path.split('/');
            vIndex = [];
            for (i=0, l=sections.length; i<l; i++) {
                if (sections[i][0] === ':') {
                    vIndex[i] = sections[i].slice(1);
                    sections[i] = '*';
                }
            }

            oon.call(this, sections.join('/'), function(request) {
                var ev, i, l, li, data, done;

                if (method) {
                    if (method !== request.method) { return; }
                    this.payload = request.body;
                }

                this.href = request.toString();

                ev = this.event.split('/');
                for (i=0, l=ev.length, li=vIndex.length; i<l && i<li; i++) {
                    if (typeof vIndex[i] !== 'undefined') {
                        this.param[vIndex[i]] = ev[i];
                    }
                }

                request.calledEvents.push(this.event);

                done = function(data) {
                    process.nextTick(function() {
                        done = function() {};
                        this.emit('data', this.event, data);
                    }.bind(this));
                };

                data = fn.call(this, done.bind(this), request);

                if (data) {
                    done.bind(this)(data);
                }
            });
        };
    })(this);

    this.http = http.createServer(function(req, res) {
        var request, i, l, scope,
            ev = '',
            body = '';

        req.on('data', function(chunk) {
            body += chunk;
        });

        req.on('end', function() {
            var parsed = url.parse(req.url, true);

            request = {
                id: 1,
                href: parsed.href.split('?')[0].split('/').slice(1),
                ts: new Date().getTime(),
                events: [],
                calledEvents: [],
                data: [],
                res: res,
                method: req.method,
                body: {},
                toString: function() { return parsed.href; }
            };

            if (body !== '' &&
                (request.method === 'POST' ||
                    request.method === 'PUT' ||
                    request.method === 'DELETE')) {
                try {
                    request.body = JSON.parse(body);
                } catch(err) {
                    self.emit('illegal', request, 400);
                    return;
                }
            }

            if (request.method === 'GET') {
                request.body = parsed.query;
            }

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
    });

    this.http.listen(this.config.port);
};

util.inherits(Server, EventEmitter2);

module.exports = Server;