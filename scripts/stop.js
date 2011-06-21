#!/usr/bin/env node

var daemon = require('daemon');
var sys = require('sys');

daemon.kill('/tmp/modul.io.pid', function (err, pid) {
    if (err) return sys.puts('Error stopping modul.io daemon: ' + err);
    sys.puts('Successfully stopped modul.io daemon with pid: ' + pid);
});