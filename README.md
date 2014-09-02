# find-requires

Search the named input *file*s for `require()` calls matching the given
*module*s. By default, local file `require()` calls will be followed. If
no input files are named, the working directory will be used.

### Command Line Usage

```
SYNOPSIS
      find-requires [OPTIONS] [MODULE]... -- [FILE...]

EXAMPLES
      find-requires some-module -- ./a.js
```

### API Usage

```js
var find = require("find-requires");
var finder = find("some-module", "./a.js");
finder.on("data", function(obj) {
  // Module at `obj.path` requires "some-module"
  console.log(obj.path);
});
```

## API

```js
var find = require("find-requires");
```

### `var finder = find(modules, files)`

Create a finder stream, emitting data objects each time a
`require()` call is found for the given *modules*.

Data objects will have the following properties:

 * `path`: The path of the file with the matching `require()` call

An `error` event will be fired if an error occurs while searching files.

An `end` event will be fired once all files have been searched.`

## Installation

```
npm install find-requires
```

## Todos

 * find-requires some-module other-module -- ./index.js
 * show context around require call (scriptie-talkie?, grep -l option?)
 * Option to not follow `require()` calls
 * Option to to follow "global" `require()` calls
 * Document no input files behavior
