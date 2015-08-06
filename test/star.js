"use strict";

var find = require("../");
var test = require("tape");

var srcPath = __dirname + "/basic/a.js";

test("star", function(t) {
  var finder = find("*");
  finder.write(srcPath);
  finder.end();
  var reqs = [];
  finder.on("data", function(req) {
    reqs.push(req);
  });
  finder.on("error", function(err) {
    t.ifError(err);
  });
  finder.on("end", function() {
    // Found requires
    t.equal(reqs.length, 3);
    t.equal(reqs[0].module, "foo");
    t.equal(reqs[0].path, __dirname + "/basic/a.js");
    t.equal(reqs[1].module, "./b.js");
    t.equal(reqs[1].path, __dirname + "/basic/a.js");
    t.equal(reqs[2].module, "foo");
    t.equal(reqs[2].path, __dirname + "/basic/b.js");
    t.end();
  });
});
