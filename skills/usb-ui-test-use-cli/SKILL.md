---
name: usb-ui-test-use-cli
description: Use the published UsbUiTest CLI to install, configure, validate, run, troubleshoot, and inspect reports for repo-local mobile test workspaces. Trigger this skill for requests involving usb-ui-test, check, test, suite, doctor, runs, start-server.
---

# UsbUiTest CLI Guide and Operator

You help repo users safely use the published `usb-ui-test` CLI inside repositories that contain `.usb-ui-test/`. Default to published CLI usage in app repositories, not monorepo contributor workflows, unless the user explicitly asks for contributor setup.

## Prerequisites

Install the published package and confirm the CLI is available:

```sh
npm install -g @usb-ui-test/cli
usb-ui-test --help
```

For local Android or iOS execution, use `usb-ui-test doctor` as the first host-readiness diagnostic.

```sh
usb-ui-test doctor
```

## Source of Truth

- Prefer local CLI help such as `usb-ui-test --help`, `usb-ui-test test --help`, and `usb-ui-test suite --help`.
- Inspect the actual workspace files under `.usb-ui-test/` before giving execution advice.
- Check `.usb-ui-test/config.yaml`, `.usb-ui-test/env/`, `.usb-ui-test/tests/`, and `.usb-ui-test/suites/` before asking questions that the repo can answer.
- Do not invent unsupported commands such as `usb-ui-test init`.

## Core Workflow

1. Inspect the workspace and confirm `usb-ui-test` is available on `PATH` when command execution matters.
2. Validate first with `usb-ui-test check` so selectors, suites, config, env bindings, and app overrides are verified before the user relies on a run result.
3. Explain the exact `usb-ui-test test` or `usb-ui-test suite` command you intend to use, including the selected `--env`, `--platform`, and `--model` when relevant.
4. Treat validation failures as blockers. Explain the CLI error in plain language and do not pretend the test run happened.
5. Use `usb-ui-test runs` to inspect recent run artifacts after validation or execution.
6. Ask before starting `usb-ui-test start-server`, because those commands launch background UI behavior.
7. If the user wants to create or edit YAML tests, suites, or env bindings, route that work to `usb-ui-test-generate-test`.

## Missing Workspace

If `.usb-ui-test/` is missing:

- explain that UsbUiTest must run from a repository containing `.usb-ui-test/`
- clarify that only `.usb-ui-test/tests` is always required; `suites/` is only required for suite-based workflows
- show the expected structure
- offer a scaffold plan or route the user to `usb-ui-test-generate-test`
- do not claim that the CLI can bootstrap the workspace automatically

Expected structure:

```text
.usb-ui-test/
  tests/      # required
  suites/     # optional unless using `usb-ui-test suite` or `--suite`
  env/        # optional
  config.yaml # optional
```

## Validation and Error Handling

- `usb-ui-test check` is the default validation command.
- Validation is mandatory before the user should trust a test run result.
- `usb-ui-test test` and `usb-ui-test suite` are validation-gated. The CLI validates selectors, suites, config, env bindings, and app overrides before execution starts.
- If `usb-ui-test test` or `usb-ui-test suite` fails during validation, report the CLI error directly in plain language, explain what it means, and stop short of describing the run as executed.
- Diagnose selector, suite, config, env, and binding problems from CLI output first. Do not guess.

Secret and credential errors require explicit user action:

- If `.usb-ui-test/env/<env>.yaml` is missing, malformed, or missing referenced bindings, explain the exact file or binding problem and tell the user to fix the env file or choose the correct `--env`.
- If a secret placeholder is malformed, explain that UsbUiTest requires the exact `${ENV_VAR}` form.
- If a secret references a missing shell environment variable, state the missing variable name and tell the user they must export or set it before validation or execution can succeed.
- If a spec references an unknown `${secrets.*}` or `${variables.*}` binding, point to the unresolved binding name and tell the user the env file must declare it.
- If the provider API key is missing, report the exact required variable for the active model (`OPENAI_API_KEY`, `GOOGLE_API_KEY`, or `ANTHROPIC_API_KEY`). When no default model is configured, recommend a repeat-use setup: add `.usb-ui-test/config.yaml` with `model: google/gemini-3-flash-preview`, add `export GOOGLE_API_KEY=<your-key>` to `~/.zshrc`, reload the shell with `source ~/.zshrc`, and rerun. Mention `--api-key` only if the user asks for a one-off run.
- Never invent, infer, write, or silently substitute secret values.

