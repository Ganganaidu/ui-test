# CLI Reference

The `usb-ui-test` CLI is the main interface for validating workspaces, running tests, and inspecting reports.

## Getting Started

| Command | Description |
|---|---|
| `usb-ui-test check` | Validates the `.usb-ui-test` workspace, environment bindings, selectors, and suite manifests. Uses `env` from `.usb-ui-test/config.yaml` when `--env` is omitted. |
| `usb-ui-test doctor` | Checks host readiness for local Android and iOS runs. Supports `--platform` to check one platform. |

## Running Tests

| Command | Description |
|---|---|
| `usb-ui-test test <selectors...>` | Executes one or more YAML specs from `.usb-ui-test/tests`. |
| `usb-ui-test suite <suitePath>` | Executes a suite manifest from `.usb-ui-test/suites`. |

### Common Flags

Flags for `test` and `suite`:

| Flag | Description |
|---|---|
| `--platform <android\|ios>` | Target platform |
| `--model <provider/model>` | AI model (e.g. `google/gemini-3-flash-preview`). Falls back to `.usb-ui-test/config.yaml`. |
| `--env <name>` | Environment name (matches `.usb-ui-test/env/<name>.yaml`). Falls back to config. |
| `--app <path>` | Path to `.apk` or `.app` binary. Overrides the app identity in config. See [configuration.md](configuration.md) for details. |
| `--api-key <key>` | Override the provider API key. Only valid when a single provider is in use across all features; use env vars when features target multiple providers. |
| `--debug` | Enable debug logging. |
| `--max-iterations <n>` | Limit AI action iterations per step. |

CLI flags always take precedence over `.usb-ui-test/config.yaml`.

For workspace-level `model`, `reasoning`, and per-feature `features:` overrides (including mixed-provider setups), see [configuration.md](configuration.md#supported-configurations).

### Examples

```sh
# Run a single test
usb-ui-test test smoke.yaml --platform android --model google/gemini-3-flash-preview

# Run with a specific app binary
usb-ui-test test smoke.yaml --platform android --app path/to/your.apk

# Run a suite
usb-ui-test suite auth_smoke.yaml --platform ios --model anthropic/claude-sonnet-4-6

# Validate before running
usb-ui-test check --env dev --platform android
```

## Report Commands

| Command | Description |
|---|---|
| `usb-ui-test runs` | Lists local reports from `~/.usb-ui-test/workspaces/<workspace-hash>/artifacts`. |
| `usb-ui-test start-server` | Starts or reuses the local report UI for a workspace. |
| `usb-ui-test server-status` | Shows the current local report server status. |
| `usb-ui-test stop-server` | Stops the local report server. |

All report commands support `--workspace <path>` to target a specific workspace.

## Help

```sh
usb-ui-test --help
usb-ui-test <command> --help
```
