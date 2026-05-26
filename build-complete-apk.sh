// PawSync Pro - 完整的 APK 构建脚本
// 使用阿里云镜像加速构建

#!/usr/bin/env bash

set -e

echo "🐾 PawSync Pro 完整构建工具"
echo "================================"
echo ""

# 设置环境变量
export ANDROID_HOME=/workspace/android-sdk
export ANDROID_SDK_ROOT=/workspace/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin

PROJECT_DIR="/workspace/final-build/simple-android-app"
OUTPUT_APK="/workspace/PawSyncPro-v3.apk"

echo "📦 项目目录: $PROJECT_DIR"
echo "📍 输出文件: $OUTPUT_APK"
echo ""

# 复制最新的 Web 资源
echo "📁 复制最新 Web 资源..."
rm -rf "$PROJECT_DIR/app/src/main/assets/assets"
rm -f "$PROJECT_DIR/app/src/main/assets/index.html"
cp -r /workspace/dist/* "$PROJECT_DIR/app/src/main/assets/"
echo "✅ 资源复制完成"
echo ""

# 清理旧的构建
echo "🧹 清理旧构建..."
rm -rf "$PROJECT_DIR/app/build"
rm -rf "$PROJECT_DIR/build"
rm -rf "$PROJECT_DIR/.gradle"
echo "✅ 清理完成"
echo ""

# 使用 Gradle 构建，添加阿里云镜像
echo "🔨 开始构建 APK..."
echo "⚠️  首次构建需要下载依赖，请耐心等待..."
echo ""

cd "$PROJECT_DIR"

# 配置 Gradle 使用阿里云镜像
cat > gradle.properties << 'EOF'
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
systemProp.http.timeout=60000
systemProp.https.timeout=60000
EOF

# 使用系统 Gradle 构建，并增加超时时间
gradle --stop 2>/dev/null || true
timeout 600 gradle assembleDebug \
    --no-daemon \
    --stacktrace \
    --refresh-dependencies \
    -Dorg.gradle.jvmargs="-Xmx4096m" \
    2>&1 | tee /tmp/gradle-build.log

BUILD_STATUS=${PIPESTATUS[0]}

if [ $BUILD_STATUS -eq 0 ]; then
    echo ""
    echo "✅ 构建成功！"
    
    # 查找 APK 文件
    APK_PATH=$(find "$PROJECT_DIR" -name "*.apk" -type f 2>/dev/null | head -1)
    
    if [ -n "$APK_PATH" ] && [ -f "$APK_PATH" ]; then
        cp "$APK_PATH" "$OUTPUT_APK"
        echo ""
        echo "📍 APK 信息:"
        ls -lh "$OUTPUT_APK"
        
        # 验证 APK
        echo ""
        echo "🔍 APK 验证:"
        /workspace/android-sdk/build-tools/34.0.0/aapt dump badging "$OUTPUT_APK" 2>&1 | grep -E "package:|application-label:|sdkVersion:" | head -3
        
        echo ""
        echo "🎉 PawSync Pro APK 已生成: $OUTPUT_APK"
        echo "🎉 可以直接安装到手机进行测试！"
    else
        echo "❌ 未找到 APK 文件"
        exit 1
    fi
else
    echo ""
    echo "❌ 构建失败，错误代码: $BUILD_STATUS"
    echo ""
    echo "📋 构建日志:"
    tail -30 /tmp/gradle-build.log
    exit $BUILD_STATUS
fi
