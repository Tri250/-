#!/usr/bin/env python3
import os
import subprocess
import sys
import shutil
import tempfile
import zipfile
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return output"""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    return True

def main():
    workspace = Path("/workspace")
    android_sdk = workspace / "android-sdk"
    
    # Check Android SDK
    if not android_sdk.exists():
        print("Error: Android SDK not found!")
        return 1
    
    # Set environment
    env = os.environ.copy()
    env['ANDROID_HOME'] = str(android_sdk)
    env['ANDROID_SDK_ROOT'] = str(android_sdk)
    env['PATH'] = f"{env['PATH']}:{android_sdk}/cmdline-tools/latest/bin:{android_sdk}/platform-tools"
    
    # Simple Android project
    project_dir = workspace / "simple-android-app"
    output_dir = workspace / "output"
    output_dir.mkdir(exist_ok=True)
    
    # Build using Gradle
    gradle_home = "/root/.local/share/mise/installs/gradle/8.14.4/gradle-8.14.4"
    
    # Run gradle build
    print("Building with Gradle...")
    build_cmd = [
        f"{gradle_home}/bin/gradle",
        "assembleDebug",
        "-p", str(project_dir),
        "--no-daemon"
    ]
    
    # Set JAVA_HOME
    env['JAVA_HOME'] = "/root/.local/share/mise/installs/java/25.0.2"
    env['PATH'] = f"{env['JAVA_HOME']}/bin:{env['PATH']}"
    
    result = subprocess.run(build_cmd, env=env, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("Build successful!")
        # Find APK
        apk_pattern = project_dir / "app" / "build" / "outputs" / "apk" / "**" / "*.apk"
        for apk in project_dir.rglob("*.apk"):
            print(f"Found APK: {apk}")
            # Copy to output
            shutil.copy(apk, output_dir / apk.name)
            print(f"APK copied to: {output_dir / apk.name}")
            return 0
    else:
        print(f"Build failed: {result.stderr}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
