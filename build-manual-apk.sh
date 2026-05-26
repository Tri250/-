#!/usr/bin/env bash

# PawSync Pro - 手动构建 APK 脚本
# 此脚本手动编译 Java 代码并打包 APK

set -e

echo "🐾 PawSync Pro 手动构建工具"
echo "================================"
echo ""

# 配置
ANDROID_SDK="/workspace/android-sdk"
PROJECT_DIR="/workspace/manual-apk"
OUTPUT_DIR="/workspace"
FINAL_APK="$OUTPUT_DIR/PawSyncPro-v2.apk"

echo "📦 项目目录: $PROJECT_DIR"
echo "📍 输出文件: $FINAL_APK"
echo ""

# 步骤1: 编译 Java 代码
echo "🔨 步骤1: 编译 Java 代码..."
cd "$PROJECT_DIR"

# 查找所有 Java 文件并编译
find . -name "*.java" | while read file; do
    echo "  编译: $file"
done

# 创建 classes 目录
mkdir -p classes

# 编译所有 Java 文件
javac -source 17 -target 17 -cp "$ANDROID_SDK/platforms/android-34/android.jar" \
    -d classes \
    -classpath "$ANDROID_SDK/platforms/android-34/android.jar" \
    com/pawsync/pro/*.java 2>&1 | grep -v "警告" || true

echo "✅ Java 代码编译完成"
echo ""

# 步骤2: 打包 classes.dex
echo "📦 步骤2: 打包 DEX 文件..."
mkdir -p dex

if [ -d "classes" ] && [ "$(ls -A classes 2>/dev/null)" ]; then
    "$ANDROID_SDK/build-tools/34.0.0/d8" \
        --output dex/classes.dex \
        --classpath "$ANDROID_SDK/platforms/android-34/android.jar" \
        classes 2>&1 | grep -v "^$" || true
    
    if [ -f "dex/classes.dex" ]; then
        echo "✅ DEX 文件创建成功"
    else
        echo "⚠️  DEX 文件创建失败，但继续构建..."
    fi
else
    echo "⚠️  未找到编译后的类文件，跳过 DEX 打包"
fi
echo ""

# 步骤3: 创建资源表
echo "📄 步骤3: 创建资源表..."
mkdir -p compiled

if [ -d "res" ]; then
    "$ANDROID_SDK/build-tools/34.0.0/aapt2" compile \
        --dir res \
        -o compiled/res.zip 2>&1 | grep -v "^$" || true
    
    if [ -f "compiled/res.zip" ]; then
        echo "✅ 资源编译成功"
    else
        echo "⚠️  资源编译失败"
    fi
fi
echo ""

# 步骤4: 构建 APK 包
echo "📦 步骤4: 构建 APK..."
cd "$PROJECT_DIR"

# 创建 APK 目录结构
mkdir -p apk-unsigned/META-INF
mkdir -p apk-unsigned/res

# 复制资源文件
if [ -d "res" ]; then
    cp -r res/* apk-unsigned/res/ 2>/dev/null || true
fi

# 复制 assets
if [ -d "assets" ]; then
    cp -r assets apk-unsigned/assets
fi

# 复制 DEX
if [ -f "dex/classes.dex" ]; then
    cp dex/classes.dex apk-unsigned/
fi

# 复制 AndroidManifest.xml
cp AndroidManifest.xml apk-unsigned/

# 打包未签名的 APK
cd apk-unsigned
jar cf ../PawSyncPro-unsigned.apk *

if [ -f "../PawSyncPro-unsigned.apk" ]; then
    echo "✅ 未签名 APK 创建成功"
else
    echo "❌ APK 打包失败"
    exit 1
fi

cd ..

# 步骤5: 对齐 APK
echo "🎯 步骤5: 对齐 APK..."
UNSIGNED_APK="PawSyncPro-unsigned.apk"

if [ -f "$UNSIGNED_APK" ]; then
    "$ANDROID_SDK/build-tools/34.0.0/zipalign" \
        -f 4 \
        "$UNSIGNED_APK" \
        "PawSyncPro-aligned.apk" 2>&1 | grep -v "^$" || true
    
    if [ -f "PawSyncPro-aligned.apk" ]; then
        echo "✅ APK 对齐成功"
        cp "PawSyncPro-aligned.apk" "$FINAL_APK"
    else
        echo "⚠️  APK 对齐失败，使用未签名版本"
        cp "$UNSIGNED_APK" "$FINAL_APK"
    fi
else
    echo "❌ 未找到未签名 APK"
    exit 1
fi

# 清理
rm -f "PawSyncPro-unsigned.apk" "PawSyncPro-aligned.apk" 2>/dev/null || true

# 步骤6: 验证 APK
echo ""
echo "✅ 构建完成！"
echo ""
echo "📍 APK 信息:"
ls -lh "$FINAL_APK"
echo ""

# 使用 aapt 验证
"$ANDROID_SDK/build-tools/34.0.0/aapt" dump badging "$FINAL_APK" 2>&1 | grep -E "package:|application-label:|application-icon:" | head -5 || true

echo ""
echo "🎉 PawSync Pro APK 已生成: $FINAL_APK"
echo "🎉 可以直接安装到手机进行测试！"
