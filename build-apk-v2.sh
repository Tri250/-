#!/bin/bash

# PawSync Pro - Android APK 一键构建脚本
# 支持 Android 16 (API 36)

set -e

echo "=========================================="
echo "PawSync Pro APK 构建脚本"
echo "版本: 1.0.0"
echo "目标: Android 16 (API 36)"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: $1 未安装${NC}"
        return 1
    fi
    return 0
}

# 检查基础命令
echo "检查环境..."

if ! check_command "java"; then
    echo -e "${YELLOW}请安装 JDK 17+: https://adoptium.net/${NC}"
    exit 1
fi

if ! check_command "gradle"; then
    echo -e "${YELLOW}警告: Gradle 未找到，将使用 Gradle Wrapper${NC}"
fi

if ! check_command "wget" && ! check_command "curl"; then
    echo -e "${RED}错误: wget 或 curl 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 环境检查完成${NC}"
echo ""

# 设置环境变量
export ANDROID_HOME=${ANDROID_HOME:-/opt/android-sdk}
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 创建 SDK 目录
mkdir -p $ANDROID_HOME

# 检查并安装 Android SDK
echo "检查 Android SDK..."

check_sdk() {
    [ -d "$ANDROID_HOME/platforms/android-36" ] && \
    [ -d "$ANDROID_HOME/build-tools/36.0.0" ] && \
    [ -f "$ANDROID_HOME/platform-tools/platform-tools.szd" ]
}

if ! check_sdk; then
    echo "正在安装 Android SDK..."
    
    # 下载命令行工具
    if command -v wget &> /dev/null; then
        wget -q --timeout=60 https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip
    else
        curl -sL --connect-timeout 60 https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/cmdline-tools.zip
    fi
    
    mkdir -p $ANDROID_HOME/cmdline-tools
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest
    rm /tmp/cmdline-tools.zip
    
    # 接受许可证
    yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses >/dev/null 2>&1 || true
    
    # 安装 SDK 组件
    echo "安装 Android SDK 组件..."
    $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platforms;android-36" "build-tools;36.0.0" "platform-tools"
    
    echo -e "${GREEN}✓ Android SDK 安装完成${NC}"
else
    echo -e "${GREEN}✓ Android SDK 已安装${NC}"
fi

echo ""
echo "=========================================="
echo "开始构建 APK"
echo "=========================================="
echo ""

# 进入 Android 目录
cd android

# 使用系统 Gradle 或 Gradle Wrapper
if command -v gradle &> /dev/null; then
    echo "使用系统 Gradle 构建..."
    gradle clean assembleDebug
else
    echo "使用 Gradle Wrapper 构建..."
    chmod +x gradlew
    ./gradlew clean assembleDebug
fi

cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}构建完成!${NC}"
echo "=========================================="
echo ""
echo "APK 文件位置:"
echo "  ${YELLOW}android/app/build/outputs/apk/debug/app-debug.apk${NC}"
echo ""

# 验证 APK
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo -e "${GREEN}✓ APK 构建成功!${NC}"
    ls -lh android/app/build/outputs/apk/debug/app-debug.apk
else
    echo -e "${RED}✗ APK 构建失败${NC}"
    exit 1
fi

echo ""
echo "下一步:"
echo "  1. 将 APK 文件传输到 Android 设备"
echo "  2. 在设备上安装 (可能需要允许未知来源)"
echo "  3. 享受 PawSync Pro!"
echo ""
