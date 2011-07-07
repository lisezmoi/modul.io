#!/usr/bin/env node

// Uncomment this line to launch modul.io in dev mode
// process.env.NODE_ENV = 'dev';

var sys = require('sys');
var modulio = require('../server/modul.io.js');

modulio.start();