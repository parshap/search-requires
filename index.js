"use strict";

var detective = require("detective");
var readFile = require("fs").readFile;
var path = require("path");
var through = require("through");
var createMapStream = require("map-stream-limit");

// ## Algorithm
//
// Search input files
// For each `require(module)` call:
//   Emit data if module matches search
//   Search module if module is local file
//
// ## Streams
//
// File Path -> File Source -> Require Call -> (Searcher, Emitter)

module.exports = function(modules, files) {
  var retval = through();
  var fileStream = retval.fileStream = createFileStream();
  var detective = retval.detective = createDetectiveStream();

  // Pipe file output to detective
  fileStream.on("data", detective.write.bind(detective));
  fileStream.on("end", detective.end.bind(detective));

  // Once we've read all pending files and no more requires have been found,
  // end the stream
  fileStream.on("drain", fileStream.end.bind(fileStream));

  // Start searching entry files
  getEntryFiles(files).forEach(function(file) {
    fileStream.write(file);
  });

  // Follow required files
  detective.on("data", function(req) {
    if (shouldFollowRequire(req)) {
      var modulePath;
      try {
        modulePath = resolveRequirePath(req);
      }
      catch (err) {
        return retval.emit("error", err);
      }
      fileStream.write(modulePath);
    }
  });

  // Emit matching require calls
  detective.on("data", function(req) {
    if (isRequireMatch(req, modules)) {
      retval.queue(req);
    }
  });

  // Pass along "end" and "error" events
  fileStream.on("error", retval.emit.bind(retval, "error"));
  detective.on("error", retval.emit.bind(retval, "error"));
  detective.on("end", retval.queue.bind(retval, null));

  return retval;
};

function getEntryFiles(files) {
  return ensureArray(files);
}

function getSearchModules(modules) {
  return ensureArray(modules);
}

function isRequireMatch(req, modules) {
  modules = getSearchModules(modules);

  if (isFileModule(req.module)) {
    var modulePath;
    try {
      modulePath = resolveRequirePath(req);
    }
    catch (err) {
      return false;
    }
    return contains(modules, modulePath);
  }

  return contains(modules, req.module);
}

function shouldFollowRequire(req) {
  return isFileModule(req.module);
}

function isFileModule(module) {
  return module.slice(0, 1) === "/" ||
    module.slice(0, 2) === "./" ||
    module.slice(0, 3) === "../";
}

// ## File Stream

var CONCURRENT_READ_LIMIT = 5;

function createFileStream() {
  var seen = [];
  return createMapStream(function(path, callback) {
    // Don't do anything if the path has already been searched
    if (contains(seen, path)) {
      return callback();
    }
    seen.push(path);
    readFile(path, function(err, source) {
      if (err) {
        return callback(err);
      }
      callback(null, {
        source: source,
        sourcePath: path,
      });
    });
  }, CONCURRENT_READ_LIMIT);
}

// ## Detective Stream

function createDetectiveStream() {
  return through(function(file) {
    var stream = this;
    var result = detective.find(file.source, {
      nodes: true,
      parse: {
        loc: true,
      },
    });
    result.nodes.filter(isLiteralRequire).forEach(function(node) {
      var req;
      try {
        req = createRequire(node, file);
      }
      catch (err) {
        stream.emit("error", err);
        return;
      }
      stream.queue(req);
    });
  });
}

function isLiteralRequire(node) {
  return node.arguments[0].type === "Literal";
}

// ## Require Object
// A require object represents a require() call found in a searched file

function createRequire(node, file) {
  var module = node.arguments[0].value;
  return {
    module: module,
    sourcePath: file.sourcePath,
  };
}

function resolveRequirePath(req) {
  var modulePath = path.resolve(path.dirname(req.sourcePath), req.module);
  try {
    return require.resolve(modulePath);
  }
  catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      throw createRequireNotFoundError(req);
    }
    throw err;
  }
}

function createRequireNotFoundError(req) {
  var error = new Error(
    "Warning: Module not found " + req.module +
    " from " + req.sourcePath
  );
  error.code = "MODULE_NOT_FOUND";
  error.module = req.module;
  error.sourcePath = req.sourcePath;
  return error;
}

// ## Misc. Helpers

function contains(array, item) {
  return array.indexOf(item) !== -1;
}

function ensureArray(array) {
  if ( ! Array.isArray(array)) {
    return [array];
  }
  return array;
}
