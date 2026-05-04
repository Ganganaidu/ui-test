/**
 * A selector identifies one element in the on-device accessibility tree. We
 * accept any of: visible text, accessibility id, content-description, plus an
 * optional `index` to disambiguate when multiple nodes match. The selector is
 * resolved against `Hierarchy.flattenedHierarchy`.
 *
 * Why a union of options instead of a single `text` field: real apps are
 * inconsistent. A "Login" button on Android may have only `text="Login"`, on
 * iOS may have only `accessibilityText="Login"`, and a custom design system
 * may instead expose a stable `id="login_submit"`. Tests should be able to
 * pick whichever is most stable for the app under test.
 */
export interface Selector {
    /** Matches HierarchyNode.text exactly (case-insensitive when caseInsensitive=true). */
    readonly text?: string;
    /** Matches HierarchyNode.id (resource-id on Android, accessibilityIdentifier on iOS). */
    readonly id?: string;
    /** Matches HierarchyNode.accessibilityText (contentDesc on Android, label on iOS). */
    readonly accessibility?: string;
    /** Substring match against text/accessibility — useful when labels are dynamic. */
    readonly contains?: string;
    /** When multiple nodes match, pick the Nth (0-based). Defaults to 0. */
    readonly index?: number;
    /** Lowercase comparison for text/contains. Defaults to false. */
    readonly caseInsensitive?: boolean;
}
/** Direction shorthand for swipe. */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
/** Discriminated union of every v1 structured step. */
export type StructuredStep = LaunchAppStep | ClearAppDataStep | TapOnStep | InputTextStep | SwipeStep | AssertVisibleStep | AssertNotVisibleStep | WaitForStep;
export interface LaunchAppStep {
    readonly kind: 'launchApp';
    /** Bundle/package id. Optional — defaults to the app declared in workspace config. */
    readonly appId?: string;
    /** Whether to clear app state before launch. Defaults to false. */
    readonly clearState?: boolean;
}
export interface ClearAppDataStep {
    readonly kind: 'clearAppData';
    readonly appId?: string;
}
export interface TapOnStep {
    readonly kind: 'tapOn';
    readonly selector: Selector;
}
export interface InputTextStep {
    readonly kind: 'inputText';
    readonly value: string;
    /** When set, taps this element first to focus it before typing. */
    readonly into?: Selector;
    /** Erase any existing text first. Defaults to false. */
    readonly clear?: boolean;
}
export interface SwipeStep {
    readonly kind: 'swipe';
    /** Either a direction shorthand or explicit start/end coordinates. */
    readonly direction?: SwipeDirection;
    readonly from?: Coordinate;
    readonly to?: Coordinate;
    readonly durationMs?: number;
}
export interface AssertVisibleStep {
    readonly kind: 'assertVisible';
    readonly selector: Selector;
}
export interface AssertNotVisibleStep {
    readonly kind: 'assertNotVisible';
    readonly selector: Selector;
}
export interface WaitForStep {
    readonly kind: 'waitFor';
    readonly selector: Selector;
    /** Max time to poll before failing. Defaults to 10000ms. */
    readonly timeoutMs?: number;
}
export interface Coordinate {
    readonly x: number;
    readonly y: number;
}
/**
 * Result of executing a single structured step. Mirrors the shape the AI
 * executor produces so reporting/CLI surfaces don't need a separate path.
 */
export interface StepResult {
    readonly step: StructuredStep;
    readonly success: boolean;
    /** Coordinates resolved (when relevant), for trace/reporting. */
    readonly resolvedPoint?: Coordinate;
    readonly errorMessage?: string;
    readonly durationMs: number;
}
//# sourceMappingURL=types.d.ts.map