#!/usr/bin/env node
"use strict";

function readUsage() {
  return require("fs").createReadStream(
    require("path").join(__dirname, 'usage.txt')
  );
}

var find = require("../");
var argv = require("minimist")(process.argv.slice(2), {
  alias: {
    module: "m",
    help: "h",
  },
  boolean: ["help"],
});

if (argv.help) {
  readUsage().pipe(process.stdout);
  return;
}

var moduleToFind = argv.module;
var entryPaths = argv._;

var finder = find(moduleToFind, entryPaths);
finder.on("error", function(err) {
  console.error(err.message);
});
finder.on("data", function(data) {
  console.log(data.path);
});
