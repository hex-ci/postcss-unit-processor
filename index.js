const defaultUnits = [
  'px', 'pt', 'pc', 'cm', 'mm', 'in', '%', 'em', 'rem', 'ch', 'vh', 'vw', 'vmin', 'vmax', 'ex'
];

const filterPropList = {
  exact: list => list.filter(m => m.match(/^[^*!]+$/)),
  contain: list =>
    list.filter(m => m.match(/^\*.+\*$/)).map(m => m.substr(1, m.length - 2)),
  endWith: list => list.filter(m => m.match(/^\*[^*]+$/)).map(m => m.substr(1)),
  startWith: list =>
    list.filter(m => m.match(/^[^*!]+\*$/)).map(m => m.substr(0, m.length - 1)),
  notExact: list =>
    list.filter(m => m.match(/^![^*].*$/)).map(m => m.substr(1)),
  notContain: list =>
    list.filter(m => m.match(/^!\*.+\*$/)).map(m => m.substr(2, m.length - 3)),
  notEndWith: list =>
    list.filter(m => m.match(/^!\*[^*]+$/)).map(m => m.substr(2)),
  notStartWith: list =>
    list.filter(m => m.match(/^![^*]+\*$/)).map(m => m.substr(1, m.length - 2))
};

const typeToString = s =>
  Object.prototype.toString
    .call(s)
    .slice(8, -1)
    .toLowerCase();

const types = [
  'String',
  'Array',
  'Undefined',
  'Boolean',
  'Number',
  'Function',
  'Symbol',
  'Object',
  'RegExp'
];

const type = types.reduce((acc, str) => {
  acc['is' + str] = val => typeToString(val) === str.toLowerCase();
  return acc;
}, {});

