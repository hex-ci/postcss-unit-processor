# postcss-unit-processor

[![npm version](https://badgen.net/npm/v/postcss-unit-processor)](https://www.npmjs.com/package/postcss-unit-processor)

PostCSS plugin to process css unit.

## Install

```shell
$ npm install postcss postcss-unit-processor --save-dev
```

## Usage

Use the processor function provided by the user to process the CSS unit. The default processor function is not to do any processing.

### Input/Output

```css
// input
h1 {
  margin: 0 0 20px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: 1px;
}

// output
h1 {
  margin: 0 0 20px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: 1px;
}
```

### Example

```js
var fs = require('fs');
var postcss = require('postcss');
var unitProcessor = require('postcss-unit-processor');
var css = fs.readFileSync('main.css', 'utf8');
var options = {
  processor: (value, unit) => {
    if (unit === 'px') {
      return value / 2;
    }
  }
};
var processedCss = postcss(unitProcessor(options)).process(css).css;

fs.writeFile('main-new.css', processedCss, function (err) {
  if (err) {
    throw err;
  }
  console.log('New file written.');
});
```

### options

Type: `Object | Null`
Default:
```js
{
  processor: (value) => value,
  unitPrecision: 5,
  propList: ['*'],
  selectorBlackList: [],
  replace: true,
  mediaQuery: false,
  exclude: /node_modules/i
}
```

- `processor` (Function) css unit processing function.
    - The plugin will call this function when the conditions are met, and pass the following parameters:
        - value (Number): Unit value.
        - unit (String): The name of the unit.
        - node (Object): Current postCSS node object.
        - root (Object): postCSS node root object.
    - The function return value:
        - If the Number is returned, the unit value is directly replaced, and the unit name remains unchanged.
        - If an object is returned, the `value` of the object replaces the value, and the `unit` replaces the name.
- `unitPrecision` (Number) The decimal numbers to allow the processed units to grow to.
- `propList` (Array) The properties that can be changed by the processor function.
    - Values need to be exact matches.
    - Use wildcard `*` to enable all properties. Example: `['*']`
    - Use `*` at the start or end of a word. (`['*position*']` will match `background-position-y`)
    - Use `!` to not match a property. Example: `['*', '!letter-spacing']`
    - Combine the "not" prefix with the other prefixes. Example: `['*', '!font*']`
- `selectorBlackList` (Array) The selectors to ignore.
    - If value is string, it checks to see if selector contains the string.
        - `['body']` will match `.body-class`
    - If value is regexp, it checks to see if the selector matches the regexp.
        - `[/^body$/]` will match `body` but not `.body`
- `replace` (Boolean) Replace rules instead of adding fallbacks.
- `mediaQuery` (Boolean) Allow processor function in media queries.
- `exclude` (String, Regexp, Function) The file path to ignore.
    - If value is string, it checks to see if file path contains the string.
        - `'exclude'` will match `\project\postcss-unit-processor\exclude\path`
    - If value is regexp, it checks to see if file path matches the regexp.
        - `/exclude/i` will match `\project\postcss-unit-processor\exclude\path`
    - If value is function, you can use exclude function to return a true and the file will be ignored.
        - the callback will pass the file path as  a parameter, it should returns a Boolean result.
        - `function (file) { return file.indexOf('exclude') !== -1; }`

### Use with gulp-postcss and autoprefixer

```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var unitProcessor = require('postcss-unit-processor');

gulp.task('css', function () {

  var processors = [
    autoprefixer({
      browsers: 'last 1 version'
    }),
    unitProcessor({
      processor: (value, unit) => {
        if (unit === 'px') {
          return value / 2;
        }
      }
    })
  ];

  return gulp.src(['build/css/**/*.css'])
    .pipe(postcss(processors))
    .pipe(gulp.dest('build/css'));
});
```
