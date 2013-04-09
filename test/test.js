var assert = require('assert'),
    respond = require('../lib/respond.js'),
    http = require('http'),
    lapis = require('../lib/lapis.js');

describe('lapis', function() {

    var request, s, isPathTriggered;

    request = {
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
        result: {
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
                assert('result' in request.res.data);
                assert('object' in request.res.data.result);
                assert(request.res.data.result.object.data === true);
                assert('array' in request.res.data.result);
                assert(request.res.data.result.array[0] === 1);
                assert(request.res.data.result.array[1] === 2);
                assert(request.res.data.result.array[2][0] === 3);
                assert(request.res.data.result.array[2][1] === 4);
                assert(!('fn' in request.res.data.result));

                done();
            });
        });
    });

    describe('#on()', function() {
        it('should add listener', function() {
            assert(Object.keys(s.listenerTree).length === 2);

            s.on('/path/on', function() {
                return { data: true };
            });

            assert(Object.keys(s.listenerTree).length === 3);
            assert('/path/on' in s.listenerTree);
        });
    });

    describe('#emit()', function() {
        it('should trigger path', function(done) {
            s.on('/path/emit', function() {
                done();
            });

            s.emit('/path/emit', request);
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

                    assert('result' in json);
                    assert(json.result.length === 2);
                    assert('data' in json.result[0]);
                    assert(json.result[0].data === true);

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