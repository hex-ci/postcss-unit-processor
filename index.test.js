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
  it('should not exclude files when file path is undefined', async () => {
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
  it('should not exclude files when file path does not match string', async () => {
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
  it('should not exclude files when file path does not match regex', async () => {
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
});
