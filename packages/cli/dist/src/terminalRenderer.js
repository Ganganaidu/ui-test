"use strict";
// Port of mobile_cli/lib/terminal_goal_renderer.dart
// Renders goal execution progress in the terminal with live updates.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalRenderer = void 0;
/**
 * Renders goal execution progress in the terminal.
 * Uses ANSI escape codes for live-updating output.
 *
 * Dart equivalent: TerminalGoalRenderer in mobile_cli/lib/terminal_goal_renderer.dart
 */
class TerminalRenderer {
    _spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    _spinnerIndex = 0;
    _spinnerInterval = null;
    _currentMessage = '';
    /**
     * Handle a progress event from the goal executor.
     */
    onProgress(event) {
        switch (event.type) {
            case 'planning':
                this._stopSpinner();
                console.log(`  [${event.iteration}/${event.totalIterations}] ${event.message ?? 'Planning...'}`);
                break;
            case 'executing':
                this._stopSpinner();
                console.log('  Executing...');
                break;
            case 'step_complete':
                this._stopSpinner();
                if (event.success) {
                    console.log(`  \x1b[32m✓\x1b[0m Step completed\n`);
                }
                else {
                    console.log(`  \x1b[31m✗\x1b[0m Step failed: ${event.message ?? 'Unknown error'}\n`);
                }
                break;
            case 'goal_complete':
                this._stopSpinner();
                if (event.status === 'aborted') {
                    console.log(`\n\x1b[33m! Goal aborted\x1b[0m ${event.reason ?? ''}`);
                }
                else if (event.success) {
                    console.log(`\n\x1b[32m✓ Goal completed!\x1b[0m ${event.reason ?? ''}`);
                }
                else {
                    console.log(`\n\x1b[31m✗ Goal failed:\x1b[0m ${event.reason ?? ''}`);
                }
                break;
            case 'error':
                this._stopSpinner();
                console.log(`  \x1b[31m✗ Error:\x1b[0m ${event.message ?? 'Unknown error'}`);
                break;
        }
    }
    /**
     * Print a summary of the goal execution result.
     */
    printSummary(result) {
        console.log('\n' + '─'.repeat(50));
        console.log(result.status === 'aborted'
            ? `\x1b[33m! Goal aborted\x1b[0m`
            : result.success
                ? `\x1b[32m✓ Goal completed successfully\x1b[0m`
                : `\x1b[31m✗ Goal failed\x1b[0m`);
        console.log(`  Message: ${result.message}`);
        console.log(`  Total steps: ${result.steps.length}`);
        console.log(`  Iterations: ${result.totalIterations}`);
        console.log('─'.repeat(50));
    }
    /**
     * Show a spinner with a message.
     */
    _showSpinner(message) {
        this._stopSpinner();
        this._currentMessage = message;
        this._spinnerInterval = setInterval(() => {
            const frame = this._spinnerFrames[this._spinnerIndex % this._spinnerFrames.length];
            this._spinnerIndex++;
            process.stdout.write(`\r  ${frame} ${this._currentMessage}`);
        }, 80);
    }
    /**
     * Stop the spinner and clear the line.
     */
    _stopSpinner() {
        if (this._spinnerInterval) {
            clearInterval(this._spinnerInterval);
            this._spinnerInterval = null;
            // Clear the spinner line
            process.stdout.write('\r' + ' '.repeat(80) + '\r');
        }
    }
    /** Clean up resources. */
    destroy() {
        this._stopSpinner();
    }
}
exports.TerminalRenderer = TerminalRenderer;
//# sourceMappingURL=terminalRenderer.js.map