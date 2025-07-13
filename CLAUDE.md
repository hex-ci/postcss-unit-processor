# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
- `npm test` - Run all tests using Jest
- `npm run test:coverage` - Run tests with coverage report
- `npx jest --testNamePattern="test name"` - Run a specific test by name pattern

### Project Structure

This is a PostCSS plugin that processes CSS units through a configurable processor function. It's a single-purpose plugin with a focused architecture.

## Core Architecture

The plugin consists of a main entry point (`index.js`) with several key architectural components:

### Main Plugin Function (`module.exports`)
- Returns a PostCSS plugin object with `postcssPlugin`, `Once`, `Declaration`, and `AtRule` hooks
- Handles plugin configuration merging with defaults
- Manages file exclusion logic and unit regex compilation

### Key Processing Components

1. **Unit Detection & Regex (`createUnitRegex`)**
   - Combines default CSS units with custom units from options
   - Creates a regex that excludes quoted strings and URLs but matches unit values
   - Pattern: `"[^"]+"|'[^']+'|url\([^)]+\)|var\([^)]+\)|(\d*\.?\d+)(${unitStr})`

2. **Property List Matching (`createPropListMatcher`)**
   - Supports wildcards (`*`), exact matches, and negation patterns (`!`)
   - Handles `startWith`, `endWith`, `contain`, and their negative variants
   - Returns a function that tests if a CSS property should be processed

3. **Unit Processing (`createUnitReplace`)**
   - Calls the user-provided processor function with value, unit, node, and root
   - Handles different processor return types: number, string, or object with value/unit
   - Applies precision rounding via `toFixed` helper

4. **Selector Blacklisting (`blacklistedSelector`)**
   - Supports string includes and regex pattern matching
   - Used to skip processing for specific CSS selectors

### Plugin Hooks

- **`Once`**: Sets up file exclusion logic and initializes the unit replacement function
- **`Declaration`**: Processes CSS property values, handles replacement vs. cloning
- **`AtRule`**: Processes media query parameters when `mediaQuery` option is enabled

### Configuration Options

The plugin accepts extensive configuration through the options object, with sensible defaults for all settings. Key options include processor function, unit precision, property filtering, selector blacklisting, and file exclusion patterns.

### Type Safety

TypeScript definitions are provided in `index.d.ts` with comprehensive interface documentation for all configuration options and the processor function signature.