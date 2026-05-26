#!/usr/bin/env bash

# PawSync Pro 快速打包脚本
# 使用简单的 WebView 项目构建 APK

set -e

echo "🐾 PawSync Pro 快速打包工具"
echo "================================"
echo ""

# 1. 确保最新的构建
echo "📦 步骤1: 构建 Web 应用..."
cd /workspace
if [ !d "dist" ]; then
    echo "构建 Web 应用..."
    npm run build
fi
echo "✅ Web 应用构建完成"
echo ""

# 2. 复制资源到 Android 项目
echo "📁 步骤2: 复制资源到 Android 项目..."
rm -rf /workspace/final-build/simple-android-app/app/src/main/assets/*
cp -r dist/* /workspace/final-build/simple-android-app/app/src/main/assets/
cp -f dist/index.html /workspace/final-build/simple-android-app/app/src/main/assets/
echo "✅ 资源复制完成"
echo ""

# 3. 修复权限问题
echo "🔧 步骤3: 设置权限..."
chmod +x /workspace/android-sdk/platform-tools/adb 2>/dev/null || true
echo "✅ 权限设置完成"
echo ""

# 4. 清理构建目录
echo "🧹 步骤4: 清理旧构建..."
rm -rf /workspace/final-build/simple-android-app/app/build
rm -rf /workspace/final-build/simple-android-app/build
echo "✅ 清理完成"
echo ""

# 5. 构建 Debug APK
echo "🔨 步骤5: 构建 Debug APK..."
cd /workspace/final-build/simple-android-app

export ANDROID_HOME=/workspace/android-sdk
export ANDROID_SDK_ROOT=/workspace/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin

# 使用系统 Gradle
if command -v gradle &> /dev/null; then
    echo "使用系统 Gradle..."
    gradle --version
    gradle assembleDebug --stacktrace
    EXIT_CODE=$?
else
    echo "❌ Gradle 未安装"
    exit 1
fi

# 6. 复制 APK 到输出目录
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ 构建成功！"
    echo ""
    echo "📍 APK 文件位置:"
    APK_PATH="/workspace/final-build/simple-android-app/app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
        cp "$APK_PATH" /workspace/PawSyncPro-debug.apk
        ls -lh "$APK_PATH"
        ls -lh /workspace/PawSyncPro-debug.apk
        echo ""
        echo "🎉 APK 已复制到: /workspace/PawSyncPro-debug.apk"
        echo "🎉 可以直接安装到手机进行测试！"
    else
        echo "❌ 未找到 APK 文件"
        find /workspace/final-build/simple-android-app -name "*.apk" 2>/dev/null
        exit 1
    fi
else
    echo ""
    echo "❌ 构建失败，错误代码: $EXIT_CODE"
    exit $EXIT_CODE
fi
