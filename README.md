

```javascript
var s = new Server();

s.on('error', function(code, msg) {
    console.log(code, msg);
});
```

```javascript
s.on('/path/somewhere', function() {
    return { data: true };
});
```

```javascript
s.on('/path/somewhere', function(done) {
    setTimeout(function() {
        done({ data: true });
    }, 1);
});
```

```javascript
s.on('/path', function() {
    return 403;
});
```

```javascript
s.on('/user/:id/email', function() {
    return { userId: this.var.id };
});
```

```javascript
s.on('/user/*/email', function() {
    return { data: true };
});
```