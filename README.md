# search-requires

Find where you `require()` a module.

### Command Line Usage

```
SYNOPSIS
      search-requires [OPTIONS] [ENTRY...]

DESCRIPTION
      search-requires searches the name ENTRY paths for require() calls
      matching the target search modules. If an entry path is not given,
      the path to the current directory will be used.

      When a require() call is encountered, the path required will also
      be search if it is a path to a local file module.

OPTIONS

      -m MODULE, --module MODULE
            Search for require() calls to MODULE.

      -h, --help
            Show this message.

EXAMPLES
      search-requires -m some-module ./a.js
      search-requires -m fs -m ./helper.js ./a.js
```

See which node core modules use the `stream` module:

```
$ search-requires -m stream /src/node/lib/*.js
/src/node/lib/crypto.js
/src/node/lib/fs.js
/src/node/lib/_http_incoming.js
/src/node/lib/_http_outgoing.js
/src/node/lib/net.js
/src/node/lib/repl.js
/src/node/lib/_stream_readable.js
/src/node/lib/_stream_writable.js
/src/node/lib/_tls_legacy.js
```

### API Usage

```js
var find = require("search-requires");
var finder = find("some-module", "./a.js");
finder.on("data", function(obj) {
  // Module at `obj.path` requires "some-module"
  console.log(obj.path);
});
```

## API

```js
var search = require("search-requires");
```

### `search(modules, entry)`

Return a stream object and start searching `paths` for require calls
to `modules`, emitting a data object for each matching call found.

`modules` should be either a module name (e.g, `"some-module"`) or the
path to a local file (e.g., `"./some-module.js"`).

`entry` should be a path or an array of paths to use as entry points for
the search. If a path to a directory is used, it will be resolved to a
path using `require.resolve` semantics using the current working
directory.

The stream's data objects will have the following properties:

 * `path`: The path of the file with the matching `require()` call
 * `module`: The name of the module

An `error` event will be fired if an error occurs while searching files.

An `end` event will be fired once all files have been searched.

## Installation

```
npm install search-requires
```

## Todos

 * Show context around require call (scriptie-talkie?, grep -l option?)
 * Options to configure `require()` following (--no-follow,
   --follow-all, --follow-files, --follow-globals)
 * Option to be silent about MODULE_NOT_FOUND errors
 * Improve tests
 * Add option to explicitly search for file module or global module
   (e.g., --module auto-detects, --file-module, --global-module)
