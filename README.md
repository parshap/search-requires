# search-requires

Find `require()` calls to a given module

### Command Line Usage

```
SYNOPSIS
      search-requires [OPTIONS] [INPUT...]

DESCRIPTION
      search-requires searches the named INPUT paths for require() calls
      to modules specified with the -m option. If an input path is not
      given, the current working directory is used.

      When a require() call is encountered, the required module will
      also be searched if it is a path to a local file module.

OPTIONS

      -m MODULE, --module MODULE
            Search for require() calls to MODULE.

      -h, --help
            Show this message.

EXAMPLES
      search-requires -m some-module index.js
      search-requires -m ./lib/fs-util.js -m fs
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

### `search(modules, input)`

Return a stream object and start searching `paths` for require calls
to `modules`, emitting a data object for each matching call found.

`modules` should be a target search module or an array of modules.
Local file modules (e.g., starts with `"./"`) will be resolved from the
current working directory, otherwise the module will be treated from a
named module resolved from `node_modules`.

`input` should be a path or an array of paths to use as entry points for
the search. If a path to a directory is used, it will be resolved to a
path using `require.resolve` semantics using the current working
directory.

The stream's data objects will have the following properties:

 * `path`: Path to the file with matching `require()` call
 * `module`: Name of the required module

An `error` event will be fired if an error occurs while searching files.

An `end` event will be fired once all files have been searched.

#### Errors

If a local file module being required is not able to be resolved,
`err.code` will be `"MODULE_NOT_FOUND"`.

## Installation

```
npm install search-requires
```
