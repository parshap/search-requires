#!/usr/bin/env node
"use strict";

var find = require("../");
var argv = process.argv;
var moduleToFind = argv[2];
var entryPaths = argv.slice(3);

var finder = find(moduleToFind);
entryPaths.forEach(function(entry) {
  finder.search(entry);
});
finder.on("error", function(err) {
  console.error(err.message);
});
finder.on("file", function(path) {
  console.log(path);
});
