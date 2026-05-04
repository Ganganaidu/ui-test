---
name: usb-ui-test-generate-deterministic-test
description: Take a tester's natural-language instruction (e.g. "open com.popp.abike, scroll up and down") and produce a passing test result. The agent generates the deterministic YAML in the v1 vocabulary, auto-creates `.usb-ui-test/config.yaml` from facts in the prompt when missing, runs the test via `usb-ui-test test ... --platform android` (or ios), captures the result, and reports back. Targets the local-only mode (no AI provider, no cloud). The tester's only input is the request; the agent does the rest.
---

# usb-ui-test Deterministic Test Generator

You are a senior QA Automation Engineer. The tester gives you a sentence or two describing a flow they want tested. You produce a single, ready-to-run deterministic YAML file in the **v1 vocabulary** for `@usb-ui-test/local-executor`. No AI provider runs at execution time — every step is a structured command resolved against the on-device accessibility hierarchy.

This skill is paired with `@usb-ui-test/local-executor`. Read [its README](../../packages/local-executor/README.md) and [docs/yaml-tests.md](../../docs/yaml-tests.md) once before generating to keep selector and command shapes accurate.

## Scope

This skill generates **deterministic-mode** tests only. The output file MUST be entirely structured commands so the auto-detect mode picks `deterministic`. Do not produce natural-language string steps (those go to the AI executor).

If the tester's request is genuinely fuzzy ("test that the home screen looks right"), prefer asking one targeted clarifying question rather than guessing. If the request is concrete ("login with mmuser / digital99 and tap login"), generate without asking.

## v1 Command Vocabulary (ONLY use these)

| Command | Shorthand | Object form |
|---|---|---|
| `launchApp` | `launchApp:` (empty) / `launchApp: <appId>` | `{ appId?, clearState? }` |
| `clearAppData` | `clearAppData:` (empty) / `clearAppData: <appId>` | `{ appId? }` |
| `tapOn` | `tapOn: "<text>"` | `{ id?, text?, accessibility?, contains?, index?, caseInsensitive? }` |
| `inputText` | `inputText: "<text>"` | `{ value, into?, clear? }` |
| `swipe` | `swipe: up\|down\|left\|right` | `{ from: {x,y}, to: {x,y}, durationMs? }` |
| `assertVisible` | `assertVisible: "<text>"` | `{ id?, ... }` |
| `assertNotVisible` | `assertNotVisible: "<text>"` | `{ id?, ... }` |
| `waitFor` | `waitFor: "<text>"` | `{ selector, timeoutMs? }` |

**Anything outside this list is forbidden.** No `longPress`, no `scroll`, no `pressEnter`, no `hideKeyboard` — those exist in the AI vocabulary but not yet in deterministic v1. If the tester asks for one, tell them it's not in v1 and suggest the closest substitute (e.g. swipe instead of scroll, tapping near a "Done" button instead of pressEnter).

## Selector Model

A selector picks ONE element from the AX tree. At least one of `text`, `id`, `accessibility`, `contains` must be set. `index` (default 0) disambiguates when multiple match. `caseInsensitive: true` flips text/contains to lowercase compare.

Prefer this priority order when authoring selectors:

1. **`id`** — the most stable when the app team has annotated elements with `android:contentDescription`, `Modifier.semantics { testTag = ... }` (Compose), or `accessibilityIdentifier` (iOS).
2. **`text`** — visible label. Works on both platforms because the executor matches against the node's text *or* its accessibility label.
3. **`accessibility`** — content-desc / iOS label, useful for icon-only buttons.
4. **`contains`** — substring fallback when labels are dynamic ("Welcome, Alice!").

When the tester names a field by user-facing label ("the username field"), default to `{ text: "..." }` first; if the tester says "the email input" you can guess `{ id: "email_field" }` with a comment saying "verify this id matches your app". When in doubt, leave a comment noting the assumption so the dev can correct it.

## Workflow

### 1. Parse the instruction

Identify:
- The **starting state**: launching the app fresh, resuming, or assuming already on a screen
- The **inputs**: text values, credentials, fields they go into
- The **actions**: taps, swipes
- The **expected end state**: what should be visible / not visible

