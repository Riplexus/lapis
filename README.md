

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
    return { userId: this.param.id };
});
```

```javascript
s.on('/user/*/email', function() {
    return { data: true };
});
```

```javascript
s.on('GET!/path', function() {
    return { data: true };
});
s.on('DELETE!/path', function() {
    return { data: this.payload };
});
s.on('POST!/path', function() {
    return { data: this.payload };
});
s.on('PUT!/path', function() {
    return { data: this.payload };
});
```