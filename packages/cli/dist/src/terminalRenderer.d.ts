import type { ExecutionProgressEvent, TestExecutionResult } from '@usb-ui-test/goal-executor';
/**
 * Renders goal execution progress in the terminal.
 * Uses ANSI escape codes for live-updating output.
 *
 * Dart equivalent: TerminalGoalRenderer in mobile_cli/lib/terminal_goal_renderer.dart
 */
export declare class TerminalRenderer {
    private _spinnerFrames;
    private _spinnerIndex;
    private _spinnerInterval;
    private _currentMessage;
    /**
     * Handle a progress event from the goal executor.
     */
    onProgress(event: ExecutionProgressEvent): void;
    /**
     * Print a summary of the goal execution result.
     */
    printSummary(result: TestExecutionResult): void;
    /**
     * Show a spinner with a message.
     */
    private _showSpinner;
    /**
     * Stop the spinner and clear the line.
     */
    private _stopSpinner;
    /** Clean up resources. */
    destroy(): void;
}
//# sourceMappingURL=terminalRenderer.d.ts.map