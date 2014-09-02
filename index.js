"use strict";

var detective = require("detective");
var readFile = require("fs").readFile;
var path = require("path");
var async = require("async");
var EventEmitter = require("events").EventEmitter;

module.exports = function(moduleToFind) {
  var queue = async.queue(handleEntry, 1);
  var seen = [];

  var finder = new EventEmitter();
  finder.search = function(path) {
    if ( ! contains(seen, path)) {
      seen.push(path);
      queue.push(path);
    }
  };
  finder.on("require", handleRequire);

  queue.drain = function() {
    finder.emit("end");
  };

  return finder;

  function handleEntry(path, callback) {
    readFile(path, function(err, src) {
      if (err) {
        finder.emit("error", err);
        return;
      }
      handleModuleSource(path, src);
      callback();
    });
  }

  function handleModuleSource(path, src) {
    detective(src).forEach(function(module) {
      finder.emit("require", {
        module: module,
        entry: path,
      });
    });
  }

  function handleRequire(req) {
    if (isLocalModule(req.module)) {
      handleLocalRequire(req);
    }
    else {
      handleGlobalRequire(req);
    }
  }

  function handleLocalRequire(req) {
    var modulePath;
    try {
      modulePath = resolveLocalRequire(req);
    }
    catch (err) {
      if (err.code === "MODULE_NOT_FOUND") {
        finder.emit("error", createModuleNotFoundError(req));
      }
      else {
        finder.emit("error", err);
      }
      return;
    }

    // if it's a module we're searching for, add source to found list
    if (modulePath === moduleToFind) {
      finder.emit("file", req.entry);
    }

    // Search this module too
    finder.search(modulePath);
  }

  function handleGlobalRequire(req) {
    // if it's a module we're searching for, add source to found list
    if (req.module === moduleToFind) {
      finder.emit("file", req.entry);
    }
  }
};

function isLocalModule(module) {
  return module.slice(0, 2) === "./" ||
    module.slice(0, 3) === "../";
}

function resolveLocalRequire(req) {
  var modulePath = path.resolve(path.dirname(req.entry), req.module);
  return require.resolve(modulePath);
}

function contains(array, item) {
  return array.indexOf(item) !== -1;
}

function createModuleNotFoundError(req) {
  var error = new Error(
    "Warning: Module not found " + req.module +
    " from " + req.entry
  );
  error.module = req.module;
  error.entry = req.entry;
  return error;
}
