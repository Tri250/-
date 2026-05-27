#!/bin/bash

# PawSync Pro - Android 16 APK Build Script
# Comprehensive build automation

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "PawSync Pro - Android 16 APK Builder"
echo "Version: 1.0.0"
echo "=========================================="
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
print_step() {
    echo -e "${GREEN}➜ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

# Check for required commands
check_requirements() {
    print_step "Checking requirements..."
    
    local missing=0
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        missing=1
    else
        print_success "npm found: $(npm --version)"
    fi
    
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed (need Java 17+)"
        missing=1
    else
        print_success "Java found: $(java -version 2>&1 | head -1)"
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "Please install missing requirements and try again"
        exit 1
    fi
    
    echo ""
}

# Clean previous builds
clean_builds() {
    print_step "Cleaning previous builds..."
    rm -rf android/.gradle android/build android/app/build
    rm -f *.apk
    print_success "Cleaned successfully"
    echo ""
}

# Build web assets
build_web() {
    print_step "Building web application..."
    npm run build
    print_success "Web application built successfully"
    echo ""
}

# Sync with Capacitor
sync_capacitor() {
    print_step "Syncing with Capacitor..."
    npx cap sync android
    print_success "Capacitor synced successfully"
    echo ""
}

# Build APK using Gradle (if available)
build_apk() {
    print_step "Building Android APK..."
    
    cd android
    
    if command -v gradle &> /dev/null; then
        gradle assembleDebug
    else
        chmod +x gradlew
        ./gradlew assembleDebug
    fi
    
    cd "$SCRIPT_DIR"
    
    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        print_success "APK built successfully"
        ls -lh android/app/build/outputs/apk/debug/
    else
        print_error "APK not found after build"
        exit 1
    fi
    
    echo ""
}

# Verify build
verify_build() {
    print_step "Verifying build artifacts..."
    
    local apk_path="android/app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$apk_path" ]; then
        print_success "APK exists: $(ls -lh $apk_path | awk '{print $5}')"
        
        if command -v aapt &> /dev/null; then
            print_step "Checking APK structure..."
            aapt dump badging "$apk_path" 2>&1 | head -20
        fi
    else
        print_error "APK not found at expected path"
        exit 1
    fi
    
    echo ""
}

# Package the output
package_output() {
    print_step "Packaging output..."
    
    mkdir -p output
    cp android/app/build/outputs/apk/debug/app-debug.apk output/PawSyncPro-Debug-1.0.0.apk
    
    print_success "Output packaged to output/"
    ls -lh output/
    echo ""
}

# Show final summary
show_summary() {
    echo "=========================================="
    echo -e "${GREEN}BUILD COMPLETED SUCCESSFULLY${NC}"
    echo "=========================================="
    echo ""
    echo "APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo "Alternate Copy: output/PawSyncPro-Debug-1.0.0.apk"
    echo ""
    echo "To install on a device:"
    echo "  1. Enable Developer Options and USB Debugging"
    echo "  2. Connect device via USB"
    echo "  3. Run: adb install -r output/PawSyncPro-Debug-1.0.0.apk"
    echo ""
    echo "For full instructions, see: ANDROID_BUILD_GUIDE.md"
    echo ""
    echo "If this build fails due to network issues,"
    echo "please use GitHub Actions for automatic build:"
    echo "  git add . && git commit -m 'Build' && git push origin main"
    echo ""
}

# Main build process
main() {
    check_requirements
    clean_builds
    build_web
    sync_capacitor
    
    # Try to build APK (may fail due to network issues)
    if build_apk; then
        verify_build
        package_output
        show_summary
    else
        print_warning "Local APK build failed (network/SDK issue)"
        echo ""
        echo "Don't worry! You can use GitHub Actions instead:"
        echo ""
        echo "  1. git add ."
        echo "  2. git commit -m 'Prepare for build'"
        echo "  3. git push origin main"
        echo "  4. Go to GitHub Actions page"
        echo ""
        echo "GitHub Actions will automatically build the APK for you!"
        echo ""
    fi
}

# Run main
main
