"use strict";

var find = require("../");
var test = require("tape");

var srcPath = __dirname + "/missing-file/a.js";
var searchPath = __dirname + "/missing-file/b.js";

test("basic", function(t) {
  var finder = find(searchPath, srcPath);
  var paths = [];
  finder.on("data", function(obj) {
    paths.push(obj.path);
  });
  finder.on("error", function(err) {
    console.log("error", err);
    if (err.code === "MODULE_NOT_FOUND" && err.module === "./b.js") {
      return;
    }
    t.ifError(err);
  });
  finder.on("end", function() {
    console.log("end", paths);
    t.equal(paths.length, 1);
    t.equal(paths[0], srcPath);
    t.end();
  });
});
