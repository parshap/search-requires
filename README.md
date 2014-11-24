# search-requires

Find where you `require()` a module.

*search-requires* searches the named input files for `require()` calls
to the target module. The target module can be a module name (e.g.,
`some-module`) or a local file (e.g., `./some-module.js`. Relative paths
are resolved automatically. Require calls to local files are followed,
meaning if `a.js` is searched and `a.js` requires `b.js`, then `b.js` is
also searched.

### Command Line Usage

```
SYNOPSIS
      search-requires [OPTIONS] [FILE...]

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

### `search(module, files)`

Return a stream object and start searching `files` for require calls
to `module`, emitting a data object for each matching call
found.

`module` should be either a module name (e.g, `"some-module"`) or the
path to a local file (e.g., `"./some-module.js"`).

`files` should be a file path or an array of file paths that will be
used as entry points for the search.

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
 * Use local directory if no input file
 * Improve tests
 * Add option to explicitly search for file module or global module
   (e.g., --module auto-detects, --file-module, --global-module)
