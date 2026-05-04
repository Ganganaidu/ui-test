// parser.test.ts — node:test specs for mode detection + step parsing.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { detectMode, parseStructuredSteps } from './parser.js';

describe('detectMode', () => {
  it('flags all-string steps as ai mode', () => {
    assert.equal(detectMode(['Tap login', 'Type my email']), 'ai');
  });

  it('flags all-structured steps as deterministic', () => {
    assert.equal(
      detectMode([{ tapOn: 'Login' }, { inputText: 'foo' }]),
      'deterministic',
    );
  });

  it('treats empty list as ai (so existing tests keep working)', () => {
    assert.equal(detectMode([]), 'ai');
  });

  it('throws on mixed string + structured input', () => {
    assert.throws(
      () => detectMode(['tap login', { tapOn: 'Login' }]),
      /mix natural-language strings and structured commands/,
    );
  });

  it('rejects entries that are neither strings nor recognized commands', () => {
    assert.throws(
      () => detectMode([42 as unknown]),
      /step\[0\] is neither a structured command/,
    );
  });
});

describe('parseStructuredSteps', () => {
  it('parses tapOn with shorthand string selector', () => {
    const out = parseStructuredSteps([{ tapOn: 'Login' }]);
    assert.deepEqual(out, [{ kind: 'tapOn', selector: { text: 'Login' } }]);
  });

  it('parses tapOn with explicit selector mapping', () => {
    const out = parseStructuredSteps([
      { tapOn: { id: 'login_submit', caseInsensitive: true } },
    ]);
    assert.deepEqual(out, [
      {
        kind: 'tapOn',
        selector: { id: 'login_submit', caseInsensitive: true },
      },
    ]);
  });

  it('rejects tapOn selector with no fields', () => {
    assert.throws(
      () => parseStructuredSteps([{ tapOn: {} }]),
      /requires at least one of/,
    );
  });

  it('parses inputText shorthand and full form', () => {
    assert.deepEqual(
      parseStructuredSteps([{ inputText: 'qa@example.com' }]),
      [{ kind: 'inputText', value: 'qa@example.com' }],
    );
    assert.deepEqual(
      parseStructuredSteps([
        { inputText: { value: 'pw', into: { id: 'pw' }, clear: true } },
      ]),
      [
        {
          kind: 'inputText',
          value: 'pw',
          into: { id: 'pw' },
          clear: true,
        },
      ],
    );
  });

  it('parses swipe by direction and by coordinates', () => {
    assert.deepEqual(parseStructuredSteps([{ swipe: 'up' }]), [
      { kind: 'swipe', direction: 'up' },
    ]);
    assert.deepEqual(
      parseStructuredSteps([
        { swipe: { from: { x: 100, y: 800 }, to: { x: 100, y: 200 } } },
      ]),
      [
        {
          kind: 'swipe',
          from: { x: 100, y: 800 },
          to: { x: 100, y: 200 },
        },
      ],
    );
  });

  it('parses launchApp empty / string / object', () => {
    assert.deepEqual(parseStructuredSteps([{ launchApp: null }]), [
      { kind: 'launchApp' },
    ]);
    assert.deepEqual(
      parseStructuredSteps([{ launchApp: 'com.bank.app' }]),
      [{ kind: 'launchApp', appId: 'com.bank.app' }],
    );
    assert.deepEqual(
      parseStructuredSteps([{ launchApp: { clearState: true } }]),
      [{ kind: 'launchApp', clearState: true }],
    );
  });

  it('parses waitFor with timeout', () => {
    assert.deepEqual(
      parseStructuredSteps([
        { waitFor: { selector: { text: 'Welcome' }, timeoutMs: 30000 } },
      ]),
      [
        {
          kind: 'waitFor',
          selector: { text: 'Welcome' },
          timeoutMs: 30000,
        },
      ],
    );
  });

  it('parses assertVisible / assertNotVisible', () => {
    assert.deepEqual(
      parseStructuredSteps([
        { assertVisible: 'Home' },
        { assertNotVisible: { id: 'spinner' } },
      ]),
      [
        { kind: 'assertVisible', selector: { text: 'Home' } },
        { kind: 'assertNotVisible', selector: { id: 'spinner' } },
      ],
    );
  });

  it('reports the index of the failing step', () => {
    assert.throws(
      () => parseStructuredSteps([{ tapOn: 'OK' }, { tapOn: 42 }]),
      /step\[1\]/,
    );
  });
});
