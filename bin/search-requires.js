#!/usr/bin/env node
"use strict";

var WARNING_ERROR_CODES = [
  "MODULE_NOT_FOUND",
  "SYNTAX_ERROR",
];

function isEmpty(val) {
  return ! val || val === true;
}

function isOptionEmpty(val) {
  if (Array.isArray(val)) {
    return val.every(isEmpty);
  }
  else {
    return isEmpty(val);
  }
}

function readUsage() {
  return require("fs").createReadStream(
    require("path").join(__dirname, 'usage.txt')
  );
}

function includes(arr, value) {
  return arr.indexOf(value) !== -1;
}

var find = require("../");
var argv = require("minimist")(process.argv.slice(2), {
  alias: {
    module: "m",
  },
});

var moduleToFind = argv.module;
var entryPaths = argv._;

if (isOptionEmpty(moduleToFind)) {
  console.error("Error: A target module must be given. Use the -m option.");
  console.error();
  readUsage().pipe(process.stderr);
  return;
}

if (isOptionEmpty(entryPaths)) {
  entryPaths = [process.cwd()];
}

var finder = find(moduleToFind, entryPaths);
entryPaths.forEach(function(file) {
  finder.write(file);
});
finder.end();
finder.on("error", function(err) {
  if (includes(WARNING_ERROR_CODES, err.code)) {
    console.error("Warning:", err.message);
  }
  else {
    console.error(err.message);
    process.exit(1);
  }
});
finder.on("data", function(data) {
  console.log(data.path);
});
