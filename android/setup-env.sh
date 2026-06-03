#!/bin/bash
# PawSync Pro Android 构建环境设置脚本
# 自动配置 JDK 17、ANDROID_HOME 和环境变量

export JAVA_HOME=/root/.local/share/mise/installs/java/17.0.2
export ANDROID_HOME=/root/android-sdk
export ANDROID_SDK_ROOT=/root/android-sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:$PATH

# 显示配置信息
echo "==================================="
echo "  PawSync Pro 构建环境"
echo "==================================="
echo "JAVA_HOME    = $JAVA_HOME"
echo "ANDROID_HOME = $ANDROID_HOME"
echo ""
echo "=== 工具版本 ==="
java -version 2>&1
echo ""
gradle --version 2>&1 | head -5
echo ""
echo "=== Android SDK 组件 ==="
ls $ANDROID_HOME/platforms/ 2>/dev/null
ls $ANDROID_HOME/build-tools/ 2>/dev/null
echo ""
echo "✅ 环境配置完成"
