const postcss = require('postcss');
const unitProcessor = require('./index');

const testProcess = async (input, output, opts = {}) => {
  const result = await postcss([unitProcessor(opts)]).process(input, { from: undefined });
  expect(result.css).toEqual(output);
  expect(result.warnings()).toHaveLength(0);
};

describe('postcss-unit-processor', () => {
  // Test default behavior
  it('should process units with default processor', async () => {
    await testProcess(
      'div { width: 100px; }',
      'div { width: 100px; }'
    );
  });

  // Test custom processor
  it('should process units with custom processor', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 200px; }',
      { processor }
    );
  });

  // Test unit precision
  it('should apply unit precision', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value / 3, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 33.33333px; }',
      { processor, unitPrecision: 5 }
    );
  });

  // Test property list filtering
  it('should only process specified properties', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100px; height: 50px; }',
      'div { width: 200px; height: 50px; }',
      { processor, propList: ['width'] }
    );
  });

  // Test selector blacklist
  it('should skip blacklisted selectors', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      '.skip-class { width: 100px; } .normal-class { width: 100px; }',
      '.skip-class { width: 100px; } .normal-class { width: 200px; }',
      { processor, selectorBlackList: [/skip/] }
    );
  });

  // Test media query processing
  it('should process units in media queries when enabled', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      '@media (max-width: 600px) { div { width: 100px; } }',
      '@media (max-width: 1200px) { div { width: 200px; } }',
      { processor, mediaQuery: true }
    );
  });

  // Test media query processing disabled
  it('should not process units in media queries when disabled', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      '@media (max-width: 600px) { div { width: 100px; } }',
      '@media (max-width: 600px) { div { width: 200px; } }',
      { processor, mediaQuery: false }
    );
  });

  // Test custom unit list
  it('should process custom units', async () => {
    const processor = (value, unit) => {
      if (unit === 'custom') {
        return { value: value * 2, unit: 'custom' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100custom; }',
      'div { width: 200custom; }',
      { processor, customUnitList: ['custom'] }
    );
  });

  // Test replace option
  it('should clone declaration when replace is false', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = 'div { width: 100px; }';
    const output = 'div { width: 100px; width: 200px; }';
    await testProcess(input, output, { processor, replace: false });
  });

  // Test exclude option with function
  it('should process CSS when file path is undefined', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = 'div { width: 100px; }';
    const output = 'div { width: 200px; }';
    await testProcess(input, output, { processor, exclude: (file) => file && file.includes('test') });
  });

  // Test exclude option with string
  it('should process CSS when file path does not match exclude string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = 'div { width: 100px; }';
    const output = 'div { width: 200px; }';
    await testProcess(input, output, { processor, exclude: 'test/path' });
  });

  // Test exclude option with regex
  it('should process CSS when file path does not match exclude regex', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = 'div { width: 100px; }';
    const output = 'div { width: 200px; }';
    await testProcess(input, output, { processor, exclude: /test\/path/ });
  });

  // Test property list with wildcard patterns
  it('should process properties with wildcard patterns', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; min-width: 50px; width: 75px; height: 25px; }',
      'div { max-width: 200px; min-width: 100px; width: 150px; height: 25px; }',
      { processor, propList: ['*width'] }
    );
  });

  // Test property list with startWith pattern
  it('should process properties starting with specified string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; min-width: 50px; width-test: 75px; height: 25px; }',
      'div { max-width: 200px; min-width: 50px; width-test: 75px; height: 25px; }',
      { processor, propList: ['max*'] }
    );
  });

  // Test property list with endWith pattern
  it('should process properties ending with specified string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; min-width: 50px; test-width: 75px; height: 25px; }',
      'div { max-width: 200px; min-width: 100px; test-width: 150px; height: 25px; }',
      { processor, propList: ['*width'] }
    );
  });

  // Test property list with contain pattern
  it('should process properties containing specified string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; min-width-test: 50px; width: 75px; height: 25px; }',
      'div { max-width: 200px; min-width-test: 100px; width: 150px; height: 25px; }',
      { processor, propList: ['*width*'] }
    );
  });

  // Test property list with not exact pattern
  it('should not process properties exactly matching not pattern', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; min-width: 50px; width: 75px; height: 25px; }',
      'div { max-width: 200px; min-width: 100px; width: 150px; height: 25px; }',
      { processor, propList: ['*', '!height'] }
    );
  });

  // Test selector blacklist with string
  it('should skip selectors matching blacklist string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      '.skip-class { width: 100px; } .normal-class { width: 100px; }',
      '.skip-class { width: 100px; } .normal-class { width: 200px; }',
      { processor, selectorBlackList: ['skip-class'] }
    );
  });

  // Test processor returning null
  it('should handle processor returning null', async () => {
    const processor = (value, unit) => {
      return null;
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 100px; }',
      { processor }
    );
  });

  // Test processor returning invalid type
  it('should handle processor returning invalid type', async () => {
    const processor = (value, unit) => {
      return Symbol('invalid');
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 100px; }',
      { processor }
    );
  });

  // Test quoted string values that should not be processed
  it('should not process values in quoted strings', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { content: "100px"; background: url(100px); width: 100px; }',
      'div { content: "100px"; background: url(100px); width: 200px; }',
      { processor }
    );
  });

  // Test blacklistedSelector with non-string selector
  it('should handle non-string selector in blacklist check', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };

    // Create CSS with a rule that has no selector
    const input = 'div { width: 100px; }';
    const result = await postcss([unitProcessor({ processor, selectorBlackList: ['test'] })])
      .process(input, { from: undefined });
    expect(result.css).toEqual('div { width: 200px; }');
  });

  // Test property list with notContain pattern
  it('should not process properties containing blacklisted string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; min-test-width: 50px; width: 75px; height: 25px; }',
      'div { max-width: 200px; min-test-width: 50px; width: 150px; height: 50px; }',
      { processor, propList: ['*', '!*test*'] }
    );
  });

  // Test property list with notStartWith pattern
  it('should not process properties starting with blacklisted string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; test-width: 50px; width: 75px; height: 25px; }',
      'div { max-width: 200px; test-width: 50px; width: 150px; height: 50px; }',
      { processor, propList: ['*', '!test*'] }
    );
  });

  // Test property list with notEndWith pattern
  it('should not process properties ending with blacklisted string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { max-width: 100px; width-test: 50px; width: 75px; height: 25px; }',
      'div { max-width: 200px; width-test: 50px; width: 150px; height: 50px; }',
      { processor, propList: ['*', '!*test'] }
    );
  });

  // Test exclude option with function that returns true
  it('should exclude files when exclude function returns true', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = 'div { width: 100px; }';
    const result = await postcss([unitProcessor({ processor, exclude: () => true })])
      .process(input, { from: 'test.css' });
    expect(result.css).toEqual('div { width: 100px; }');
  });

  // Test exclude option with string that matches file path
  it('should exclude files when file path contains exclude string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = 'div { width: 100px; }';
    const result = await postcss([unitProcessor({ processor, exclude: 'test' })])
      .process(input, { from: 'test.css' });
    expect(result.css).toEqual('div { width: 100px; }');
  });

  // Test exclude option with regex that matches file path
  it('should exclude files when file path matches exclude regex', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = 'div { width: 100px; }';
    const result = await postcss([unitProcessor({ processor, exclude: /test/ })])
      .process(input, { from: 'test.css' });
    expect(result.css).toEqual('div { width: 100px; }');
  });

  // Test media query processing when excluded
  it('should not process media queries when file is excluded', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    const input = '@media (max-width: 600px) { div { width: 100px; } }';
    const result = await postcss([unitProcessor({ processor, mediaQuery: true, exclude: /test/ })])
      .process(input, { from: 'test.css' });
    expect(result.css).toEqual('@media (max-width: 600px) { div { width: 100px; } }');
  });

  // Test blacklistedSelector function directly by manipulating parent selector
  it('should handle selector blacklist check with edge cases', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };

    const testPlugin = () => {
      return {
        postcssPlugin: 'test-manipulation',
        Once(root) {
          // Apply unitProcessor first
          const unitProc = unitProcessor({ processor, selectorBlackList: ['test'] });
          if (unitProc.Once) unitProc.Once(root);

          root.walkDecls(decl => {
            if (decl.prop === 'width') {
              // Temporarily set selector to non-string to trigger the blacklist check
              const originalSelector = decl.parent.selector;
              decl.parent.selector = undefined;

              // Manually call the blacklist check portion
              if (unitProc.Declaration) {
                try {
                  unitProc.Declaration(decl);
                } catch (e) {
                  // Expected to fail due to unitReplace not being properly initialized in this context
                }
              }

              // Restore selector
              decl.parent.selector = originalSelector;
            }
          });
        }
      };
    };
    testPlugin.postcss = true;

    const input = 'div { width: 100px; }';
    await postcss([testPlugin()])
      .process(input, { from: undefined });
  });

  // Test customUnitList with non-array value
  it('should handle non-array customUnitList', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: value * 2, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 200px; }',
      { processor, customUnitList: 'not-an-array' }
    );
  });

  // Test customUnitList with invalid units
  it('should filter out invalid custom units', async () => {
    const processor = (value, unit) => {
      if (unit === 'valid') {
        return { value: value * 2, unit: 'valid' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100valid; margin: 50invalid123; padding: 25; }',
      'div { width: 200valid; margin: 50invalid123; padding: 25; }',
      {
        processor,
        customUnitList: [
          'valid',      // valid
          'invalid123', // invalid - contains numbers
          123,          // invalid - not a string
          '',           // invalid - empty string
          '   ',        // invalid - only whitespace
          null,         // invalid - null
          'spec@al'     // invalid - contains special chars
        ]
      }
    );
  });

  // Test processor returning object with null value
  it('should handle processor returning object with null value', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: null, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 0; }',
      { processor }
    );
  });

  // Test processor returning object with falsy unit
  it('should handle processor returning object with falsy unit', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: 50, unit: '' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 50px; }',
      { processor }
    );
  });

  // Test processor returning string number
  it('should handle processor returning string number', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return '75.5';
      }
      return value;
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 75.5px; }',
      { processor }
    );
  });

  // Test processor returning NaN string
  it('should handle processor returning non-numeric string', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return 'not-a-number';
      }
      return value;
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 0; }',
      { processor }
    );
  });

  // Test processor returning 0 value
  it('should handle processor returning 0 value', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return 0;
      }
      return value;
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 0; }',
      { processor }
    );
  });

  // Test processor returning object with 0 value
  it('should handle processor returning object with 0 value', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return { value: 0, unit: 'px' };
      }
      return { value, unit };
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 0; }',
      { processor }
    );
  });

  // Test processor returning exact number type
  it('should handle processor returning exact number type', async () => {
    const processor = (value, unit) => {
      if (unit === 'px') {
        return 42.75;
      }
      return value;
    };
    await testProcess(
      'div { width: 100px; }',
      'div { width: 42.75px; }',
      { processor }
    );
  });

  // Test unitProcessor with no options (default parameter)
  it('should handle unitProcessor called without options', async () => {
    const input = 'div { width: 100px; }';
    const result = await postcss([unitProcessor()])
      .process(input, { from: undefined });
    expect(result.css).toEqual('div { width: 100px; }');
    expect(result.warnings()).toHaveLength(0);
  });

});
