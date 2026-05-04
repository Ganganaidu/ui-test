// selector.test.ts — exercises selector resolution against a fake hierarchy.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Hierarchy, HierarchyNode } from '@usb-ui-test/common';
import { findMatches, hasMatch, resolveSelector, SelectorNotFoundError } from './selector.js';

function fakeHierarchy(nodes: Partial<HierarchyNode>[]): Hierarchy {
  // Hand-build a Hierarchy whose flattenedHierarchy is exactly `nodes`. This
  // skips the parser and lets each test focus on selector behavior.
  const flat = nodes.map(
    (n, i) =>
      new HierarchyNode({
        index: i,
        text: n.text ?? null,
        accessibilityText: n.accessibilityText ?? null,
        id: n.id ?? null,
        clazz: n.clazz ?? null,
        bounds: n.bounds ?? [0, 0, 100, 100],
      }),
  );
  return new Hierarchy(null, flat);
}

describe('selector', () => {
  it('matches by exact text', () => {
    const h = fakeHierarchy([
      { text: 'Login', id: 'login_submit' },
      { text: 'Cancel' },
    ]);
    const node = resolveSelector(h, { text: 'Login' });
    assert.equal(node.id, 'login_submit');
  });

  it('matches by id', () => {
    const h = fakeHierarchy([
      { text: 'Continue', id: 'submit' },
      { text: 'Continue', id: 'continue_alt' },
    ]);
    const node = resolveSelector(h, { id: 'submit' });
    assert.equal(node.id, 'submit');
  });

  it('matches by accessibility label', () => {
    const h = fakeHierarchy([
      { accessibilityText: 'Login button', text: null, id: 'a' },
    ]);
    const node = resolveSelector(h, { accessibility: 'Login button' });
    assert.equal(node.id, 'a');
  });

  it('matches by contains (substring)', () => {
    const h = fakeHierarchy([
      { text: 'Welcome back, Alice!', id: 'greet' },
    ]);
    const node = resolveSelector(h, { contains: 'Welcome' });
    assert.equal(node.id, 'greet');
  });

  it('honors caseInsensitive on text and contains', () => {
    const h = fakeHierarchy([{ text: 'Sign In', id: 'login' }]);
    const node = resolveSelector(h, {
      contains: 'sign in',
      caseInsensitive: true,
    });
    assert.equal(node.id, 'login');
  });

  it('disambiguates with index', () => {
    const h = fakeHierarchy([
      { text: 'OK', id: 'first' },
      { text: 'OK', id: 'second' },
    ]);
    assert.equal(resolveSelector(h, { text: 'OK', index: 0 }).id, 'first');
    assert.equal(resolveSelector(h, { text: 'OK', index: 1 }).id, 'second');
  });

  it('hasMatch returns false when nothing matches', () => {
    const h = fakeHierarchy([{ text: 'Cancel' }]);
    assert.equal(hasMatch(h, { text: 'Login' }), false);
  });

  it('throws SelectorNotFoundError with on-screen sample on miss', () => {
    const h = fakeHierarchy([{ text: 'Cancel' }, { text: 'Continue' }]);
    assert.throws(
      () => resolveSelector(h, { text: 'Login' }),
      (err: unknown) =>
        err instanceof SelectorNotFoundError &&
        /Cancel/.test(err.message) &&
        /Continue/.test(err.message),
    );
  });

  it('throws when index is out of range', () => {
    const h = fakeHierarchy([{ text: 'OK', id: 'first' }]);
    assert.throws(
      () => resolveSelector(h, { text: 'OK', index: 5 }),
      /index 5 is out of range/,
    );
  });

  it('findMatches returns nodes in flattened order', () => {
    const h = fakeHierarchy([
      { text: 'OK', id: 'a' },
      { text: 'Cancel', id: 'b' },
      { text: 'OK', id: 'c' },
    ]);
    const ids = findMatches(h, { text: 'OK' }).map((n) => n.id);
    assert.deepEqual(ids, ['a', 'c']);
  });
});