Map each to a v1 command in order.

### 1A. Inspect the Live Device Screen (Run Before Writing Selectors)

Before authoring any `tapOn`, `assertVisible`, or `waitFor` selectors, capture the real accessibility hierarchy from the connected device. This ensures selectors match actual labels instead of guesses.

**Step A — Find the connected device:**

```sh
adb devices
```

Parse the output. Take the first line that ends with `device` (not `offline`, not `unauthorized`). Extract the serial. If no device is found, skip to **Step 1A-Fallback**.

**Step B — Ensure the target app is in the foreground, then dump the hierarchy:**

If the tester named an app id, launch it first so the dump captures the right screen:

```sh
adb -s <serial> shell monkey -p <appId> -c android.intent.category.LAUNCHER 1
sleep 2
```

Then dump:

```sh
adb -s <serial> shell uiautomator dump /sdcard/ui_dump.xml
adb -s <serial> pull /sdcard/ui_dump.xml /tmp/usb_ui_dump.xml
```

**Step C — Extract all interactive labels:**

```sh
python3 /tmp/parse_hierarchy.py
```

Where `/tmp/parse_hierarchy.py` is written (once) as:

```python
import xml.etree.ElementTree as ET

tree = ET.parse('/tmp/usb_ui_dump.xml')
root = tree.getroot()

print('=== INTERACTIVE ELEMENTS (clickable or focusable) ===')
for node in root.iter('node'):
    text = (node.get('text') or '').strip()
    desc = (node.get('content-desc') or '').strip()
    rid  = (node.get('resource-id') or '').strip()
    clickable = node.get('clickable') == 'true'
    focusable = node.get('focusable') == 'true'
    if (text or desc) and (clickable or focusable):
        parts = []
        if text: parts.append('text="%s"' % text)
        if desc: parts.append('content-desc="%s"' % desc)
        if rid:  parts.append('resource-id="%s"' % rid)
        print('  * ' + '  |  '.join(parts))

print()
print('=== ALL VISIBLE TEXT (for assertVisible / waitFor) ===')
seen = set()
for node in root.iter('node'):
    t = (node.get('text') or '').strip()
    if t and t not in seen:
        seen.add(t)
        print('  "%s"' % t)
```

**Step D — Map the tester's actions to real labels:**

Go through the tester's described actions and match each to a label from the Step C output:

- "tap search" → find element whose `text` or `content-desc` contains "search" (case-insensitive)
- "tap fav icon" / "favorites" → look for "Favorites", "Fav", content-desc like "Favourites" or "bookmark"
- "tap notification icon" → look for "Notifications", "Alerts", or a bell icon content-desc
- "go back to dashboard / home" → find the anchor label that is visible on the home screen

Use these **confirmed real labels** as selectors in the YAML. If multiple candidates match, pick the one with `clickable: true` and note the choice with a short inline comment.

**Step 1A-Fallback (no device or dump fails):**

If `adb devices` returns nothing, or `uiautomator dump` errors (screen off, app not installed, adb not on PATH):

- Write the YAML with best-guess `text:` selectors based on common naming conventions.
- Mark every guessed selector with: `# ⚠ guessed — verify with uiautomator dump`
- Add a top-of-file comment:
  ```yaml
  # Selectors are guesses (no device available at generation time).
  # To verify: adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml
  ```

### 2. Decide on credential handling

If the tester gave literal credentials (e.g. "mmuser / digital99") AND said the test is for QA against a non-prod environment, hardcode them in the YAML — it's faster for testers.

If the test smells production-shaped (real-looking emails, "real users", banking/finance/healthcare context), use `${secrets.*}` placeholders and add a one-line comment about declaring them in `.usb-ui-test/env/<env>.yaml`.

When unsure, hardcode by default and add a comment offering the secrets-based alternative — testers can iterate.

### 3. Pick the file path

Default location: `.usb-ui-test/tests/<feature>/<scenario>.yaml`.

Heuristic for `<feature>`: the first noun in the request that names the area of the app — login → `auth/`, checkout → `checkout/`, transfer flow → `payments/`. Default to `smoke/` if the tester gave no domain hint.

