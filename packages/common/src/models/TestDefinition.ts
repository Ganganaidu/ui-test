/** A single test authored as a YAML file under .usb-ui-test/tests/ */
export interface TestDefinition {
  // --- Always present (authored in YAML) ---
  name: string;
  description?: string;
  setup: string[];
  steps: string[];
  expected_state: string[];

  /**
   * Execution mode for this test:
   *   'ai'            — natural-language steps interpreted by an LLM (default)
   *   'deterministic' — structured commands resolved against the on-device AX tree
   *                     by @usb-ui-test/local-executor; no AI calls
   * Detected by the test loader from the shape of step entries. When this is
   * 'deterministic' the parsed commands live in structuredSteps below; the
   * existing steps[] field is populated with human-readable string forms for
   * report rendering and snapshotting, so legacy consumers still work.
   */
  mode?: 'ai' | 'deterministic';

  /**
   * Parsed structured commands when mode === 'deterministic'. Shape matches
   * @usb-ui-test/local-executor's StructuredStep type. Kept as unknown[] in
   * common to avoid a circular dep on local-executor.
   */
  structuredSteps?: unknown[];


  // --- Populated after loading from disk ---
  /** Absolute path to the source YAML file. Set by the test loader. */
  sourcePath?: string;
  /** Path relative to .usb-ui-test/tests/. Set by the test loader. */
  relativePath?: string;
  /** Sanitized unique ID derived from the file path. Set by the test loader. */
  testId?: string;

  // --- Populated at run time for run manifest input ---
  /** Absolute path within the workspace. Set at run time. */
  workspaceSourcePath?: string;
  /** Path to the YAML snapshot taken at run time. */
  snapshotYamlPath?: string;
  /** Path to the JSON snapshot taken at run time. */
  snapshotJsonPath?: string;
  /** Variables and secrets referenced by this test. Set at run time. */
  bindingReferences?: BindingReference;
}

export interface BindingReference {
  variables: string[];
  secrets: string[];
}
