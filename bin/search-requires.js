#!/usr/bin/env node
"use strict";

var find = require("../");
var argv = require("minimist")(process.argv.slice(2), {
  alias: {
    module: ["m"],
  },
});

var moduleToFind = argv.module;
var entryPaths = argv._;

var finder = find(moduleToFind, entryPaths);
finder.on("error", function(err) {
  console.error(err.message);
});
finder.on("data", function(data) {
  console.log(data.sourcePath);
});
