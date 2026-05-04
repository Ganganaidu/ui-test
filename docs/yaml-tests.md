# YAML Tests

usb-ui-test runs tests authored in YAML files under `.usb-ui-test/tests/`.
Each file describes one scenario. Two execution modes are supported and the
mode is detected automatically from the shape of your `steps`:

- **Deterministic mode** — every step is a structured command (`tapOn:`,
  `inputText:`, `assertVisible:`, ...). Resolved against the on-device
  accessibility hierarchy by [`@usb-ui-test/local-executor`](../packages/local-executor/README.md).
  No AI provider is contacted, no screenshots leave the host. Recommended
  when you control the app and can rely on stable selectors.
- **AI mode** — every step is a plain natural-language string ("Tap the
  login button"). Interpreted at run time by an LLM (Gemini, GPT, or
  Claude). Useful when selectors are unstable or you want freer-form tests.

Mixing the two in one file is rejected at load time.

## Common test fields

| Field | Required | Description |
|---|---|---|
| `name` | yes | Stable identifier for the scenario |
| `description` | no | Short human-readable summary |
| `setup` | no | Natural-language preparation steps (always AI-mode strings) |
| `steps` | yes | Either structured commands (deterministic) or plain strings (AI) |
| `expected_state` | no | Natural-language assertions evaluated by the AI mode after `steps` |

> `setup` and `expected_state` are always strings in v1. Deterministic mode
> currently runs only the main `steps` block; build any pre-conditions into
> `setup`-style structured commands at the top of `steps` (`launchApp:`,
> `clearAppData:`) and any assertions at the bottom (`assertVisible:`).

## Deterministic mode

```yaml
name: login_smoke
description: Verify a user can log in.

steps:
  - clearAppData:
  - launchApp:
  - waitFor: "Sign in"

  - tapOn: { id: "email_field" }
  - inputText: ${secrets.email}

  - tapOn: { id: "password_field" }
  - inputText:
      value: ${secrets.password}
      clear: true

  - tapOn: "Sign in"

  - waitFor:
      selector: { id: "home_screen" }
      timeoutMs: 15000

  - assertVisible: "Welcome"
  - assertNotVisible: { id: "spinner" }
```

### v1 command vocabulary

| Command | Shorthand | Object form |
|---|---|---|
| `launchApp` | `launchApp:` / `launchApp: <appId>` | `{ appId?, clearState? }` |
| `clearAppData` | `clearAppData:` / `clearAppData: <appId>` | `{ appId? }` |
| `tapOn` | `tapOn: "<text>"` | `{ id?, text?, accessibility?, contains?, index?, caseInsensitive? }` |
| `inputText` | `inputText: "<text>"` | `{ value, into?, clear? }` |
| `swipe` | `swipe: up\|down\|left\|right` | `{ from: {x,y}, to: {x,y}, durationMs? }` |
| `assertVisible` | `assertVisible: "<text>"` | `{ id?, ... }` (selector form) |
| `assertNotVisible` | `assertNotVisible: "<text>"` | (selector form) |
| `waitFor` | `waitFor: "<text>"` | `{ selector, timeoutMs? }` |

### Selector model

A selector picks one element from the hierarchy. At least one of `text`,
`id`, `accessibility`, `contains` must be present:

```yaml
- tapOn: "Login"                        # shorthand: matches by text/label
- tapOn: { id: "login_submit" }         # by resource-id / accessibilityIdentifier
- tapOn: { accessibility: "Sign in" }   # by content-desc / iOS label
- tapOn: { contains: "Sign", caseInsensitive: true }
- tapOn: { text: "OK", index: 1 }       # second "OK" on the screen
```

When a `text` selector is used, the executor matches against either the
node's visible text *or* its accessibility label, so the same selector
works on both Android (where the text is usually in `text`) and iOS (where
it's usually in the accessibility label).

### Smart waiting

Each command that resolves a selector is wrapped in a 10-second retry loop
(configurable per `waitFor`). After every state-changing action the executor
polls the hierarchy until it stabilises (no change for 3 consecutive polls
or 5 seconds elapsed). You don't need explicit `sleep` calls.

## AI mode

```yaml
name: login_smoke
description: Verify a user can log in.

setup:
  - Clear app data.

steps:
  - Launch the app.
  - Enter ${secrets.email} on the login screen.
  - Enter ${secrets.password} on the password screen.
  - Tap the login button.

expected_state:
  - The home screen is visible.
  - The user's name appears in the header.
```

The CLI reads a screenshot + accessibility hierarchy from the device on
each iteration and asks the configured LLM what to do next. See
[environment.md](environment.md) for provider keys.

## Environment placeholders

Both modes support placeholder substitution:

- **`${secrets.*}`** — resolves from OS environment variables and workspace
  `.env` / `.env.<name>` files. Use for credentials.
- **`${variables.*}`** — resolves from non-sensitive values declared in
  `.usb-ui-test/env/*.yaml`. Use for locale, feature flags, etc.

Both must be declared in `.usb-ui-test/env/<name>.yaml`. See
[environment.md](environment.md).

## Suite manifests

Suite manifests live under `.usb-ui-test/suites/` and group tests
together. Each entry resolves under `.usb-ui-test/tests/`.

```yaml
name: auth_smoke
description: Covers the authentication smoke scenarios.
tests:
  - auth/login.yaml
  - auth/logout.yaml
```

A single suite can mix deterministic and AI test files — each file picks
its own mode independently from its step shape.

| Field | Required | Description |
|---|---|---|
| `name` | yes | Suite identifier |
| `description` | no | Short summary |
| `tests` | yes | Test file paths relative to `.usb-ui-test/tests/` |

## Running

```sh
# Single test (mode auto-detected from the file)
usb-ui-test test auth/login.yaml --platform android

# Suite — files can mix modes; AI-mode files still need --model + an API key
usb-ui-test suite auth_smoke.yaml --platform android \
    --model google/gemini-3-flash-preview
```

When every test in a run is deterministic, you don't need `--model` or any
provider API key.

See [cli-reference.md](cli-reference.md) for all flags.
