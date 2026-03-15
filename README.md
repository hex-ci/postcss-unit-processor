# postcss-unit-processor

[![npm version](https://badgen.net/npm/v/postcss-unit-processor)](https://www.npmjs.com/package/postcss-unit-processor) [![codecov](https://codecov.io/github/hex-ci/postcss-unit-processor/graph/badge.svg?token=YKJBZI9LGK)](https://codecov.io/github/hex-ci/postcss-unit-processor) [![Downloads](https://badgen.net/npm/dt/postcss-unit-processor)](https://www.npmjs.com/package/postcss-unit-processor)

A PostCSS plugin that processes CSS unit values through a user-defined function. Use it to convert units (e.g. `px` to `rem`, `px` to `vw`), scale values, or apply any custom transformation to CSS numeric values.

## Features

- Process any CSS unit (`px`, `rem`, `vw`, `em`, `%`, etc.) with a custom function
- Filter by property name with wildcard and negation patterns
- Filter by unit type
- Skip specific selectors via blacklist
- Support for media query processing
- Support for custom/non-standard units (e.g. `rpx`, `dp`)
- Exclude files by path string, regex, or function
- Optionally append fallback values instead of replacing

## Install

```shell
npm install postcss postcss-unit-processor --save-dev
```

## Usage

```js
const postcss = require('postcss');
const unitProcessor = require('postcss-unit-processor');

postcss([
  unitProcessor({
    processor: (value, unit) => {
      if (unit === 'px') {
        return value / 16; // returns a number, unit stays px
      }
    }
  })
]).process(css).css;
```

The `processor` function receives the numeric value and unit name, and returns the new value. If nothing is returned (or `undefined`), the original value is kept unchanged.

## processor Function

The core of the plugin. It is called for every matched unit value.

```js
processor(value, unit, node, root)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `Number` | The numeric value |
| `unit` | `String` | The unit name (e.g. `'px'`) |
| `node` | `Object` | The current PostCSS node |
| `root` | `Object` | The PostCSS root node |

**Return value:**

- Return a `Number` — replaces the value, keeps the original unit
- Return an `Object` `{ value, unit }` — replaces both value and unit; if `value` cannot be parsed as a number (e.g. `undefined`, `NaN`), it is treated as `0`
- Return `undefined` / nothing — keeps the original value unchanged

```js
// Return a number: value changes, unit stays the same
processor: (value, unit) => value / 16
// 32px → 2px  (unit stays px, only the number changes)

// Return an object: both value and unit change
processor: (value, unit) => ({ value: value / 16, unit: 'rem' })
// 32px → 2rem  (both value and unit change)

// Return nothing: no change
processor: (value, unit) => {
  if (unit === 'px') return value / 16;
  // other units: implicitly returns undefined, no change
}
```

## Examples

### px to rem

```js
unitProcessor({
  processor: (value, unit) => {
    if (unit === 'px') {
      return {
        value: value / 16,
        unit: 'rem'
      };
    }
  }
})
```

Input/Output:

```css
/* input */
h1 {
  font-size: 32px;
  margin: 0 0 16px;
  border: 1px solid #ccc;
}

/* output */
h1 {
  font-size: 2rem;
  margin: 0 0 1rem;
  border: 0.0625rem solid #ccc;
}
```

### px to vw (responsive design)

```js
unitProcessor({
  processor: (value, unit) => {
    if (unit === 'px') {
      return {
        value: (value / 375) * 100,
        unit: 'vw'
      };
    }
  }
})
```

### Scale all px values by half

```js
unitProcessor({
  processor: (value, unit) => {
    if (unit === 'px') {
      return value / 2;
    }
  }
})
```

Input/Output:

```css
/* input */
h1 {
  margin: 0 0 20px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: 1px;
}

/* output */
h1 {
  margin: 0 0 10px;
  font-size: 16px;
  line-height: 1.2;
  letter-spacing: 0.5px;
}
```

### Append fallback instead of replacing

```js
unitProcessor({
  replace: false,
  processor: (value, unit) => {
    if (unit === 'px') {
      return {
        value: value / 16,
        unit: 'rem'
      };
    }
  }
})
```

```css
/* input */
.box {
  font-size: 16px;
}

/* output */
.box {
  font-size: 16px;
  font-size: 1rem;
}
```

## Options

```js
{
  processor: (value) => value,  // default: identity function
  unitPrecision: 5,
  propList: ['*'],
  unitList: ['*'],
  selectorBlackList: [],
  replace: true,
  mediaQuery: false,
  exclude: /node_modules/i,
  customUnitList: []
}
```

### `processor`

Type: `Function`

The unit processing function. See [processor Function](#processor-function) above.

### `unitPrecision`

Type: `Number`
Default: `5`

Decimal places to round the processed value to.

### `unitList`

Type: `Array`
Default: `['*']`

Which units to pass to the processor function.

```js
// All units (default)
unitList: ['*']

// Only px
unitList: ['px']

// px and rem
unitList: ['px', 'rem']

// All units except rem
unitList: ['*', '!rem']
```

### `propList`

Type: `Array`
Default: `['*']`

Which CSS properties to process.

```js
// All properties (default)
propList: ['*']

// Only font-size
propList: ['font-size']

// All properties except letter-spacing
propList: ['*', '!letter-spacing']

// Properties containing "size"
propList: ['*size*']

// Properties starting with "font"
propList: ['font*']

// Properties ending with "width"
propList: ['*width']
```

### `selectorBlackList`

Type: `Array`
Default: `[]`

Selectors to skip. Accepts strings (substring match) or regular expressions.

```js
selectorBlackList: ['.ignore', /^\.no-convert/]
```

```css
/* .ignore matches the blacklist, skipped */
.ignore { font-size: 16px; }       /* → 16px (unchanged) */

/* normal selector, processed */
.convert { font-size: 16px; }      /* → processed by your processor function */
```

### `replace`

Type: `Boolean`
Default: `true`

- `true` — replace the original value
- `false` — insert the processed value as a new declaration after the original (useful for fallbacks)

### `mediaQuery`

Type: `Boolean`
Default: `false`

Whether to process values inside `@media` queries.

```js
// Enable media query processing
mediaQuery: true
```

```css
/* input */
@media (max-width: 768px) { ... }

/* output (with px→rem processor) */
@media (max-width: 48rem) { ... }
```

### `exclude`

Type: `String | RegExp | Function`
Default: `/node_modules/i`

File paths to exclude from processing.

```js
// String: skip files whose path contains this string
exclude: 'src/legacy'

// RegExp
exclude: /\/legacy\//i

// Function
exclude: (filePath) => filePath.includes('legacy')
```

### `customUnitList`

Type: `Array`
Default: `[]`

Additional non-standard units to recognize and process (e.g. `rpx` used in WeChat Mini Programs, `dp` used in Android).

```js
customUnitList: ['rpx', 'dp']
```

Only strings consisting entirely of letters (`a-z`, `A-Z`) or the `%` character are accepted. Invalid entries are silently ignored.

**Default recognized units:** `px`, `pt`, `pc`, `cm`, `mm`, `in`, `%`, `em`, `rem`, `ch`, `vh`, `vw`, `vmin`, `vmax`, `ex`

## Framework Integration

### Vite / Vue / React

```js
// vite.config.js
import unitProcessor from 'postcss-unit-processor';

export default {
  css: {
    postcss: {
      plugins: [
        unitProcessor({
          processor: (value, unit) => {
            if (unit === 'px') {
              return {
                value: value / 16,
                unit: 'rem'
              };
            }
          }
        })
      ]
    }
  }
};
```

### webpack (postcss-loader)

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-unit-processor')({
      processor: (value, unit) => {
        if (unit === 'px') {
          return {
            value: value / 16,
            unit: 'rem'
          };
        }
      }
    })
  ]
};
```

### gulp

```js
const gulp = require('gulp');
const postcss = require('gulp-postcss');
const unitProcessor = require('postcss-unit-processor');

gulp.task('css', () => {
  return gulp.src('src/**/*.css')
    .pipe(postcss([
      unitProcessor({
        processor: (value, unit) => {
          if (unit === 'px') {
            return value / 2;
          }
        }
      })
    ]))
    .pipe(gulp.dest('dist'));
});
```

## License

MIT
