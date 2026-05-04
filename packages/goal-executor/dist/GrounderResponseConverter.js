"use strict";
// Port of goal_executor/lib/src/GrounderResponseConverter.dart
// Converts grounder AI response into coordinates or scroll actions.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrounderResponseConverter = exports.ConversionResult = void 0;
const common_1 = require("@usb-ui-test/common");
/**
 * Result wrapper for conversion operations.
 */
class ConversionResult {
    success;
    data;
    error;
    constructor(success, data, error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }
    static ok(data) {
        return new ConversionResult(true, data, null);
    }
    static fail(error) {
        return new ConversionResult(false, null, error);
    }
}
exports.ConversionResult = ConversionResult;
/**
 * Converts AI grounder responses into actionable coordinates or scroll actions.
 *
 * Dart equivalent: GrounderResponseConverter in goal_executor/lib/src/GrounderResponseConverter.dart
 */
class GrounderResponseConverter {
    /**
     * Extract a Point from the grounder response.
     * Handles:
     *   - {index: N} → look up center of Nth element
     *   - {x: N, y: N} → direct coordinates
     *   - {index: null} → already focused (for input-focus grounder)
     *
     * Dart: static ConversionResult<Point> extractPoint(...)
     */
    static extractPoint(params) {
        const { output, flattenedHierarchy, screenWidth, screenHeight } = params;
        // Case: error response
        if (output['isError'] === true) {
            return ConversionResult.fail(output['reason'] ?? 'Grounder returned error');
        }
        // Case: needsVisualGrounding
        if (output['needsVisualGrounding'] === true) {
            return ConversionResult.fail('needsVisualGrounding');
        }
        // Case: index is explicitly null/undefined → already focused (no tap needed)
        if (Object.prototype.hasOwnProperty.call(output, 'index') &&
            (output['index'] === null || output['index'] === undefined)) {
            if (output['reason']) {
                common_1.Logger.d(`Element already focused: ${output['reason']}`);
            }
            return ConversionResult.ok(null); // null means "no action needed"
        }
        // Case: direct x, y coordinates
        if (typeof output['x'] === 'number' && typeof output['y'] === 'number') {
            const x = Math.round(output['x']);
            const y = Math.round(output['y']);
            // Validate coordinates are within screen bounds
            if (x < 0 || x >= screenWidth || y < 0 || y >= screenHeight) {
                return ConversionResult.fail(`Coordinates (${x}, ${y}) out of screen bounds (${screenWidth}x${screenHeight})`);
            }
            return ConversionResult.ok(new common_1.Point({ x, y }));
        }
        // Case: element index → look up center coordinates
        if (typeof output['index'] === 'number') {
            const index = output['index'];
            if (index < 0 || index >= flattenedHierarchy.length) {
                return ConversionResult.fail(`Element index ${index} out of range (0-${flattenedHierarchy.length - 1})`);
            }
            const node = flattenedHierarchy[index];
            const center = node.getCenterPoint();
            if (!center) {
                return ConversionResult.fail(`Element at index ${index} has no bounds`);
            }
            return ConversionResult.ok(new common_1.Point({ x: center.x, y: center.y }));
        }
        return ConversionResult.fail(`Unexpected grounder response format: ${JSON.stringify(output)}`);
    }
    /**
     * Extract a ScrollAbsAction from the scroll-index grounder response.
     * Response format: {startX, startY, endX, endY, duration}
     *
     * Dart: static ConversionResult<ScrollAbsAction> extractScrollAction(...)
     */
    static extractScrollAction(params) {
        const { output, screenWidth, screenHeight } = params;
        // Check for error
        if (output['isError'] === true) {
            return ConversionResult.fail(output['reason'] ?? 'Scroll grounder returned error');
        }
        // Parse coordinates
        const startX = output['startX'] ?? output['start_x'];
        const startY = output['startY'] ?? output['start_y'];
        const endX = output['endX'] ?? output['end_x'];
        const endY = output['endY'] ?? output['end_y'];
        const durationMs = output['duration'] ?? output['durationMs'] ?? 500;
        if (typeof startX !== 'number' ||
            typeof startY !== 'number' ||
            typeof endX !== 'number' ||
            typeof endY !== 'number') {
            return ConversionResult.fail(`Invalid scroll coordinates: ${JSON.stringify(output)}`);
        }
        // Validate bounds
        const coords = [
            { name: 'startX', val: startX },
            { name: 'startY', val: startY },
            { name: 'endX', val: endX },
            { name: 'endY', val: endY },
        ];
        for (const { name, val } of coords) {
            const maxVal = name.includes('X') ? screenWidth : screenHeight;
            if (val < 0 || val >= maxVal) {
                return ConversionResult.fail(`${name}=${val} out of screen bounds (max ${maxVal})`);
            }
        }
        return ConversionResult.ok(new common_1.ScrollAbsAction({
            startX: Math.round(startX),
            startY: Math.round(startY),
            endX: Math.round(endX),
            endY: Math.round(endY),
            durationMs: Math.round(durationMs),
        }));
    }
}
exports.GrounderResponseConverter = GrounderResponseConverter;
//# sourceMappingURL=GrounderResponseConverter.js.map