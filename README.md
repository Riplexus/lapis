

    var s = new Server();

    s.on('error', function(code, msg) {
        console.log(code, msg);
    });

    s.on('/path/somewhere', function() {
        return { data: true };
    });

    s.on('/path/somewhere', function(done) {
        setTimeout(function() {
            done({ data: true });
        }, 1);
    });