const defaults = {
  processor: (value) => value,
  unitPrecision: 5,
  selectorBlackList: [],
  propList: ['*'],
  replace: true,
  mediaQuery: false,
  exclude: /node_modules/i,
  customUnitList: [],
  unitList: ['*']
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createUnitRegex(customUnitList, unitList) {
  let userUnits = Array.isArray(customUnitList)
    ? customUnitList.filter(
        (u) => typeof u === 'string' && u.trim() && /^[a-zA-Z%]+$/.test(u)
      )
    : [];
  const unitSet = new Set(defaultUnits);

  for (const u of userUnits) {
    unitSet.add(u);
  }

  // Filter units based on unitList if provided
  let filteredUnits = Array.from(unitSet);
  if (Array.isArray(unitList)) {
    if (unitList.length === 0) {
      // Empty unitList means no units should be processed
      filteredUnits = [];
    }
    else {
      const satisfyUnitList = createUnitListMatcher(unitList);
      filteredUnits = filteredUnits.filter(unit => satisfyUnitList(unit));
    }
  }

  const unitStr = filteredUnits.map(escapeRegExp).join('|');

  // If no units to process, create a regex that won't match any units
  if (unitStr === '') {
    return new RegExp(
      `"[^"]+"|'[^']+'|url\\([^)]+\\)|var\\([^)]+\\)`,
      'g'
    );
  }

  return new RegExp(
    `"[^"]+"|'[^']+'|url\\([^)]+\\)|var\\([^)]+\\)|(\\d*\\.?\\d+)(${unitStr})`,
    'g'
  );
}

function createUnitReplace(processor, unitPrecision, root) {
  return (node) => (m, $1, $2) => {
    if (!$1) {
      return m;
    }

    const value = parseFloat($1);
    const unit = $2;
    const result = processor(value, unit, node, root);

    let newValue, newUnit;
    if (type.isObject(result) && result !== null) {
      newValue = parseFloat(result.value) || 0;
      newUnit = result.unit || unit;
    }
    else if (type.isNumber(result) || type.isString(result)) {
      newValue = parseFloat(result) || 0;
      newUnit = unit;
    }
    else {
      newValue = value;
      newUnit = unit;
    }

    const fixedVal = toFixed(newValue, unitPrecision);

    return fixedVal + newUnit;
  };
}

function toFixed(number, precision) {
  const multiplier = Math.pow(10, precision + 1);
  const wholeNumber = Math.floor(number * multiplier);

  return (Math.round(wholeNumber / 10) * 10) / multiplier;
}

function blacklistedSelector(blacklist, selector) {
  if (typeof selector !== 'string') {
    return;
  }

  return blacklist.some(regex => {
    if (typeof regex === 'string') {
      return selector.indexOf(regex) !== -1;
    }

    return regex.test(selector);
  });
}

function createPropListMatcher(propList) {
  const hasWild = propList.indexOf('*') > -1;
  const matchAll = hasWild && propList.length === 1;
  const lists = {
    exact: filterPropList.exact(propList),
    contain: filterPropList.contain(propList),
    startWith: filterPropList.startWith(propList),
    endWith: filterPropList.endWith(propList),
    notExact: filterPropList.notExact(propList),
    notContain: filterPropList.notContain(propList),
    notStartWith: filterPropList.notStartWith(propList),
    notEndWith: filterPropList.notEndWith(propList)
  };

  return prop => {
    if (matchAll) {
      return true;
    }

    return (
      (hasWild ||
        lists.exact.indexOf(prop) > -1 ||
        lists.contain.some(function(m) {
          return prop.indexOf(m) > -1;
        }) ||
        lists.startWith.some(function(m) {
          return prop.indexOf(m) === 0;
        }) ||
        lists.endWith.some(function(m) {
          return prop.indexOf(m) === prop.length - m.length;
        })) &&
      !(
        lists.notExact.indexOf(prop) > -1 ||
        lists.notContain.some(function(m) {
          return prop.indexOf(m) > -1;
        }) ||
        lists.notStartWith.some(function(m) {
          return prop.indexOf(m) === 0;
        }) ||
        lists.notEndWith.some(function(m) {
          return prop.indexOf(m) === prop.length - m.length;
        })
      )
    );
  };
}

function createUnitListMatcher(unitList) {
  const hasWild = unitList.indexOf('*') > -1;
  const matchAll = hasWild && unitList.length === 1;
  const lists = {
    exact: filterPropList.exact(unitList),
    contain: filterPropList.contain(unitList),
    startWith: filterPropList.startWith(unitList),
    endWith: filterPropList.endWith(unitList),
    notExact: filterPropList.notExact(unitList),
    notContain: filterPropList.notContain(unitList),
    notStartWith: filterPropList.notStartWith(unitList),
    notEndWith: filterPropList.notEndWith(unitList)
  };

  return unit => {
    if (matchAll) {
      return true;
    }

    return (
      (hasWild ||
        lists.exact.indexOf(unit) > -1 ||
        lists.contain.some(function(m) {
          return unit.indexOf(m) > -1;
        }) ||
        lists.startWith.some(function(m) {
          return unit.indexOf(m) === 0;
        }) ||
        lists.endWith.some(function(m) {
          return unit.indexOf(m) === unit.length - m.length;
        })) &&
      !(
        lists.notExact.indexOf(unit) > -1 ||
        lists.notContain.some(function(m) {
          return unit.indexOf(m) > -1;
        }) ||
        lists.notStartWith.some(function(m) {
          return unit.indexOf(m) === 0;
        }) ||
        lists.notEndWith.some(function(m) {
          return unit.indexOf(m) === unit.length - m.length;
        })
      )
    );
  };
}

module.exports = (options = {}) => {
  const opts = Object.assign({}, defaults, options);
  const satisfyPropList = createPropListMatcher(opts.propList);
  const exclude = opts.exclude;
  const customUnitList = opts.customUnitList;
  const unitList = opts.unitList;
  let isExcludeFile = false;
  let unitReplace;

  const unitRegex = createUnitRegex(customUnitList, unitList);

  return {
    postcssPlugin: 'postcss-unit-processor',

    Once(css) {
      const filePath = css.source.input.file;

      if (
        exclude &&
        filePath &&
        ((type.isFunction(exclude) && exclude(filePath)) ||
         (type.isString(exclude) && filePath.indexOf(exclude) !== -1) ||
         (type.isRegExp(exclude) && filePath.match(exclude) !== null))
      ) {
        isExcludeFile = true;
      }
      else {
        isExcludeFile = false;
      }

      unitReplace = createUnitReplace(opts.processor, opts.unitPrecision, css);
    },

    Declaration(decl) {
      if (isExcludeFile) {
        return;
      }

      unitRegex.lastIndex = 0;

      if (
        !unitRegex.test(decl.value) ||
        !satisfyPropList(decl.prop) ||
        blacklistedSelector(opts.selectorBlackList, decl.parent.selector)
      ) {
        return;
      }

      const value = decl.value.replace(unitRegex, unitReplace(decl));

      // if unit already processed, do not add or replace
      if (decl.__unitProcessorFinished === true) {
        return;
      }

      if (opts.replace) {
        decl.__unitProcessorFinished = true;
        decl.value = value;
      }
      else {
        decl.cloneAfter({ value, __unitProcessorFinished: true });
      }
    },

    AtRule(atRule) {
      if (isExcludeFile) {
        return;
      }

      unitRegex.lastIndex = 0;

      if (opts.mediaQuery && atRule.name === 'media') {
        if (atRule.__unitProcessorFinished === true || !unitRegex.test(atRule.params)) {
          return;
        }
        atRule.__unitProcessorFinished = true;
        atRule.params = atRule.params.replace(unitRegex, unitReplace(atRule));
      }
    }
  };
};

module.exports.postcss = true;