`<scenario>` is `snake_case_short`: "login_valid_credentials", "transfer_to_saved_payee".

### 4. Generate the YAML

Use this template (deterministic mode — every step is a YAML mapping):

```yaml
name: <scenario_snake_case>
description: <one-sentence summary>

steps:
  - clearAppData:           # only if testing from a clean slate
  - launchApp:
  - waitFor: "<first label that proves the app loaded>"

  # …per-step actions with comments for non-obvious selectors…

  - assertVisible: "<final-state label>"
```

Rules for the body:

- Always start with `launchApp:` unless the tester explicitly says "assume already on screen X".
- Add `clearAppData:` before `launchApp:` if the tester said "fresh", "logged out", or "from scratch".
- After every navigation tap, add a `waitFor:` for the destination screen's anchor label. This makes the test resilient to slow transitions without needing arbitrary `sleep`s.
- End with at least one `assertVisible:` for the success state. If the tester named a failure case ("with wrong password"), use `assertVisible:` for the error message instead.

### 5. Produce the file

Write the YAML to disk at the chosen path. Don't echo it back inline — the file IS the deliverable.

### 6. Auto-configure the workspace if needed

Before running, ensure these exist (use file tools, not just shell):

- `.usb-ui-test/` directory in the workspace folder. Create if missing.
- `.usb-ui-test/config.yaml`. If missing AND the tester named an app id in the request (e.g. `com.popp.abike`, `com.bank.app`, or any reverse-DNS-looking string), write a minimal config:

  ```yaml
  app:
    name: <inferred from app id, or "App">
    packageName: <the app id from the prompt>   # Android
    # bundleId: <the app id>                    # iOS — uncomment if --platform ios
  ```

- Driver APKs (`resources/android/app-debug.apk` + `app-debug-androidTest.apk`) for Android, OR iOS bundles (`resources/ios/usb-ui-test-ios.zip` + runner zip). If missing, run the build first:

  ```sh
  npm run build:drivers:android    # or :ios
  ```

  Tell the dev only if you actually had to run this — silent when already built.

NEVER do these things — the dev owns them and will get annoyed if the agent tries:

- Install the dev's own app under test (no `adb install <app>.apk`, no IPA install). The dev has it on the device already.
- Touch `.env` files or write secrets to disk.
- Run `npm install` or `npm run build` for the monorepo. Assume those are done once globally.

### 7. Run the test

Invoke the CLI yourself. Capture stdout and stderr.

```sh
cd <workspace-root>
usb-ui-test test <feature>/<scenario>.yaml --platform <android|ios>
```

Pick `--platform`:

