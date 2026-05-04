# @usb-ui-test/local-executor

Deterministic, fully-local YAML test executor. Runs structured commands
(`tapOn`, `inputText`, `swipe`, `assertVisible`, `waitFor`, ...) against the
on-device accessibility hierarchy that the existing Android/iOS drivers
already expose.

No AI providers, no outbound network, no cloud — every decision is made
locally from the AX tree. Designed for security-sensitive contexts (banking,
healthcare, internal tooling) where screen contents must not leave the host.

## v1 command vocabulary

| Command | Shape | Notes |
|---|---|---|
| `launchApp` | `launchApp:` / `launchApp: <appId>` / `launchApp: { appId?, clearState? }` | Defaults to the workspace-config app. |
| `clearAppData` | `clearAppData:` / `clearAppData: <appId>` | Same engine as `launchApp { clearState: true }`. |
| `tapOn` | `tapOn: "<text>"` / `tapOn: { id?, text?, accessibility?, contains?, index?, caseInsensitive? }` | Resolves a selector against the hierarchy and taps the matching node's center. |
| `inputText` | `inputText: "<text>"` / `inputText: { value, into?, clear? }` | `into:` taps that element first to focus it. |
| `swipe` | `swipe: up\|down\|left\|right` / `swipe: { from: {x,y}, to: {x,y}, durationMs? }` | Direction shorthand uses 30 % of screen size. |
| `assertVisible` | `assertVisible: "<text>"` / `assertVisible: { ... }` | Polls the tree until the selector matches or times out. |
| `assertNotVisible` | `assertNotVisible: ...` | Polls until the selector is gone. |
| `waitFor` | `waitFor: "<text>"` / `waitFor: { selector, timeoutMs? }` | Same as `assertVisible` with a custom budget. |

## Selector model

A selector is a mapping with at least one of: `text`, `id`, `accessibility`,
`contains`. Optional fields are `index` (when multiple nodes match) and
`caseInsensitive`. The shorthand string `"Login"` is sugar for
`{ text: "Login" }`.

Match precedence within a node:

* `text` matches the node's `text` _or_ `accessibilityText`
* `id` matches the resource id (Android) / accessibility identifier (iOS)
* `accessibility` matches the content-description / label
* `contains` substring-matches against text + accessibility combined

## Mode auto-detection

A YAML test file is in **deterministic mode** when every step is a structured
command (a YAML mapping with one recognized key). It's in **AI mode** when
every step is a plain string. Mixing the two in one file is rejected at load
time.

## Module layout

```
src/
  types.ts                     // StructuredStep + Selector type union
  parser.ts                    // detectMode(), parseStructuredSteps()
  selector.ts                  // resolveSelector(), findMatches()
  waiter.ts                    // waitUntilStable(), retryUntil()
  DeterministicExecutor.ts     // the main loop + per-command dispatch
```

## Build / Test

```sh
npm run build --workspace=@usb-ui-test/local-executor
npm test --workspace=@usb-ui-test/local-executor
```

The unit tests (`parser.test.ts`, `selector.test.ts`) mock the hierarchy and
do not require a real device.
