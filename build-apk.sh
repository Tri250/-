#!/bin/bash

# PawSync Pro APK 本地构建脚本
# 使用方法：在网络良好的环境下运行此脚本

echo "🐾 PawSync Pro APK 构建脚本"
echo "================================"
echo ""

# 检查环境
echo "📋 检查构建环境..."

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "❌ Java 未安装"
    exit 1
fi
echo "✅ Java: $(java -version 2>&1 | head -n 1)"

# 检查 Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME 未设置"
    if [ -d "/workspace/android-sdk" ]; then
        export ANDROID_HOME=/workspace/android-sdk
        export ANDROID_SDK_ROOT=/workspace/android-sdk
        echo "✅ 使用项目内置 SDK: $ANDROID_HOME"
    else
        echo "❌ Android SDK 未找到"
        exit 1
    fi
else
    echo "✅ ANDROID_HOME: $ANDROID_HOME"
fi

# 检查 Gradle
if ! command -v gradle &> /dev/null; then
    echo "⚠️  Gradle 未安装，将使用项目内置 wrapper"
fi

cd /workspace/android

echo ""
echo "📦 开始构建 APK..."
echo ""

# 清理旧构建
echo "🧹 清理旧构建..."
rm -rf app/build
rm -rf .gradle

# 构建 Debug APK
echo "🔨 运行 Gradle assembleDebug..."
if command -v gradle &> /dev/null; then
    gradle assembleDebug --stacktrace
else
    ./gradlew assembleDebug --stacktrace
fi

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 构建成功！"
    echo "📍 APK 文件位置:"
    ls -lh app/build/outputs/apk/debug/*.apk
    echo ""
    echo "🎉 可以直接安装到手机进行测试！"
else
    echo ""
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
