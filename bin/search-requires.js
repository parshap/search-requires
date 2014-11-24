#!/usr/bin/env node
"use strict";

function isOptionEmpty(val) {
  return ! val || ! val.length;
}

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

if (isOptionEmpty(moduleToFind)) {
  console.error("A target module must be given. Use the -m option.");
  console.error();
  readUsage().pipe(process.stderr);
  return;
}

if (isOptionEmpty(entryPaths)) {
  entryPaths = process.cwd();
}

var finder = find(moduleToFind, entryPaths);
finder.on("error", function(err) {
  console.error(err.message);
});
finder.on("data", function(data) {
  console.log(data.path);
});
