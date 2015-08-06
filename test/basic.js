"use strict";

var find = require("../");
var test = require("tape");

var srcPath = __dirname + "/basic/a.js";

test("basic", function(t) {
  var finder = find("foo");
  finder.write(srcPath);
  finder.end();
  var paths = [];
  finder.on("data", function(obj) {
    paths.push(obj.path);
  });
  finder.on("error", function(err) {
    t.ifError(err);
  });
  finder.on("end", function() {
    t.equal(paths.length, 2);
    t.equal(paths[0], srcPath);
    t.equal(paths[1], __dirname + "/basic/b.js");
    t.end();
  });
});
