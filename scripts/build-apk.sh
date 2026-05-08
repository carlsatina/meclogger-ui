#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ANDROID_DIR="$ROOT/android"
APK_DEBUG="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
APK_RELEASE="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"

BUILD_TYPE="${1:-debug}"   # debug | release

if [[ "$BUILD_TYPE" != "debug" && "$BUILD_TYPE" != "release" ]]; then
    echo "Usage: $0 [debug|release]"
    exit 1
fi

echo "▶ 1/3  Vite build..."
cd "$ROOT"
npm run build

echo "▶ 2/3  Capacitor sync → android..."
npx cap sync android

echo "▶ 3/3  Gradle assemble ($BUILD_TYPE)..."
cd "$ANDROID_DIR"
if [[ "$BUILD_TYPE" == "release" ]]; then
    ./gradlew assembleRelease
    APK_OUT="$APK_RELEASE"
else
    ./gradlew assembleDebug
    APK_OUT="$APK_DEBUG"
fi

echo ""
echo "✓ APK ready:"
echo "  $APK_OUT"
