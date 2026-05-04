"use strict";
// VisualGrounder.ts — NEW file, not in Dart codebase.
// Fallback when grounder returns needsVisualGrounding: true.
// Re-calls the LLM with only the screenshot to get x,y coordinates.
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualGrounder = void 0;
const common_1 = require("@usb-ui-test/common");
const common_2 = require("@usb-ui-test/common");
const providerFailure_js_1 = require("./providerFailure.js");
/**
 * Fallback visual grounder — called when the text-based grounder
 * returns `needsVisualGrounding: true` (element visible in screenshot
 * but not in hierarchy).
 *
 * Makes one attempt to find coordinates by asking the LLM
 * to visually locate the element using only the screenshot (no hierarchy).
 */
class VisualGrounder {
    _aiAgent;
    constructor(aiAgent) {
        this._aiAgent = aiAgent;
    }
    /**
     * Attempt to visually ground an element from the screenshot alone.
     * One attempt only — if it fails, returns success: false.
     */
    async ground(params) {
        try {
            common_1.Logger.i('Attempting visual grounding fallback (no hierarchy)...');
            const response = await this._aiAgent.ground({
                feature: common_2.FEATURE_VISUAL_GROUNDER,
                act: params.act,
                screenshot: params.screenshot,
                platform: params.platform,
                traceStep: params.traceStep,
                tracePhase: 'action.visual_fallback',
                logContext: params.logContext,
            });
            const output = response.output;
            // Check for x,y coordinates
            if (typeof output['x'] === 'number' && typeof output['y'] === 'number') {
                common_1.Logger.i(`Visual grounding succeeded: (${output['x']}, ${output['y']}) — ${output['reason']}`);
                return {
                    success: true,
                    x: output['x'],
                    y: output['y'],
                    reason: output['reason'],
                    trace: response.trace,
                    ...(response.llmCall ? { llmCall: response.llmCall } : {}),
                };
            }
            // Check for error
            if (output['isError']) {
                common_1.Logger.w(`Visual grounding failed: ${output['reason']}`);
                return {
                    success: false,
                    reason: output['reason'],
                    trace: response.trace,
                    ...(response.llmCall ? { llmCall: response.llmCall } : {}),
                };
            }
            common_1.Logger.w('Visual grounding returned unexpected format');
            return {
                success: false,
                reason: 'Unexpected response format',
                trace: response.trace,
                ...(response.llmCall ? { llmCall: response.llmCall } : {}),
            };
        }
        catch (error) {
            if (providerFailure_js_1.FatalProviderError.isInstance(error)) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            common_1.Logger.e('Visual grounding error:', error);
            return { success: false, reason: message };
        }
    }
}
exports.VisualGrounder = VisualGrounder;
//# sourceMappingURL=VisualGrounder.js.map