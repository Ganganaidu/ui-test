import { Point, ScrollAbsAction } from '@usb-ui-test/common';
import type { HierarchyNode } from '@usb-ui-test/common';
/**
 * Result wrapper for conversion operations.
 */
export declare class ConversionResult<T> {
    readonly success: boolean;
    readonly data: T | null;
    readonly error: string | null;
    private constructor();
    static ok<T>(data: T): ConversionResult<T>;
    static fail<T>(error: string): ConversionResult<T>;
}
/**
 * Converts AI grounder responses into actionable coordinates or scroll actions.
 *
 * Dart equivalent: GrounderResponseConverter in goal_executor/lib/src/GrounderResponseConverter.dart
 */
export declare class GrounderResponseConverter {
    /**
     * Extract a Point from the grounder response.
     * Handles:
     *   - {index: N} → look up center of Nth element
     *   - {x: N, y: N} → direct coordinates
     *   - {index: null} → already focused (for input-focus grounder)
     *
     * Dart: static ConversionResult<Point> extractPoint(...)
     */
    static extractPoint(params: {
        output: Record<string, unknown>;
        flattenedHierarchy: HierarchyNode[];
        screenWidth: number;
        screenHeight: number;
    }): ConversionResult<Point | null>;
    /**
     * Extract a ScrollAbsAction from the scroll-index grounder response.
     * Response format: {startX, startY, endX, endY, duration}
     *
     * Dart: static ConversionResult<ScrollAbsAction> extractScrollAction(...)
     */
    static extractScrollAction(params: {
        output: Record<string, unknown>;
        screenWidth: number;
        screenHeight: number;
    }): ConversionResult<ScrollAbsAction>;
}
//# sourceMappingURL=GrounderResponseConverter.d.ts.map