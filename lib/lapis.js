var EventEmitter2 = require('eventemitter2').EventEmitter2,
    defaultConfig = require('./config/default'),
    util = require('util'),
    http = require('http'),
    Server;

Server = function Server() {
    Server.super_.call(this, {
        wildcard: true,
        delimiter: '/',
        newListener: true,
        maxListeners: 20
    });


};

util.inherits(Server, EventEmitter2);

module.exports = Server;



// ------------------------------ //
var s = new Server();

console.log(defaultConfig);