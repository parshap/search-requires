# search-requires

Find where you `require()` a module.

*search-requires* searches the named input files for `require()` calls
to the given module. Both global modules and local file modules can be
searched for, and relative paths are automatically handled. Require
calls are followed, meaning if `a.js` is searched and `a.js` requires
`b.js`, then `b.js` is also searched.

### Command Line Usage

```
SYNOPSIS
      search-requires [OPTIONS] MODULE [FILE...]

EXAMPLES
      search-requires some-module ./a.js
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
var find = require("search-requires");
```

### `var finder = find(module, files)`

Create a finder stream, emitting data objects each time a
`require()` call is found for the given *module*.

*module* should be the path to a module or the name of a module.

*files* should be a entry point to start the search or an array of
paths.

Data objects will have the following properties:

 * `sourcePath`: The path of the file with the matching `require()` call
 * `module`: The name of the module

An `error` event will be fired if an error occurs while searching files.

An `end` event will be fired once all files have been searched.`

## Installation

```
npm install search-requires
```

## Todos

 * Allow searching multiple modules at the same time (`search-requires
   some-module other-module -- ./index.js`)
 * Show context around require call (scriptie-talkie?, grep -l option?)
 * Options to configure `require()` following (--no-follow,
   --follow-all, --follow-files, --follow-globals)
 * Option to be silent about MODULE_NOT_FOUND errors
 * Use local directory if no input file
