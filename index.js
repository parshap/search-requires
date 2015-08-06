"use strict";

var detective = require("detective");
var resolve = require("resolve");
var readFile = require("fs").readFile;
var path = require("path");
var through = require("through");
var pumpify = require("pumpify");
var streamFilter = require("through2-filter");
var createMapStream = require("map-stream-limit");

// ## Algorithm
//
// Search input files
// For each `require(module)` call:
//   Emit data if module matches search
//   Search module if module is local file
//
// ### Streams
//
// File Path -> File Source -> Require Call -> Matcher
//

module.exports = function(modules) {
  var fileStream = createFileStream();
  var detective = createDetectiveStream();

  var retval = pumpify.obj([
    fileStream,
    detective,
    createMatchStream(modules),
  ]);

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

  // Pass along "end" and "error" events
  fileStream.on("error", retval.emit.bind(retval, "error"));

  return retval;
};

function createMatchStream(modules) {
  modules = getSearchModules(modules);
  if ( ! modules.length) {
    throw new Error("A target search module must be given.");
  }
  return streamFilter.obj(function(req) {
    return isRequireMatch(req, modules);
  });
}


// ### Entry Files
//
// Map "named input file" arguments to paths of files to search. Implements
// logic like mapping directory paths to e.g., index.js.
//

function getEntryPath(path) {
  return resolveEntryFiles(ensureFileModule(path));
}

function ensureFileModule(path) {
  if ( ! isFileModule(path)) {
    return "./" + path;
  }
  return path;
}

function resolveEntryFiles(path) {
  return resolve.sync(path, { basedir: process.cwd() });
}

// ### Search Target Modules
//

function getSearchModules(modules) {
  return ensureArray(modules)
    .map(resolveSearchModule)
    .filter(Boolean);
}

function resolveSearchModule(module) {
  // If it is a file module (e.g., starts with "./"), then resolve the absolute
  // path
  if (isFileModule(module)) {
    return path.resolve(process.cwd(), module);
  }
  // If the module is a path to a valid file, resolve the absolute path
  else {
    try {
      return resolve.sync("./" + module, { basedir: process.cwd() });
    }
    // Otherwise, treat it as a global module)
    catch (err) {
      return module;
    }
  }
}

// ### Module Matching
//
// Determine if the given require() call matches the search target module.
//

function isRequireMatch(req, modules) {
  if (isFileModule(req.module)) {
    var modulePath;
    try {
      modulePath = resolveRequirePath(req);
    }
    catch (err) {
      modulePath = resolveModulePath(req);
    }
    return contains(modules, modulePath);
  }
  else {
    return contains(modules, req.module);
  }
}

function shouldFollowRequire(req) {
  return isFileModule(req.module);
}

// ### File Modules
//
// Determines if the given module name is a "file module".
//

function isFileModule(module) {
  return module.slice(0, 1) === "/" ||
    module.slice(0, 2) === "./" ||
    module.slice(0, 3) === "../";
}

// ## File Stream
//

var CONCURRENT_READ_LIMIT = 5;

function createFileStream() {
  var seen = [];
  return createMapStream(function(path, callback) {
    path = getEntryPath(path);
    // Don't do anything if the path has already been searched
    if ( ! path || contains(seen, path)) {
      return callback();
    }
    seen.push(path);
    readFile(path, function(err, source) {
      if (err) {
        return callback(err);
      }
      callback(null, {
        source: source,
        path: path,
      });
    });
  }, CONCURRENT_READ_LIMIT);
}

// ## Detective Stream
//

function createDetectiveStream() {
  return through(function(file) {
    var stream = this;
    var result;
    try {
      result = findRequires(file);
    }
    catch (err) {
      stream.emit("error", err);
      return;
    }
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

function findRequires(file) {
  try {
    return detective.find(file.source, {
      nodes: true,
      parse: {
        loc: true,
      },
    });
  }
  catch (err) {
    if (err instanceof SyntaxError) {
      err.code = "SYNTAX_ERROR";
      err.message = getSyntaxErrorMessage(err, file);
    }
    throw err;
  }
}

function getSyntaxErrorMessage(err, file) {
  return [
    "Error parsing ",
    file.path,
    ", unexpected token at ",
    "" + err.loc.line + ":" + err.loc.column,
  ].join("");
}

function isLiteralRequire(node) {
  return node.arguments[0].type === "Literal";
}

// ## Require Object
//
// A require object represents a require() call found in a searched file
//

function createRequire(node, file) {
  var module = node.arguments[0].value;
  return {
    module: module,
    path: file.path,
  };
}

function resolveRequirePath(req) {
  var modulePath = resolveModulePath(req);
  try {
    return require.resolve(modulePath);
  }
  catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      throw createRequireNotFoundError(req);
    }
    else {
      throw err;
    }
  }
}

function resolveModulePath(req) {
  return path.resolve(path.dirname(req.path), req.module);
}

function createRequireNotFoundError(req) {
  var error = new Error(
    "Module not found " + req.module +
    " from " + req.path
  );
  error.code = "MODULE_NOT_FOUND";
  error.module = req.module;
  error.path = req.path;
  return error;
}

// ## Misc. Helpers
//

function contains(array, item) {
  return array.indexOf(item) !== -1;
}

function ensureArray(array) {
  if ( ! Array.isArray(array)) {
    return [array];
  }
  return array;
}
