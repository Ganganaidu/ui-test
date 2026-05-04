"use strict";
// Port of common/model/Hierarchy.dart — MINIMAL: parse + flatten + node properties
// The Dart file is ~108KB. We port only the subset used by UsbUiTestAgent and
// HeadlessActionExecutor for AI prompt building and grounding.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hierarchy = exports.HierarchyNode = void 0;
const constants_js_1 = require("../constants.js");
/**
 * Represents a single node in the UI hierarchy tree.
 *
 * Dart equivalent: HierarchyNode in Hierarchy.dart
 */
class HierarchyNode {
    index;
    text;
    accessibilityText;
    id;
    clazz;
    bounds; // [left, top, right, bottom]
    isScrollable;
    isFocused;
    isEditable;
    isImage;
    hintText;
    error;
    isSelected;
    children;
    constructor(params) {
        this.index = params.index;
        this.text = params.text ?? null;
        this.accessibilityText = params.accessibilityText ?? null;
        this.id = params.id ?? null;
        this.clazz = params.clazz ?? null;
        this.bounds = params.bounds ?? null;
        this.isScrollable = params.isScrollable ?? false;
        this.isFocused = params.isFocused ?? false;
        this.isEditable = params.isEditable ?? false;
        this.isImage = params.isImage ?? false;
        this.hintText = params.hintText ?? null;
        this.error = params.error ?? null;
        this.isSelected = params.isSelected ?? false;
        this.children = params.children ?? [];
    }
    /**
     * Dart: bool isElementTypeButton()
     * Returns true if the element's class suggests it's a button-like widget.
     */
    isElementTypeButton() {
        if (!this.clazz)
            return false;
        return this.classContainsButton();
    }
    /**
     * Dart: bool classContainsButton()
     */
    classContainsButton() {
        if (!this.clazz)
            return false;
        const lower = this.clazz.toLowerCase();
        return lower.includes('button') || lower.includes('clickable');
    }
    /**
     * Get the center point of this node's bounds.
     */
    getCenterPoint() {
        if (!this.bounds)
            return null;
        const [left, top, right, bottom] = this.bounds;
        return {
            x: Math.round((left + right) / 2),
            y: Math.round((top + bottom) / 2),
        };
    }
}
exports.HierarchyNode = HierarchyNode;
// ============================================================================
// Hierarchy — the full tree with parsing and flattening
// ============================================================================
/**
 * Represents the full UI hierarchy of a screen.
 * Parsed from JSON sent by the on-device driver app via gRPC.
 *
 * Dart equivalent: Hierarchy class in Hierarchy.dart
 */
