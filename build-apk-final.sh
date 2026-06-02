#!/bin/bash
set -e

export ANDROID_HOME=~/android-sdk
export ANDROID_SDK_ROOT=~/android-sdk
export JAVA_HOME=/root/.local/share/mise/installs/java/17.0.2

cd /workspace/android

echo "=== Building PawSync Pro APK ==="
echo "ANDROID_HOME: $ANDROID_HOME"
echo "JAVA_HOME: $JAVA_HOME"

$JAVA_HOME/bin/java -version

gradle assembleRelease --no-daemon -Dorg.gradle.java.home=$JAVA_HOME

echo "=== Build Complete ==="
ls -la app/build/outputs/apk/release/