import type { AIAgent } from './AIAgent.js';
import type { LLMTrace, LLMCallTrace } from '../trace.js';
export interface VisualGroundingResult {
    success: boolean;
    x?: number;
    y?: number;
    reason?: string;
    trace?: LLMTrace;
    /** LLM call trace from the visual grounding attempt. */
    llmCall?: LLMCallTrace;
}
/**
 * Fallback visual grounder — called when the text-based grounder
 * returns `needsVisualGrounding: true` (element visible in screenshot
 * but not in hierarchy).
 *
 * Makes one attempt to find coordinates by asking the LLM
 * to visually locate the element using only the screenshot (no hierarchy).
 */
export declare class VisualGrounder {
    private _aiAgent;
    constructor(aiAgent: AIAgent);
    /**
     * Attempt to visually ground an element from the screenshot alone.
     * One attempt only — if it fails, returns success: false.
     */
    ground(params: {
        act: string;
        screenshot: string;
        platform: string;
        traceStep?: number;
        logContext?: string;
    }): Promise<VisualGroundingResult>;
}
//# sourceMappingURL=VisualGrounder.d.ts.map