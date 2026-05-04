#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_ROOT="$REPO_ROOT/drivers/ios"
PROJECT_PATH="$IOS_ROOT/usb-ui-test-ios.xcodeproj"
DERIVED_DATA_PATH="$IOS_ROOT/.derived-data"
PRODUCTS_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator"
OUTPUT_ROOT="$REPO_ROOT/resources/ios"

rm -rf "$DERIVED_DATA_PATH"

xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme usb-ui-test-ios \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  build-for-testing

APP_PATH="$PRODUCTS_PATH/usb-ui-test-ios.app"
RUNNER_PATH="$PRODUCTS_PATH/usb-ui-test-ios-test-Runner.app"

if [[ ! -d "$APP_PATH" ]]; then
  printf 'Expected iOS app bundle not found: %s\n' "$APP_PATH" >&2
  exit 1
fi

if [[ ! -d "$RUNNER_PATH" ]]; then
  printf 'Expected iOS runner bundle not found: %s\n' "$RUNNER_PATH" >&2
  exit 1
fi

mkdir -p "$OUTPUT_ROOT"
rm -f "$OUTPUT_ROOT/usb-ui-test-ios.zip" "$OUTPUT_ROOT/usb-ui-test-ios-test-Runner.zip"

(
  cd "$PRODUCTS_PATH"
  /usr/bin/zip -qry "$OUTPUT_ROOT/usb-ui-test-ios.zip" "usb-ui-test-ios.app"
  /usr/bin/zip -qry "$OUTPUT_ROOT/usb-ui-test-ios-test-Runner.zip" "usb-ui-test-ios-test-Runner.app"
)

printf 'iOS driver artifacts staged in %s\n' "$OUTPUT_ROOT"
