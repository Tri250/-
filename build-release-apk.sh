#!/bin/bash

# PawSync Pro - Android Release APK Build Script
# 此脚本用于构建支持Android 14-15-16的Release APK

set -e

echo "=========================================="
echo "PawSync Pro - Android Release APK Builder"
echo "版本: 1.0.0"
echo "目标SDK: Android 35 (支持Android 14-16)"
echo "=========================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# 1. 检查环境
print_step "检查构建环境..."

if ! command -v npm &> /dev/null; then
    print_error "npm未安装"
    exit 1
fi

if ! command -v java &> /dev/null; then
    print_error "Java未安装 (需要Java 17+)"
    exit 1
fi

if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME未设置"
    export ANDROID_HOME=$HOME/Android/Sdk
fi

echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Java: $(java --version 2>&1 | head -1)"
echo "Android SDK: $ANDROID_HOME"
echo ""

# 2. 安装前端依赖
print_step "安装前端依赖..."
npm install --prefer-offline --no-audit
print_success "依赖安装完成"
echo ""

# 3. 构建Web应用
print_step "构建Web应用..."
npm run build
print_success "Web应用构建完成"
echo ""

# 4. 同步Capacitor
print_step "同步Capacitor到Android..."
npx cap sync android
print_success "Capacitor同步完成"
echo ""

# 5. 构建Release APK
print_step "构建Release APK..."
cd android

# 设置local.properties
echo "sdk.dir=${ANDROID_HOME}" > local.properties

# 使用gradle构建
if command -v gradle &> /dev/null; then
    gradle assembleRelease --no-daemon
else
    chmod +x gradlew
    ./gradlew assembleRelease --no-daemon
fi

cd ..

# 6. 验证APK
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    print_success "APK构建成功!"
    echo ""
    echo "=========================================="
    echo "APK位置: $APK_PATH"
    echo "APK大小: $APK_SIZE"
    echo "=========================================="
    echo ""
    echo "安装说明:"
    echo "1. 将APK传输到Android设备"
    echo "2. 在设备上打开APK文件"
    echo "3. 允许安装未知来源应用"
    echo "4. 完成安装"
    echo ""
    echo "支持的Android版本: 14, 15, 16 (API 24-35)"
else
    print_error "APK构建失败"
    exit 1
fi