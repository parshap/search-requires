"use strict";

var find = require("../");
var assert = require("assert");

var srcPath = __dirname + "/a.js";

var called = false;
var finder = find("foo");
var paths = [];
finder.search(srcPath);
finder.on("file", function(path) {
  paths.push(path);
});
finder.on("error", assert.ifError);
finder.on("end", function() {
  called = true;
  assert.equal(paths[0], srcPath);
  assert.equal(paths[1], __dirname + "/b.js");
  assert.equal(paths.length, 2);
});

process.on("exit", function() {
  if ( ! called) {
    assert(false);
  }
});
