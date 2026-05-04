export declare const TEST_SELECTION_REQUIRED_ERROR = "At least one test selector is required. Pass a YAML file, directory, or glob under .usb-ui-test/tests.";
export interface SelectTestFilesOptions {
    requireSelection?: boolean;
}
export declare function normalizeTestSelectors(selectors?: readonly string[]): string[];
export declare function selectTestFiles(testsDir: string, selectors?: string[], options?: SelectTestFilesOptions): Promise<string[]>;
//# sourceMappingURL=testSelection.d.ts.map