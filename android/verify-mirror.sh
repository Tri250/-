#!/bin/bash
# 镜像源验证脚本
# 用于测试国内镜像源是否可用

echo "=========================================="
echo "Gradle镜像源验证工具"
echo "=========================================="

# 定义镜像源列表
declare -a MIRRORS=(
    "https://maven.aliyun.com/repository/google"
    "https://maven.aliyun.com/repository/public"
    "https://maven.aliyun.com/repository/central"
    "https://mirrors.cloud.tencent.com/nexus/repository/maven-public/"
    "https://repo.huaweicloud.com/repository/maven/"
)

# 测试文件（Android Gradle Plugin）
TEST_PATH="com/android/tools/build/gradle/8.13.0/gradle-8.13.0.pom"

echo ""
echo "测试镜像源可用性..."
echo "----------------------------------------"

SUCCESS_COUNT=0
FAIL_COUNT=0

for mirror in "${MIRRORS[@]}"; do
    echo -n "测试: $mirror ... "

    # 使用curl测试连接，超时10秒
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "${mirror}/${TEST_PATH}" 2>/dev/null)

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "307" ]; then
        echo "✅ 可用 (HTTP $HTTP_CODE)"
        ((SUCCESS_COUNT++))
    else
        echo "❌ 不可用 (HTTP $HTTP_CODE)"
        ((FAIL_COUNT++))
    fi
done

echo ""
echo "----------------------------------------"
echo "验证结果: 成功 $SUCCESS_COUNT / 失败 $FAIL_COUNT"
echo "----------------------------------------"

# 测试Gradle下载
echo ""
echo "测试Gradle分发服务器..."
GRADLE_URL="https://services.gradle.org/distributions/gradle-8.13-bin.zip"
echo -n "测试: $GRADLE_URL ... "

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 -r 0-0 "$GRADLE_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ 可用 (HTTP $HTTP_CODE)"
else
    echo "❌ 不可用 (HTTP $HTTP_CODE)"
fi

echo ""
echo "=========================================="
echo "验证完成"
echo "=========================================="

# 返回状态
if [ $SUCCESS_COUNT -gt 0 ]; then
    exit 0
else
    exit 1
fi
