# usb-ui-test Project Notes

## Purpose

`usb-ui-test` is a local-only, AI-driven mobile UI testing tool for:

- Android emulators
- iOS simulators
- YAML-authored test cases
- AI-assisted execution via provider APIs (OpenAI, Google Gemini, Anthropic)

The product scope is intentionally simple:

- no managed cloud execution
- no backend API
- no app-upload workflow
- no cloud device support

## Identity

- product name: `usb-ui-test`
- CLI command: `usb-ui-test`
- workspace folder: `.usb-ui-test`
- package scope: `@usb-ui-test/*`
- runtime home: `~/.usb-ui-test`
- environment variable prefix: `USB_UI_TEST_*`

Code-safe identifiers that cannot use hyphens use `usbuitest`:

- proto package: `usbuitest.driver`
- Android package/bundle prefixes such as `app.usbuitest.*`

## External APIs

The only external APIs intentionally involved are the AI provider APIs used
for test execution:

- OpenAI
- Google Gemini
- Anthropic

These are consumed by the goal executor and AI agent layer. They are part of
the core product behavior because the tool is AI-driven.

## Package Layout

The active monorepo workspaces are:

- `packages/cli` — user-facing orchestration / CLI entrypoint
- `packages/common` — shared types, utilities
- `packages/device-node` — device detection, setup, and gRPC driver client
- `packages/goal-executor` — AI planner / grounder / action loop
- `packages/local-runtime` — per-platform runtime tarball builder
- `packages/report-web` — local report UI

Native driver implementations live under:

- `drivers/android` — Android UiAutomator-based driver (Kotlin)
- `drivers/ios` — iOS XCTest-based driver (Swift)
- `proto/usbuitest/driver.proto` — shared gRPC contract

## Architecture Overview

The project flow is:

1. user writes YAML tests under `.usb-ui-test/tests`
2. CLI loads workspace config and env bindings
3. device/session setup happens locally
4. screenshots and UI hierarchy are captured from Android/iOS drivers
5. the AI planner/grounder chooses the next action
6. actions are executed on the device via local drivers and gRPC
7. artifacts and reports are written locally
8. the report UI is served locally

## Important Files

- CLI entrypoint:
  - `packages/cli/bin/usb-ui-test.ts`
- workspace resolution:
  - `packages/cli/src/workspace.ts`
- test validation/loading:
  - `packages/cli/src/checkRunner.ts`
  - `packages/cli/src/testLoader.ts`
- local run orchestration:
  - `packages/cli/src/testRunner.ts`
  - `packages/cli/src/sessionRunner.ts`
- AI execution:
  - `packages/goal-executor/src/TestExecutor.ts`
  - `packages/goal-executor/src/ai/AIAgent.ts`
- device transport:
  - `packages/device-node/src/grpc/GrpcDriverClient.ts`
  - `proto/usbuitest/driver.proto`
- local report UI:
  - `packages/report-web/src/routes/StandaloneReportApp.tsx`

## Build & Run

Install deps and build:

```sh
npm install
npm run build
```

Run the CLI in dev:

```sh
npm run dev:cli -- test smoke.yaml --platform android
```

Run the CLI test suites:

```sh
npm test
```

Build the per-platform runtime tarballs (used for the standalone binary):

```sh
npm run build:drivers
npm run build --workspace=@usb-ui-test/local-runtime
```

## Notes For Future Work

- if provider coverage should be reduced, the AI layer can be narrowed to one
  provider later
- if physical devices are desired later, that should be treated as a separate
  feature from the current emulator/simulator-first scope
