var assert = require('assert'),
    respond = require('../lib/respond.js'),
    http = require('http'),
    lapis = require('../lib/lapis.js');

describe('lapis', function() {

    var request, s, isPathTriggered;

    request = {
        calledEvents: [],
        res: {
            head: {},
            code: 200,
            data: null,
            writeHead: function(code, head) {
                this.code = code;
                this.head = head;
            },
            end: function(data) {
                this.data = JSON.parse(data);
            }
        },
        data: {
            object: {data: true},
            fn: function() {},
            array: [1, 2, [3, 4]]
        }
    };
    s = new lapis({
        port: 1337
    });

    s.on('/path', function() {
        isPathTriggered = true;
        return {data: true};
    });

    beforeEach(function() {
        isPathTriggered = false;
    });

    describe('#respond()', function() {
        it('should generate response', function(done) {
            respond(request, 200, function() {
                assert('Content-Type' in request.res.head);
                assert(request.res.head['Content-Type'] === 'application/json');
                assert('data' in request.res.data);
                assert('object' in request.res.data.data);
                assert(request.res.data.data.object.data === true);
                assert('array' in request.res.data.data);
                assert(request.res.data.data.array[0] === 1);
                assert(request.res.data.data.array[1] === 2);
                assert(request.res.data.data.array[2][0] === 3);
                assert(request.res.data.data.array[2][1] === 4);
                assert(!('fn' in request.res.data.data));

                done();
            });
        });
    });

    describe('#on()', function() {
        it('should add listener', function() {

            s.on('/path/on', function() {
                return { data: true };
            });

            assert('path' in s.listenerTree);
            assert('on' in s.listenerTree.path);
        });
    });

    describe('#emit()', function() {
        it('should trigger path', function(done) {
            s.on('/path/emit', function() {
                done();
            });

            s.emit('path/emit', request);
        });
    });

    describe('#request()', function() {
        it('should trigger path', function(done) {
            s.on('/path/request', function() {
                return {data: true};
            });

            var req = http.request({
                port: 1337,
                path: '/path/request'
            }, function(res) {
                assert(res.statusCode === 200);
                assert(isPathTriggered);

                var json = '';
                res.on('data', function(chunk) {
                    json += chunk;
                });
                res.on('end', function() {
                    json = JSON.parse(json);

                    assert('data' in json);
                    assert('data' in json.data[1]);
                    assert(json.data[1].data === true);

                    done();
                });
            });

            req.on('error', function(err) {
               throw err;
            });

            req.end();
        });

        it('should return error code', function(done) {
            s.on('/path/error', function() {
                return 403;
            });

            var req = http.request({
                port: 1337,
                path: '/path/error/sub'
            }, function(res) {
                assert(res.statusCode === 403);
                assert(isPathTriggered);

                var json = '';
                res.on('data', function(chunk) {
                    json += chunk;
                });
                res.on('end', function() {
                    json = JSON.parse(json);

                    assert('meta' in json);
                    assert('error' in json.meta);
                    assert(json.meta.error === 'Forbidden');

                    done();
                });
            });

            req.on('error', function(err) {
                throw err;
            });

            req.end();
        });

        it('should extract variable', function(done) {
            s.on('/path/var/:var', function() {
                return {var: this.param.var};
            });

            var req = http.request({
                port: 1337,
                path: '/path/var/123'
            }, function(res) {
                assert(res.statusCode === 200);
                assert(isPathTriggered);

                var json = '';
                res.on('data', function(chunk) {
                    json += chunk;
                });
                res.on('end', function() {
                    json = JSON.parse(json);

                    assert('data' in json);
                    assert('var' in json.data[1]);
                    assert(json.data[1].var === '123');

                    done();
                });
            });

            req.on('error', function(err) {
                throw err;
            });

            req.end();
        });
    });
});