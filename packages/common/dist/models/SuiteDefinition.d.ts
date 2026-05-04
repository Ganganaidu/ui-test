/** A suite manifest authored as a YAML file under .usb-ui-test/suites/ */
export interface SuiteDefinition {
    name: string;
    description?: string;
    tests: string[];
    /** Absolute path to the source YAML file. Set by the test loader. */
    sourcePath?: string;
    /** Path relative to .usb-ui-test/suites/. Set by the test loader. */
    relativePath?: string;
    /** Sanitized unique ID derived from the file path. Set by the test loader. */
    suiteId?: string;
    /** Absolute path within the workspace. Set at run time. */
    workspaceSourcePath?: string;
    /** Path to the YAML snapshot. Set at run time. */
    snapshotYamlPath?: string;
    /** Path to the JSON snapshot. Set at run time. */
    snapshotJsonPath?: string;
    /** Resolved test IDs for the tests in this suite. Set at run time. */
    resolvedTestIds?: string[];
}
//# sourceMappingURL=SuiteDefinition.d.ts.map