// selector.ts
//
// Resolve a Selector against a Hierarchy. Returns the matching HierarchyNode
// or throws with a useful "not found" message that lists what *was* on screen
// (a few candidate text/id values) — the most common test failure is a
// selector that doesn't match anything, and the diagnostic is what makes
// debugging fast.

import type { Hierarchy, HierarchyNode } from '@usb-ui-test/common';
import type { Selector } from './types.js';

export class SelectorNotFoundError extends Error {
  readonly selector: Selector;
  constructor(selector: Selector, hierarchy: Hierarchy) {
    super(formatNotFoundMessage(selector, hierarchy));
    this.name = 'SelectorNotFoundError';
    this.selector = selector;
  }
}

/** Resolve `selector` against `hierarchy`. Throws if no match. */
export function resolveSelector(
  hierarchy: Hierarchy,
  selector: Selector,
): HierarchyNode {
  const matches = findMatches(hierarchy, selector);
  if (matches.length === 0) {
    throw new SelectorNotFoundError(selector, hierarchy);
  }
  const idx = selector.index ?? 0;
  const picked = matches[idx];
  if (!picked) {
    throw new Error(
      `selector matched ${matches.length} nodes but index ${idx} is out of range`,
    );
  }
  return picked;
}

/** Returns true iff at least one node in the hierarchy matches. */
export function hasMatch(hierarchy: Hierarchy, selector: Selector): boolean {
  return findMatches(hierarchy, selector).length > 0;
}

/** Returns all matches in flattened-tree order. */
export function findMatches(
  hierarchy: Hierarchy,
  selector: Selector,
): HierarchyNode[] {
  const ci = selector.caseInsensitive ?? false;
  const norm = (s: string | null | undefined): string =>
    s == null ? '' : ci ? s.toLowerCase() : s;

  const targets: {
    text?: string;
    id?: string;
    accessibility?: string;
    contains?: string;
  } = {
    ...(selector.text !== undefined ? { text: norm(selector.text) } : {}),
    ...(selector.id !== undefined ? { id: selector.id } : {}),
    ...(selector.accessibility !== undefined
      ? { accessibility: norm(selector.accessibility) }
      : {}),
    ...(selector.contains !== undefined
      ? { contains: norm(selector.contains) }
      : {}),
  };

  return hierarchy.flattenedHierarchy.filter((n) => {
    if (
      targets.text !== undefined &&
      norm(n.text) !== targets.text &&
      norm(n.accessibilityText) !== targets.text
    ) {
      return false;
    }
    if (targets.id !== undefined && n.id !== targets.id) {
      return false;
    }
    if (
      targets.accessibility !== undefined &&
      norm(n.accessibilityText) !== targets.accessibility
    ) {
      return false;
    }
    if (targets.contains !== undefined) {
      const haystack = `${norm(n.text)} ${norm(n.accessibilityText)}`;
      if (!haystack.includes(targets.contains)) return false;
    }
    return true;
  });
}

/**
 * Build a "not found" diagnostic that lists what selector keys we looked for
 * and a small sample of visible labels on the current screen. We cap the
 * sample at 12 so logs stay readable in CI output.
 */
function formatNotFoundMessage(
  selector: Selector,
  hierarchy: Hierarchy,
): string {
  const want = describeSelector(selector);

  const visible: string[] = [];
  for (const n of hierarchy.flattenedHierarchy) {
    if (visible.length >= 12) break;
    const label = n.text ?? n.accessibilityText ?? n.id ?? null;
    if (label && label.trim().length > 0) {
      visible.push(`"${label}"`);
    }
  }

  const haveLine =
    visible.length > 0
      ? `On screen: ${visible.join(', ')}${visible.length === 12 ? ', ...' : ''}`
      : 'On screen: (no labeled elements found in hierarchy)';
  return `Selector did not match any element. Wanted: ${want}. ${haveLine}`;
}

function describeSelector(selector: Selector): string {
  const parts: string[] = [];
  if (selector.text !== undefined) parts.push(`text="${selector.text}"`);
  if (selector.id !== undefined) parts.push(`id="${selector.id}"`);
  if (selector.accessibility !== undefined)
    parts.push(`accessibility="${selector.accessibility}"`);
  if (selector.contains !== undefined)
    parts.push(`contains="${selector.contains}"`);
  if (selector.index !== undefined && selector.index !== 0)
    parts.push(`index=${selector.index}`);
  if (selector.caseInsensitive) parts.push('caseInsensitive=true');
  return `{${parts.join(', ')}}`;
}
