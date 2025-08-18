import { Plugin } from 'postcss';

declare namespace PostcssUnitProcessor {
  interface Options {
    /**
     * A function to process the value and unit.
     * @param value The numeric value to process.
     * @param unit The unit of the value (e.g., 'px', 'rem').
     * @param node The PostCSS node being processed.
     * @param root The root PostCSS node.
     * @returns The processed value as a number, string, or an object with value and unit.
     */
    processor?: (value: number, unit: string, node: any, root: any) => number | string | { value: number | string; unit?: string };

    /**
     * The precision for rounding unit values.
     * @default 5
     */
    unitPrecision?: number;

    /**
     * List of selectors to exclude from processing.
     * @default []
     */
    selectorBlackList?: Array<string | RegExp>;

    /**
     * List of properties to process. Supports wildcards and negation.
     * @default ['*']
     */
    propList?: string[];

    /**
     * Whether to replace the original declaration or add a new one.
     * @default true
     */
    replace?: boolean;

    /**
     * Whether to process units in media queries.
     * @default false
     */
    mediaQuery?: boolean;

    /**
     * Pattern or function to exclude files from processing.
     * @default /node_modules/i
     */
    exclude?: RegExp | string | ((filePath: string) => boolean);

    /**
     * Custom units to support in addition to default units.
     * @default []
     */
    customUnitList?: string[];

    /**
     * List of units to process. Supports wildcards and negation.
     * @default ['*']
     */
    unitList?: string[];
  }
}

/**
 * A PostCSS plugin to process units in CSS declarations and media queries.
 * @param options Configuration options for the plugin.
 * @returns A PostCSS plugin instance.
 */
declare function PostcssUnitProcessor(options?: PostcssUnitProcessor.Options): Plugin;

export = PostcssUnitProcessor;
