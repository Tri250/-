#!/usr/bin/env bash
# 发一个版本：改版本号 → 编译 → 提交打 tag → 创建 GitHub Release 并上传 APK。
#
#   tools/release.sh <versionName> <versionCode> [说明]
#   tools/release.sh 1.0.2 102 "修复充电曲线在深色下的对比度"
#
# 依赖：gh（已登录）、git（已配 remote origin）。
set -euo pipefail

VERSION="${1:?用法: tools/release.sh <versionName> <versionCode> [说明]}"
CODE="${2:?用法: tools/release.sh <versionName> <versionCode> [说明]}"
NOTES="${3:-BatteryData ${VERSION}}"

cd "$(dirname "$0")/.."

TAG="v${VERSION}"
OUT="build/release/BatteryData-${VERSION}.apk"

echo "==> 版本 ${VERSION} (${CODE})"
sed -i "s/versionName = \"[^\"]*\"/versionName = \"${VERSION}\"/" app/build.gradle.kts
sed -i "s/versionCode = [0-9]\+/versionCode = ${CODE}/" app/build.gradle.kts

echo "==> 编译（release 变体，用 keystore.properties 里的密钥签名）"
./gradlew :app:assembleRelease

mkdir -p build/release
cp app/build/outputs/apk/release/app-release.apk "${OUT}"
echo "==> 安装包 ${OUT} ($(du -h "${OUT}" | cut -f1))"

echo "==> 提交"
git add -A
if git diff --cached --quiet; then
  echo "    没有改动，跳过提交"
else
  git commit -m "release: ${VERSION} (${CODE})"
fi

echo "==> 打 tag / 推送"
git tag -f "${TAG}"
git push origin HEAD
git push -f origin "${TAG}"

echo "==> 创建 Release"
if gh release view "${TAG}" >/dev/null 2>&1; then
  gh release upload "${TAG}" "${OUT}" --clobber
else
  gh release create "${TAG}" "${OUT}" --title "${TAG}" --notes "${NOTES}"
fi

echo "==> 完成：https://github.com/Tri250/-/releases/tag/${TAG}"
