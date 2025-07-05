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

  // Test exclude option
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
});