## Safety Policy

Safe to run without extra approval when the user asks:

- `usb-ui-test check`
- `usb-ui-test doctor`
- `usb-ui-test runs`

Ask before executing:

- `usb-ui-test test`
- `usb-ui-test suite`
- `usb-ui-test start-server`

Why ask first:

- test execution can take time and may consume provider credits
- server commands can start background processes and open the browser

## Post-Execution

After `usb-ui-test test` or `usb-ui-test suite` completes, the CLI prints a structured summary. The agent's response depends on the outcome.

### On success

The CLI prints a short confirmation with the artifact directory and report URL. The agent should:

- Confirm success in plain language.
- Include the report URL so the user can review the run.
- Stop. Do not suggest follow-up runs, suite escalation, or additional checks.

### On failure

The CLI prints a failure summary listing each failed test with paths to its artifacts. The agent should:

1. Read the failure output and identify which tests failed and why.
2. For each failed test, read the artifact files the CLI listed to build context for the user:
   - `result.json` — the test outcome, failure message, and step-level results.
   - `actions/` — individual agent action files (JSON) showing what the agent tried at each step, including its reasoning, the action it took, and whether it succeeded.
   - `screenshots/` — per-step screenshots showing the device screen at each action.
   - `recording.mp4` or `recording.mov` — screen recording of the full test (if available).
   - `device.log` — device-level logs (logcat on Android, `log stream` on iOS) captured during the test (if available).
   - `runner.log` — the CLI's own log for the entire run (at the run directory root).
3. Summarize the failure in plain language: what the test was trying to do, where it failed, and what the device screen showed at that point.
4. Suggest concrete next steps: whether the test spec needs updating, whether the app has a bug, or whether the environment was misconfigured.

**Do not ask the user to go find artifact files.** The CLI prints the full paths — read them directly and present the findings.

## Command Reference

### Validation

- `usb-ui-test check [selectors...]`
  - validates the `.usb-ui-test` workspace, selectors, suite manifests, env bindings, and app overrides
  - supports `--env`, `--platform`, `--app`, and `--suite`
  - uses `.usb-ui-test/config.yaml` `env` when `--env` is omitted

### Execution

- `usb-ui-test test [selectors...]`
  - runs one or more specs from `.usb-ui-test/tests`
  - supports `--env`, `--platform`, `--app`, `--suite`, `--api-key`, `--model`, `--debug`, and `--max-iterations`
  - uses `.usb-ui-test/config.yaml` `env` and `model` when those flags are omitted
  - validates before execution starts
- `usb-ui-test suite <suitePath>`
  - runs one suite manifest from `.usb-ui-test/suites`
  - supports `--env`, `--platform`, `--app`, `--api-key`, `--model`, `--debug`, and `--max-iterations`
  - uses `.usb-ui-test/config.yaml` `env` and `model` when those flags are omitted
  - validates before execution starts

### Diagnostics

- `usb-ui-test doctor`
  - checks local Android and iOS host readiness
  - supports `--platform`

### Reports

- `usb-ui-test runs`
  - lists local run artifacts for the current workspace
  - supports `--json`
- `usb-ui-test start-server`
  - starts or reuses the local report UI for the current workspace
  - supports `--port` and `--dev`

Explicit CLI flags override `.usb-ui-test/config.yaml` defaults.

## Common CLI Flags

- `--env <name>`
  - used by `check`, `test`, and `suite`
  - selects `.usb-ui-test/env/<name>.yaml`
- `--platform <android|ios>`
  - used by `check`, `test`, `suite`, and `doctor`
  - required when platform cannot be inferred from context or app override
- `--app <path>`
  - used by `check`, `test`, and `suite`
  - `.apk` implies Android and `.app` implies iOS
- `--model <provider/model>`
  - used by `test` and `suite`
  - required unless `.usb-ui-test/config.yaml` already defines `model`
- `--api-key <key>`
  - used by `test` and `suite`
  - overrides provider-specific environment variables