class Hierarchy {
    root;
    _flattenedCache = null;
    constructor(root, flattenedNodes) {
        this.root = root;
        if (flattenedNodes) {
            this._flattenedCache = flattenedNodes;
        }
    }
    /**
     * Parse a hierarchy from the JSON string returned by the driver.
     * Dart: factory Hierarchy.fromJson(Map<String, dynamic> json)
     */
    static fromJson(json) {
        const root = Hierarchy._parseNode(json, 0);
        return new Hierarchy(root.node);
    }
    /**
     * Parse hierarchy from the raw JSON string.
     */
    static fromJsonString(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed)) {
                return Hierarchy.fromFlatJson(parsed);
            }
            return Hierarchy.fromJson(parsed);
        }
        catch {
            return new Hierarchy(null);
        }
    }
    /**
     * Parse the flat array payload returned by the native driver.
     * Dart: Hierarchy.fromJSON(List<dynamic> jsonArray, ...)
     */
    static fromFlatJson(jsonArray) {
        const flattenedNodes = jsonArray.map((item, index) => Hierarchy._parseFlatNode(item, index));
        return new Hierarchy(null, flattenedNodes);
    }
    /**
     * Flatten the hierarchy tree into a linear list of nodes.
     * Each node gets a sequential 0-based index.
     * Dart: List<HierarchyNode> get flattenedHierarchy
     */
    get flattenedHierarchy() {
        if (this._flattenedCache !== null)
            return this._flattenedCache;
        const result = [];
        if (this.root) {
            Hierarchy._flattenNode(this.root, result);
        }
        this._flattenedCache = result;
        return result;
    }
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
    toPromptElementsForPlanner(platform) {
        const isAndroid = platform === constants_js_1.PLATFORM_ANDROID;
        const isIOS = platform === constants_js_1.PLATFORM_IOS;
        return this.flattenedHierarchy
            .filter((node) => {
            const hasAccText = !!node.accessibilityText;
            if (!hasAccText)
                return false;
            if (node.isImage)
                return true;
            if (isIOS && node.isElementTypeButton())
                return true;
            if (isAndroid && node.classContainsButton())
                return true;
            return false;
        })
            .map((node) => {
            const out = { index: node.index };
            if (node.accessibilityText)
                out['contentDesc'] = node.accessibilityText;
            const simpleClass = Hierarchy._shortenAndroidClass(node.clazz, platform);
            if (simpleClass)
                out['class'] = simpleClass;
            if (node.bounds)
                out['bounds'] = node.bounds;
            return out;
        });
    }
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
    toPromptElementsForGrounder(platform) {
        return this.flattenedHierarchy.map((node) => {
            const out = { index: node.index };
            if (node.text)
                out['text'] = node.text;
            if (node.accessibilityText)
                out['contentDesc'] = node.accessibilityText;
            if (node.id)
                out['id'] = node.id;
            const simpleClass = Hierarchy._shortenAndroidClass(node.clazz, platform);
            if (simpleClass)
                out['class'] = simpleClass;
            if (node.bounds)
                out['bounds'] = node.bounds;
            if (node.isScrollable)
                out['isScrollable'] = true;
            if (node.isFocused)
                out['isFocused'] = true;
            if (node.isEditable)
                out['isEditable'] = true;
            if (node.hintText)
                out['hintText'] = node.hintText;
            if (node.error)
                out['error'] = node.error;
            if (node.isSelected)
                out['isSelected'] = true;
            return out;
        });
    }
    // ---------- private helpers ----------
    /**
     * Android classes come through fully qualified (e.g. `android.widget.Button`).
     * Shorten to the last `.`-separated segment so prompts stay terse.
     * iOS classes are left alone.
     */
    static _shortenAndroidClass(clazz, platform) {
        if (!clazz)
            return null;
        if (platform !== constants_js_1.PLATFORM_ANDROID)
            return clazz;
        const parts = clazz.split('.');
        return parts[parts.length - 1] ?? clazz;
    }
    /**
     * Recursively parse a JSON node into a HierarchyNode.
     * Returns the node and a counter tracking the next available index.
     */
    static _parseNode(json, startIndex) {
        let currentIndex = startIndex;
        const childrenJson = json['children'] ?? [];
        const parsedChildren = [];
        for (const childJson of childrenJson) {
            const result = Hierarchy._parseNode(childJson, currentIndex + 1);
            parsedChildren.push(result.node);
            currentIndex = result.nextIndex;
        }
        // Parse bounds: either array [l,t,r,b] or object {left,top,right,bottom}
        const bounds = Hierarchy._parseBounds(json['bounds']);
        const node = new HierarchyNode({
            index: startIndex,
            text: json['text'] ?? null,
            accessibilityText: json['contentDesc'] ?? json['accessibilityText'] ?? null,
            id: json['id'] ?? null,
            clazz: json['class'] ?? json['clazz'] ?? null,
            bounds,
            isScrollable: json['isScrollable'] ?? false,
            isFocused: json['isFocused'] ?? false,
            isEditable: json['isEditable'] ?? false,
            isImage: json['isImage'] ?? false,
            hintText: json['hintText'] ?? null,
            error: json['error'] ?? null,
            isSelected: json['isSelected'] ?? false,
            children: parsedChildren,
        });
        return { node, nextIndex: currentIndex };
    }
    /**
     * Flatten a node and all its descendants into a list.
     */
    static _flattenNode(node, result) {
        result.push(node);
        for (const child of node.children) {
            Hierarchy._flattenNode(child, result);
        }
    }
    static _parseFlatNode(json, index) {
        let id = json['id'] ??
            json['identifier'] ??
            null;
        if (id && id.includes(':id/')) {
            id = id.split(':id/').at(-1) ?? id;
        }
        const clazz = json['class'] ??
            json['clazz'] ??
            null;
        return new HierarchyNode({
            index,
            text: json['text'] ??
                json['title'] ??
                json['value'] ??
                null,
            accessibilityText: json['content_desc'] ??
                json['contentDesc'] ??
                json['accessibilityText'] ??
                json['label'] ??
                null,
            id,
            clazz,
            bounds: Hierarchy._parseBounds(json['bounds']),
            isScrollable: json['isScrollable'] ??
                json['is_scrollable'] ??
                false,
            isFocused: json['isFocused'] ??
                json['is_focused'] ??
                false,
            isEditable: json['isEditable'] ??
                json['is_editable'] ??
                false,
            isImage: (json['isImage'] ??
                false) || ((clazz?.includes('ImageView') ?? false) ||
                (clazz?.includes('ImageButton') ?? false) ||
                (clazz?.includes('SvgView') ?? false)),
            hintText: json['hintText'] ?? null,
            error: json['error'] ?? null,
            isSelected: json['isSelected'] ??
                json['is_selected'] ??
                json['is_checked'] ??
                false,
            children: [],
        });
    }
    static _parseBounds(rawBounds) {
        if (Array.isArray(rawBounds) && rawBounds.length === 4) {
            return [
                Number(rawBounds[0]),
                Number(rawBounds[1]),
                Number(rawBounds[2]),
                Number(rawBounds[3]),
            ];
        }
        if (rawBounds &&
            typeof rawBounds === 'object' &&
            'left' in rawBounds &&
            'top' in rawBounds &&
            'right' in rawBounds &&
            'bottom' in rawBounds) {
            const bounds = rawBounds;
            return [
                Number(bounds['left']),
                Number(bounds['top']),
                Number(bounds['right']),
                Number(bounds['bottom']),
            ];
        }
        return null;
    }
}
exports.Hierarchy = Hierarchy;
//# sourceMappingURL=Hierarchy.js.map