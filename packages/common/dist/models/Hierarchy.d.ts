/**
 * Represents a single node in the UI hierarchy tree.
 *
 * Dart equivalent: HierarchyNode in Hierarchy.dart
 */
export declare class HierarchyNode {
    readonly index: number;
    readonly text: string | null;
    readonly accessibilityText: string | null;
    readonly id: string | null;
    readonly clazz: string | null;
    readonly bounds: [number, number, number, number] | null;
    readonly isScrollable: boolean;
    readonly isFocused: boolean;
    readonly isEditable: boolean;
    readonly isImage: boolean;
    readonly hintText: string | null;
    readonly error: string | null;
    readonly isSelected: boolean;
    readonly children: HierarchyNode[];
    constructor(params: {
        index: number;
        text?: string | null;
        accessibilityText?: string | null;
        id?: string | null;
        clazz?: string | null;
        bounds?: [number, number, number, number] | null;
        isScrollable?: boolean;
        isFocused?: boolean;
        isEditable?: boolean;
        isImage?: boolean;
        hintText?: string | null;
        error?: string | null;
        isSelected?: boolean;
        children?: HierarchyNode[];
    });
    /**
     * Dart: bool isElementTypeButton()
     * Returns true if the element's class suggests it's a button-like widget.
     */
    isElementTypeButton(): boolean;
    /**
     * Dart: bool classContainsButton()
     */
    classContainsButton(): boolean;
    /**
     * Get the center point of this node's bounds.
     */
    getCenterPoint(): {
        x: number;
        y: number;
    } | null;
}
/**
 * Represents the full UI hierarchy of a screen.
 * Parsed from JSON sent by the on-device driver app via gRPC.
 *
 * Dart equivalent: Hierarchy class in Hierarchy.dart
 */
export declare class Hierarchy {
    readonly root: HierarchyNode | null;
    private _flattenedCache;
    constructor(root: HierarchyNode | null, flattenedNodes?: HierarchyNode[] | null);
    /**
     * Parse a hierarchy from the JSON string returned by the driver.
     * Dart: factory Hierarchy.fromJson(Map<String, dynamic> json)
     */
    static fromJson(json: Record<string, unknown>): Hierarchy;
    /**
     * Parse hierarchy from the raw JSON string.
     */
    static fromJsonString(jsonString: string): Hierarchy;
    /**
     * Parse the flat array payload returned by the native driver.
     * Dart: Hierarchy.fromJSON(List<dynamic> jsonArray, ...)
     */
    static fromFlatJson(jsonArray: unknown[]): Hierarchy;
    /**
     * Flatten the hierarchy tree into a linear list of nodes.
     * Each node gets a sequential 0-based index.
     * Dart: List<HierarchyNode> get flattenedHierarchy
     */
    get flattenedHierarchy(): HierarchyNode[];
    /**
     * Hierarchy subset for the PLANNER — minimal, tappable/image elements only.
     *
     * Filter: a node is kept only if it has accessibility text AND is either an
     * image, an iOS button, or an Android button-class node.
     * Fields: index, contentDesc, class (Android class name shortened), bounds.
     *
     * The planner treats the screenshot as the source of truth and uses the
     * hierarchy only to disambiguate interactive targets, so the slim payload
     * is sufficient and keeps token cost low.
     */
    toPromptElementsForPlanner(platform?: string): Record<string, unknown>[];
    /**
     * Hierarchy subset for the GROUNDER — every flattened node with a rich
     * field set.
     *
     * Filter: none (all flattened nodes are included).
     * Fields: index, text, contentDesc, id, class (Android class name shortened),
     * bounds, isScrollable, isFocused, isEditable, hintText, error, isSelected.
     *
     * The grounder needs maximum context to map a natural-language target
     * description to an element index reliably.
     */
    toPromptElementsForGrounder(platform?: string): Record<string, unknown>[];
    /**
     * Android classes come through fully qualified (e.g. `android.widget.Button`).
     * Shorten to the last `.`-separated segment so prompts stay terse.
     * iOS classes are left alone.
     */
    private static _shortenAndroidClass;
    /**
     * Recursively parse a JSON node into a HierarchyNode.
     * Returns the node and a counter tracking the next available index.
     */
    private static _parseNode;
    /**
     * Flatten a node and all its descendants into a list.
     */
    private static _flattenNode;
    private static _parseFlatNode;
    private static _parseBounds;
}
//# sourceMappingURL=Hierarchy.d.ts.map