- `--debug`
  - used by `test` and `suite`
  - enables debug logging
- `--max-iterations <n>`
  - used by `test` and `suite`
  - caps execution iterations before the run aborts
- `--suite <path>`
  - used by `check` and `test`
  - on `test`, remains a compatibility path; prefer `usb-ui-test suite <path>`
- `--port <n>`
  - used by `start-server`
- `--dev`
  - used by `start-server`
  - runs the report UI in development mode

## Supported Providers and Models

- Supported providers are `openai`, `google`, and `anthropic`.
- Use `openai/...` models from the GPT-5 family and above.
- Use `google/...` models from the Gemini 3 family and above.
- Use `anthropic/...` models from the Claude Sonnet 4 / Opus 4 families and above.
- Verify the exact `provider/model` value with `usb-ui-test test --help` before using sample run commands.

## Common Workflows

Validate an existing workspace:

```sh
usb-ui-test check --env dev
```

Run one spec after validation:

```sh
usb-ui-test check auth/login.yaml --env dev --platform android
usb-ui-test test auth/login.yaml --env dev --platform android --model google/gemini-3-flash-preview
```

Run one suite after validation:

```sh
usb-ui-test check --suite smoke.yaml --env dev --platform ios
usb-ui-test suite smoke.yaml --env dev --platform ios --model anthropic/claude-3-7-sonnet
```

Inspect recent runs:

```sh
usb-ui-test runs
```

Open the report UI:

```sh
usb-ui-test start-server
```

Discover current command and model help:

```sh
usb-ui-test --help
usb-ui-test test --help
usb-ui-test suite --help
```

## Troubleshooting

Diagnose from the actual CLI output first. Do not guess.

- Missing `.usb-ui-test/`
  - explain that UsbUiTest must run from a repository containing `.usb-ui-test/`
- Missing `.usb-ui-test/tests/`
  - explain that this directory is required by the CLI
- Missing or ambiguous env files
  - verify whether `.usb-ui-test/env/` exists
  - if multiple env files exist and the selection is ambiguous, tell the user to choose `--env <name>` explicitly
- Unknown env bindings
  - explain which `${variables.*}` or `${secrets.*}` bindings are unresolved
  - tell the user the env file must declare them
- Malformed or missing secrets
  - malformed placeholders must use the exact `${ENV_VAR}` form
  - missing shell environment variables must be exported by the user before validation or execution
  - do not write or infer secret values
- Missing provider API keys
  - `openai/...` uses `OPENAI_API_KEY`
  - `google/...` uses `GOOGLE_API_KEY`
  - `anthropic/...` uses `ANTHROPIC_API_KEY`
  - recommend `.usb-ui-test/config.yaml` with `model: google/gemini-3-flash-preview` when no default model is configured
  - recommend `export GOOGLE_API_KEY=<your-key>` in `~/.zshrc` for the default setup path
  - tell the user to reload the shell with `source ~/.zshrc` and rerun
  - mention `--api-key` only if they want a one-off run
- Invalid `.usb-ui-test/config.yaml`
  - point to the YAML or config error directly
- Selector and suite resolution failures
  - `usb-ui-test test auth/login.yaml` resolves from `.usb-ui-test/tests/auth/login.yaml`
  - `usb-ui-test suite smoke.yaml` resolves from `.usb-ui-test/suites/smoke.yaml`
  - explicit `.usb-ui-test/tests/...` and `.usb-ui-test/suites/...` paths still work
- App override and platform mismatch
  - `.apk` overrides require Android
  - `.app` overrides require iOS
  - tell the user to fix the path or `--platform` mismatch instead of ignoring it
- Host readiness issues
  - use `usb-ui-test doctor` as the default local environment diagnostic

## Coordination with `usb-ui-test-generate-test`

This skill is for CLI usage, validation, execution, reporting, and troubleshooting.

If the user asks to:

- create a new YAML test
- update a suite manifest
- add or change `.usb-ui-test/env/*.yaml` bindings
- plan a new test flow

route that work to `usb-ui-test-generate-test`.

This skill may explain where the CLI expects those files and how selectors resolve, but it should not duplicate the YAML authoring workflow.
