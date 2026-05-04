import type { Hierarchy, HierarchyNode } from '@usb-ui-test/common';
import type { Selector } from './types.js';
export declare class SelectorNotFoundError extends Error {
    readonly selector: Selector;
    constructor(selector: Selector, hierarchy: Hierarchy);
}
/** Resolve `selector` against `hierarchy`. Throws if no match. */
export declare function resolveSelector(hierarchy: Hierarchy, selector: Selector): HierarchyNode;
/** Returns true iff at least one node in the hierarchy matches. */
export declare function hasMatch(hierarchy: Hierarchy, selector: Selector): boolean;
/** Returns all matches in flattened-tree order. */
export declare function findMatches(hierarchy: Hierarchy, selector: Selector): HierarchyNode[];
//# sourceMappingURL=selector.d.ts.map