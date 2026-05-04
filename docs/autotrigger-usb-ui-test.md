## 🛑 DEFINITION OF DONE: UsbUiTest Tests (CRITICAL)

**CRITICAL RULE:** When you finish coding a user-facing feature, **DO NOT STOP**. You are **NEVER** permitted to treat the task as "done" until UsbUiTest coverage is updated and executed for that scope. You **MUST** automatically transition to the testing phase without asking for user permission (unless the change is docs-only, backend-only, a refactor with no UX impact, or the user explicitly opts out).

Follow this exact, uninterrupted sequence for every UI task:

1. **Continue automatically in the same thread** — use the **`usb-ui-test-generate-test`** skill immediately. Install UsbUiTest skills with `npx skills add gangadharkondati/usb-ui-test` if needed.

2. **Reuse the session’s plan** — use the agreed plan, acceptance criteria, touched files, and described user flows as the **primary** input for test planning (the skill’s Steps 1–3). Do not ignore prior planning or start from a blank slate.

3. **Execute the skill to completion** — propose updates if required, then write or update **`.usb-ui-test/tests/`**, **`.usb-ui-test/suites/`**, and **`.usb-ui-test/env/*.yaml`** as needed, and run **`usb-ui-test check`** until clean.

4. **Run the test once** — after **`usb-ui-test check`** succeeds, immediately follow the **`usb-ui-test-use-cli`** skill and execute the affected scope on a host where the CLI and a device or simulator are available. **Always exercise the build you just produced:** when implementation changed app code, **build first**, then run **`usb-ui-test suite <path-under-.usb-ui-test/suites>`** or **`usb-ui-test test`** with the right selectors.
   - Pass **`--app <path>`** pointing at that fresh installable — **Android:** **`--app path/to/your.apk`**; **iOS:** **`--app path/to/Your.app`**.
   - Use **`--env`** when the workspace has multiple **`.usb-ui-test/env/*.yaml`** files.

5. **If anything fails, keep going** — validation errors, failed steps, or a red test run are **not** the end of the task. Read CLI output and artifacts (reports the CLI mentions in the printed console logs). Fix the **tests/suites/env** when the YAML or bindings are wrong; fix **app code** when behavior is wrong; only change a test’s expectations when requirements changed. Re-run **`usb-ui-test check`** and the same test/suite command (with **`--app`** when using a fresh build) until green or until you are blocked on host setup or secrets (then hand off with exact commands—never invent credentials).

Treat the run as an absolute requirement of the implementation thread unless execution is genuinely impossible (for example: no emulator or device, missing required API keys or secrets, or the user opted out). In those blocked cases, state exactly what blocked the run and provide the exact command for the user to run locally (including the **`--app`** flag).