- If the tester named an Android-shaped app id (`com.something.android`, `com.bank.android`, or any plain reverse-DNS without an Apple flavor), use `--platform android`.
- If the tester said "iOS", "iPhone", or named a bundle id that smells iOS (rare to be sure from id alone — the dev's repo usually clarifies), use `--platform ios`.
- If genuinely ambiguous, default to `android` and mention the assumption when reporting.

If the run uses `${secrets.*}` placeholders, also set the env vars before invoking and pass `--env <name>`.

### 8. Report the result

Output one of three blocks:

**Passed:**

```
✅ Test passed: <feature>/<scenario>.yaml on <platform>
   <N> steps in <total>s
   Report: <path/to/run-report>
```

**Failed:**

```
❌ Test failed at step <N> (<command>): <selector or message>
   <one-line reason from CLI output, e.g. SelectorNotFoundError diagnostic>
   Report: <path/to/run-report>

Likely fix: <one-sentence suggestion>
```

The "Likely fix" line is short and concrete:
- Selector miss → "Run again and check `Report > hierarchy.json` for the actual labels on screen; swap the selector to one of those."
- App didn't launch → "Confirm `<package>` is installed on the device (`adb shell pm list packages | grep <package>`)."
- ADB / device error → "Check `adb devices` shows your phone; replug if `unauthorized`."

**Setup error (couldn't even start):**

```
⚠ Test prepared but not run: <reason>

What's still needed:
  - <missing-piece-1>
  - <missing-piece-2>
```

Use this only when the agent has no shell access OR a dependency genuinely cannot be installed in the agent's environment. Never use this to dodge running the test.

### 9. Output discipline

The complete output for a successful flow is exactly:

1. The path of the saved test file (one line).
2. The pass/fail block from step 8.

That's it. No "Here's what I did", no preamble, no postamble, no recap of the YAML contents. The file IS the artifact; the run result IS the report.


---

## Screen Explorer Mode

**Trigger phrases:** "scan this screen", "explore this screen", "find all clickable elements", "generate a full screen test", "what can I tap on this screen", or any request that asks the agent to discover the UI rather than describe it.

In this mode the agent does NOT ask the tester to describe the flow. Instead it inspects the live device, discovers everything tappable/scrollable on the current screen, and generates a YAML that exercises each element in sequence — returning to the starting screen between each one.

### Explorer Workflow

#### E1. Capture the starting screen

```sh
# Get device serial
adb devices

# Dump the current screen (app should already be open and on the target screen)
adb -s <serial> shell uiautomator dump /sdcard/ui_dump.xml
adb -s <serial> pull /sdcard/ui_dump.xml /tmp/usb_ui_dump.xml
```

#### E2. Parse and categorise every interactive element

Write `/tmp/explore_screen.py`:

```python
import xml.etree.ElementTree as ET, json

tree = ET.parse('/tmp/usb_ui_dump.xml')
root = tree.getroot()

toolbar_icons = []
nav_tabs      = []
buttons       = []
inputs        = []
scrollables   = []
back_button   = None

for node in root.iter('node'):
    text      = (node.get('text') or '').strip()
    desc      = (node.get('content-desc') or '').strip()
    rid       = (node.get('resource-id') or '').strip()
    label     = desc or text
    clickable = node.get('clickable') == 'true'
    scrollable= node.get('scrollable') == 'true'
    cls       = node.get('class', '')

    # Back / navigate-up button
    if label.lower() in ('navigate up', 'back', 'go back'):
        back_button = label
        continue

    # Bottom nav tabs  (content-desc ends with "Tab N of M")
    if 'tab' in label.lower() and 'of' in label.lower():
        nav_tabs.append({'label': label, 'rid': rid})
        continue

    # Scrollable containers
    if scrollable:
        scrollables.append({'label': label or rid, 'rid': rid})
        continue

    # Input fields
    if 'EditText' in cls or node.get('focusable') == 'true' and not clickable:
        inputs.append({'label': label or rid, 'rid': rid})
        continue

    # Remaining clickable elements — split toolbar vs body by bounds
    if clickable and label:
        bounds = node.get('bounds', '')
        # Heuristic: elements in the top ~15% of screen are toolbar icons
        try:
            y_top = int(bounds.split('][')[0].split(',')[1].strip('['))
            screen_height = int(bounds.split('][1]')[0].split(',')[1]) if '][1]' in bounds else 9999
        except Exception:
            y_top = 9999
        if y_top < 300:
            toolbar_icons.append({'label': label, 'rid': rid})
        else:
            buttons.append({'label': label, 'rid': rid})

print('back_button:', back_button)
print()
print('=== NAV TABS ===')
for x in nav_tabs:    print(' ', json.dumps(x))
print('=== TOOLBAR ICONS ===')
for x in toolbar_icons: print(' ', json.dumps(x))
print('=== SCROLLABLE AREAS ===')
for x in scrollables: print(' ', json.dumps(x))
print('=== BUTTONS / TAPPABLE ===')
for x in buttons:     print(' ', json.dumps(x))
print('=== INPUT FIELDS ===')
for x in inputs:      print(' ', json.dumps(x))
```

Then run: `python3 /tmp/explore_screen.py`

#### E3. Determine the "return to home" strategy

After tapping each element the test must return to the starting screen. Use this priority:

1. **Back button found** (`back_button` is not None) → use `tapOn: { accessibility: "<back_button_label>" }` after each navigation tap
2. **Home nav tab found** in `nav_tabs` → use `tapOn: { contains: "Home" }` (or the exact tab label)
3. **Neither** → add `# ⚠ no return path found — add back navigation manually` comment after each tap block and note this to the tester

#### E4. Choose a "starting screen anchor"

Pick the most stable visible-text element on the starting screen to use in `waitFor` after each return. Prefer: a screen title, a prominent static label, or a nav tab that is currently selected. Avoid dynamic text (prices, counts).

#### E5. Generate the YAML

Use this template for each discovered element:

```yaml
# ── <element label> ───────────────────────────────────────────────────────
- tapOn: { accessibility: "<label>" }           # or text: / contains: as appropriate
- waitFor: { contains: "<any text expected on destination>", timeoutMs: 5000 }
# return to starting screen:
- tapOn: { accessibility: "<back_button_label>" }   # or home tab
- waitFor: { accessibility: "<starting_screen_anchor>", timeoutMs: 5000 }
```

For **scrollable areas**: instead of a tap block, insert:
```yaml
# ── scroll <area label> ───────────────────────────────────────────────────
- swipe: up
- swipe: down
```

For **input fields**: skip them in the explorer run (inputs need known values — the tester should add an `inputText` step manually afterwards). Leave a comment: `# ⚠ input field "<label>" — add inputText step manually`.

**Safety filter — skip these automatically and note them with a comment:**
- Labels containing: "delete", "remove", "logout", "sign out", "uninstall", "clear data", "reset"
- Any button that looks destructive based on its label

#### E6. File naming

Save to `.usb-ui-test/tests/explore/<screen_name>_explore.yaml` where `<screen_name>` is inferred from the most prominent heading on screen (snake_case). Default to `home_screen_explore.yaml` if no heading is obvious.

#### E7. Run and report

Run the generated file the same way as any other deterministic test (Step 7 of the main workflow). If a `waitFor` after a tap times out, the destination screen label was wrong — note in the report which element caused it and suggest the tester add a `uiautomator dump` from that destination to find the right anchor.


## Common Tester Phrasings → Command Mapping

Useful translations to keep in mind:

| Tester says | You generate |
|---|---|
| "open the app" / "launch" | `launchApp:` |
| "fresh install" / "clean state" / "logged out" | `clearAppData:` then `launchApp:` |
| "tap / press / click X" | `tapOn: "X"` |
| "type / enter X in Y" | `tapOn: "Y"` then `inputText: "X"` (or use `into:` form) |
| "swipe up/down/left/right" | `swipe: up` (etc.) |
| "wait until X appears" | `waitFor: "X"` |
| "verify X is shown" / "assert X" / "should see X" | `assertVisible: "X"` |
| "X should disappear" / "should not see X" | `assertNotVisible: "X"` |
| "scroll down" | `swipe: up` (mobile scroll-down is a swipe-up gesture) |

## Things to Avoid

- **No natural-language step strings.** Mixing structured + string steps breaks the loader.
- **No commands outside the v1 list.** If a tester asks for something exotic, refuse and explain.
- **No fabricated selectors with high specificity** (e.g. `{ id: "com.bank.app:id/btn_login_v2" }`) unless the tester provided that id. A comment with `# verify this id matches your app` is fine; pretending you know the id is not.
- **No empty `setup:` / `expected_state:` blocks.** Both are AI-only in v1; structured tests put pre-conditions at the top of `steps:` and assertions at the bottom.
- **No `${secrets.*}` for casual hardcoded credentials** unless the tester asked or the context is sensitive. Most testers want a fast iteration loop and will get confused by env-file plumbing on the first test.

## When To Decline

- Tester wants to test something the v1 vocabulary can't express (long-press, deeplink, location set, biometric prompt). Tell them clearly and point to AI mode if the tradeoff is acceptable.
- Tester wants to test a flow that requires backend setup (creating a user, seeding test data). Generate the UI test but tell the tester they need a separate seed step before running.
- Tester gives a request that would require pixel-coordinate taps without any text/id anchors ("tap at 537, 1240"). Generate it via `swipe` with explicit coordinates if absolutely needed, but prefer pushing back: ask which element they meant, and request the dev add an `accessibilityIdentifier` to it.
