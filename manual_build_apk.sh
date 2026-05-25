#!/bin/bash

# Android SDK paths
ANDROID_SDK="/workspace/android-sdk"
BUILD_TOOLS="$ANDROID_SDK/build-tools/34.0.0"
PLATFORMS="$ANDROID_SDK/platforms/android-34"
JAVA_HOME="/root/.local/share/mise/installs/java/25.0.2"

# Paths
PROJECT_DIR="/workspace/simple-android-app"
BUILD_DIR="/tmp/apk-build"
OUTPUT_DIR="/workspace/output"
APP_NAME="PawSync Pro"

# Clean build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

echo "=== PawSync Pro APK Builder ==="
echo ""

# Set PATH
export PATH="$JAVA_HOME/bin:$BUILD_TOOLS:$PATH"
export ANDROID_HOME="$ANDROID_SDK"
export ANDROID_SDK_ROOT="$ANDROID_SDK"

echo "Step 1: Compiling resources..."
# Compile resources using aapt2
"$BUILD_TOOLS/aapt2" compile \
  --dir "$PROJECT_DIR/app/src/main/res" \
  -o "$BUILD_DIR/res.zip"

if [ $? -ne 0 ]; then
    echo "Error: Resource compilation failed"
    exit 1
fi
echo "Resources compiled successfully"
echo ""

echo "Step 2: Creating compiled resources..."
# Create flat res directory
mkdir -p "$BUILD_DIR/flat-res"

# We need to use the correct resource compilation output
# For now, let's use the compiled resources
cp -r "$PROJECT_DIR/app/src/main/res/values" "$BUILD_DIR/res/"
mkdir -p "$BUILD_DIR/res/values"

echo "Step 3: Building APK..."
# Use aapt to package the APK
cd "$PROJECT_DIR/app/src/main"

"$BUILD_TOOLS/aapt" package -f \
  -F "$BUILD_DIR/app-unsigned.apk" \
  -A assets \
  -S res \
  -M AndroidManifest.xml \
  -I "$PLATFORMS/android.jar"

if [ $? -ne 0 ]; then
    echo "Error: APK packaging failed"
    exit 1
fi
echo "APK packaged successfully"
echo ""

echo "Step 4: Signing APK..."
# Sign the APK
"$JAVA_HOME/bin/jarsigner" \
  -keystore "$BUILD_DIR/debug.keystore" \
  -storepass android \
  -keypass android \
  -signedjar "$BUILD_DIR/app-unaligned.apk" \
  "$BUILD_DIR/app-unsigned.apk" \
  androiddebugkey

if [ $? -ne 0 ]; then
    echo "Note: Signing failed, creating debug keystore..."
    # Create debug keystore
    "$JAVA_HOME/bin/keytool" -genkeypair \
      -v -keystore "$BUILD_DIR/debug.keystore" \
      -storepass android -alias androiddebugkey \
      -keypass android -keyalg RSA -keysize 2048 \
      -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
    
    # Try signing again
    "$JAVA_HOME/bin/jarsigner" \
      -keystore "$BUILD_DIR/debug.keystore" \
      -storepass android \
      -keypass android \
      -signedjar "$BUILD_DIR/app-unaligned.apk" \
      "$BUILD_DIR/app-unsigned.apk" \
      androiddebugkey
fi

if [ $? -eq 0 ]; then
    echo "APK signed successfully"
else
    echo "Error: APK signing failed"
    exit 1
fi
echo ""

echo "Step 5: Aligning APK..."
# Align the APK
"$BUILD_TOOLS/zipalign" -f 4 \
  "$BUILD_DIR/app-unaligned.apk" \
  "$BUILD_DIR/app-aligned.apk"

if [ $? -ne 0 ]; then
    echo "Error: APK alignment failed"
    exit 1
fi
echo "APK aligned successfully"
echo ""

echo "Step 6: Copying final APK..."
cp "$BUILD_DIR/app-aligned.apk" "$OUTPUT_DIR/PawSyncPro.apk"
echo ""
echo "=== Build Complete! ==="
echo "APK Location: $OUTPUT_DIR/PawSyncPro.apk"
ls -lh "$OUTPUT_DIR/PawSyncPro.apk"
