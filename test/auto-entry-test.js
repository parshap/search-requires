"use strict";

var find = require("../");
var test = require("tape");

var srcDir = __dirname + "/auto-entry";
var srcPath = srcDir + "/a.js";

test("auto-entry", function(t) {
  var finder = find(["foo", "bar"], srcDir);
  var paths = [];
  finder.on("data", function(obj) {
    paths.push(obj);
  });
  finder.on("end", function() {
    t.equal(paths[0].module, "foo");
    t.equal(paths[0].path, srcPath);
    t.equal(paths[1].module, "bar");
    t.equal(paths[1].path, srcPath);
    t.end();
  });
});
