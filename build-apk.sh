#!/bin/bash

# PawSync Pro - Android APK 构建脚本
# 此脚本用于在有网络连接的环境中构建兼容 Android 16 的 APK 文件

set -e

echo "=========================================="
echo "PawSync Pro - Android APK 构建脚本"
echo "=========================================="
echo ""

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 2. 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"

# 3. 检查 Java
if ! command -v java &> /dev/null; then
    echo "❌ Java 未安装，请先安装 JDK 17+"
    exit 1
fi

echo "✅ Java 版本: $(java --version)"

# 4. 检查 Gradle
if ! command -v gradle &> /dev/null; then
    echo "⚠️ Gradle 未安装，将使用 Gradle Wrapper"
fi

echo ""
echo "=========================================="
echo "步骤 1: 安装依赖"
echo "=========================================="
npm install

echo ""
echo "=========================================="
echo "步骤 2: 构建 Web 应用"
echo "=========================================="
npm run build

echo ""
echo "=========================================="
echo "步骤 3: 同步到 Android 项目"
echo "=========================================="
npx cap sync android

echo ""
echo "=========================================="
echo "步骤 4: 构建 Debug APK"
echo "=========================================="
cd android

if command -v gradle &> /dev/null; then
    echo "使用系统 Gradle 构建..."
    gradle assembleDebug
else
    echo "使用 Gradle Wrapper 构建..."
    chmod +x gradlew
    ./gradlew assembleDebug
fi

cd ..

echo ""
echo "=========================================="
echo "构建完成!"
echo "=========================================="
echo ""
echo "APK 文件位置:"
echo "  - Debug APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "下一步:"
echo "  1. 将 APK 文件传输到 Android 设备"
echo "  2. 在设备上安装 APK (可能需要允许未知来源应用)"
echo "  3. 享受 PawSync Pro!"
echo ""
