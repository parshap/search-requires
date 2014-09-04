"use strict";

var find = require("../");
var assert = require("assert");

var srcPath = __dirname + "/a.js";

var called = false;
var finder = find("foo", srcPath);
var paths = [];
finder.on("data", function(obj) {
  paths.push(obj.sourcePath);
});
finder.on("error", function(err) {
  if (err.code === "MODULE_NOT_FOUND" && err.module === "foo") {
    return;
  }
  assert.ifError(err);
});
finder.on("end", function() {
  called = true;
  assert.equal(paths.length, 2);
  assert.equal(paths[0], srcPath);
  assert.equal(paths[1], __dirname + "/b.js");
});

process.on("exit", function() {
  assert(called);
});
