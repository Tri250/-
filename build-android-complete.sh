#!/bin/bash
# PawSync Pro Android 一键构建脚本
# 自动处理环境配置、Web 构建、Capacitor 同步、APK 构建

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 步骤 1: 设置环境变量
log_info "=== 步骤 1: 设置构建环境 ==="
export JAVA_HOME=/root/.local/share/mise/installs/java/17.0.2
export ANDROID_HOME=/root/android-sdk
export ANDROID_SDK_ROOT=/root/android-sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:$PATH

# 验证环境
java -version 2>&1 | head -1
log_success "Java 环境配置完成"

if [ ! -d "$ANDROID_HOME" ]; then
    log_error "Android SDK 未安装: $ANDROID_HOME"
    exit 1
fi
log_success "Android SDK 配置完成"

# 步骤 2: 构建 Web 应用
log_info "=== 步骤 2: 构建 Web 应用 ==="
cd /workspace

if [ ! -d "node_modules" ]; then
    log_warn "node_modules 不存在，正在安装依赖..."
    npm install --prefer-offline --no-audit --no-fund
fi

log_info "执行 Vite 构建..."
npm run build 2>&1 | tail -10

if [ ! -d "dist" ]; then
    log_error "Web 构建失败：dist 目录未生成"
    exit 1
fi
log_success "Web 构建完成"

# 步骤 3: 同步 Capacitor
log_info "=== 步骤 3: 同步 Capacitor ==="
export CAPACITOR_ANDROID_STUDIO_PATH=
npx cap sync android 2>&1 | tail -20
log_success "Capacitor 同步完成"

# 步骤 4: 构建 Android APK
log_info "=== 步骤 4: 构建 Android APK ==="
cd /workspace/android

# 设置 Gradle 用户主目录使用本地仓库
export GRADLE_USER_HOME=/root/.gradle

log_info "执行 Gradle assembleRelease..."
gradle assembleRelease --no-daemon --init-script init.gradle 2>&1 | tail -30

# 步骤 5: 验证产物
log_info "=== 步骤 5: 验证 APK 产物 ==="
APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
if [ -f "$APK_PATH" ]; then
    log_success "APK 构建成功！"
    ls -lh "$APK_PATH"
    echo ""
    echo "================================="
    echo "  构建完成！"
    echo "  APK 路径: /workspace/android/$APK_PATH"
    echo "================================="
else
    log_error "APK 未生成，请检查构建日志"
    exit 1
fi
