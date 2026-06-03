#!/bin/bash

# PawSync Pro Android离线构建脚本
# 适用于无法访问Maven中央仓库的环境

set -e

echo "=========================================="
echo "PawSync Pro Android 离线构建脚本"
echo "=========================================="

# 1. 检查环境
echo "[1/6] 检查构建环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未安装Node.js"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo "错误: 未安装Java"
    exit 1
fi

if [ -z "$ANDROID_HOME" ]; then
    echo "警告: ANDROID_HOME未设置，使用默认路径"
    export ANDROID_HOME=$HOME/Android/Sdk
fi

echo "Node.js: $(node --version)"
echo "Java: $(java --version 2>&1 | head -1)"
echo "Android SDK: $ANDROID_HOME"

# 2. 安装前端依赖
echo "[2/6] 安装前端依赖..."
npm install --prefer-offline --no-audit

# 3. 构建Web端
echo "[3/6] 构建Web端..."
npm run build

# 4. 同步到Android
echo "[4/6] 同步到Android..."
npx cap sync android

# 5. 构建APK
echo "[5/6] 构建APK..."
cd android

if [ "$1" == "debug" ]; then
    echo "构建Debug版本..."
    ./gradlew assembleDebug --offline
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
    echo "构建Release版本..."
    ./gradlew assembleRelease --offline
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
fi

# 6. 验证APK
echo "[6/6] 验证APK..."
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "=========================================="
    echo "构建成功!"
    echo "APK位置: $(pwd)/$APK_PATH"
    echo "APK大小: $APK_SIZE"
    echo "=========================================="
else
    echo "错误: APK构建失败"
    exit 1
fi
