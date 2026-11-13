/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Copy, Check, FileCode, Terminal, Download, ShieldCheck, Cpu } from 'lucide-react';

interface CodeFileItem {
  id: string;
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

// 单一数据源：内嵌源码与仓库真实文件保持同步（NativeAndroidProjectHub 亦复用此数组）
export const NATIVE_CODE_FILES: CodeFileItem[] = [
  {
    id: 'github_actions',
    name: 'build-apk.yml (GitHub 自动编译)',
    path: '.github/workflows/build-apk.yml',
    language: 'yaml',
    description: 'GitHub Actions CI/CD 实际流水线（Android Release 签名构建 + 安装属性/签名自检 + Web 演示端构建 + 标签触发 Release 发布，与仓库真实配置同步）',
    code: `name: Build & Release Android APK

on:
  push:
    branches:
      - main
      - master
    tags:
      - 'v*'
  pull_request:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: write

# 同一 ref 的流水线串行执行，避免并发发布相互覆盖 Release 资产
concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: false

env:
  ANDROID_HOME: /usr/local/lib/android/sdk
  ANDROID_SDK_ROOT: /usr/local/lib/android/sdk

jobs:
  # ============================================================
  # Android 原生端：编译 Release APK（R8 混淆 + 资源收缩 + 正式签名）+ 安装属性自检
  # 签名密钥经 GitHub Secrets 注入（KEYSTORE_BASE64 等），缺失时回退 debug 签名
  # ============================================================
  android:
    name: Android APK 构建
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          # v1.2.6 P3 审计修复：完整提交历史——发布提交记录与差异核验依赖完整 reflog
          fetch-depth: 0

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          # v2.0.0-alpha 批次G：AGP 8.10.1 要求 Gradle 8.11.1+
          gradle-version: '8.11.1'

      - name: Ensure Android SDK Components
        run: |
          if [ -d "$ANDROID_HOME/cmdline-tools/latest/bin" ]; then
            yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1 || true
            $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" || true
          elif [ -d "$ANDROID_HOME/tools/bin" ]; then
            yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses > /dev/null 2>&1 || true
          fi

      # 解码 release 签名密钥（GitHub Secrets 注入）；未配置时回退 debug 签名
      - name: Decode Release Keystore
        env:
          KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: |
          if [ -n "$KEYSTORE_BASE64" ]; then
            echo "$KEYSTORE_BASE64" | base64 -d > "$GITHUB_WORKSPACE/release.keystore"
            echo "KEYSTORE_FILE=$GITHUB_WORKSPACE/release.keystore" >> "$GITHUB_ENV"
            echo "KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD" >> "$GITHUB_ENV"
            echo "KEY_ALIAS=$KEY_ALIAS" >> "$GITHUB_ENV"
            echo "KEY_PASSWORD=$KEY_PASSWORD" >> "$GITHUB_ENV"
            echo "keystore_available=true" >> "$GITHUB_ENV"
            echo "Release keystore decoded."
          else
            echo "keystore_available=false" >> "$GITHUB_ENV"
            echo "::warning::KEYSTORE_BASE64 secret not set, falling back to debug signing"
          fi

      - name: Ensure Gradle Wrapper Executable
        run: |
          cd android
          chmod +x gradlew

      # 启动闪退回归测试 (Robolectric，无模拟器)：
      # 覆盖 Activity 启动 -> ViewModel 构造 -> 粘性广播回调 -> Compose 首帧渲染全链路，
      # 任何一环抛异常都会导致安装后启动闪退，测试失败即阻断发布
      # v1.2.6 P1 审计修复：移除 \`|| gradle\` 系统兜底——runner 系统 Gradle (9.x) 与
      # AGP 8.7.2 不兼容，兜底只会把真实的 wrapper 失败转换成另一个更难排查的错误，
      # 还可能掩盖构建缺陷 (假绿灯)；统一强制走 wrapper 单一入口
      - name: Run Startup Crash Regression Tests (Robolectric)
        run: |
          cd android
          ./gradlew testDebugUnitTest --no-daemon --stacktrace

      - name: Build Release APK (R8 minified + signed)
        run: |
          cd android
          ./gradlew assembleRelease --stacktrace --no-daemon

      - name: Locate Generated APK
        id: find_apk
        run: |
          APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" 2>/dev/null | head -n 1)
          if [ -z "$APK_PATH" ]; then
            APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" 2>/dev/null | head -n 1)
          fi
          if [ -z "$APK_PATH" ]; then
            APK_PATH=$(find . -name "*.apk" | head -n 1)
          fi
          if [ -z "$APK_PATH" ]; then
            echo "::error::No APK found"
            exit 1
          fi
          echo "Found APK at: $APK_PATH"
          echo "apk_path=$APK_PATH" >> $GITHUB_OUTPUT

      # v1.2.6 P1 审计修复：Release DEX 反射实例化冒烟——testDebugUnitTest 只跑 debug
      # 未混淆变体，无法暴露 R8 全量混淆后 ViewModel 反射构造器被裁剪 (启动即崩溃)
      # 的最坏情形；此步解包 release APK，断言混淆映射存在、映射后的 ViewModel 类
      # 在 DEX 中、且 (Application) 反射构造器签名被保留
      - name: Release DEX ViewModel Constructor Smoke Check
        run: |
          APK_PATH="\${{ steps.find_apk.outputs.apk_path }}"
          MAPPING="android/app/build/outputs/mapping/release/mapping.txt"
          if [ ! -s "$MAPPING" ]; then
            echo "::error::R8 mapping.txt missing — release build must emit obfuscation mapping"
            exit 1
          fi
          VM_LINE=$(grep -m1 "com.battery.master.viewmodel.BatteryViewModel -> " "$MAPPING")
          if [ -z "$VM_LINE" ]; then
            echo "::error::BatteryViewModel missing from mapping.txt"
            exit 1
          fi
          # mapping 行格式: \`original -> renamed:\`，混淆名在第 3 列
          RENAMED=$(echo "$VM_LINE" | awk '{print $3}' | sed 's/:$//' | tr '.' '/')
          grep -q "void <init>(android.app.Application)" "$MAPPING" || {
            echo "::error::BatteryViewModel (Application) constructor not retained by R8 keep rules"
            exit 1
          }
          echo "BatteryViewModel renamed to: $RENAMED"
          DEXDUMP=$(find "$ANDROID_HOME/build-tools" -name dexdump -type f | sort -V | tail -n 1)
          if [ -z "$DEXDUMP" ]; then
            echo "::error::dexdump not found in build-tools"
            exit 1
          fi
          TMP_DEX_DIR=$(mktemp -d)
          unzip -o -q "$APK_PATH" "classes*.dex" -d "$TMP_DEX_DIR"
          DEX_DUMP_OUT="$TMP_DEX_DIR/dexdump.txt"
          : > "$DEX_DUMP_OUT"
          for D in "$TMP_DEX_DIR"/classes*.dex; do
            "$DEXDUMP" "$D" >> "$DEX_DUMP_OUT" 2>/dev/null || true
          done
          grep -q "'L\${RENAMED};'" "$DEX_DUMP_OUT" || {
            echo "::error::Renamed ViewModel class '$RENAMED' not found in release DEX"
            exit 1
          }
          grep -q "(Landroid/app/Application;)V" "$DEX_DUMP_OUT" || {
            echo "::error::(Application) constructor signature stripped from release DEX"
            exit 1
          }
          echo "Release DEX smoke check passed: ViewModel class + (Application) constructor retained."

      # R8 混淆映射归档：崩溃堆栈反解 (deobfuscation) 必需，随构建 artifact 一并产出
      - name: Upload R8 Mapping Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Android-Battery-Master-R8-Mapping
          path: android/app/build/outputs/mapping/release/mapping.txt
          retention-days: 30

      # 安装属性自检：校验包名 / 版本号 / 启动 Activity / 应用图标齐全，
      # 与"安装与卸载"审计项对应，属性缺失直接让流水线失败。
      # 版本号从 build.gradle.kts 动态解析（单一事实来源），并在 v* 标签触发时
      # 强制校验 tag 与 versionName 一致，杜绝"tag 与包内版本不一致"的错版发布
      - name: Verify APK Install Metadata (aapt2 badging)
        run: |
          APK_PATH="\${{ steps.find_apk.outputs.apk_path }}"
          VERSION_NAME=$(grep -m1 'versionName' android/app/build.gradle.kts | sed -E "s/.*\\"([^\\"]+)\\".*/\\1/")
          VERSION_CODE=$(grep -m1 'versionCode' android/app/build.gradle.kts | sed -E "s/.*= *([0-9]+).*/\\1/")
          if [ -z "$VERSION_NAME" ] || [ -z "$VERSION_CODE" ]; then
            echo "::error::Failed to parse versionName/versionCode from build.gradle.kts"
            exit 1
          fi
          echo "Expecting versionName=$VERSION_NAME versionCode=$VERSION_CODE"
          AAPT=$(find "$ANDROID_HOME/build-tools" -name aapt2 -type f | sort -V | tail -n 1)
          if [ -z "$AAPT" ]; then
            echo "::warning::aapt2 not found, skipping metadata verification"
            exit 0
          fi
          "$AAPT" dump badging "$APK_PATH" > apk-badging.txt || { echo "::error::aapt2 dump badging failed"; exit 1; }
          head -n 20 apk-badging.txt
          grep -q "package: name='com.battery.master'" apk-badging.txt || { echo "::error::Unexpected applicationId"; exit 1; }
          grep -q "versionName='$VERSION_NAME'" apk-badging.txt || { echo "::error::APK versionName does not match build.gradle.kts ($VERSION_NAME)"; exit 1; }
          grep -q "versionCode='$VERSION_CODE'" apk-badging.txt || { echo "::error::APK versionCode does not match build.gradle.kts ($VERSION_CODE)"; exit 1; }
          grep -q "launchable-activity" apk-badging.txt || { echo "::error::Missing launcher activity"; exit 1; }
          grep -q "application-icon-320" apk-badging.txt || { echo "::error::Missing launcher icons"; exit 1; }
          grep -q "application-label:'电池大师'" apk-badging.txt || { echo "::error::Unexpected app label"; exit 1; }
          if [[ "\${GITHUB_REF}" == refs/tags/v* ]]; then
            TAG_VERSION="\${GITHUB_REF#refs/tags/v}"
            if [ "$TAG_VERSION" != "$VERSION_NAME" ]; then
              echo "::error::Tag v$TAG_VERSION does not match versionName $VERSION_NAME — bump build.gradle.kts and re-tag"
              exit 1
            fi
            echo "Tag version consistency verified: v$TAG_VERSION == versionName $VERSION_NAME."
          fi
          echo "APK install metadata verified."

      # 签名校验：无条件执行 apksigner verify（v1.2.4 P3 审计修复）——
      # 旧实现仅在 keystore_available=true 时执行，debug 签名兜底的产物可跳过
      # 签名校验并以 release 产物名义发布；现 debug 兜底时也校验签名完整性，
      # 并显式告警披露签名类型，不再静默冒充正式签名
      - name: Verify APK Signature (apksigner)
        run: |
          APK_PATH="\${{ steps.find_apk.outputs.apk_path }}"
          APKSIGNER=$(find "$ANDROID_HOME/build-tools" -name apksigner -type f | sort -V | tail -n 1)
          if [ -z "$APKSIGNER" ]; then
            echo "::warning::apksigner not found, skipping signature verification"
            exit 0
          fi
          # v1.2.6 P2 审计修复：先落盘再截断——旧实现 \`| head -n 10\` 双重缺陷：
          # head 提前退出触发 SIGPIPE 截断 apksigner 输出，且管道退出码取 head (恒 0)，
          # apksigner 真实校验失败会被吞掉 (假绿灯)
          "$APKSIGNER" verify --verbose "$APK_PATH" > apk-signature.txt 2>&1 || { echo "::error::APK signature verification failed"; exit 1; }
          head -n 10 apk-signature.txt
          if [ "\${{ env.keystore_available }}" = "true" ]; then
            echo "APK signature verified (release keystore)."
          else
            echo "::warning::APK is debug-signed (release keystore not configured). Artifact will be named *-debug.apk and release notes disclose the debug signing."
          fi

      # 版本化命名：从 build.gradle.kts 解析 versionName，产物文件名携带版本，便于安装与归档
      - name: Rename APK with Version Name
        id: rename_apk
        run: |
          VERSION_NAME=$(grep -m1 'versionName' android/app/build.gradle.kts | sed -E "s/.*\\"([^\\"]+)\\".*/\\1/")
          if [ -z "$VERSION_NAME" ]; then
            echo "::error::Failed to parse versionName from build.gradle.kts"
            exit 1
          fi
          if [ "\${{ env.keystore_available }}" = "true" ]; then SUFFIX="release"; else SUFFIX="debug"; fi
          APK_PATH="\${{ steps.find_apk.outputs.apk_path }}"
          NEW_NAME="Android-Battery-Master-v\${VERSION_NAME}-\${SUFFIX}.apk"
          mv "$APK_PATH" "$NEW_NAME"
          echo "version_name=$VERSION_NAME" >> $GITHUB_OUTPUT
          echo "renamed_apk=$NEW_NAME" >> $GITHUB_OUTPUT

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Android-Battery-Master-APK
          path: \${{ steps.rename_apk.outputs.renamed_apk }}
          retention-days: 30

  # ============================================================
  # Web 演示端：TypeScript 静态检查 + Vite 构建 + 产物校验 + 打包
  # ============================================================
  web:
    name: Web 演示端构建
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies (npm ci)
        run: npm ci

      - name: TypeScript Static Check
        run: npx tsc --noEmit

      - name: Build Web Demo (Vite)
        run: npm run build

      # 产物自检：入口 HTML 与编译资产必须存在且非空，防止空壳构建被发布
      - name: Verify Web Dist Output
        run: |
          if [ ! -s dist/index.html ]; then
            echo "::error::dist/index.html missing or empty"
            exit 1
          fi
          ASSET_COUNT=$(find dist/assets -type f | wc -l)
          if [ "$ASSET_COUNT" -lt 2 ]; then
            echo "::error::Expected JS and CSS assets in dist/assets, found $ASSET_COUNT"
            exit 1
          fi
          # v1.2.6 P1 审计修复：vite base './' 后入口必须引用相对路径资源，
          # 绝对路径 (src="/assets/...") 在 file:// 直开与子路径部署下白屏
          if grep -qE '(src|href)="/[^/]' dist/index.html; then
            echo "::error::dist/index.html contains absolute asset paths (expect relative base './')"
            exit 1
          fi
          echo "Web dist verified: index.html + $ASSET_COUNT asset files (relative paths, file:// compatible)."

      - name: Package Web Dist
        run: |
          cd dist
          zip -r ../web-demo-dist.zip .
          cd ..

      - name: Upload Web Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Android-Battery-Master-Web-Demo
          path: web-demo-dist.zip
          retention-days: 30

  # ============================================================
  # 发布：仅在推送 v* 标签时创建 GitHub Release
  # 产物 = Android Release APK（版本化命名）+ Web 演示端 dist 打包 + SHA256 校验和
  # 版本信息从 build.gradle.kts 动态解析，发布说明随版本自动更新
  # ============================================================
  release:
    name: 发布 GitHub Release
    needs: [android, web]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # 版本解析：以 build.gradle.kts 为单一事实来源，注入发布说明与安装指引
      - name: Resolve Release Version
        id: version
        run: |
          VERSION_NAME=$(grep -m1 'versionName' android/app/build.gradle.kts | sed -E "s/.*\\"([^\\"]+)\\".*/\\1/")
          VERSION_CODE=$(grep -m1 'versionCode' android/app/build.gradle.kts | sed -E "s/.*= *([0-9]+).*/\\1/")
          if [ -z "$VERSION_NAME" ] || [ -z "$VERSION_CODE" ]; then
            echo "::error::Failed to parse versionName/versionCode from build.gradle.kts"
            exit 1
          fi
          TAG_VERSION="\${GITHUB_REF#refs/tags/v}"
          if [ "$TAG_VERSION" != "$VERSION_NAME" ]; then
            echo "::error::Tag v$TAG_VERSION does not match versionName $VERSION_NAME"
            exit 1
          fi
          echo "version_name=$VERSION_NAME" >> $GITHUB_OUTPUT
          echo "version_code=$VERSION_CODE" >> $GITHUB_OUTPUT
          echo "Release version resolved: v$VERSION_NAME (versionCode=$VERSION_CODE)"

      # v2.0.0-alpha 批次G：alpha/beta/rc/dev 版本自动标记 GitHub Release 为预发布
      - name: Resolve Pre-release Flag
        id: prerelease
        run: |
          VERSION_NAME="\${{ steps.version.outputs.version_name }}"
          if [[ "$VERSION_NAME" =~ (alpha|beta|rc|dev) ]]; then
            echo "prerelease=true" >> "$GITHUB_OUTPUT"
          else
            echo "prerelease=false" >> "$GITHUB_OUTPUT"
          fi
          echo "Pre-release flag: $(grep -o 'prerelease=.*' "$GITHUB_OUTPUT" | cut -d= -f2)"

      - name: Download Android APK
        uses: actions/download-artifact@v4
        with:
          name: Android-Battery-Master-APK
          path: artifacts/

      # v1.2.4 P3 审计修复：解析实际 APK 文件名与签名类型（release 密钥缺失时
      # 兜底 debug 签名，产物名 *-debug.apk），发布说明不再硬编码
      # "-release.apk / 正式 Release 签名"——debug 兜底包不再冒充正式签名发布
      - name: Resolve APK File Name And Signing Mode
        id: apkfile
        run: |
          APK_FILE=$(ls artifacts/*.apk | xargs -n1 basename)
          echo "apk_file=$APK_FILE" >> "$GITHUB_OUTPUT"
          if [[ "$APK_FILE" == *-debug.apk ]]; then
            echo "signing_label=Debug 签名 (兜底，正式密钥未配置)" >> "$GITHUB_OUTPUT"
            echo "signing_table=Android 原生 APK（**Debug 签名兜底**——正式密钥未配置，包体完整且可安装，但以 debug 密钥签名）" >> "$GITHUB_OUTPUT"
          else
            echo "signing_label=正式 Release 签名" >> "$GITHUB_OUTPUT"
            echo "signing_table=Android 原生 APK（**正式 Release 签名**，R8 混淆 + 资源收缩，可直接安装）" >> "$GITHUB_OUTPUT"
          fi
          echo "Resolved APK file: $APK_FILE"

      - name: Download Web Demo
        uses: actions/download-artifact@v4
        with:
          name: Android-Battery-Master-Web-Demo
          path: artifacts/

      # 完整性校验：为全部发布资产生成 SHA256SUMS，供下载方验证
      - name: Generate SHA256 Checksums
        run: |
          cd artifacts
          find . -type f \\( -name '*.apk' -o -name '*.zip' \\) -print0 | xargs -0 sha256sum > SHA256SUMS.txt
          cat SHA256SUMS.txt

      - name: Publish GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          # 中文发布说明（安装/卸载/权限/五维自检摘要），版本号全部动态注入 + 自动追加的提交记录
          body: |
            ## Android Battery Master v\${{ steps.version.outputs.version_name }}

            专业的安卓电池充放电监测工具：**12 项核心充放电指标**全量实时遥测（健康度 / 剩余电量 / 当前容量 / 设计容量 / 电量百分比 / 电池状态 / 温度 / 健康状况 / 电压 / 循环计数 / 瞬时电流 / 完全充满容量），底层基于 Android BatteryManager、粘性广播与 Linux sysfs 真实硬件通道。

            ### 发布资产
            | 资产 | 说明 |
            | --- | --- |
            | \`\${{ steps.apkfile.outputs.apk_file }}\` | \${{ steps.apkfile.outputs.signing_table }} |
            | \`web-demo-dist.zip\` | Web 演示端静态产物（解压后任意静态服务器托管，或直接用浏览器打开 \`index.html\`） |
            | \`SHA256SUMS.txt\` | 全部资产 SHA256 校验和 |

            ### 安装说明
            1. 下载 APK 后在设备上点击安装（需在系统设置中允许"安装未知来源应用"）。签名类型：**\${{ steps.apkfile.outputs.signing_label }}**。
            2. 首次启动授予**零运行时权限**：应用不申请任何敏感权限，安装后即可使用全部功能。
            3. 覆盖安装：版本号 \`versionCode=\${{ steps.version.outputs.version_code }}\` 单调递增，直接安装即可覆盖旧版（含 v1.0.0，versionCode=1），数据不丢失。

            ### 卸载说明
            - 常规卸载：系统设置 → 应用管理 → 电池大师 → 卸载， SharedPreferences 与应用数据随包体一并清除，无残留。
            - 备份策略：已配置 \`dataExtractionRules\` 与 \`fullBackupContent\` 排除全部应用数据，云备份与换机传输均不会携带本应用数据。

            ### 权限说明
            - 应用声明权限数：**0**（无运行时权限、无危险权限）。
            - 合并后清单含 1 个 AndroidX 框架自动注入的**签名级内部权限**（\`androidx.core.content.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION\`，protectionLevel=signature，仅用于框架内部广播保护，不向用户呈现、不涉及隐私）。
            - 电池指标全部来自公开系统 API（BatteryManager 属性 / \`ACTION_BATTERY_CHANGED\` 广播）与 sysfs 节点，无需任何授权。

            ### 五维自检摘要
            - **稳定性**：广播注册/注销全容错（异常 ROM 下退化为轮询通道不崩溃）、系统服务安全转换、空安全与除零防护、Gradle 分发下载超时放宽至 120s。
            - **性能**：Compose 单数据源 1Hz 刷新、双通道（广播+轮询）共享 Reader 配置避免重复解析、Web 遥测定时器 ref 化消除每拍重建。
            - **兼容性**：minSdk 26 / targetSdk 35，API 31+/34+ 分级适配（SoC 型号、循环计数）、中文字体回退栈、\`prefers-reduced-motion\` 无障碍支持。
            - **权限管理**：0 运行时权限，备份规则显式排除应用数据。
            - **安装卸载**：\`applicationId=com.battery.master\`、\`versionCode=\${{ steps.version.outputs.version_code }}\` 单调递增支持覆盖安装、自适应图标（anydpi-v26 + 五密度 PNG 兜底）、版本化产物命名、CI 安装属性自检（aapt2 badging）与 tag↔versionName 一致性校验。

            ### 👨‍💻 开发者
            - **某厂大牛马【带娃的小陈工】** — 抖音 / 小红书 平台

            ---
            *以下为自动生成的提交记录*
          generate_release_notes: true
          draft: false
          # v2.0.0-alpha 批次G：预发布版本 (alpha/beta/rc/dev) 自动标记 prerelease
          prerelease: \${{ steps.prerelease.outputs.prerelease }}
          fail_on_unmatched_files: true
          files: |
            artifacts/*.apk
            artifacts/*.zip
            artifacts/SHA256SUMS.txt
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
  },
  {
    id: 'reader',
    name: 'BatteryHardwareReader.kt',
    path: 'android/app/src/main/java/com/battery/master/service/BatteryHardwareReader.kt',
    language: 'kotlin',
    description: '核心硬件采集：经 BatteryTelemetryParser 单一解析实现提取 12 项指标，含三态充满判定与锁定持久化',
    code: `package com.battery.master.service

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict

/**
 * Android 原生底层硬件与电量计 HAL 读取器
 * 负责通过 Android BatteryManager、Intent 以及 Linux sysfs 读取真实的 12 项充放电指标
 *
 * 启动闪退治理：本类是启动路径 (ViewModel 构造 -> 首次遥测 -> 粘性广播回调) 的核心，
 * 任何 OEM ROM 的硬件服务异常 (BatteryManager 缺失、PowerProfile 反射抛 Error、
 * sysfs 不可读、SharedPreferences 损坏、registerReceiver 被 ROM 拒绝) 都可能引发崩溃。
 * 因此所有外部依赖访问均以 Throwable 级兜底 + 最后已知状态降级，保证进程永不因此退出。
 */
class BatteryHardwareReader(private val context: Context) {

    /**
     * BatteryManager 安全获取：部分定制 ROM/模拟器可能缺失 BATTERY_SERVICE，
     * 非空强转 (as) 会直接 NPE 导致启动闪退，故使用安全转换 + 可空引用
     */
    private val batteryManager: BatteryManager? =
        try {
            context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        } catch (e: Throwable) {
            null
        }

    // 满电容量持久化：指标 12 锁定值跨进程重启保留
    private val prefs = try {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    } catch (e: Throwable) {
        null
    }

    // 指标 04 设计容量来源等级 (v1.2.3 健康度真实性审计)：
    // 必须在 designCapacityMah 之前声明——getDesignCapacity 在其初始化期写入命中等级，
    // 声明顺序错误会导致来源被随后的默认值覆盖
    var designCapacitySource: CapacitySource = CapacitySource.FALLBACK

    // 默认或从数据库读取的出厂设计容量 (mAh)：构造时从系统解析一次，之后可被用户覆盖
    // (Receiver 事件通道共享此值，保证轮询/广播双通道数据一致，用户设置不被广播覆盖)
    // v1.2.3 P1 审计修复：用户校准值持久化到 SharedPreferences——
    // 旧实现为纯内存 var，总览页"校准设计容量"重启即丢，与按钮/对话框文案暗示的
    // "持久校准"语义不符。校准链优先级：用户校准(持久) > PowerProfile > sysfs > 兜底
    var designCapacityMah: Int = runCatching { getDesignCapacity(context) }
        .getOrDefault(FALLBACK_DESIGN_CAPACITY)
        set(value) {
            field = value
            // 校准值持久化：经 VM 区间校验 (500~25000) 后写入，重启恢复。
            // suppressCapacityPersist = true 时 (clearDesignCapacityCalibration
            // 重新解析系统链) 禁止写回，否则会复活刚删除的用户校准 key
            if (!suppressCapacityPersist) {
                runCatching {
                    prefs?.edit()?.putInt(KEY_USER_DESIGN_CAPACITY, value)?.apply()
                }
            }
        }

    // 重新解析系统回退链时抑制校准值持久化 (仅 clearDesignCapacityCalibration 路径)
    private var suppressCapacityPersist = false

    // 记录上一轮充满锁定的容量 (从持久化恢复)
    private var lastRecordedFullCapacity: Int? =
        runCatching { prefs?.getInt(KEY_LAST_FULL_CAPACITY, -1)?.takeIf { it > 0 } }.getOrNull()

    // 上一次满足充满判定条件的时间戳 (广播通道共享读取，与锁定容量同源)
    var lastFullChargeTimestamp: Long? =
        runCatching { prefs?.getLong(KEY_LAST_FULL_TIMESTAMP, -1L)?.takeIf { it > 0 } }.getOrNull()

    // v1.2.3 P0 审计修复："一键模拟完全充满"演示值与真实锁定分离存储。
    // 旧实现把演示值 persistFullChargeCapacity 写进真实锁定 key，导致用户点一次
    // 演示按钮，指标 12 永久显示假容量且跨重启存在，与实验室"充满校准"场景
    // (不写盘) 语义两套。现演示值写独立 key，仅在无真实锁定时兜底展示并标 SIMULATED
    private var simulatedFullCapacity: Int? =
        runCatching { prefs?.getInt(KEY_SIMULATED_FULL_CAPACITY, -1)?.takeIf { it > 0 } }.getOrNull()

    private var simulatedFullTimestamp: Long? =
        runCatching { prefs?.getLong(KEY_SIMULATED_FULL_TIMESTAMP, -1L)?.takeIf { it > 0 } }.getOrNull()

    // 是否处于充满判定区间内 (100% 且 0-25mA)：用于写盘去重，
    // 避免满足条件期间每秒遥测轮询重复写 SharedPreferences
    private var wasInFullChargeBand = false

    // 最后一次成功读取的完整遥测：读取异常时降级返回，UI 不白屏不崩溃
    private var lastKnownState: BatteryState? = null

    /**
     * 读取最新的电池遥测数据 (全链路 Throwable 兜底，异常时降级到最后已知态)
     */
    fun readBatteryTelemetry(): BatteryState = try {
        readBatteryTelemetryInternal().also { lastKnownState = it }
    } catch (e: Throwable) {
        // 采集链路任何环节异常 (ROM 服务缺失/sysfs 拒绝等)：
        // 返回最后已知态或安全默认值，保证 UI 与轮询协程不崩溃
        lastKnownState ?: buildSafeDefaultState()
    }

    private fun readBatteryTelemetryInternal(): BatteryState {
        // 粘性广播查询：部分 ROM 会对此抛异常，必须兜底
        val batteryIntent: Intent? = try {
            context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        } catch (e: Throwable) {
            null
        }

        // 12 项指标统一经共享解析器提取 (与广播通道 BatteryReceiver 单一实现，语义零漂移)
        val raw = BatteryTelemetryParser.parse(
            batteryIntent,
            batteryManager,
            designCapacityMah,
            designCapacitySource
        )

        // v2.0.0-alpha 批次B：轮询通道喂样健康引擎 (ΔV/ΔI 内阻滑窗 + 温度 EWMA)，
        // 与广播通道共享同一进程级样本窗口
        BatteryHealthEngine.observe(raw)

        // 12. 完全充满时的容量：满足判定则锁定+持久化，未满足保留上次锁定值不抹除
        // 注意：必须先执行锁定 (内部可能刷新时间戳) 再读取 lastFullChargeTimestamp
        // v1.2.6 P2 审计修复：充电态判定单源——直接消费解析器输出的 raw.isCharging
        // (含 EXTRA_PLUGGED 通道判定)，与广播通道完全一致，消除本地重复推导漂移
        lockFullChargeIfCriteriaMet(raw.currentCapacityMah, raw.percentage, raw.currentMa, raw.isCharging)
        // v1.2.3 P0 审计修复：真实锁定 (REAL) 与模拟演示值 (SIMULATED) 分离，
        // 真实优先，无真实锁定时才回显演示值并标注来源
        val display = resolveFullChargeDisplay()

        return raw.toBatteryState(display.capacityMah, display.timestampMs, display.source)
    }

    /**
     * v1.2.3 P0 审计修复：指标 12 展示值解析——真实锁定优先，模拟演示值兜底
     *
     * 真实锁定 (lockFullChargeIfCriteriaMet 判定) 与"一键模拟完全充满"演示值
     * 分 key 存储，杜绝演示值冒充实测锁定跨重启存在；UI 依来源显式标注。
     */
    data class FullChargeDisplay(
        val capacityMah: Int?,
        val timestampMs: Long?,
        val source: FullChargeSource
    )

    fun resolveFullChargeDisplay(): FullChargeDisplay = when {
        lastRecordedFullCapacity != null ->
            FullChargeDisplay(lastRecordedFullCapacity, lastFullChargeTimestamp, FullChargeSource.REAL)
        simulatedFullCapacity != null ->
            FullChargeDisplay(simulatedFullCapacity, simulatedFullTimestamp, FullChargeSource.SIMULATED)
        else -> FullChargeDisplay(null, null, FullChargeSource.NONE)
    }

    /** 安全默认态：任何采集都不可用时 UI 仍有可渲染的中性数据 (保留已锁定的指标 12 不丢失) */
    private fun buildSafeDefaultState(): BatteryState {
        // v2.0.0-alpha.1 用户口径修正：采集全失败的降级态不再按 0.92 出厂保持率
        // 虚构"当前容量/健康度"——容量不可测 (0)、来源 UNAVAILABLE、健康度 0，
        // UI 显示"无法测算"。是多少就是多少，测不到就不展示。
        // v1.2.3 P0 审计修复：采集全失败时电流不可读 → 判定 CURRENT_UNAVAILABLE，
        // 不得谎报"已达充满判定"
        val display = resolveFullChargeDisplay()
        return BatteryState(
            designCapacityMah = designCapacityMah,
            designCapacitySource = designCapacitySource,
            currentCapacityMah = 0,
            hasMeasuredCapacity = false,
            // 降级态容量不可测算，来源标注 UNAVAILABLE，杜绝 UI 把估算值当实测展示
            currentCapacitySource = CapacitySource.UNAVAILABLE,
            healthPercentage = 0f,
            // v1.2.3 审计加固：采集全失败的降级态必须诚实——未知状态不得谎报"良好"，
            // 未充电不得谎报"充电中"，避免用户在无数据环境下被错误指标误导
            status = BatteryStatus.NOT_CHARGING,
            healthQuality = BatteryHealthQuality.UNKNOWN,
            remainingCapacityMah = 0,
            voltageMv = 4000,
            temperatureCelsius = 25.0f,
            percentage = 0,
            socModel = "平台 SoC 解析中",
            pmicModel = "平台级 PMIC 电源管理 [工程估算]",
            currentMa = null,
            isFullChargeConditionMet = false,
            fullChargeVerdict = FullChargeVerdict.CURRENT_UNAVAILABLE,
            fullChargeCapacityMah = display.capacityMah,
            lastFullChargeTimestamp = display.timestampMs,
            fullChargeSource = display.source
        )
    }

    /**
     * 持久化指标 12 的**真实**充满锁定容量与时间戳
     * 防御：容量/时间戳非法时拒绝写入，保留上一次有效锁定值，避免脏数据覆盖真实记录
     */
    fun persistFullChargeCapacity(capacityMah: Int, timestampMs: Long) {
        if (capacityMah <= 0 || timestampMs <= 0) return
        lastRecordedFullCapacity = capacityMah
        lastFullChargeTimestamp = timestampMs
        try {
            prefs?.edit()
                ?.putInt(KEY_LAST_FULL_CAPACITY, capacityMah)
                ?.putLong(KEY_LAST_FULL_TIMESTAMP, timestampMs)
                ?.apply()
        } catch (e: Throwable) {
            // 存储异常不阻塞内存锁定值的生效
        }
    }

    /**
     * v1.2.3 P0 审计修复：持久化"一键模拟完全充满"**演示值** (独立 key)
     *
     * 旧实现直接写真实锁定 key，用户点一次演示按钮指标 12 就永久显示假容量。
     * 现演示值仅在无真实锁定时兜底展示，UI 标注"来源：模拟"，并可被
     * [clearFullChargeRecords] 一键清除。
     */
    fun persistSimulatedFullChargeCapacity(capacityMah: Int, timestampMs: Long) {
        if (capacityMah <= 0 || timestampMs <= 0) return
        simulatedFullCapacity = capacityMah
        simulatedFullTimestamp = timestampMs
        try {
            prefs?.edit()
                ?.putInt(KEY_SIMULATED_FULL_CAPACITY, capacityMah)
                ?.putLong(KEY_SIMULATED_FULL_TIMESTAMP, timestampMs)
                ?.apply()
        } catch (e: Throwable) {
            // 存储异常不阻塞内存演示值的生效
        }
    }

    /**
     * v1.2.3 P0 审计修复：清除指标 12 全部锁定记录 (真实 + 模拟演示值)
     * 入口：充满判定卡"清除锁定记录"按钮，用户可随时消除演示/历史锁定值
     */
    fun clearFullChargeRecords() {
        lastRecordedFullCapacity = null
        lastFullChargeTimestamp = null
        simulatedFullCapacity = null
        simulatedFullTimestamp = null
        wasInFullChargeBand = false
        // v1.2.6 P2 审计修复：同步清空最后已知态快照——旧实现 lastKnownState 仍持有
        // 含旧锁定值的 BatteryState，清除记录后一旦采集异常降级返回该快照，
        // 指标 12 "已清除"的锁定容量/时间戳会复活回显
        lastKnownState = null
        try {
            prefs?.edit()
                ?.remove(KEY_LAST_FULL_CAPACITY)
                ?.remove(KEY_LAST_FULL_TIMESTAMP)
                ?.remove(KEY_SIMULATED_FULL_CAPACITY)
                ?.remove(KEY_SIMULATED_FULL_TIMESTAMP)
                ?.apply()
        } catch (e: Throwable) {
            // 存储异常不阻塞内存记录的清除
        }
    }

    /**
     * 指标 12 共享判定 (v1.2.3 P0 审计修复为三态 + 符号无关)：
     * 仅当 percentage == 100 且**充电态**下 |currentNow| ≤ 25 mA 浮充截止区间时，
     * 锁定并持久化完全充满容量 (同步刷新内存锁定时间戳)；
     * 未满足条件时保留上次锁定值，不因通道切换而丢失。
     * 轮询通道 (readBatteryTelemetry) 与广播通道 (BatteryReceiver) 共用，
     * 保证两通道指标 12 语义完全一致。
     *
     * v1.2.3 修复要点：
     * 1. currentNowMa 可空——设备不支持 CURRENT_NOW 时判定 CURRENT_UNAVAILABLE，
     *    旧实现归一化为 0 mA 使判定恒真、估算值被冒充实测锁定写盘；
     * 2. 符号无关 (|I|)——高通/三星部分内核充电上报负值，旧实现 [0,25] 永不成立；
     * 3. 附加充电态校验——防 100% 拔线放电时误判；
     * 4. 真实锁定后清除模拟演示值，杜绝演示记录长期干扰展示。
     *
     * 写盘去重：仅在进入判定区间的第一拍、或锁定容量发生变化时才持久化；
     * 容量守卫：currentCapacityMah 非法 (≤0) 时拒绝锁定，防止 sysfs 脏数据
     * 把 "0 mAh" 写入指标 12 与持久化存储。
     */
    fun lockFullChargeIfCriteriaMet(
        currentCapacityMah: Int,
        percentage: Int,
        currentNowMa: Int?,
        isCharging: Boolean = true
    ): Int? {
        val verdict = BatteryTelemetryParser.evaluateFullCharge(percentage, currentNowMa, isCharging)
        if (verdict == FullChargeVerdict.FULLY_CHARGED && currentCapacityMah > 0) {
            if (!wasInFullChargeBand || lastRecordedFullCapacity != currentCapacityMah) {
                persistFullChargeCapacity(currentCapacityMah, System.currentTimeMillis())
            }
            wasInFullChargeBand = true
            // 真实锁定生效后清除模拟演示值，避免演示记录长期干扰
            if (simulatedFullCapacity != null) {
                simulatedFullCapacity = null
                simulatedFullTimestamp = null
                runCatching {
                    prefs?.edit()
                        ?.remove(KEY_SIMULATED_FULL_CAPACITY)
                        ?.remove(KEY_SIMULATED_FULL_TIMESTAMP)
                        ?.apply()
                }
            }
            return currentCapacityMah
        }
        wasInFullChargeBand = false
        return lastRecordedFullCapacity
    }

    /**
     * 指标 04 设计容量回退链 (v1.2.3 P1 审计修复扩展为用户校准优先)：
     * 用户校准值 (SharedPreferences 持久化) -> PowerProfile 反射
     * -> sysfs charge_full_design -> 主流 5000mAh 兜底
     *
     * v1.2.3 审计加固：各级输出统一施加 MIN/MAX_PLAUSIBLE_CAPACITY_MAH (500~25000 mAh)
     * 合理区间校验 (与 BatteryTelemetryParser 单源一致)，任一级越界即降级下一级——
     * 杜绝单位异常/脏数据设计容量污染指标 01 (健康度分母)、02 (剩余电量基准)、
     * 03 (当前容量估算基准)。旧实现 PowerProfile 仅判 >0、sysfs 无任何区间校验，
     * mAh 上报内核会把 5000 mAh 误算成 5 mAh 并级联污染全部容量体系。
     *
     * v1.2.3 P1 修复：旧实现无用户校准恢复级——总览页"校准设计容量"写入的
     * 纯内存 var 重启即丢，与"持久校准"文案语义不符。现启动时优先读取
     * SharedPreferences 中经区间校验的校准值。
     *
     * 注意：PowerProfile 构造在部分 OEM ROM 上会抛出 ExceptionInInitializerError /
     * NoClassDefFoundError 等 Error (非 Exception)，必须按 Throwable 捕获，
     * 否则会直接引发启动闪退。
     */
    private fun getDesignCapacity(context: Context): Int {
        // 用户校准值 (持久化)：显式用户意图优先于系统推断
        val userCalibrated = runCatching {
            prefs?.getInt(KEY_USER_DESIGN_CAPACITY, -1)?.takeIf { it > 0 }
        }.getOrNull()
        if (userCalibrated != null &&
            userCalibrated in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH
        ) {
            designCapacitySource = CapacitySource.CALIBRATED
            return userCalibrated
        }

        try {
            val powerProfileClass = Class.forName("com.android.internal.os.PowerProfile")
            val constructor = powerProfileClass.getConstructor(Context::class.java)
            val powerProfile = constructor.newInstance(context)
            val getBatteryCapacityMethod = powerProfileClass.getMethod("getBatteryCapacity")
            val capacity = getBatteryCapacityMethod.invoke(powerProfile) as? Double
            if (capacity != null) {
                // 四舍五入保留精度 (截断丢 1mAh)；NaN/越界一律降级下一级
                val capacityMah = Math.round(capacity).toInt()
                if (capacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
                    designCapacitySource = CapacitySource.POWER_PROFILE
                    return capacityMah
                }
            }
        } catch (e: Throwable) {}

        // sysfs 规范单位 μAh：v2.0.0-alpha 批次A 改走多节点探测链 (含双单位归一化与区间校验)，
        // bms/maxfg/dc 平台的 charge_full_design 不在 battery 目录
        val sysfsDesign = BatterySysfs.readChargeFullDesign()
        if (sysfsDesign != null) {
            designCapacitySource = CapacitySource.SYSFS
            return sysfsDesign
        }

        designCapacitySource = CapacitySource.FALLBACK
        return FALLBACK_DESIGN_CAPACITY
    }

    /**
     * v1.2.3 P1 审计修复：清除用户校准值，恢复系统自动探测 (三级回退链)
     */
    fun clearDesignCapacityCalibration() {
        runCatching {
            prefs?.edit()?.remove(KEY_USER_DESIGN_CAPACITY)?.apply()
        }
        suppressCapacityPersist = true
        designCapacityMah = runCatching { getDesignCapacity(context) }
            .getOrDefault(FALLBACK_DESIGN_CAPACITY)
        suppressCapacityPersist = false
    }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_LAST_FULL_CAPACITY = "last_full_capacity_mah"
        private const val KEY_LAST_FULL_TIMESTAMP = "last_full_timestamp_ms"
        private const val KEY_SIMULATED_FULL_CAPACITY = "simulated_full_capacity_mah"
        private const val KEY_SIMULATED_FULL_TIMESTAMP = "simulated_full_timestamp_ms"
        private const val KEY_USER_DESIGN_CAPACITY = "user_design_capacity_mah"

        /** 设计容量兜底值：与 BatteryState 默认口径一致 */
        const val FALLBACK_DESIGN_CAPACITY = 5000
    }
}
`,
  },
  {
    id: 'compose',
    name: 'BatteryScreen.kt (Compose UI)',
    path: 'android/app/src/main/java/com/battery/master/ui/BatteryScreen.kt',
    language: 'kotlin',
    description: 'Jetpack Compose 原生界面（全量源码）：12 项指标卡片网格、硬件信息汇总与充满判定卡片',
    code: `package com.battery.master.ui

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import com.battery.master.ui.theme.DesignTokens
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.BuildConfig
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict
import com.battery.master.model.BatteryInfo
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BatteryScreen(
    viewModel: BatteryViewModel
) {
    // 经 BatteryInfo (BatteryState 业务别名) 消费 ViewModel 兼容别名 batteryInfo
    val state: BatteryInfo by viewModel.batteryInfo.collectAsState()

    // 指标 04 设计容量校准对话框开关 (激活 ViewModel.setDesignCapacity)。
    // 外壳层审计修复：rememberSaveable 保证旋转/折叠屏/字体变更等配置变更重建后
    // 对话框不丢失，用户输入上下文不被打断
    var showDesignCapacityDialog by rememberSaveable { mutableStateOf(false) }

    // 一键模拟充满保持期剩余秒数 (0 = 无模拟，UI 倒计时反馈)
    val simulationRemainingSec by viewModel.simulationRemainingSec.collectAsState()

    // v1.2.3 P1 审计修复：硬件实验室模拟态跨 Tab 可见——旧实现总览页完全不读
    // labOverride，用户切回总览后看到的是模拟数据却零提示，会把实验室模拟值
    // 当作真实电池状态阅读。现采集覆盖层状态，顶部显示警示横幅
    val labOverride by viewModel.labOverride.collectAsState()

    // 顶层双 Tab：状态总览 / 硬件实验室 (对齐 Web 端 AndroidNavBar 信息架构)。
    // 外壳层审计修复：rememberSaveable 保证配置变更重建后停留在当前 Tab，
    // 用户在硬件实验室的调试上下文不丢失
    var selectedTab by rememberSaveable { mutableStateOf(0) }
    // v2.0.0-alpha.1：对齐 Web 端 4 Tab 信息架构——总览 / 遥测分析 / 健康档案 / 硬件实验室
    // (Web 端的"原生源码/工程总览"属 Web 演示页说明性内容，不适用于 Android 端，不搬移)
    val tabTitles = listOf("状态总览", "遥测分析", "健康档案", "硬件实验室")

    Scaffold(
        containerColor = DesignTokens.BgDeep, // Deep Cyber AMOLED Black
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .background(DesignTokens.BrandPrimary, RoundedCornerShape(DesignTokens.RadiusChip))
                        )
                        Column {
                            Text(
                                text = "电池大师",
                                fontSize = DesignTokens.FontXl,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 2.sp,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                // 外壳层审计修复：副标题按真实运行 API 动态渲染。
                                // 旧实现硬编码 "Android 15"，在 minSdk 26~34 设备上宣称失实
                                text = "API \${android.os.Build.VERSION.SDK_INT} 电池管理服务 · 原生硬件遥测",
                                fontSize = DesignTokens.Font2xs,
                                color = DesignTokens.AccentCyanDark,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DesignTokens.BgSurface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // 顶部 Tab 导航条
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = DesignTokens.BgSurface,
                contentColor = DesignTokens.BrandPrimary,
                divider = {}
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        // 外壳层审计修复：heightIn(min) 替代固定 height，
                        // 系统字体缩放至最大档时 Tab 文本不再被裁剪 (无障碍)
                        modifier = Modifier.heightIn(min = 44.dp)
                    ) {
                        Text(
                            text = title,
                            fontSize = DesignTokens.FontXs,
                            fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                            fontFamily = FontFamily.Monospace,
                            color = if (selectedTab == index) DesignTokens.BrandPrimary else DesignTokens.TextTertiary
                        )
                    }
                }
            }

            // Tab 切换转场动画：淡入淡出 + 轻微缩放（与 Web animate-tab-in 对齐）
            Crossfade(
                targetState = selectedTab,
                animationSpec = tween(durationMillis = DesignTokens.DurationSlow),
                label = "tab-crossfade"
            ) { tab ->
            if (tab == 0) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. 顶部华丽核心环形仪表盘 (5. 电量百分比, 6. 电池状态, 2. 剩余电量, 11. 瞬时电流)
            item {
                CyberHeroBatteryCard(state)
            }

            // 1. 硬件实验室模拟态警示横幅 (P1 审计修复：跨 Tab 泄漏可视化)
            if (labOverride != null) {
                item {
                    LabSimulationBanner(onExit = { viewModel.exitLabMode() })
                }
            }

            // 2. 硬件信息汇总栏 (Hardware Information Summary Bar)
            item {
                HardwareSummaryCard(state, onCalibrateDesignCapacity = { showDesignCapacityDialog = true })
            }

            // 3. 特性 12 充满判定卡片 (100% 且充电态 |电流| ≤ 25 mA)
            item {
                FullChargeConditionCard(
                    state,
                    simulationRemainingSec = simulationRemainingSec,
                    onTriggerTest = { viewModel.triggerFullChargeSimulation() },
                    onClearRecords = { viewModel.clearFullChargeRecords() }
                )
            }

            // 4. 12 项充放电指标卡片网格列表
            item {
                Text(
                    text = "12 项充放电核心指标详情",
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.FontXs,
                    letterSpacing = 1.sp,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
                )
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "01",
                        title = "电池健康度",
                        // v2.0.0-alpha.1 用户口径修正：健康度是多少就是多少——
                        // 电量计节点不可读时显示"无法测算"，不再按 0.92 出厂保持率虚构
                        value = if (state.hasMeasuredCapacity)
                            "\${String.format(Locale.US, "%.1f", state.healthPercentage)}%" else "—",
                        // 标注容量来源——"sysfs 实测"为真实硬件状态，
                        // "不可测算"为无电量计节点时的诚实空态，不得虚构
                        sub = if (state.hasMeasuredCapacity) "实测健康度 [\${state.currentCapacitySource.label}]"
                              else "无法测算 [\${state.currentCapacitySource.label}]",
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.BrandPrimary else DesignTokens.TextTertiary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "02",
                        title = "剩余电量",
                        // v2.0.0-alpha.1：剩余电量口径基准=当前可用容量，容量不可测时同显 "—"
                        value = if (state.hasMeasuredCapacity) "\${state.remainingCapacityMah}" else "—",
                        unit = if (state.hasMeasuredCapacity) "mAh" else "",
                        // v1.2.4 P2 审计修复：双口径来源显式标注——"库仑计实测"
                        // (CHARGE_COUNTER) 与"百分比×容量估算"量纲基准不同，
                        // 机型间不可比、运行中切换会跳变，旧实现无任何口径标注
                        sub = if (state.hasMeasuredCapacity) "当前可用电荷量 [\${state.remainingCapacitySource.label}]"
                              else "无法测算 [容量未实测]",
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.AccentCyanDark else DesignTokens.TextTertiary
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "03",
                        title = "电池当前容量",
                        // v2.0.0-alpha.1：容量不可测显示 "—" (0 为非法哨兵，不再虚构估算值)
                        value = if (state.hasMeasuredCapacity) "\${state.currentCapacityMah}" else "—",
                        unit = if (state.hasMeasuredCapacity) "mAh" else "",
                        sub = if (state.hasMeasuredCapacity) "衰减后最大可用 [\${state.currentCapacitySource.label}]"
                              else "无法测算 [\${state.currentCapacitySource.label}]",
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.FeaturePurple else DesignTokens.TextTertiary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "04",
                        title = "电池设计容量",
                        value = "\${state.designCapacityMah}",
                        unit = "mAh",
                        sub = "出厂铭牌标称 [\${state.designCapacitySource.label}]",
                        accentColor = DesignTokens.InfoSky
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "05",
                        title = "电量百分比",
                        value = "\${state.percentage}",
                        unit = "%",
                        sub = "系统广播 EXTRA_LEVEL/SCALE",
                        accentColor = DesignTokens.BrandPrimary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "06",
                        title = "电池状态",
                        value = state.status.label,
                        sub = "Battery Status",
                        accentColor = DesignTokens.InfoSky
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "07",
                        title = "电池温度",
                        // v1.2.3 审计修复：温度主值经 Locale.US 锚定——德语等逗号
                        // 小数点 Locale 下 Float.toString 渲染 "32,6°C"，与全屏
                        // 数值口径割裂；精度 0.1°C 与解析器一致
                        value = String.format(Locale.US, "%.1f", state.temperatureCelsius),
                        unit = "°C",
                        // v1.2.4 P2 审计修复：温度分级阈值与温控节流态单源 (解析器常量)，
                        // 旧实现 >45/≥38 与节流态 ≥44/≥38.5 打架 (44~45℃ 标签"过热急停"
                        // 而卡片仅"偏热预警"、38~38.5℃ 反之，同屏自相矛盾)
                        sub = when {
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
                                "严重发热 (≥\${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                                "偏热预警 (\${BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt()}-\${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                            state.temperatureCelsius <= 0 -> "过冷保护 (≤0°C)"
                            else -> "温度正常"
                        },
                        accentColor = when {
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ||
                                state.temperatureCelsius <= 0 -> DesignTokens.DangerRose
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                                DesignTokens.WarningAmber
                            else -> DesignTokens.BrandPrimary
                        }
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "08",
                        title = "电池健康状况",
                        value = state.healthQuality.label,
                        sub = "Android BatteryManager",
                        accentColor = DesignTokens.BrandPrimary
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "09",
                        title = "电芯电压",
                        value = "\${state.voltageMv}",
                        unit = "mV",
                        sub = "电势差 \${String.format(Locale.US, "%.2f", state.voltageMv / 1000f)} V",
                        accentColor = DesignTokens.InfoSky
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "10",
                        title = "充放电循环",
                        value = if (state.cycleCount > 0) "\${state.cycleCount}" else "—",
                        unit = if (state.cycleCount > 0) "次" else "",
                        // v2.0.0-alpha 批次B：健康度实测时展示循环寿命预测 (模型外推)，
                        // 估算健康度不预测——保持 "Cycle Count" 原口径
                        sub = state.healthForecastText
                            ?: if (state.cycleCount > 0) "Cycle Count" else "系统未上报循环数据",
                        accentColor = DesignTokens.AccentTeal
                    )
                }
            }

            item {
                // 局部变量：currentNowMa 为自定义 getter 属性不可智能转换，
                // 绑定局部值后 when 分支可安全比较与空安全分支
                val currentNow = state.currentNowMa
                val powerW = state.powerWatts
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "11",
                        title = "瞬时电流",
                        // 指标 11：经 BatteryState.currentNowMa 别名读取 (激活别名，与 currentMa 同源)
                        // v1.2.3 P0 审计修复：currentMa 可空——设备不支持 CURRENT_NOW
                        // 时显示 "—"，旧实现归一化为 0 会虚构 "0 mA / 0.00 W" 读数
                        value = currentNow?.let { if (it > 0) "+$it" else "$it" } ?: "—",
                        unit = if (currentNow != null) "mA" else "",
                        // v1.2.4 P2 审计修复：功率随符号携带方向 (充电 +W / 放电 −W)，
                        // 旧实现解析层 abs 后充放同显正功率，方向丢失
                        sub = "功率 " + when {
                            currentNow == null -> "— W"
                            currentNow > 0 -> "+\${String.format(Locale.US, "%.2f", powerW)} W"
                            currentNow < 0 -> "-\${String.format(Locale.US, "%.2f", abs(powerW))} W"
                            else -> String.format(Locale.US, "%.2f", powerW) + " W"
                        },
                        accentColor = if ((currentNow ?: 0) > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "12",
                        title = "完全充满容量",
                        value = if (state.fullChargeCapacityMah != null) "\${state.fullChargeCapacityMah}" else "—",
                        unit = if (state.fullChargeCapacityMah != null) "mAh" else "",
                        sub = if (state.isFullChargeConditionMet) "已满足 100% & 0-25 mA" else "详见上方充满判定卡",
                        accentColor = DesignTokens.BrandPrimaryLight
                    )
                }
            }

            // 5. 关于 APP 功能说明 (版本号经 BuildConfig 单源注入)
            item {
                AboutAppCard()
            }

            item {
                Spacer(modifier = Modifier.height(28.dp))
            }
        }
            } else if (tab == 1) {
                // v2.0.0-alpha.1：遥测分析 Tab (对齐 Web 端 TELEMETRY 视图)——
                // 实时硬件遥测曲线 + 功率/温度评估 + 采集链路状态
                TelemetryAnalysisScreen(state)
            } else if (tab == 2) {
                // v2.0.0-alpha.1：健康档案 Tab (对齐 Web 端 HEALTH 视图)——
                // 健康度实测大数字 + 内阻/寿命预测 + 诊断建议 + 充满判定卡
                HealthProfileScreen(
                    state = state,
                    simulationRemainingSec = simulationRemainingSec,
                    onTriggerTest = { viewModel.triggerFullChargeSimulation() },
                    onClearRecords = { viewModel.clearFullChargeRecords() }
                )
            } else {
                // 硬件实验室 Tab：场景模拟 / 滑杆调参 / 健康枚举 / 提示音
                HardwareLabScreen(viewModel = viewModel, state = state)
            }
            }
        }

        // 指标 04 设计容量校准对话框 (激活 ViewModel.setDesignCapacity)
        if (showDesignCapacityDialog) {
            var capacityInput by remember { mutableStateOf(state.designCapacityMah.toString()) }
            var inputError by remember { mutableStateOf<String?>(null) }

            // 校验并提交：空值/0/超范围均给出可见错误反馈，不再静默失败
            val submitCalibration: () -> Unit = {
                val parsed = capacityInput.toIntOrNull()
                inputError = when {
                    capacityInput.isBlank() -> "请输入容量数值"
                    parsed == null || parsed <= 0 -> "容量必须为大于 0 的整数"
                    parsed < BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH ->
                        "容量不能小于 \${BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH} mAh"
                    parsed > BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH ->
                        "容量超出合理范围 (最大 \${BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH} mAh)"
                    else -> null
                }
                if (inputError == null && parsed != null) {
                    viewModel.setDesignCapacity(parsed)
                    showDesignCapacityDialog = false
                }
            }

            AlertDialog(
                onDismissRequest = { showDesignCapacityDialog = false },
                title = { Text("校准设计容量 (指标 04)") },
                text = {
                    OutlinedTextField(
                        value = capacityInput,
                        onValueChange = { input ->
                            capacityInput = input.filter { it.isDigit() }.take(5)
                            inputError = null
                        },
                        label = { Text("出厂设计容量 (mAh)") },
                        singleLine = true,
                        isError = inputError != null,
                        supportingText = {
                            inputError?.let { err ->
                                Text(err, fontSize = DesignTokens.Font2xs, color = DesignTokens.TextError)
                            }
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = { submitCalibration() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = DesignTokens.TextPrimary,
                            focusedBorderColor = DesignTokens.AccentCyanDark,
                            unfocusedBorderColor = DesignTokens.BorderStrong,
                            focusedLabelColor = DesignTokens.AccentCyanDark,
                            unfocusedLabelColor = DesignTokens.TextTertiary,
                            errorBorderColor = DesignTokens.TextError,
                            errorLabelColor = DesignTokens.TextError
                        )
                    )
                },
                confirmButton = {
                    TextButton(onClick = submitCalibration) {
                        Text("确定", color = DesignTokens.BrandPrimaryLight)
                    }
                },
                dismissButton = {
                    // v1.2.3 P1 审计修复：校准值持久化后需提供撤销入口——
                    // 恢复系统自动探测 (PowerProfile/sysfs 三级回退链)
                    if (state.designCapacitySource == CapacitySource.CALIBRATED) {
                        TextButton(onClick = {
                            viewModel.clearDesignCapacityCalibration()
                            showDesignCapacityDialog = false
                        }) {
                            Text("恢复自动探测", color = DesignTokens.TextSecondary)
                        }
                    }
                    TextButton(onClick = { showDesignCapacityDialog = false }) {
                        Text("取消", color = DesignTokens.TextSecondary)
                    }
                },
                containerColor = DesignTokens.BgElevated,
                titleContentColor = Color.White
            )
        }
    }
}

/**
 * 华丽酷炫核心电池 HUD 卡片
 */
@Composable
fun CyberHeroBatteryCard(state: BatteryState) {
    val isCharging = state.status == BatteryStatus.CHARGING
    val isLow = state.percentage <= 15 && !isCharging

    // 氛围动画：充电/低电量时 Hero 卡片呼吸光晕（与 Web 双层呼吸光晕对齐）
    val infiniteTransition = rememberInfiniteTransition(label = "hero-ambient")
    val ambientAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "ambient-alpha"
    )

    // 电量百分比缓动过渡（消除读数跳动，与 Web duration-hero 一致）
    val animatedPercentage by animateIntAsState(
        targetValue = state.percentage,
        animationSpec = tween(durationMillis = DesignTokens.DurationHero),
        label = "hero-percentage"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            // 玻璃拟态：半透明垂直渐变底（Compose 无真模糊，以层叠透明 + 细描边模拟玻璃切面）
            .drawBehind {
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            DesignTokens.BgGlass,
                            DesignTokens.BgElevated.copy(alpha = 0.94f)
                        )
                    )
                )
            }
            .border(1.dp, DesignTokens.BorderStrong, RoundedCornerShape(DesignTokens.RadiusHero)),
        shape = RoundedCornerShape(DesignTokens.RadiusHero),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            // 呼吸氛围光晕（充电 emerald / 低电量 rose）
            if (isCharging || isLow) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    (if (isCharging) DesignTokens.BrandPrimary else DesignTokens.DangerRose)
                                        .copy(alpha = 0.13f * ambientAlpha),
                                    Color.Transparent
                                )
                            )
                        )
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 玻璃顶部切面高光线（1px 渐变亮线）
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    Color.White.copy(alpha = 0.18f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Status Tag
                Surface(
                    shape = RoundedCornerShape(DesignTokens.RadiusPill),
                    color = DesignTokens.Border,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.BorderStrong)
                ) {
                    Text(
                        text = state.status.label,
                        fontSize = DesignTokens.Font2xs,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = when (state.status) {
                            BatteryStatus.CHARGING -> DesignTokens.BrandPrimaryLight
                            BatteryStatus.FULL -> DesignTokens.FullTeal
                            else -> DesignTokens.InfoSky
                        },
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // 5. 电量百分比 (Huge Futuristic typography, 缓动过渡)
                Text(
                    text = "\${animatedPercentage}%",
                    fontSize = DesignTokens.FontHero,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )

            // 2. 剩余电量 (mAh)
            Text(
                text = "剩余电量: \${state.remainingCapacityMah} / \${state.currentCapacityMah} mAh",
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Medium,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextSecondary
            )

            Spacer(modifier = Modifier.height(8.dp))

            // 11. 瞬时电流与功率 (指标 11 经 BatteryState.currentNowMa 别名读取，与 currentMa 同源；
            //    功率直接消费 State.powerWatts，统一数据源)
            // v1.2.3 P0 审计修复：currentMa 可空——设备不支持 CURRENT_NOW 时显示
            // "— mA · — W"，旧实现归一化为 0 会显示 "0 mA · 0.00 W" 的虚构读数
            val currentMa = state.currentNowMa
            val powerW = state.powerWatts
            Surface(
                shape = RoundedCornerShape(DesignTokens.RadiusChip),
                color = DesignTokens.BgInset,
                border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
            ) {
                Text(
                    text = buildString {
                        append(if (currentMa != null) "\${if (currentMa > 0) "+$currentMa" else currentMa} mA" else "— mA")
                        append(" · ")
                        // v1.2.4 P2 审计修复：功率随符号携带方向 (充电 +W / 放电 −W，
                        // 负值由 String.format 自然输出 "-")，不再 abs 抹平方向
                        append(if (currentMa != null) "\${if (powerW > 0) "+" else ""}\${String.format(Locale.US, "%.2f", powerW)} W" else "— W")
                        append(" · ")
                        append("\${String.format(Locale.US, "%.2f", state.voltageMv / 1000f)} V")
                    },
                    fontSize = DesignTokens.FontXs,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.InfoSky,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                )
            }
            }
        }
    }
}

/**
 * 硬件信息汇总栏 (Hardware Information Summary Bar)
 */
@Composable
fun HardwareSummaryCard(state: BatteryState, onCalibrateDesignCapacity: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusPanel)),
        shape = RoundedCornerShape(DesignTokens.RadiusPanel),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "底层硬件信息与电源子系统",
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontFamily = FontFamily.Monospace
                )
                Surface(
                    shape = RoundedCornerShape(DesignTokens.RadiusChip),
                    color = DesignTokens.BgElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.AccentCyanDark)
                ) {
                    Text(
                        text = state.thermalThrottlingState,
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.AccentCyanDark,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ===== SoC 主控架构区块 (型号/厂商/制程/CPU/GPU 五字段，检测链见 SoCHardwareProfile) =====
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "SoC 主控", value = state.socModel)
                HardwareItem(modifier = Modifier.weight(1f), label = "SoC 厂商", value = state.socVendor)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "制程工艺", value = state.socProcess)
                HardwareItem(modifier = Modifier.weight(1f), label = "GPU 渲染", value = state.socGpu)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // CPU 架构文案较长，允许两行展示 (核心配置分级完整可读)
            HardwareItem(
                modifier = Modifier.fillMaxWidth(),
                label = "CPU 架构",
                value = state.socCpu,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(10.dp))

            // ===== 电源子系统区块 =====
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电源管理 IC", value = state.pmicModel)
                // 快充协议实际值形如 "超级快充 (45.0 W) · 澎湃秒充 [品牌档案]"，
                // 半宽 chip 内单行必然截断，允许两行完整展示 (与 CPU 架构行同策略)
                HardwareItem(
                    modifier = Modifier.weight(1f),
                    label = "快充协议",
                    value = state.fastChargeProtocol,
                    maxLines = 2
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // v1.2.4 P2 审计修复 + v2.0.0-alpha 批次B：内阻来源随引擎置信度显式标注——
                // ΔV/ΔI 滑窗回归实测显示 "[运行时测算·高置信 n=48]"，
                // 样本不足时仍回退估算模型并标注 "[工程估算]"
                HardwareItem(
                    modifier = Modifier.weight(1f),
                    label = "电芯内阻",
                    value = "\${String.format(Locale.US, "%.1f", state.internalResistanceMohm)} mΩ \${state.internalResistanceLabel}",
                    maxLines = 2
                )
                HardwareItem(modifier = Modifier.weight(1f), label = "化学材料体系", value = state.batteryChemistry)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电芯结构", value = state.cellStructure)
                HardwareItem(modifier = Modifier.weight(1f), label = "系统接口", value = state.halVersion)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 指标 04 用户校准入口 (激活 ViewModel.setDesignCapacity，与 Web 端自定义容量对等)
            OutlinedButton(
                onClick = onCalibrateDesignCapacity,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = DesignTokens.AccentCyanDark)
            ) {
                Text(
                    text = "校准设计容量 (当前 \${state.designCapacityMah} mAh)",
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

@Composable
fun HardwareItem(modifier: Modifier = Modifier, label: String, value: String, maxLines: Int = 1) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(DesignTokens.RadiusChip),
        color = DesignTokens.BgInset,
        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(text = label, fontSize = DesignTokens.Font2xs, color = DesignTokens.TextTertiary)
            Spacer(modifier = Modifier.height(2.dp))
            // v1.2.4 P2 审计修复：补 overflow = Ellipsis——旧实现默认 Clip 且
            // 无省略号，"快充协议"等长值 (如 "超级快充 (45.0 W) · 澎湃秒充 [品牌档案]")
            // 在半宽 chip 内被静默硬裁切，用户无从得知内容被截断
            Text(
                text = value,
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextPrimary,
                maxLines = maxLines,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * v1.2.3 P1 审计修复：硬件实验室模拟态警示横幅
 *
 * 旧实现 labOverride 只能靠实验室 Tab 内的"恢复真实硬件遥测"按钮清除，
 * 切 Tab 不退出模拟且总览页零提示——用户会把模拟数据当真实电池状态阅读。
 * 本横幅在模拟生效期间常驻总览页顶部，明示数据性质并提供一键恢复出口。
 */
@Composable
private fun LabSimulationBanner(onExit: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(DesignTokens.RadiusChip),
        color = DesignTokens.BgElevated,
        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.TextAmberStrong)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "硬件实验室模拟数据生效中",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextAmberStrong
                )
                Text(
                    text = "当前总览页数值为实验室模拟值，非真实电池状态",
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            TextButton(onClick = onExit) {
                Text(
                    text = "恢复真实",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight
                )
            }
        }
    }
}

/**
 * 特性 12 充满判定卡片
 *
 * v1.2.3 P0 审计修复：
 * 1. 三态判定展示——电流不可读 (设备不支持 CURRENT_NOW) 时明确提示"无法判定"，
 *    不再谎报"已达充满判定"；未在充电态时提示未在充电；
 * 2. 来源标注——锁定值为"一键模拟完全充满"演示值时显式标注"模拟"，与真实
 *    锁定 (REAL) 区分，杜绝演示值冒充实测跨重启存在；
 * 3. 清除入口——用户可一键清除全部锁定记录 (真实 + 模拟)。
 */
@Composable
fun FullChargeConditionCard(
    state: BatteryState,
    simulationRemainingSec: Long,
    onTriggerTest: () -> Unit,
    onClearRecords: () -> Unit
) {
    // 直接消费 State 判定字段 (双通道单一数据源，不本地重算)
    val isFullMet = state.isFullChargeConditionMet
    val verdict = state.fullChargeVerdict
    val isSimulating = simulationRemainingSec > 0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                1.dp,
                if (isFullMet) DesignTokens.BrandPrimary else DesignTokens.Border,
                RoundedCornerShape(DesignTokens.RadiusPanel)
            ),
        shape = RoundedCornerShape(DesignTokens.RadiusPanel),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "12. 完全充满时的容量 (估算)",
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.FontXs,
                    color = Color.White
                )
                Text(
                    text = when (verdict) {
                        FullChargeVerdict.FULLY_CHARGED -> "已达充满判定 (100% & |I|≤25 mA)"
                        FullChargeVerdict.CURRENT_UNAVAILABLE -> "电流不可读 · 无法判定"
                        FullChargeVerdict.NOT_YET -> "等待条件满足"
                    },
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = when (verdict) {
                        FullChargeVerdict.FULLY_CHARGED -> DesignTokens.BrandPrimaryLight
                        FullChargeVerdict.CURRENT_UNAVAILABLE -> DesignTokens.TextAmberStrong
                        FullChargeVerdict.NOT_YET -> DesignTokens.TextAmberStrong
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (state.fullChargeCapacityMah != null) {
                        "\${state.fullChargeCapacityMah} mAh"
                    } else {
                        "— 未完全充满暂不显示 (需100%且充电态|电流|≤25mA) —"
                    },
                    fontSize = DesignTokens.Font2xl,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = if (state.fullChargeCapacityMah != null) DesignTokens.BrandPrimaryLight else DesignTokens.TextTertiary
                )
                // v1.2.1 自检：锁定值为历史记录 (当前未在判定区间) 时显式标注，
                // 避免用户把历史锁定容量误读为实时充满值
                if (state.fullChargeCapacityMah != null && !isFullMet) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(DesignTokens.RadiusChip),
                        color = DesignTokens.BgElevated,
                        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
                    ) {
                        Text(
                            text = "历史锁定",
                            fontSize = DesignTokens.Font2xs,
                            fontFamily = FontFamily.Monospace,
                            color = DesignTokens.TextAmberStrong,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                // v1.2.3 P0 审计修复：演示值显式标注"模拟"，杜绝一键模拟按钮的
                // 演示容量冒充实测锁定跨重启存在
                if (state.fullChargeCapacityMah != null && state.fullChargeSource == FullChargeSource.SIMULATED) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(DesignTokens.RadiusChip),
                        color = DesignTokens.BgElevated,
                        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.BrandPrimaryDark)
                    ) {
                        Text(
                            text = "来源: 模拟",
                            fontSize = DesignTokens.Font2xs,
                            fontFamily = FontFamily.Monospace,
                            color = DesignTokens.BrandPrimaryLight,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            // v1.2.3 P0 审计修复：电流不可读时显式说明设备能力边界，引导用户
            // 以系统充满状态为准，不再把估算值当作实测锁定值
            if (verdict == FullChargeVerdict.CURRENT_UNAVAILABLE) {
                Text(
                    text = "本设备不支持电流上报 (CURRENT_NOW)，无法执行 0-25 mA 浮充判定；" +
                        "已保留上次有效锁定值，不作新锁定。",
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }

            // 上次充满锁定时间 (激活 lastFullChargeTimestamp：持久化值跨重启回显)
            state.lastFullChargeTimestamp?.let { timestamp ->
                Text(
                    text = "上次锁定: " + SimpleDateFormat(
                        "yyyy-MM-dd HH:mm:ss",
                        Locale.getDefault()
                    ).format(Date(timestamp)),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = onTriggerTest,
                enabled = !isSimulating,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSimulating) DesignTokens.BorderStrong else DesignTokens.BrandPrimaryDark,
                    disabledContainerColor = DesignTokens.Border,
                    disabledContentColor = DesignTokens.TextSecondary
                )
            ) {
                Text(
                    text = if (isSimulating) {
                        "模拟保持中 (\${simulationRemainingSec}s) · 结束后自动恢复真实遥测"
                    } else {
                        "一键模拟完全充满 (100% + 16mA)"
                    },
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold
                )
            }

            // v1.2.3 P0 审计修复：清除锁定记录入口 (真实 + 模拟演示值)
            if (state.fullChargeCapacityMah != null) {
                Spacer(modifier = Modifier.height(6.dp))
                TextButton(
                    onClick = onClearRecords,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "清除锁定记录",
                        fontSize = DesignTokens.Font2xs,
                        fontFamily = FontFamily.Monospace,
                        color = DesignTokens.TextSecondary
                    )
                }
            }
        }
    }
}

@Composable
fun CyberMetricCardItem(
    modifier: Modifier = Modifier,
    number: String,
    title: String,
    value: String,
    unit: String = "",
    sub: String,
    accentColor: Color
) {
    Card(
        modifier = modifier.border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard)),
        shape = RoundedCornerShape(DesignTokens.RadiusCard),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(modifier = Modifier.padding(13.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = title,
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary
                )
                Text(
                    text = number,
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextDisabled
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = value,
                    fontSize = DesignTokens.FontXl,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )
                if (unit.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = unit,
                        fontSize = DesignTokens.Font2xs,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = accentColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(3.dp))

            Text(
                text = sub,
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextTertiary,
                maxLines = 1
            )
        }
    }
}

// ============================================================
// 关于 APP 功能说明卡片
// 版本信息经 BuildConfig 单源注入 (build.gradle.kts defaultConfig)
// ============================================================
@Composable
fun AboutAppCard() {
    val featureLines = listOf(
        "12 项核心充放电指标全量实时遥测：健康度 / 剩余电量 / 当前容量 / 设计容量 / 电量百分比 / 电池状态 / 温度 / 健康状况 / 电压 / 循环计数 / 瞬时电流 / 完全充满容量",
        "完全充满判定：电量 100% 且瞬时电流回落至 0~25 mA 浮充截止区间时，自动锁定实际充满容量并跨会话保存",
        "硬件实验室：一键场景模拟（充满校准 / 极速闪充 / 高负载放电 / 过热警报）与六组滑杆调参，随时一键恢复真实硬件遥测",
        "硬件信息解析：SoC 主控五字段档案（型号 / 厂商 / 制程 / CPU / GPU）与 PMIC 型号、快充协议、电芯结构三级回退检测",
        "数据来源：系统 BatteryManager 公开接口、ACTION_BATTERY_CHANGED 粘性广播与 sysfs 真实硬件通道，全部本地计算，不上传任何数据",
        "权限声明：不申请任何运行时或危险权限，安装即可使用全部功能（合并清单仅含系统框架自动注入的签名级内部权限，不涉及隐私）"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusPanel)),
        shape = RoundedCornerShape(DesignTokens.RadiusPanel),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "关于 APP",
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontFamily = FontFamily.Monospace
                )
                Surface(
                    shape = RoundedCornerShape(DesignTokens.RadiusChip),
                    color = DesignTokens.BgElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.BrandPrimary)
                ) {
                    Text(
                        text = "v\${BuildConfig.VERSION_NAME} (\${BuildConfig.VERSION_CODE})",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.BrandPrimary,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "电池大师 — 专业安卓电池充放电监测工具",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextSecondary,
                fontFamily = FontFamily.Monospace
            )

            Spacer(modifier = Modifier.height(10.dp))

            featureLines.forEach { line ->
                Row(modifier = Modifier.padding(vertical = 3.dp)) {
                    Text(
                        text = "• ",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.BrandPrimary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = line,
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace,
                        lineHeight = DesignTokens.FontXs
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            HorizontalDivider(color = DesignTokens.Border, thickness = 1.dp)

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "开发者：某厂大牛马【带娃的小陈工】",
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                color = DesignTokens.TextSecondary,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = "抖音 / 小红书 平台",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

/**
 * v2.0.0-alpha.1：遥测分析 Tab (对齐 Web 端 TELEMETRY 视图，Android 独有真实数据)
 *
 * - 实时硬件遥测曲线 (Compose Canvas 自绘，零三方依赖)：电压/电流/温度 1Hz 滑窗 120 秒；
 * - 功率与温度评估卡 (38/45℃ 分级单源解析器常量)；
 * - 采集链路状态卡：电量计探测链命中节点 / 库仑计 / CURRENT_NOW / 内阻引擎滑窗——
 *   这是 Android 端真机才能提供的真实采集通道透视，Web 模拟端无法实现。
 */
@Composable
fun TelemetryAnalysisScreen(state: BatteryState) {
    // 滑动窗口：1Hz 遥测追加上限 120 点 (~2 分钟)；remember 存活于本 Tab 作用域，
    // 切 Tab (Crossfade 保留状态) 不清空，进程重建则重新积累
    val history = remember { mutableStateListOf<BatteryState>() }
    LaunchedEffect(state) {
        history.add(state)
        while (history.size > 120) history.removeAt(0)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "高频硬件遥测分析",
                fontWeight = FontWeight.Bold,
                fontSize = DesignTokens.FontXs,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(top = 4.dp)
            )
            Text(
                text = "实时捕获充放电电流 (mA)、电芯端电压 (mV) 与热敏传感器温度曲线",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        // 实时遥测曲线 (Compose Canvas 自绘)
        item {
            TelemetryChartPanel(history)
        }

        // 功率与温度评估 (与 Web 端 Summary Cards 对齐，复用 12 指标卡样式)
        item {
            val currentNow = state.currentNowMa
            val powerW = state.powerWatts
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "P",
                    title = "充放电功率",
                    value = when {
                        currentNow == null -> "—"
                        powerW >= 0f -> "+\${String.format(Locale.US, "%.2f", powerW)}"
                        else -> "-\${String.format(Locale.US, "%.2f", abs(powerW))}"
                    },
                    unit = if (currentNow != null) "W" else "",
                    sub = when {
                        currentNow == null -> "电流不可读，不虚构 0W"
                        currentNow > 0 -> "充电输入 P = V × I"
                        currentNow < 0 -> "放电输出 P = V × |I|"
                        else -> "浮充截止"
                    },
                    accentColor = if ((currentNow ?: 0) > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
                )
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "T",
                    title = "电池温度评估",
                    value = String.format(Locale.US, "%.1f", state.temperatureCelsius),
                    unit = "°C",
                    sub = when {
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
                            "严重发热 (≥\${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                            "偏热预警 (\${BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt()}-\${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                        state.temperatureCelsius <= 0 -> "过冷保护 (≤0°C)"
                        else -> "温度正常"
                    },
                    accentColor = when {
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ||
                            state.temperatureCelsius <= 0 -> DesignTokens.DangerRose
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                            DesignTokens.WarningAmber
                        else -> DesignTokens.BrandPrimary
                    }
                )
            }
        }

        // 采集链路状态卡 (Android 真机独有：真实数据来源透视)
        item {
            TelemetrySourceCard(state)
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/**
 * 实时遥测曲线面板：Compose Canvas 自绘三通道折线 (电压/电流/温度)，
 * 各通道独立归一化到面板高度，横轴为最近 120 个采样点 (~2 分钟 @1Hz)。
 */
@Composable
fun TelemetryChartPanel(history: List<BatteryState>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
            .padding(14.dp)
    ) {
        Text(
            text = "实时遥测曲线 (最近 \${history.size} 个采样点)",
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextSecondary,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
        ) {
            if (history.size < 2) return@Canvas
            // 背景网格 (4 条水平参考线)
            val gridColor = DesignTokens.Border
            for (i in 1..3) {
                val y = size.height * i / 4f
                drawLine(gridColor, Offset(0f, y), Offset(size.width, y), strokeWidth = 1f)
            }
            fun drawSeries(
                pick: (BatteryState) -> Float,
                lo: Float, hi: Float, color: Color
            ) {
                if (hi - lo <= 0f) return
                val n = history.size
                val path = Path()
                history.forEachIndexed { idx, s ->
                    val x = size.width * idx / (n - 1).coerceAtLeast(1)
                    val norm = ((pick(s) - lo) / (hi - lo)).coerceIn(0f, 1f)
                    val y = size.height * (1f - norm)
                    if (idx == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                drawPath(path, color, style = Stroke(width = 4f))
            }
            // 电压 (3000~5000 mV 典型电芯窗口)、电流 (-6000~6000 mA)、温度 (0~60°C)
            drawSeries({ it.voltageMv.toFloat() }, 3000f, 5000f, DesignTokens.InfoSky)
            drawSeries({ (it.currentNowMa ?: 0).toFloat() }, -6000f, 6000f, DesignTokens.BrandPrimary)
            drawSeries({ it.temperatureCelsius }, 0f, 60f, DesignTokens.WarningAmber)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            listOf("电压 mV" to DesignTokens.InfoSky, "电流 mA" to DesignTokens.BrandPrimary, "温度 °C" to DesignTokens.WarningAmber)
                .forEach { (label, color) ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(color, RoundedCornerShape(2.dp))
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = label,
                            fontSize = DesignTokens.Font2xs,
                            color = DesignTokens.TextTertiary,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
        }
    }
}

/**
 * 采集链路状态卡：透视真实数据来源——探测链命中节点、库仑计/CURRENT_NOW 支持性、
 * 内阻引擎滑窗状态。Android 真机独有视图，Web 模拟端无法提供。
 */
@Composable
fun TelemetrySourceCard(state: BatteryState) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
            .padding(14.dp)
    ) {
        Text(
            text = "采集链路状态 (真实数据来源透视)",
            fontSize = DesignTokens.FontXs,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.height(10.dp))
        val currentNow = state.currentNowMa
        val rows = listOf(
            "电量计节点" to state.gaugeNodePath,
            "当前容量来源" to state.currentCapacitySource.label,
            "库仑计剩余电荷" to state.remainingCapacitySource.label,
            "CURRENT_NOW 瞬时电流" to if (currentNow != null) "支持 (读数 \${if (currentNow > 0) "+$currentNow" else "$currentNow"} mA)" else "不可读 (显示 —)",
            "内阻引擎滑窗" to "n=\${state.engineSampleCount} · \${state.engineConfidenceLabel}",
            "采集通道" to "粘性广播 + 1Hz 轮询双通道 (单解析器)"
        )
        rows.forEach { (label, value) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = label,
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextTertiary,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = value,
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextPrimary,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * v2.0.0-alpha.1：健康档案 Tab (对齐 Web 端 HEALTH 视图)
 *
 * - 健康度实测大数字 (是多少就是多少——容量不可测显式"无法测算")；
 * - 内阻实测与循环寿命预测 (v2.0.0-alpha 批次B 引擎输出)；
 * - 健康诊断建议 (对齐 Web BatteryHealthAdvice 分级文案)；
 * - 充满判定卡 (复用总览同款组件) + 校准规范说明。
 */
@Composable
fun HealthProfileScreen(
    state: BatteryState,
    simulationRemainingSec: Long,
    onTriggerTest: () -> Unit,
    onClearRecords: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 健康度大数字卡
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
                    .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
                    .padding(16.dp)
            ) {
                Text(
                    text = "电池健康度 (实测口径)",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextTertiary,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(6.dp))
                if (state.hasMeasuredCapacity) {
                    Text(
                        text = "\${String.format(Locale.US, "%.1f", state.healthPercentage)}%",
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Black,
                        color = DesignTokens.BrandPrimary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "当前容量 / 设计容量 · [\${state.currentCapacitySource.label} + \${state.designCapacitySource.label}]",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                } else {
                    Text(
                        text = "无法测算",
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Black,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "电量计节点 (\${state.gaugeNodePath}) 未上报 charge_full——健康度=当前容量/设计容量，测不到就不虚构",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // 内阻实测 + 循环寿命预测
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "R",
                    title = "电芯内阻",
                    value = if (state.internalResistanceMohm > 0f)
                        String.format(Locale.US, "%.1f", state.internalResistanceMohm) else "—",
                    unit = if (state.internalResistanceMohm > 0f) "mΩ" else "",
                    sub = state.internalResistanceLabel,
                    accentColor = DesignTokens.AccentTeal
                )
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "C",
                    title = "充放电循环",
                    value = if (state.cycleCount > 0) "\${state.cycleCount}" else "—",
                    unit = if (state.cycleCount > 0) "次" else "",
                    sub = state.healthForecastText
                        ?: if (state.cycleCount > 0) "Cycle Count" else "系统未上报循环数据",
                    accentColor = DesignTokens.AccentTeal
                )
            }
        }

        // 健康诊断建议 (对齐 Web BatteryHealthAdvice 分级)
        item {
            HealthAdviceCard(state)
        }

        // 充满判定卡 (复用总览同款组件——双入口)
        item {
            FullChargeConditionCard(
                state,
                simulationRemainingSec = simulationRemainingSec,
                onTriggerTest = onTriggerTest,
                onClearRecords = onClearRecords
            )
        }

        // 校准规范说明 (对齐 Web HEALTH Tab 说明区)
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
                    .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
                    .padding(14.dp)
            ) {
                Text(
                    text = "完全充满校准规范详细说明",
                    fontSize = DesignTokens.FontXs,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "为什么电量到 100% 还不算完全充满？Android 电源管理为提升体验，通常在恒压 (CV) 阶段初期就提前把 UI 显示为 100%——此时仍有数百 mA 电流持续注入 (饱和浮充)，并非真正充满。",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "0-25 mA 截止电流门限：按锂离子电池充电终止标准，当充电电流自然衰减至 0.005C (0~25 mA) 时才达到完全饱和截止，此时测得的容量最准确，被库仑计固化为「完全充满时的容量」。",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 18.sp
                )
            }
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/**
 * 健康诊断建议卡：按硬件健康枚举 / 实测温度 / 循环计数 / 实测健康度分级给出真实建议
 * (对齐 Web 端 BatteryHealthAdvice；全部基于实测字段，无实测数据时诚实提示)
 */
@Composable
fun HealthAdviceCard(state: BatteryState) {
    val (advice, accent) = when {
        state.healthQuality == BatteryHealthQuality.OVERHEAT ->
            "系统上报电池过热，请立即停止充电并移除热源，恢复常温后再观察" to DesignTokens.DangerRose
        state.healthQuality == BatteryHealthQuality.DEAD ->
            "系统上报电池损坏，建议前往官方售后检测更换电芯" to DesignTokens.DangerRose
        state.healthQuality == BatteryHealthQuality.OVER_VOLTAGE ->
            "系统上报电芯超压，请断开充电器并避免继续快充，尽快检修" to DesignTokens.DangerRose
        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
            "当前 \${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C 以上：高温会加速电芯老化，建议停止高负载与快充" to DesignTokens.DangerRose
        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
            "当前 \${BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt()}-\${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C 偏热：建议移除保护壳、避免边充边玩" to DesignTokens.WarningAmber
        state.cycleCount >= 800 ->
            "循环已超 \${state.cycleCount} 次 (锂聚合物 80% 健康基线约 800 次)：留意续航衰减，考虑更换" to DesignTokens.WarningAmber
        state.hasMeasuredCapacity && state.healthPercentage in 1f..79.9f ->
            "实测健康度 \${String.format(Locale.US, "%.1f", state.healthPercentage)}% 低于 80% 基线：电池老化明显，建议规划更换" to DesignTokens.WarningAmber
        !state.hasMeasuredCapacity ->
            "电量计节点未上报容量数据，健康度无法测算——其余遥测 (电压/电流/温度) 均为真实读数" to DesignTokens.TextTertiary
        else ->
            "各项硬件指标均在正常区间，继续保持良好充放电习惯即可" to DesignTokens.BrandPrimary
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(accent, RoundedCornerShape(DesignTokens.RadiusChip))
        )
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(
                text = "健康诊断建议",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = advice,
                fontSize = DesignTokens.FontXs,
                color = DesignTokens.TextPrimary,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                lineHeight = 18.sp,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}
`,
  },
  {
    id: 'manifest',
    name: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: '应用清单配置：零运行时权限（公开 Battery API 免权限）、应用图标与暗黑主题',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- 公开电池读取 API (BatteryManager 属性 / 粘性广播) 无需任何运行时权限。
         原先声明的 BATTERY_STATS / FOREGROUND_SERVICE / POST_NOTIFICATIONS / WAKE_LOCK
         均为未使用权限，已移除以通过严格 lint 与应用商店合规审查 -->

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AndroidBatteryMaster"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.AndroidBatteryMaster">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
`,
  },
  {
    id: 'res_themes',
    name: 'themes.xml / strings.xml / colors.xml',
    path: 'android/app/src/main/res/values/themes.xml',
    language: 'xml',
    description: 'Android 资源配置：暗黑赛博朋克主题、应用名、图标背景色与备份排除规则',
    code: `<!-- android/app/src/main/res/values/themes.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Dark Cyberpunk Theme for Battery Master -->
    <style name="Theme.AndroidBatteryMaster" parent="android:Theme.Material.NoActionBar">
        <!-- 窗口背景与 Scaffold 首帧容器色 (#030712) 保持一致，消除启动瞬间色差跳变 -->
        <item name="android:windowBackground">#030712</item>
        <!-- 外壳层审计修复：显式声明状态栏图标为亮色 (暗底正确对比度)。
             系统栏配色由 MainActivity enableEdgeToEdge 统一控制 (透明 + 亮图标)，
             主题层不再声明 statusBarColor/navigationBarColor——API 35 起该属性
             已 deprecated 且会被 edge-to-edge 覆盖，属死配置 -->
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>

<!-- android/app/src/main/res/values/strings.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">电池大师</string>
</resources>

<!-- android/app/src/main/res/values/colors.xml -->
<?xml version="1.0" encoding="utf-8"?>
<!--
  外壳层审计修复：neon_emerald / ic_launcher_background 两个色值在全工程
  (kotlin/res/manifest) 均无引用 (启动图标 drawable 直接内联 #090d16 / #10B981)，
  且 release 构建开启 isShrinkResources 会被剔除，此处移除死资源。
  新增色值请直接引用 com.battery.master.ui.theme.DesignTokens 单源令牌。
-->
<resources />

<!-- android/app/src/main/res/xml/backup_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="root" path="." />
    <exclude domain="file" path="." />
    <exclude domain="database" path="." />
    <exclude domain="sharedpref" path="." />
    <exclude domain="external" path="." />
</full-backup-content>

<!-- android/app/src/main/res/xml/data_extraction_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
    </device-transfer>
</data-extraction-rules>
`,
  },
  {
    id: 'gradle',
    name: 'build.gradle.kts',
    path: 'android/app/build.gradle.kts',
    language: 'kotlin',
    description: 'Android 15 / SDK 35 Gradle 构建脚本与 Jetpack Compose 依赖',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// 签名参数由 CI 通过环境变量注入（GitHub Secrets），本地构建同样可注入；
// 缺失时回退 debug 签名，保证流水线与本地开发始终可产出可安装 APK
val releaseKeystoreFile = System.getenv("KEYSTORE_FILE")
val releaseKeystorePass = System.getenv("KEYSTORE_PASSWORD")
// v1.2.6 P2 审计修复：KEY_ALIAS 由 CI Secret 注入 (旧实现硬编码 "battery-master"，
// Secret 实际注入了别名却被无视，更换 keystore/别名必须改源码)；缺失时回退历史别名
val releaseKeyAlias = System.getenv("KEY_ALIAS")
val releaseKeyPass = System.getenv("KEY_PASSWORD")
val hasReleaseSigning = releaseKeystoreFile != null &&
    releaseKeystorePass != null && releaseKeyPass != null

android {
    namespace = "com.battery.master"
    // v2.0.0-alpha 批次G：compileSdk/targetSdk 升至 36 (Android 16)
    compileSdk = 36

    defaultConfig {
        applicationId = "com.battery.master"
        minSdk = 26
        targetSdk = 36
        versionCode = 13
        versionName = "2.0.0-alpha.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseKeystoreFile as String)
                storePassword = releaseKeystorePass
                keyAlias = releaseKeyAlias ?: "battery-master"
                keyPassword = releaseKeyPass
                // v1.2.6 P3 审计修复：显式启用签名方案 (v1/v2/v3)——v3 轮换证明在
                // targetSdk 30+ 设备必需；旧实现依赖 AGP 默认行为，不同配置下可能缺 v3。
                // v2.0.0-alpha 批次G：升级 AGP 8.10.1 后经 javap 实证 DSL 仅提供
                // enableV1/V2/V3/V4Signing——v3.1 (轮换密钥证明) 无 DSL 开关，且该方案
                // 仅对已实际执行密钥轮换的密钥库有意义，当前单层密钥库由 v3 覆盖；
                // 同步显式启用 v4 (增量安装/文件级校验，不影响 v2/v3 兼容性)
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
                enableV4Signing = true
            }
        }
    }

    buildTypes {
        release {
            // 正式发布：R8 全量混淆 + 资源收缩，压缩包体并移除未引用代码/资源
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = if (hasReleaseSigning) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        // AboutAppCard 版本徽章经 BuildConfig.VERSION_NAME/VERSION_CODE 单源注入
        buildConfig = true
    }
    testOptions {
        unitTests {
            // Robolectric 需要资源与 Manifest 上下文
            isIncludeAndroidResources = true
        }
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.core:core-ktx:1.15.0")

    // 单元测试 (Robolectric)：无模拟器验证启动全链路 (Activity/ViewModel/Receiver/Resolver)
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.14.1")
    testImplementation("androidx.test:core-ktx:1.6.1")
    testImplementation(platform("androidx.compose:compose-bom:2024.10.01"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
`,
  },
  {
    id: 'gradle_properties',
    name: 'gradle.properties',
    path: 'android/gradle.properties',
    language: 'properties',
    description: '全局 Gradle 属性配置：开启 android.useAndroidX 与 JVM 编译优化',
    code: `# Project-wide Gradle settings.
# Enable AndroidX support for libraries and dependencies (required by AndroidX and Jetpack Compose)
android.useAndroidX=true
android.nonTransitiveRClass=true

# JVM memory configuration for Gradle daemon
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8

# Kotlin style
kotlin.code.style=official`,
  },
  {
    id: 'receiver',
    name: 'BatteryReceiver.kt',
    path: 'android/app/src/main/java/com/battery/master/receiver/BatteryReceiver.kt',
    language: 'kotlin',
    description: '广播通道核心：监听 ACTION_BATTERY_CHANGED，与轮询通道共享 Reader 配置与指标 12 锁定逻辑（App 实际源码）',
    code: `package com.battery.master.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import com.battery.master.data.BatteryState
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatteryHealthEngine
import com.battery.master.service.BatteryTelemetryParser

/**
 * 监听 Android 底层硬件广播 ACTION_BATTERY_CHANGED
 * 提取电压、温度、瞬时电流、健康状态并根据条件 12 判定完全充满
 * 设计容量等配置共享 BatteryHardwareReader 单一数据源，避免双通道数据不一致
 *
 * v1.2.1 自检优化：12 项指标解析统一收敛至 BatteryTelemetryParser，
 * 与轮询通道 (BatteryHardwareReader) 共用单一实现，从结构上保证
 * 双通道指标 12「完全充满容量」语义完全一致，杜绝两套并行解析的逻辑漂移。
 */
class BatteryReceiver(
    private val reader: BatteryHardwareReader,
    private val onBatteryUpdate: (BatteryState) -> Unit
) : BroadcastReceiver() {

    /**
     * 启动闪退治理：ACTION_BATTERY_CHANGED 是粘性广播，注册成功瞬间即在主线程同步回调
     * (ViewModel 构造期间)，BroadcastReceiver 未捕获异常会直接导致进程崩溃。
     * 因此整体包一层 Throwable 兜底：单次解析失败由 1 秒轮询通道自动补偿，绝不影响启动。
     */
    override fun onReceive(context: Context, intent: Intent) {
        try {
            handleBatteryChanged(context, intent)
        } catch (e: Throwable) {
            // 任何解析异常静默丢弃本次广播，轮询通道继续兜底，保证启动与运行期稳定
        }
    }

    private fun handleBatteryChanged(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BATTERY_CHANGED) return

        // 安全转换：极端场景下系统服务异常返回时静默丢弃本次广播，轮询通道继续兜底
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager ?: return

        // 12 项指标统一经共享解析器提取 (与轮询通道单一实现，语义零漂移)；
        // 设计容量来源随 Reader 单一数据源透传，双通道标注一致
        val raw = BatteryTelemetryParser.parse(
            intent,
            batteryManager,
            reader.designCapacityMah,
            reader.designCapacitySource
        )

        // 12. 完全充满时的容量：与轮询通道共享三态锁定逻辑，满足则锁定+持久化，
        // 未满足保留上次锁定值不抹除；先锁定再读时间戳保证回显值实时刷新
        // v1.2.6 P2 审计修复：充电态判定单源——直接消费解析器输出的 raw.isCharging
        // (含 EXTRA_PLUGGED 通道判定)，杜绝广播通道本地重复推导与解析口径漂移
        // v2.0.0-alpha 批次B：广播通道喂样健康引擎 (ΔV/ΔI 内阻滑窗 + 温度 EWMA)
        BatteryHealthEngine.observe(raw)

        reader.lockFullChargeIfCriteriaMet(raw.currentCapacityMah, raw.percentage, raw.currentMa, raw.isCharging)

        // v1.2.3 P0 审计修复：真实锁定 (REAL) 与模拟演示值 (SIMULATED) 分离，
        // 双通道统一经 Reader 单一数据源解析展示值，广播通道不再冒充实测锁定
        val display = reader.resolveFullChargeDisplay()

        onBatteryUpdate(raw.toBatteryState(display.capacityMah, display.timestampMs, display.source))
    }
}
`,
  },
  {
    id: 'state',
    name: 'BatteryState.kt',
    path: 'android/app/src/main/java/com/battery/master/data/BatteryState.kt',
    language: 'kotlin',
    description: '12 项充放电指标数据模型 + 硬件信息汇总 + 双枚举（App 实际源码）',
    code: `package com.battery.master.data

/**
 * 容量数据来源等级 (v1.2.3 健康度真实性审计新增)
 *
 * 电池健康度 = 当前容量 / 设计容量，两项容量都可能来自实测或估算。
 * 旧实现把 0.92 降级估算值与 sysfs 实测值以同等精度展示 (如无 sysfs 时显示
 * 精确的 "92.0%")，虚构精度冒充真实测量；现按硬件字段既有模式显式标注来源，
 * 保证用户可区分"真实状态"与"降级估算"。
 */
enum class CapacitySource(val label: String) {
    /** Linux sysfs charge_full / charge_full_design 实测 */
    SYSFS("sysfs 实测"),

    /** BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER 库仑计剩余电荷实测 (指标 02) */
    COULOMB_COUNTER("库仑计实测"),

    /** PowerProfile 反射实测 (设计容量) */
    POWER_PROFILE("PowerProfile 实测"),

    /** 用户在设置中手动校准 */
    CALIBRATED("用户校准"),

    /** sysfs 全链路不可读时按设计容量估算 (非真实测量，v2.0.0-alpha.1 起不再虚构数值) */
    ESTIMATED("降级估算"),

    /**
     * v2.0.0-alpha.1 用户口径修正：电量计节点 (charge_full) 全链路不可读——
     * 不再按出厂保持率 (0.92) 虚构"当前容量/健康度"，数值显示 "—"，
     * 健康度标注"无法测算"。是多少就是多少，测不到就不展示
     */
    UNAVAILABLE("不可测算"),

    /** 全链路失败时的 5000 mAh 兜底 (非真实测量) */
    FALLBACK("5000 mAh 兜底")
}

/**
 * 电池全部 12 项充放电指标数据模型 + 硬件信息汇总
 */
data class BatteryState(
    // 1、电池健康度 (百分比，例如 94.5%)
    // v2.0.0-alpha.1：hasMeasuredCapacity=false 时为 0 (UI 显示"无法测算")——
    // 旧实现 0.92×设计容量的虚构健康度已移除，是多少就是多少
    val healthPercentage: Float = 0f,

    // 2、剩余电量 (mAh，例如 3800 mAh)
    val remainingCapacityMah: Int = 0,

    /**
     * 指标 02 剩余电量口径 (v1.2.4 P2 审计修复)：
     * COULOMB_COUNTER = 系统库仑计实测；ESTIMATED = 百分比 × 当前容量 估算。
     * 两条口径量纲基准不同 (机型间不可比、运行中切换会跳变)，UI 显式标注口径来源
     */
    val remainingCapacitySource: CapacitySource = CapacitySource.ESTIMATED,

    // 3、电池当前容量 (电池衰减后的容量 mAh，例如 4700 mAh)
    // 0 = 电量计节点不可读 (非真实测量)；合法实测区间 500~25000
    val currentCapacityMah: Int = 0,

    /**
     * v2.0.0-alpha.1：当前容量是否实测 (sysfs/bms/maxfg 探测链命中)。
     * false 时指标 01 健康度/指标 03 当前容量显示 "— 无法测算"，不虚构数值
     */
    val hasMeasuredCapacity: Boolean = false,

    // 4、电池设计容量 (电池出厂容量 mAh，例如 5000 mAh)
    val designCapacityMah: Int = 5000,

    /** 指标 03 当前容量数据来源 (sysfs 实测 / 0.92 降级估算)；指标 01 健康度同源 */
    val currentCapacitySource: CapacitySource = CapacitySource.ESTIMATED,

    /** 指标 04 设计容量数据来源 (PowerProfile / sysfs / 用户校准 / 5000 mAh 兜底) */
    val designCapacitySource: CapacitySource = CapacitySource.FALLBACK,

    // 5、电量：当前电池电量的百分比 (0 - 100)
    val percentage: Int = 0,

    // 6、电池状态：充电中、放电中、已充满、未充电
    val status: BatteryStatus = BatteryStatus.NOT_CHARGING,

    // 7、电池温度：摄氏度 (例如 32.5°C)
    // 默认 25.0°C 中性室温 (与 BatteryTelemetryParser 缺失默认一致)；0.0 会被 UI 判定为"过冷"
    val temperatureCelsius: Float = 25.0f,

    // 8、电池健康：良好、过热、损坏、超压、未知
    // 默认 UNKNOWN 诚实中性 (与 Reader 降级态一致)；GOOD 属正面断言不作默认
    val healthQuality: BatteryHealthQuality = BatteryHealthQuality.UNKNOWN,

    // 9、电压：毫伏 mV (例如 4150 mV)
    // 默认 4000 中性典型值 (与 Parser 故障回退一致)；0 是故障断言值
    val voltageMv: Int = 4000,

    // 10、循环计数：电池充放电的次数
    val cycleCount: Int = 0,

    // 11、电流：瞬时电流 mA (充电流入为正，放电消耗为负)
    // v1.2.3 P0 审计修复：设备不支持 BATTERY_PROPERTY_CURRENT_NOW 时系统返回
    // Int.MIN_VALUE，旧实现归一化成 0 mA 会使指标 12 充满判定 (0~25mA) 恒真。
    // 现改为可空：null = 电流不可读，UI 显示 "—"，判定走 UNKNOWN 而非 true
    val currentMa: Int? = null,

    // 12、完全充满时的容量 (mAh)
    // 仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满并记录
    val fullChargeCapacityMah: Int? = null,

    // 满足 100% 且电流 0-25 mA 充满条件的判定时间戳
    val lastFullChargeTimestamp: Long? = null,

    // 功率 (W)
    val powerWatts: Float = 0.0f,

    // 是否符合充满判定标准 (verdict == FULLY_CHARGED 的便捷布尔)
    val isFullChargeConditionMet: Boolean = false,

    /**
     * 指标 12 充满判定三态 (v1.2.3 P0 审计修复)
     *
     * 旧实现仅布尔判定，且电流不可读时归一化为 0 → 不支持 CURRENT_NOW 的机型
     * 一到 100% 就谎报"已达充满判定"并把估算值写盘。现显式区分不可读场景。
     */
    val fullChargeVerdict: FullChargeVerdict = FullChargeVerdict.NOT_YET,

    /**
     * 指标 12 锁定容量来源 (v1.2.3 P0 审计修复)
     *
     * 真实锁定 (REAL) 与"一键模拟完全充满"演示值 (SIMULATED) 分离存储，
     * 演示值不再冒充实测锁定值，UI 显式标注来源。
     */
    val fullChargeSource: FullChargeSource = FullChargeSource.NONE,

    // ===== 硬件信息汇总 =====
    // 默认值为中性估算文案 (采集层 HardwareInfoResolver 会立即以实测/档案值覆盖)；
    // 三级回退链保证运行期任何字段不再出现"系统未上报"
    val socModel: String = "平台 SoC 解析中",
    val socVendor: String = "主流旗舰 SoC 厂商 [工程估算]",
    val socProcess: String = "主流旗舰制程 (以厂方规格为准) [工程估算]",
    val socCpu: String = "8 核 64 位大小核架构 [工程估算]",
    val socGpu: String = "平台集成旗舰 GPU [工程估算]",
    val pmicModel: String = "平台级 PMIC 电源管理 [工程估算]",
    val batteryChemistry: String = "锂离子/聚合物电芯 (主流体系) [工程估算]",
    val fastChargeProtocol: String = "USB PD / QC 兼容快充 [工程估算]",
    val internalResistanceMohm: Float = 0f,

    /**
     * v2.0.0-alpha 批次B：内阻数据来源标注。
     * "[运行时测算·高置信 n=48]" = ΔV/ΔI 滑窗回归实测；"[工程估算]" = 回退估算模型
     */
    val internalResistanceLabel: String = "[工程估算]",

    /**
     * v2.0.0-alpha 批次B：循环寿命预测文案 (如 "预计还可循环约 480 次 [模型预测]")。
     * 仅健康度实测 (当前容量 sysfs + 设计容量非兜底) 时输出；估算健康度不做外推
     */
    val healthForecastText: String? = null,

    /**
     * v2.0.0-alpha.1：电量计探测链命中节点 (如 "bms"/"maxfg"/"battery")，
     * 遥测分析 Tab 展示真实数据来源路径；"无" = 全链路未命中
     */
    val gaugeNodePath: String = "无",

    /**
     * v2.0.0-alpha.1：内阻引擎滑窗样本数与置信度 (遥测分析 Tab 采集链路卡展示)
     */
    val engineSampleCount: Int = 0,
    val engineConfidenceLabel: String = "UNAVAILABLE",

    val halVersion: String = "Android BatteryManager API",
    val cellStructure: String = "标准单电芯封装 [工程估算]",
    val thermalThrottlingState: String = "正常供电 (无节流)"
) {
    // 别名兼容
    val currentNowMa: Int? get() = currentMa
}

/**
 * 指标 12 充满判定三态 (v1.2.3 P0 审计修复)
 *
 * - FULLY_CHARGED：电量 100% 且充电态下瞬时电流 |I| ≤ 25 mA (浮充截止区间)；
 * - NOT_YET：条件未满足 (电量不足 / 电流超区间 / 未在充电)；
 * - CURRENT_UNAVAILABLE：设备不支持 CURRENT_NOW 或读数不可用——
 *   此时不得谎报充满，也不得把估算值当作"实测完全充满容量"锁定写盘。
 */
enum class FullChargeVerdict {
    FULLY_CHARGED,
    NOT_YET,
    CURRENT_UNAVAILABLE
}

/**
 * 指标 12 锁定容量来源 (v1.2.3 P0 审计修复)
 *
 * REAL：真实硬件判定锁定 (含持久化恢复)；
 * SIMULATED："一键模拟完全充满"演示按钮写入的演示值 (独立 key 存储)；
 * NONE：无任何锁定记录。
 */
enum class FullChargeSource {
    REAL,
    SIMULATED,
    NONE
}

enum class BatteryStatus(val label: String) {
    CHARGING("充电中"),
    DISCHARGING("放电中"),
    FULL("已充满"),
    NOT_CHARGING("未充电")
}

enum class BatteryHealthQuality(val label: String) {
    GOOD("良好"),
    OVERHEAT("过热"),
    DEAD("损坏"),
    OVER_VOLTAGE("超压"),
    UNKNOWN("未知")
}
`,
  },
  {
    id: 'viewmodel',
    name: 'BatteryViewModel.kt',
    path: 'android/app/src/main/java/com/battery/master/viewmodel/BatteryViewModel.kt',
    language: 'kotlin',
    description: '状态中枢：双通道发布去重、模拟充满保持期倒计时、广播注册容错（App 实际源码）',
    code: `package com.battery.master.viewmodel

import android.app.Application
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.media.ToneGenerator
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatteryTelemetryParser
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * 硬件实验室一键模拟场景 (与 Web 端 HardwareSimulationLab 对齐)
 */
enum class LabScenario(val label: String, val desc: String) {
    FULL_CHARGE("充满校准", "100% 且电流 16 mA"),
    FLASH_CHARGE("极速闪充", "+4800 mA / 45%"),
    GAMING_DISCHARGE("高负载游戏放电", "-1150 mA / 发热升高"),
    OVERHEAT_ALERT("电池过热警报", "49.2°C / 异常中断")
}

/**
 * 实验室模拟覆盖层：非空时 UI 展示模拟数据，真实遥测轮询被冻结；
 * 全部字段可在滑杆/枚举中独立调节，退出后无缝恢复真实硬件遥测
 */
data class LabOverride(
    val percentage: Int,
    val currentMa: Int,
    val voltageMv: Int,
    val temperatureCelsius: Float,
    val status: BatteryStatus,
    val healthQuality: BatteryHealthQuality,
    val cycleCount: Int
)

class BatteryViewModel(application: Application) : AndroidViewModel(application) {

    private val reader = BatteryHardwareReader(application.applicationContext)

    // 启动闪退治理：构造期首次读取走安全读取，任何 ROM 硬件异常都降级为默认态而非崩溃
    private val _batteryState = MutableStateFlow(reader.readBatteryTelemetry())
    val batteryState: StateFlow<BatteryState> = _batteryState.asStateFlow()

    // 兼容别名
    val batteryInfo: StateFlow<BatteryState> get() = batteryState

    // 事件通道：监听系统 ACTION_BATTERY_CHANGED 广播 (与 1 秒轮询互补，共享 Reader 配置)
    private val batteryReceiver = BatteryReceiver(reader) { fresh -> publish(fresh) }

    // 一键模拟充满后的保持期截止时间戳 (毫秒)：期间不覆盖模拟数据，15 秒后恢复真实遥测
    private var simulationHoldUntilMs = 0L

    // 模拟保持期剩余秒数 (供 UI 显示倒计时反馈，0 表示无模拟)
    private val _simulationRemainingSec = MutableStateFlow(0L)
    val simulationRemainingSec: StateFlow<Long> = _simulationRemainingSec.asStateFlow()

    // 广播注册状态标记：仅成功注册后才允许注销，防止 onCleared 重复注销崩溃
    private var isReceiverRegistered = false

    // v1.2.4 P3 审计修复：1Hz 轮询生命周期门控——退后台/锁屏后暂停主线程
    // sysfs 读取与 StateFlow 刷新 (电池监测工具持续后台轮询属反向耗电缺陷)；
    // 广播通道保留 (系统事件驱动，无自轮询开销)，回前台立即恢复
    @Volatile
    private var telemetryPollingActive = true

    /** 前后台切换由 Activity 调用：true=恢复 1Hz 轮询，false=暂停 (广播通道不受影响) */
    fun setTelemetryPollingActive(active: Boolean) {
        telemetryPollingActive = active
    }

    init {
        // 注册容错：部分定制 ROM 可能拒绝动态注册，失败时退化为纯轮询通道，保证 UI 不崩溃
        try {
            ContextCompat.registerReceiver(
                application,
                batteryReceiver,
                IntentFilter(Intent.ACTION_BATTERY_CHANGED),
                ContextCompat.RECEIVER_NOT_EXPORTED
            )
            isReceiverRegistered = true
        } catch (e: Throwable) {
            // Error 级异常 (如部分 ROM 的 SecurityException/LinkageError) 也一并兜底
            isReceiverRegistered = false
        }
        startTelemetryPolling()
        startSimulationCountdown()
    }

    /**
     * 模拟保持期倒计时：每 250ms 刷新剩余秒数，让用户明确感知
     * "模拟数据生效中、N 秒后恢复真实遥测"，避免误以为界面卡死
     *
     * v1.2.5 性能审计修复：无模拟时段降频空转——旧实现全生命周期固定 4Hz 唤醒
     * (250ms)，即使 99% 的时间无模拟在跑也持续消耗主线程时钟；现无保持期时
     * 以 500ms 低频轮询保持期开始信号 (触发后 0.5s 内即进入高频倒计时)，
     * 活跃保持期内维持 250ms 高频刷新
     */
    private fun startSimulationCountdown() {
        viewModelScope.launch {
            while (isActive) {
                try {
                    val remainingMs = simulationHoldUntilMs - System.currentTimeMillis()
                    if (remainingMs <= 0L) {
                        _simulationRemainingSec.value = 0L
                        // 无模拟：低频空转等待下一次保持期开始
                        delay(500)
                        continue
                    }
                    _simulationRemainingSec.value = (remainingMs + 999) / 1000
                } catch (e: Exception) {
                    // v1.2.6 P2 审计修复：协程取消必须原样重抛——旧实现 catch Throwable
                    // 吞掉 CancellationException，ViewModel 销毁时取消信号被静默吞掉一拍，
                    // 违背结构化并发语义；非取消类异常仍不致命，下一拍继续刷新
                    if (e is CancellationException) throw e
                }
                delay(250)
            }
        }
    }

    override fun onCleared() {
        if (isReceiverRegistered) {
            try {
                getApplication<Application>().unregisterReceiver(batteryReceiver)
            } catch (e: Throwable) {
                // 防御：系统已代为注销/ROM 拒绝时忽略，避免清理阶段崩溃
            }
            isReceiverRegistered = false
        }
        // v1.2.4 P3 审计修复：释放 ToneGenerator native 对象——旧实现仅在播放异常
        // 分支释放，ViewModel 销毁时懒创建的实例泄漏 (每次带实验室的页面销毁泄漏一个)
        try {
            labToneGenerator?.release()
        } catch (e: Throwable) {
            // 释放异常不阻塞清理
        }
        labToneGenerator = null
        super.onCleared()
    }

    /**
     * 统一发布遥测数据：
     * 1. 模拟保持期内不覆盖 (一键充满演示可持续观察 15 秒)；
     * 2. 硬件实验室模拟中冻结真实遥测覆盖，保持滑杆/场景设定值稳定展示。
     *
     * v1.2.1 自检修复：删除旧版"上一轮已锁定则回填"分支——
     * 锁定容量以 BatteryHardwareReader 为单一数据源 (未满足判定时已自动返回上次锁定值)，
     * 旧分支会把实验室合成的展示容量泄漏进真实遥测态 (退出实验室后虚假回显)。
     */
    private fun publish(fresh: BatteryState) {
        // 启动闪退治理：发布链路任何异常都不能逃逸到协程 (未捕获异常会直接杀进程)
        try {
            if (System.currentTimeMillis() < simulationHoldUntilMs) return
            // 硬件实验室模拟中：冻结真实遥测覆盖，保持滑杆/场景设定值稳定展示
            if (_labOverride.value != null) return

            _batteryState.value = fresh
        } catch (e: Throwable) {
            // 单拍发布失败保留上一帧数据，下一拍自动恢复
        }
    }

    private fun startTelemetryPolling() {
        viewModelScope.launch {
            while (isActive) {
                // 启动闪退治理：轮询体整体兜底，硬件读取异常只跳过本拍，协程不中断
                try {
                    // v1.2.4 P3 审计修复：后台态跳过读取与发布 (保持 1s 节奏，回前台无缝恢复)
                    if (telemetryPollingActive) {
                        publish(reader.readBatteryTelemetry())
                    }
                } catch (e: Throwable) {
                    // 读取失败静默跳过，1 秒后重试
                }
                delay(1000)
            }
        }
    }

    fun setDesignCapacity(capacityMah: Int) {
        // 启动闪退治理：UI 回调入口兜底，写配置/读遥测异常不逃逸到主线程
        try {
            // v1.2.3 审计加固：设计容量是指标 01/02/03 的分母与估算基准，
            // 区间外非法值 (≤0 / 越界) 一律拒绝写入，与 BatteryTelemetryParser
            // 合理区间常量单源一致，防止级联污染三项指标
            val isPlausible = capacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH
            if (!isPlausible) return
            reader.designCapacityMah = capacityMah
            // v1.2.3 健康度真实性审计：用户手动校准是可信来源，标注 CALIBRATED，
            // 与系统解析值 (PowerProfile/sysfs) 在 UI 上可区分
            reader.designCapacitySource = CapacitySource.CALIBRATED
            simulationHoldUntilMs = 0L // 手动改配置立即恢复真实遥测
            if (_labOverride.value != null) {
                // 链路闭环修复：实验室模拟中 publish 会冻结真实遥测覆盖，旧实现导致
                // designCapacityMah 写入 Reader 后 _batteryState 不刷新——实验室
                // "设计容量"滑杆数值回弹、指标 01/02/03 停止联动。显式刷新基底后
                // 重放实验室覆盖层，保证 滑杆 → Reader 配置 → 指标 01/02/03 → UI 闭环
                _batteryState.value = reader.readBatteryTelemetry()
                publishLab()
            } else {
                publish(reader.readBatteryTelemetry())
            }
        } catch (e: Throwable) {
            // 忽略：保持当前展示数据
        }
    }

    // ==================== 硬件实验室 (与 Web 端 HardwareSimulationLab 对齐) ====================

    // 实验室模拟覆盖层：null = 真实遥测；非空 = 模拟数据生效
    private val _labOverride = MutableStateFlow<LabOverride?>(null)
    val labOverride: StateFlow<LabOverride?> = _labOverride.asStateFlow()

    // 实验室提示音开关 (ToneGenerator 系统提示音，无需额外权限)
    private val _labSoundEnabled = MutableStateFlow(true)
    val labSoundEnabled: StateFlow<Boolean> = _labSoundEnabled.asStateFlow()

    private var labToneGenerator: ToneGenerator? = null

    /** 实验室提示音：ToneGenerator 懒创建 + 防御性释放，失败静默 (部分 ROM 限制) */
    private fun playLabTone(tone: Int) {
        if (!_labSoundEnabled.value) return
        try {
            if (labToneGenerator == null) {
                labToneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 70)
            }
            labToneGenerator?.startTone(tone, 150)
        } catch (e: Throwable) {
            // ToneGenerator 构造/播放在部分 ROM 抛 RuntimeException，降级为静音
            try {
                labToneGenerator?.release()
            } catch (e2: Throwable) {
            }
            labToneGenerator = null
        }
    }

    /** 进入实验室模拟：以当前真实遥测为基准创建覆盖层 */
    fun enterLabMode() {
        if (_labOverride.value != null) return
        val cur = _batteryState.value
        _labOverride.value = LabOverride(
            percentage = cur.percentage,
            // v1.2.3 P0 审计修复：currentMa 可空，设备不支持 CURRENT_NOW 时
            // 真实值为 null，LabOverride 非空字段以 0 兜底
            currentMa = cur.currentMa ?: 0,
            voltageMv = cur.voltageMv,
            temperatureCelsius = cur.temperatureCelsius,
            status = cur.status,
            healthQuality = cur.healthQuality,
            cycleCount = cur.cycleCount
        )
        playLabTone(ToneGenerator.TONE_PROP_ACK)
        publishLab()
    }

    /** 退出实验室模拟：清除覆盖层并立即恢复真实遥测 */
    fun exitLabMode() {
        // UI 回调入口兜底：恢复真实遥测失败也不影响 UI 稳定
        try {
            _labOverride.value = null
            // v1.2.1 自检修复：用户主动退出实验室即要求立即回到真实遥测，
            // 必须同时取消一键模拟保持期——否则 publish 会在保持期内被拦截，
            // 退出后界面仍残留实验室合成数据直到保持期自然结束
            simulationHoldUntilMs = 0L
            publish(reader.readBatteryTelemetry())
        } catch (e: Throwable) {
            // 忽略：下一拍轮询自动恢复
        }
    }

    fun toggleLabSound() {
        _labSoundEnabled.value = !_labSoundEnabled.value
        if (_labSoundEnabled.value) playLabTone(ToneGenerator.TONE_PROP_BEEP)
    }

    /** 一键场景：自动进入实验室模式并应用预设参数 (与 Web 端四场景一致) */
    fun applyLabScenario(scenario: LabScenario) {
        val base = _labOverride.value ?: run {
            val cur = _batteryState.value
            LabOverride(
                cur.percentage, cur.currentMa ?: 0, cur.voltageMv, cur.temperatureCelsius,
                cur.status, cur.healthQuality, cur.cycleCount
            )
        }
        _labOverride.value = when (scenario) {
            LabScenario.FULL_CHARGE -> base.copy(
                percentage = 100, currentMa = 16, voltageMv = 4410,
                status = BatteryStatus.CHARGING, healthQuality = BatteryHealthQuality.GOOD
            )
            LabScenario.FLASH_CHARGE -> base.copy(
                percentage = 45, currentMa = 4800, voltageMv = 4250,
                temperatureCelsius = 38.5f, status = BatteryStatus.CHARGING,
                healthQuality = BatteryHealthQuality.GOOD
            )
            LabScenario.GAMING_DISCHARGE -> base.copy(
                currentMa = -1150, voltageMv = 3820, temperatureCelsius = 39.8f,
                status = BatteryStatus.DISCHARGING, healthQuality = BatteryHealthQuality.GOOD
            )
            LabScenario.OVERHEAT_ALERT -> base.copy(
                temperatureCelsius = 49.2f, healthQuality = BatteryHealthQuality.OVERHEAT,
                status = BatteryStatus.NOT_CHARGING
            )
        }
        playLabTone(ToneGenerator.TONE_PROP_BEEP)
        publishLab()
    }

    // ---- 滑杆逐项调节：无覆盖层时自动以真实遥测为基准进入实验室 ----

    private fun mutateLab(transform: (LabOverride) -> LabOverride) {
        // UI 回调入口兜底：滑杆高频回调，异常不逃逸到主线程
        try {
            _labOverride.update { current ->
                transform(current ?: run {
                    val cur = _batteryState.value
                    LabOverride(
                        cur.percentage, cur.currentMa ?: 0, cur.voltageMv, cur.temperatureCelsius,
                        cur.status, cur.healthQuality, cur.cycleCount
                    )
                })
            }
            publishLab()
        } catch (e: Throwable) {
            // 忽略：保持当前模拟参数
        }
    }

    fun updateLabPercentage(v: Int) = mutateLab { it.copy(percentage = v.coerceIn(0, 100)) }
    // v1.2.3 P1 审计修复：滑杆区间与解析器合法区间对齐 (旧实现 5 条滑杆区间
    // 均窄于解析器钳制区间，真实合法值被静默压成边界值：如双电芯 8800mV 一碰变
    // 4600mV、120W 快充 8000mA 一碰变 6000mA)。区间单源：BatteryTelemetryParser
    fun updateLabCurrent(v: Int) =
        mutateLab { it.copy(currentMa = v.coerceIn(-BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA, BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA)) }
    fun updateLabVoltage(v: Int) =
        mutateLab { it.copy(voltageMv = v.coerceIn(BatteryTelemetryParser.MIN_PLAUSIBLE_VOLTAGE_MV, BatteryTelemetryParser.MAX_PLAUSIBLE_VOLTAGE_MV)) }
    fun updateLabTemperature(v: Float) =
        mutateLab { it.copy(temperatureCelsius = v.coerceIn(BatteryTelemetryParser.MIN_PLAUSIBLE_TEMPERATURE_C, BatteryTelemetryParser.MAX_PLAUSIBLE_TEMPERATURE_C)) }
    fun updateLabCycleCount(v: Int) =
        mutateLab { it.copy(cycleCount = v.coerceIn(0, BatteryTelemetryParser.MAX_PLAUSIBLE_CYCLE_COUNT)) }
    fun updateLabStatus(v: BatteryStatus) = mutateLab { it.copy(status = v) }
    fun updateLabHealthQuality(v: BatteryHealthQuality) = mutateLab {
        val t = when (v) {
            BatteryHealthQuality.OVERHEAT -> 49.2f
            // v1.2.3 审计修复：选非过热态时若温度仍停留在过热区 (>45°C，与解析器
            // "严重发热"分级阈值一致)，回落中性室温 25°C——消除"健康=良好
            // 但 49.2°C"的自相矛盾展示，保证健康枚举与温度指标链路闭环
            else -> if (it.temperatureCelsius > 45f) 25.0f else it.temperatureCelsius
        }
        it.copy(healthQuality = v, temperatureCelsius = t)
    }

    /** 设计容量滑杆：直接作用于 Reader 配置 (真实生效，与总览页校准入口同源) */
    fun updateLabDesignCapacity(v: Int) {
        // v1.2.3 P1 审计修复：移除 1000~15000 二次钳制——真实设备 (600mAh 小电池 /
        // 23800mAh 三防大电池) 被静默改写成边界值会污染指标 01/02/03 至重启。
        // 区间校验统一由 setDesignCapacity (500~25000, 与解析器常量单源) 承担
        setDesignCapacity(v)
    }

    /** v1.2.3 P0 审计修复：清除指标 12 全部锁定记录 (真实 + 模拟演示值) */
    fun clearFullChargeRecords() {
        reader.clearFullChargeRecords()
        _batteryState.update { state ->
            state.copy(
                fullChargeCapacityMah = null,
                lastFullChargeTimestamp = null,
                isFullChargeConditionMet = false,
                fullChargeVerdict = FullChargeVerdict.NOT_YET,
                fullChargeSource = FullChargeSource.NONE
            )
        }
    }

    /** v1.2.3 P1 审计修复：清除用户校准的设计容量，恢复系统自动探测 */
    fun clearDesignCapacityCalibration() {
        reader.clearDesignCapacityCalibration()
        publish(reader.readBatteryTelemetry())
    }

    /**
     * 将实验室覆盖层合成为展示态 BatteryState：
     * 剩余电量/功率/充满判定按模拟值实时重算；容量与锁定指标 12 保持真实值不丢失
     */
    private fun publishLab() {
        val lab = _labOverride.value ?: return
        // UI 回调入口兜底：合成展示态失败时保留上一帧，不逃逸到主线程
        try {
            val base = _batteryState.value
            // v2.0.0-alpha.1：模拟基准容量——真实通道容量不可测 (0) 时退回设计容量，
            // 保证实验室演示环境自洽 (UI 已全程标注 [模拟]，不冒充实测)
            val labBaseCapacity = base.currentCapacityMah.takeIf { it > 0 } ?: base.designCapacityMah
            // v1.2.3 P0 审计修复：充满判定三态 (与真实通道同一实现)；
            // 未处于充电/满电状态时不得判定充满，杜绝"健康=良好+49.2℃"式矛盾组合
            val isLabCharging = lab.status == BatteryStatus.CHARGING || lab.status == BatteryStatus.FULL
            val verdict = BatteryTelemetryParser.evaluateFullCharge(lab.percentage, lab.currentMa, isLabCharging)
            val isFullMet = verdict == FullChargeVerdict.FULLY_CHARGED
            val effectiveStatus = if (isFullMet) BatteryStatus.FULL else lab.status
            // 四舍五入与真实遥测通道 (BatteryTelemetryParser) 及 Web 端口径一致，消除截断漂移
            val remaining = Math.round(labBaseCapacity * (lab.percentage / 100f))
            _batteryState.value = base.copy(
                percentage = lab.percentage,
                currentMa = lab.currentMa,
                voltageMv = lab.voltageMv,
                temperatureCelsius = lab.temperatureCelsius,
                status = effectiveStatus,
                healthQuality = lab.healthQuality,
                cycleCount = lab.cycleCount,
                remainingCapacityMah = remaining.coerceAtMost(labBaseCapacity),
                // v1.2.4 P2 审计修复：实验室剩余电量 = 百分比 × 当前容量 (估算口径)，
                // 显式标注 ESTIMATED，避免继承真实通道的 COULOMB_COUNTER 标注
                remainingCapacitySource = CapacitySource.ESTIMATED,
                // v1.2.4 P2 审计修复：移除 abs()——功率随符号携带方向 (充电 +W / 放电 −W)
                powerWatts = (lab.voltageMv * lab.currentMa) / 1_000_000f,
                isFullChargeConditionMet = isFullMet,
                fullChargeVerdict = verdict,
                // 实验室注入的锁定值一律标注 SIMULATED，与真实锁定分离
                fullChargeCapacityMah = if (isFullMet) (base.fullChargeCapacityMah ?: labBaseCapacity)
                else base.fullChargeCapacityMah,
                fullChargeSource = if (isFullMet) FullChargeSource.SIMULATED else base.fullChargeSource
            )
        } catch (e: Throwable) {
            // 忽略：保持上一帧展示
        }
    }

    /**
     * 一键模拟完全充满判定条件 (电量 100% 且充电态瞬时电流 |I| ≤ 25mA)
     * 模拟结果写入独立演示 key 持久化，保持期结束后可回显 (指标 12) 且标注"来源：模拟"，
     * 不污染真实锁定记录；可在充满判定卡一键清除。
     *
     * v1.2.3 P0 审计修复：旧实现 persistFullChargeCapacity 把演示值写进真实锁定
     * key——用户点一次演示按钮，指标 12 永久显示假容量且跨重启存在，UI 只标
     * "历史锁定"不标"模拟"。
     *
     * v1.2.1 自检修复：容量非法 (≤0) 时拒绝写入持久化并保留上次有效锁定值，
     * 同步把剩余电量校准为当前容量，保证"100% 充满"展示态自洽。
     */
    fun triggerFullChargeSimulation() {
        // UI 回调入口兜底
        try {
            val current = _batteryState.value
            val timestamp = System.currentTimeMillis()
            simulationHoldUntilMs = timestamp + SIMULATION_HOLD_MS
            // v1.2.6 P2 审计修复：同步置剩余秒数——旧实现等倒计时协程下一拍 (最多 500ms
            // 低频空转间隔) 才刷新，触发瞬间 UI 倒计时存在 0~500ms 显示 0 的竞态窗口
            _simulationRemainingSec.value = (SIMULATION_HOLD_MS + 999) / 1000
            // v2.0.0-alpha.1：演示容量不再取真实通道 currentCapacityMah——电量计节点
            // 不可读时该值为 0，被持久化区间校验拒绝导致 SIMULATED key 永不写入
            // (回显来源 NONE)。演示模式语义 = 固定演示电芯，UI 全程标注 [模拟]，不冒充实测
            val capacity = current.currentCapacityMah.takeIf { it > 0 } ?: SIMULATED_DEMO_CAPACITY_MAH
            // v1.2.3 P0 审计修复：演示值写独立 key，真实锁定 (REAL) 优先展示
            reader.persistSimulatedFullChargeCapacity(capacity, timestamp)
            val lockedCapacity = if (capacity > 0) capacity else current.fullChargeCapacityMah
            _batteryState.value = current.copy(
                percentage = 100,
                currentMa = SIMULATED_TRICKLE_CURRENT_MA,
                status = BatteryStatus.FULL,
                isFullChargeConditionMet = true,
                fullChargeVerdict = FullChargeVerdict.FULLY_CHARGED,
                fullChargeSource = FullChargeSource.SIMULATED,
                fullChargeCapacityMah = lockedCapacity,
                lastFullChargeTimestamp = timestamp,
                // v2.0.0-alpha.1：模拟态展示自洽——当前容量同步为演示容量 (0 会导致
                // "当前容量 0 mAh / 剩余 4760 mAh"矛盾展示)；UI 全程标注 [模拟] 来源
                hasMeasuredCapacity = lockedCapacity != null,
                currentCapacityMah = lockedCapacity ?: 0,
                // v1.2.4 P2 审计修复：模拟态剩余电量按 100% 校准为当前容量 (估算口径)，
                // 显式标注，不继承真实通道的库仑计实测标注
                remainingCapacitySource = CapacitySource.ESTIMATED,
                remainingCapacityMah = lockedCapacity ?: current.remainingCapacityMah
            )
        } catch (e: Throwable) {
            // 忽略：保持当前展示数据
        }
    }

    companion object {
        /** 一键模拟充满后的保持期 (毫秒) */
        private const val SIMULATION_HOLD_MS = 15_000L

        /**
         * 一键模拟充满的演示电芯容量 (mAh)：电量计节点不可读 (容量=0) 时的固定演示基准，
         * 模拟态 UI 全程标注 [模拟] 来源，不冒充实测
         */
        private const val SIMULATED_DEMO_CAPACITY_MAH = 4760

        /** 一键模拟充满时展示的浮充电流 (mA)：0~25 mA 判定区间内稳定采样点，
         *  与全链路文案口径 (UI 按钮/实验室场景描述/源码镜像) 保持一致 */
        private val SIMULATED_TRICKLE_CURRENT_MA = 16
    }
}
`,
  },
  {
    id: 'sysfs',
    name: 'BatterySysfs.kt',
    path: 'android/app/src/main/java/com/battery/master/service/BatterySysfs.kt',
    language: 'kotlin',
    description: 'sysfs 节点读取 + CURRENT_NOW μA/mA 单位归一化（保护指标 11 与指标 12 涓流判定，App 实际源码）',
    code: `package com.battery.master.service

import java.io.File
import kotlin.math.abs

/**
 * 电池 sysfs 节点读取与电流单位归一化工具
 *
 * 背景：BatteryManager.BATTERY_PROPERTY_CURRENT_NOW 官方规范返回微安 (μA)，
 * 但部分旧内核/芯片实际返回毫安 (mA)。若统一按某一单位换算，
 * 会在涓流区间 (0~25 mA) 产生 1000 倍误差，直接破坏指标 11 (瞬时电流)
 * 与指标 12 (完全充满判定) 的正确性，故做单位归一化处理。
 */
internal object BatterySysfs {

    /**
     * 从 Linux sysfs 读取电池节点数据
     * (例如高通/联发科平台的 /sys/class/power_supply/battery/)
     */
    fun readInt(path: String): Int? = try {
        val file = File(path)
        if (file.exists() && file.canRead()) file.readText().trim().toIntOrNull() else null
    } catch (e: Exception) {
        null
    }

    /**
     * 将 CURRENT_NOW 原始值归一化为毫安 (mA)，统一符号约定"充电为正、放电为负"
     *
     * v1.2.3 P0 审计修复：
     * 1. 可空语义：设备不支持 BATTERY_PROPERTY_CURRENT_NOW 时系统返回
     *    Int.MIN_VALUE (旧实现归一化为 0 mA，导致不支持该属性的机型在 100%
     *    电量时充满判定恒真、估算值被冒充实测锁定写盘)。现 Int.MIN_VALUE
     *    与 null 一律返回 null = 电流不可读，判定方走 UNKNOWN 而非 true。
     *    真实 0 mA (浮充截止) 仍是合法读数，返回 0。
     * 2. 符号归一：AOSP 未规定 current_now 符号方向，实际随平台/HAL 而变
     *    (大量高通/三星内核充电时上报负值)。旧实现只处理量纲不校验符号，
     *    使指标 12 判定 (0~25 mA) 在这类机型上永不成立。现按充放电状态
     *    校准符号：充电态取正值、放电态取负值，未知态保持原始符号。
     *
     * @param raw CURRENT_NOW 原始读数 (μA 或 mA，随 HAL 而定)，允许 null
     * @param isCharging 是否处于充电/满电状态 (null = 未知，不翻转符号)
     * @return 归一化后的 mA 值；不可读返回 null
     */
    fun normalizeCurrentToMilliAmps(raw: Int?, isCharging: Boolean?): Int? {
        // 不支持/不可读：返回 null，绝不归一化成 0 (0 是合法浮充读数，语义不同)
        if (raw == null || raw == Int.MIN_VALUE) return null
        if (raw == 0) return 0

        val normalized = normalizeCurrentToMilliAmpsInternal(raw).coerceIn(
            -BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA,
            BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA
        )

        // 符号校准：跨平台统一"充电为正、放电为负"口径
        return when {
            isCharging == true && normalized < 0 -> -normalized
            isCharging == false && normalized > 0 -> -normalized
            else -> normalized
        }
    }

    private fun normalizeCurrentToMilliAmpsInternal(raw: Int): Int {
        if (raw == 0 || raw == Int.MIN_VALUE) return 0
        val absRaw = abs(raw)
        if (absRaw > 20000) return raw / 1000

        // v2.0.0-alpha 批次A：电流单位判定参照改为多节点探测链
        // (bms/maxfg 平台的 battery 目录无 current_now，旧硬编码路径拿不到参照)
        val sysfsCurrent = readCurrentNow()
        if (sysfsCurrent != null && abs(sysfsCurrent) > 0) {
            val ratio = abs(sysfsCurrent).toFloat() / absRaw
            if (ratio in 500f..2000f) return raw
            if (ratio in (1f / 2000f)..(1f / 500f)) return raw / 1000
            return raw / 1000
        }
        return raw / 1000
    }

    /**
     * 容量原始值 → mAh 双单位归一化 (指标 03 当前容量 / 指标 04 设计容量共用)
     *
     * 背景：charge_full / charge_full_design 规范单位为 μAh，但个别内核以 mAh 上报。
     * 判定链 (合理区间与 BatteryTelemetryParser 常量单源一致)：
     * 1. round(raw / 1000) ∈ [500, 25000] → 规范 μAh，四舍五入取整返回；
     * 2. raw ∈ [500, 25000] → μAh 单位下 0.5~25 mAh 电芯物理上不存在，
     *    必为 mAh 上报内核 → 直接返回原始值；
     * 3. 其余 (0 / 负值 / 越界) 一律视为脏数据返回 null，由调用方回退设计容量估算值。
     */
    fun parseCapacityMah(raw: Int): Int? {
        if (raw <= 0 || raw == Int.MIN_VALUE) return null
        val microAhCapacityMah = Math.round(raw / 1000f)
        if (microAhCapacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
            return microAhCapacityMah
        }
        if (raw in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
            return raw
        }
        return null
    }

    /** 读取 sysfs 容量节点并归一化为 mAh；不可读或脏数据返回 null */
    fun readCapacityMah(path: String): Int? = readInt(path)?.let(::parseCapacityMah)

    // ===== v2.0.0-alpha 批次A：多节点电量计探测链 =====
    //
    // 背景：/sys/class/power_supply/battery 并非全平台都挂载完整电量计节点——
    // 高通 QG 平台与小米澎湃 G1 挂 bms、Pixel (Maxim) 挂 maxfg、OPPO/一加双电芯挂 dc。
    // 旧实现硬编码 battery 目录，这些机型 charge_full/charge_full_design/current_now
    // 全部不可读，指标 03/04 降级 0.92 估算、指标 11 电流符号校准缺少 sysfs 参照。
    // 探测链：按品牌预设优先级 + 特征节点评分自动选出真实电量计目录，探测一次缓存。

    /** 探测根目录可注入 (单元测试用临时目录验证目录优先级逻辑) */
    @Volatile internal var scanRootOverride: String? = null

    private const val DEFAULT_SCAN_ROOT = "/sys/class/power_supply"

    /** 电量计特征节点：命中越多越可信是该平台的真实电量计目录 */
    private val gaugeSignatureNodes = listOf(
        "charge_full_design", "charge_full", "current_now", "cycle_count", "temp", "voltage_now"
    )

    /**
     * 机型预设节点联动：品牌 → 优先探测目录 (排名分先后)。
     * 预设仅在目录真实存在且含足够电量计特征节点时生效，不存在自动滑落到
     * battery 目录与其余评分目录，预设错误不会导致误读
     */
    private val brandPreferredGaugeDirs = listOf(
        "xiaomi" to listOf("bms", "maxfg"),
        "redmi" to listOf("bms", "maxfg"),
        "poco" to listOf("bms", "maxfg"),
        "google" to listOf("maxfg", "bms"),
        "oppo" to listOf("dc", "bms"),
        "oneplus" to listOf("dc", "bms"),
        "realme" to listOf("dc", "bms"),
        "vivo" to listOf("bms", "battery"),
        "iqoo" to listOf("bms", "battery"),
        "samsung" to listOf("battery", "bms"),
        "honor" to listOf("battery", "bms"),
        "huawei" to listOf("battery", "bms"),
        "asus" to listOf("maxfg", "battery"),
        "motorola" to listOf("battery", "bms"),
        "nubia" to listOf("bms", "battery"),
        "zte" to listOf("bms", "battery")
    )

    // 探测结果缓存：探测一次 (空结果也缓存，避免不可读设备每秒重扫 power_supply)
    @Volatile private var probed = false
    @Volatile private var cachedGaugeDirs: List<String> = emptyList()

    /** 电量计目录评分：特征节点命中数 (存在且可读) */
    private fun scoreGaugeDir(dir: File): Int =
        gaugeSignatureNodes.count { node ->
            runCatching { File(dir, node).let { it.exists() && it.canRead() } }.getOrDefault(false)
        }

    /**
     * 纯函数 (测试可直接驱动)：扫描 power_supply 根目录并给出电量计目录优先级链。
     * 优先级：品牌预设目录 (存在且评分≥2) > battery > 其余按评分降序；
     * 评分 <2 (至少两个特征节点) 的目录视为噪声目录不参与
     */
    internal fun selectGaugeDirs(root: File, brandKey: String): List<String> {
        val brand = brandKey.lowercase()
        val scored = runCatching {
            root.listFiles()?.filter { it.isDirectory }?.map { it to scoreGaugeDir(it) }
        }.getOrNull() ?: return emptyList()
        val valid = scored.filter { it.second >= 2 }
        if (valid.isEmpty()) return emptyList()

        val ordered = mutableListOf<File>()
        val preferred = brandPreferredGaugeDirs
            .firstOrNull { brand.startsWith(it.first) }?.second ?: emptyList()
        preferred.forEach { name -> valid.firstOrNull { it.first.name == name }?.let { ordered.add(it.first) } }
        valid.filter { it.first.name == "battery" && it.first !in ordered }.forEach { ordered.add(it.first) }
        valid.sortedByDescending { it.second }.forEach { if (it.first !in ordered) ordered.add(it.first) }
        return ordered.map { it.absolutePath }
    }

    /** 运行时探测 (带缓存与 Throwable 兜底)；测试可经 installProbeResultForTest 注入 */
    private fun resolveGaugeDirs(): List<String> {
        if (probed) return cachedGaugeDirs
        probed = true
        cachedGaugeDirs = try {
            selectGaugeDirs(
                File(scanRootOverride ?: DEFAULT_SCAN_ROOT),
                android.os.Build.MANUFACTURER.lowercase()
            )
        } catch (e: Throwable) {
            emptyList()
        }
        return cachedGaugeDirs
    }

    /** 测试注入探测结果 (Robolectric 桌面环境无真实 /sys) */
    internal fun installProbeResultForTest(dirs: List<String>) {
        probed = true
        cachedGaugeDirs = dirs
    }

    /** 电量计目录优先级链 (含兜底)：探测为空时回退经典 battery 路径，兼容只读受限环境 */
    private fun gaugeDirsOrDefault(): List<String> {
        val dirs = resolveGaugeDirs()
        return if (dirs.isNotEmpty()) dirs else listOf("$DEFAULT_SCAN_ROOT/battery")
    }

    /**
     * v2.0.0-alpha.1：探测链命中节点标签 (如 "bms"/"maxfg"/"battery")，
     * 遥测分析 Tab 采集链路卡展示真实数据来源；探测为空回退 battery
     */
    fun gaugeNodeLabel(): String {
        val dirs = resolveGaugeDirs()
        return if (dirs.isNotEmpty()) java.io.File(dirs.first()).name else "battery"
    }

    private fun <T> readAcrossDirs(node: String, transform: (String) -> T?): T? =
        gaugeDirsOrDefault().firstNotNullOfOrNull { dir -> transform("$dir/$node") }

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 charge_full (衰减后容量，μAh/mAh 双归一) */
    fun readChargeFull(): Int? = readAcrossDirs("charge_full") { readCapacityMah(it) }

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 charge_full_design (设计容量) */
    fun readChargeFullDesign(): Int? = readAcrossDirs("charge_full_design") { readCapacityMah(it) }

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 cycle_count (循环计数) */
    fun readCycleCount(): Int? = readAcrossDirs("cycle_count") { readInt(it) }

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 current_now 原始值 (μA/mA 单位判定参照) */
    fun readCurrentNow(): Int? = readAcrossDirs("current_now") { readInt(it) }
}
`,
  },
  {
    id: 'resolver',
    name: 'HardwareInfoResolver.kt',
    path: 'android/app/src/main/java/com/battery/master/service/HardwareInfoResolver.kt',
    language: 'kotlin',
    description: '硬件信息动态解析：SoC/HAL 真实值 + 快充档位功率推断 + 诚实未上报标注（App 实际源码）',
    code: `package com.battery.master.service

import android.os.Build

/**
 * 动态硬件信息解析结果
 */
internal data class HardwareTelemetry(
    val socModel: String,
    val socVendor: String,
    val socProcess: String,
    val socCpu: String,
    val socGpu: String,
    val pmicModel: String,
    val batteryChemistry: String,
    val fastChargeProtocol: String,
    val internalResistanceMohm: Float,
    /** v2.0.0-alpha 批次B：内阻来源标注 (运行时测算·置信度 / 工程估算) */
    val internalResistanceLabel: String,
    val halVersion: String,
    val cellStructure: String,
    val thermalThrottlingState: String
)

/**
 * 动态解析硬件信息摘要 —— 三级回退链，彻底消除"系统未上报"：
 * 1. [实测] sysfs / device-tree 真实节点探测（SoC 型号、PMIC compatible、pd_active、恒压门限、双电芯路径）
 * 2. [推断] 品牌硬件档案 (Build.MANUFACTURER) 匹配品牌快充体系与 PMIC 体系
 * 3. [估算] 主流工程默认值兜底
 * 每个字段均在输出中标注来源；快充协议另叠加实时功率档位 (V×I 推断)，
 * 与 Web 端档位阈值一致 (≥45W 超级快充 / ≥18W 快充 / >0.5W 普通 / 未充电)
 */
internal object HardwareInfoResolver {

    // 设备静态档案（SoC / PMIC / 协议体系 / 电芯结构 / 化学体系）：探测结果缓存，仅解析一次
    private val staticProfile: DeviceHardwareProfile.Profile by lazy {
        DeviceHardwareProfile.resolveProfile()
    }

    fun resolve(temperatureCelsius: Float, cycleCount: Int, powerWatts: Float): HardwareTelemetry {
        // 启动闪退治理：解析链路任何 Throwable (ROM 服务缺失/DT 扫描 Error 等) 均降级为
        // 工程估算态，绝不向启动路径抛异常
        return try {
            resolveInternal(temperatureCelsius, cycleCount, powerWatts)
        } catch (e: Throwable) {
            HardwareTelemetry(
                socModel = "平台 SoC 解析中",
                socVendor = "主流旗舰 SoC 厂商 [工程估算]",
                socProcess = "主流旗舰制程 (以厂方规格为准) [工程估算]",
                socCpu = "8 核 64 位大小核架构 [工程估算]",
                socGpu = "平台集成旗舰 GPU [工程估算]",
                pmicModel = "平台级 PMIC 电源管理 [工程估算]",
                batteryChemistry = "锂离子/聚合物电芯 (主流体系) [工程估算]",
                fastChargeProtocol = "USB PD / QC 兼容快充 [工程估算]",
                internalResistanceMohm = 14.8f,
                internalResistanceLabel = "[工程估算]",
                halVersion = "Android \${Build.VERSION.RELEASE} BatteryManager API",
                cellStructure = "标准单电芯封装 [工程估算]",
                thermalThrottlingState = "正常供电 (无节流)"
            )
        }
    }

    private fun resolveInternal(temperatureCelsius: Float, cycleCount: Int, powerWatts: Float): HardwareTelemetry {
        val profile = staticProfile

        // SoC 主控五字段：型号 / 厂商 / 制程 / CPU / GPU (SoCHardwareProfile 全量检测链)
        val soc = SoCHardwareProfile.resolveSoc()

        // 温控节流状态：按电芯温度推导。
        // v1.2.4 P2 审计修复：1) 阈值与温度卡统一单源 (BatteryTelemetryParser 常量)——
        // 旧实现 44/38.5℃ 与温度卡 45/38℃ 打架 (38~38.5℃ 卡片"偏热"而标签"正常"、
        // 44~45℃ 标签"急停"而卡片仅"偏热"，同屏自相矛盾)；2) 移除臆造的
        // "限制 50%"/"限流 15%" 百分比——系统无任何 API 上报节流比例，虚构精度
        // 冒充实测；标注 [工程估算] 与 SoC 字段既有来源标注模式一致
        val thermalThrottlingState = when {
            temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
                "过热急停 [工程估算]"
            temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                "温控限流 [工程估算]"
            else -> "正常供电 (无节流)"
        }

        // 电芯内阻 (v2.0.0-alpha 批次B)：健康引擎 ΔV/ΔI 滑窗回归实测优先，
        // 无有效测算样本 (样本不足/跨度不足/回归越界) 时回退工程估算模型。
        // 工程估算公式 (与 Web 端一致)：基础值 + 循环老化 + 高温附加
        val resistanceSnapshot = BatteryHealthEngine.snapshot()
        val (internalResistance, internalResistanceLabel) = if (resistanceSnapshot.resistanceMohm != null) {
            val measured = (resistanceSnapshot.resistanceMohm * 10f).toInt() / 10f
            measured to resistanceSnapshot.sourceLabel
        } else {
            val estimate = 14.8f +
                (cycleCount.coerceAtLeast(0) / 300f) * 1.5f +
                if (temperatureCelsius > 40f) (temperatureCelsius - 40f) * 0.3f else 0f
            ((estimate * 10f).toInt() / 10f) to "[工程估算]"
        }

        // 快充协议：体系名（sysfs 实测优先 → 品牌档案 → 工程估算）+ 实时功率档位组合，
        // 未充电时保留体系名并标注"待充电协商"，不再输出空洞的"系统未上报"
        val chargeBand = when {
            powerWatts >= 45f -> "超级快充"
            powerWatts >= 18f -> "快速充电"
            powerWatts > 0.5f -> "普通充电"
            else -> null
        }
        val liveProtocol = DeviceHardwareProfile.probeLiveProtocol()
        val protocolSystem = liveProtocol ?: profile.fastChargeProtocol
        val fastChargeProtocol = if (chargeBand != null) {
            val wattText = String.format(java.util.Locale.US, "%.1f", powerWatts)
            "$chargeBand ($wattText W) · $protocolSystem"
        } else {
            "$protocolSystem · 未充电待协商"
        }

        return HardwareTelemetry(
            socModel = soc.model,
            socVendor = soc.vendor,
            socProcess = soc.process,
            socCpu = soc.cpu,
            socGpu = soc.gpu,
            pmicModel = profile.pmicModel,
            batteryChemistry = profile.batteryChemistry,
            fastChargeProtocol = fastChargeProtocol,
            internalResistanceMohm = internalResistance,
            internalResistanceLabel = internalResistanceLabel,
            halVersion = "Android \${Build.VERSION.RELEASE} Battery AIDL HAL",
            cellStructure = profile.cellStructure,
            thermalThrottlingState = thermalThrottlingState
        )
    }
}
`,
  },
  {
    id: 'soc_profile',
    name: 'SoCHardwareProfile.kt',
    path: 'android/app/src/main/java/com/battery/master/service/SoCHardwareProfile.kt',
    language: 'kotlin',
    description: 'SoC 主控档案五级检测链：Build.SOC_* → soc0 节点 → cpuinfo → 平台代号档案 → 工程估算，覆盖骁龙/天玑/Tensor/Exynos/麒麟规格表（App 实际源码）',
    code: `package com.battery.master.service

import android.os.Build
import java.io.File

/**
 * SoC 主控芯片档案解析结果
 *
 * @property model   SoC 型号 (营销名优先，如 "Snapdragon 8 Gen 3")
 * @property vendor  SoC 厂商 (如 "Qualcomm 高通")
 * @property process 制程工艺 (如 "4nm (TSMC N4P)")
 * @property cpu     CPU 架构与核心配置
 * @property gpu     GPU 型号
 */
internal data class SocProfile(
    val model: String,
    val vendor: String,
    val process: String,
    val cpu: String,
    val gpu: String
)

/**
 * SoC 主控功能模块：型号 / 厂商 / 制程 / CPU 架构 / GPU 五字段全量解析
 *
 * 检测链与 DeviceHardwareProfile (PMIC) 同构，彻底消除"系统未上报"：
 * 1. [实测] API 31+ Build.SOC_MODEL / Build.SOC_MANUFACTURER (ro.soc.model 系统属性)
 * 2. [实测] Linux soc0 节点 /sys/devices/soc0/{machine,family,model} (权限 444 可读)
 * 3. [实测] /proc/cpuinfo "Hardware:" 行 (高通/联发科普遍填充 SoC 型号)
 * 4. [品牌档案] 平台代号档案 (Build.BOARD/DEVICE/HARDWARE，如 pineapple/kona/mt6989)
 *    命中后映射营销名 + 制程/CPU/GPU 完整规格 (来源：各厂商官方规格页)
 * 5. [工程估算] 品牌平台估算兜底 (按 Build.MANUFACTURER 推断 SoC 厂商体系)
 *
 * 启动闪退治理：/proc 与 /sys 扫描在部分 OEM ROM 会抛 Error 级异常，
 * 全链路按 Throwable 兜底；静态档案探测一次即缓存，不参与每秒轮询。
 */
internal object SoCHardwareProfile {

    /** 设备 SoC 静态档案：探测一次即缓存 (null 也视为已探测) */
    @Volatile private var socProbed = false
    @Volatile private var cachedProfile: SocProfile? = null

    /** 平台规格档案：代号/型号 token -> 营销名 + 厂商 + 制程 + CPU + GPU */
    private data class PlatformSoc(
        val vendor: String,
        val marketingName: String,
        val process: String,
        val cpu: String,
        val gpu: String
    )

    private val socPlatforms: List<Pair<List<String>, PlatformSoc>> = listOf(
        // ===== Qualcomm 骁龙 8 系旗舰 =====
        listOf("sm8650", "pineapple") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Gen 3 (第三代骁龙 8)",
            "4nm (TSMC N4P)",
            "1×Cortex-X4@3.3GHz + 5×Cortex-A720@3.2GHz + 2×Cortex-A520@2.3GHz (Kryo)",
            "Adreno 750"
        ),
        listOf("sm8750", "sun") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Elite (骁龙 8 至尊版)",
            "3nm (TSMC N3E)",
            "2×Oryon 超大核@4.32GHz + 6×Oryon 大核@3.53GHz (自研 8 核)",
            "Adreno 830"
        ),
        listOf("sm8850") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Elite Gen 5 (第五代骁龙 8 至尊版)",
            "3nm (TSMC N3P)",
            "2×Oryon 三代超大核@4.74GHz + 6×Oryon 大核 (自研 8 核)",
            "Adreno 840 (12CU @1.2GHz)"
        ),
        listOf("sm8550", "kalama") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Gen 2 (第二代骁龙 8)",
            "4nm (TSMC N4P)",
            "1×Cortex-X3@3.2GHz + 4×Cortex-A715@2.8GHz + 3×Cortex-A510@2.0GHz",
            "Adreno 740"
        ),
        listOf("sm8475") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8+ Gen 1 (骁龙 8+ Gen 1)",
            "4nm (TSMC N4)",
            "1×Cortex-X2@3.2GHz + 3×Cortex-A710@2.75GHz + 4×Cortex-A510@1.8GHz",
            "Adreno 730"
        ),
        listOf("sm8450", "waipio") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Gen 1 (全新骁龙 8)",
            "4nm (Samsung 4LPE)",
            "1×Cortex-X2@3.0GHz + 3×Cortex-A710@2.5GHz + 4×Cortex-A510@1.8GHz",
            "Adreno 730"
        ),
        listOf("sm8635") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8s Gen 3 (第三代骁龙 8s)",
            "4nm (TSMC N4P)",
            "1×Cortex-X4@3.0GHz + 4×Cortex-A720@2.8GHz + 3×Cortex-A520@2.0GHz",
            "Adreno 735"
        ),
        listOf("sm8475q", "sm8550p") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8+ Gen 1 / 8 Gen 2 高频版",
            "4nm (TSMC N4)",
            "1×Cortex-X2@3.2GHz + 3×Cortex-A710@2.75GHz + 4×Cortex-A510@1.8GHz",
            "Adreno 730"
        ),
        listOf("lahaina") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 888 (骁龙 888)",
            "5nm (Samsung 5LPE)",
            "1×Cortex-X1@2.84GHz + 3×Cortex-A78@2.42GHz + 4×Cortex-A55@1.8GHz (Kryo 680)",
            "Adreno 660"
        ),
        listOf("kona") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 865 (骁龙 865)",
            "7nm (TSMC N7P)",
            "1×Cortex-A77@2.84GHz + 3×Cortex-A77@2.42GHz + 4×Cortex-A55@1.8GHz (Kryo 585)",
            "Adreno 650"
        ),
        // ===== MediaTek 天玑旗舰 =====
        listOf("mt6991") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9500 (天玑 9500)",
            "3nm (TSMC N3P)",
            "1×Arm C1-Ultra@4.21GHz + 3×C1-Premium + 4×C1-Pro (全大核 8 核)",
            "Arm Mali-G1 Ultra MC12"
        ),
        listOf("mt6990") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9400 (天玑 9400)",
            "3nm (TSMC N3E)",
            "1×Cortex-X925@3.62GHz + 3×Cortex-X4@3.3GHz + 4×Cortex-A720@2.4GHz (全大核)",
            "Immortalis-G925 MC12"
        ),
        listOf("mt6989") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9300 (天玑 9300)",
            "4nm (TSMC N4P)",
            "4×Cortex-X4@3.25GHz + 4×Cortex-A720@2.0GHz (全大核 8 核)",
            "Immortalis-G720 MC12"
        ),
        listOf("mt6985") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9200 (天玑 9200)",
            "4nm (TSMC N4P)",
            "1×Cortex-X3@3.05GHz + 3×Cortex-A715@2.85GHz + 4×Cortex-A510@1.8GHz",
            "Immortalis-G715 MC11"
        ),
        listOf("mt6983") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9200 / 9200+ (天玑 9200 系列)",
            "4nm (TSMC N4P)",
            "1×Cortex-X3@3.05GHz + 3×Cortex-A715@2.85GHz + 4×Cortex-A510@1.8GHz",
            "Immortalis-G715 MC11"
        ),
        listOf("mt6897") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 8300 Ultra (天玑 8300-Ultra)",
            "4nm (TSMC N4P)",
            "1×Cortex-A715@3.35GHz + 3×Cortex-A715@3.2GHz + 4×Cortex-A510@2.2GHz",
            "Mali-G615 MC6"
        ),
        listOf("mt8798") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 8500 系列 (天玑 8500)",
            "4nm",
            "全大核 8×Cortex-A725 (至高 3.4GHz)",
            "Arm Mali-G720 MC8"
        ),
        // ===== Google Tensor =====
        listOf("tensor", "g4", "zuma") to PlatformSoc(
            "Google 谷歌", "Google Tensor G4",
            "4nm (Samsung 4LPP)",
            "1×Cortex-X4@3.1GHz + 3×Cortex-A720@2.6GHz + 4×Cortex-A520@1.92GHz",
            "Arm Mali-G715 MC7"
        ),
        listOf("g3", "ripcurrent") to PlatformSoc(
            "Google 谷歌", "Google Tensor G3",
            "4nm (Samsung 4LPP)",
            "1×Cortex-X3@2.91GHz + 4×Cortex-A715@2.61GHz + 4×Cortex-A510@1.83GHz",
            "Arm Mali-G710 MC7"
        ),
        // ===== Samsung Exynos =====
        listOf("exynos2400", "s5e9945") to PlatformSoc(
            "Samsung 三星", "Samsung Exynos 2400",
            "4nm (Samsung 4LPP)",
            "10 核 (1×Cortex-X4@3.21GHz + 2+3×Cortex-A720 + 4×Cortex-A520)",
            "Samsung Xclipse 940 (AMD RDNA3)"
        ),
        listOf("exynos2200", "s5e9925") to PlatformSoc(
            "Samsung 三星", "Samsung Exynos 2200",
            "4nm (Samsung 4LPE)",
            "1×Cortex-X2@2.95GHz + 3×Cortex-A710@2.5GHz + 4×Cortex-A510@1.8GHz",
            "Samsung Xclipse 920 (AMD RDNA2)"
        ),
        // ===== HiSilicon 海思麒麟 =====
        listOf("kirin9000", "hi36a0") to PlatformSoc(
            "HiSilicon 海思", "Kirin 9000 (麒麟 9000)",
            "5nm (TSMC N5)",
            "1×Cortex-A77@3.13GHz + 3×Cortex-A77@2.54GHz + 4×Cortex-A55@2.05GHz",
            "Mali-G78 MP24"
        ),
        listOf("kirin9000s", "hi36c0") to PlatformSoc(
            "HiSilicon 海思", "Kirin 9000S (麒麟 9000S)",
            "7nm 级 (N+2)",
            "8 核 (1 超大核 + 3 大核 + 4 能效核)",
            "Maleoon 910"
        ),
        // ===== UNISOC 展锐 =====
        listOf("t760", "unisoc") to PlatformSoc(
            "UNISOC 展锐", "UNISOC T760 (虎贲 T760)",
            "6nm (EUV)",
            "1×Cortex-A76@2.2GHz + 3×Cortex-A76@2.0GHz + 4×Cortex-A55@1.8GHz",
            "Mali-G57 MC4"
        )
    )

    /** 按平台代号键查找规格档案 (供营销名别名表引用，避免下标硬编码) */
    private fun platformOf(vararg keys: String): PlatformSoc =
        socPlatforms.first { entry -> entry.first.any { it in keys } }.second

    /** 营销名匹配键 (Build.SOC_MODEL 等原始值直接给营销名时命中) */
    private val marketingAliases: List<Pair<List<String>, PlatformSoc>> = listOf(
        listOf("snapdragon 8 gen 3", "骁龙8 gen 3", "骁龙 8 gen 3", "sd 8 gen 3") to platformOf("sm8650"),
        listOf("snapdragon 8 elite gen 5", "第五代骁龙8至尊版", "第五代骁龙 8 至尊版", "8 elite gen 5") to platformOf("sm8850"),
        listOf("snapdragon 8 elite", "骁龙8至尊版", "骁龙 8 至尊版") to platformOf("sm8750"),
        listOf("snapdragon 8 gen 2", "骁龙8 gen 2", "骁龙 8 gen 2") to platformOf("sm8550"),
        listOf("snapdragon 8s gen 3", "第三代骁龙8s", "第三代骁龙 8s") to platformOf("sm8635"),
        listOf("dimensity 9500", "天玑9500", "天玑 9500") to platformOf("mt6991"),
        listOf("dimensity 9400", "天玑9400", "天玑 9400") to platformOf("mt6990"),
        listOf("dimensity 9300", "天玑9300", "天玑 9300") to platformOf("mt6989"),
        listOf("dimensity 8500", "天玑8500", "天玑 8500") to platformOf("mt8798"),
        listOf("tensor g4") to platformOf("g4"),
        listOf("tensor g3") to platformOf("g3")
    )

    /** 品牌 SoC 体系估算档案 (回退层：按整机厂商推断典型 SoC 厂商体系) */
    private val brandSocSystems = listOf(
        "google" to "Google 谷歌",
        "samsung" to "Samsung 三星",
        "xiaomi" to "Qualcomm 高通 / MediaTek 联发科",
        "redmi" to "Qualcomm 高通 / MediaTek 联发科",
        "oppo" to "Qualcomm 高通 / MediaTek 联发科",
        "oneplus" to "Qualcomm 高通 / MediaTek 联发科",
        "realme" to "Qualcomm 高通 / MediaTek 联发科",
        "vivo" to "Qualcomm 高通 / MediaTek 联发科",
        "iqoo" to "Qualcomm 高通 / MediaTek 联发科",
        "honor" to "Qualcomm 高通 / MediaTek 联发科",
        "huawei" to "HiSilicon 海思",
        "motorola" to "Qualcomm 高通 / MediaTek 联发科",
        "sony" to "Qualcomm 高通",
        "asus" to "Qualcomm 高通",
        "lenovo" to "Qualcomm 高通",
        "meizu" to "Qualcomm 高通 / Samsung 三星",
        "nubia" to "Qualcomm 高通",
        "zte" to "Qualcomm 高通",
        "nothing" to "Qualcomm 高通"
    )

    /**
     * 解析设备 SoC 主控档案 (结果进程内缓存，静态硬件信息仅探测一次)
     */
    fun resolveSoc(): SocProfile {
        if (socProbed) return cachedProfile ?: engineeringEstimate(Build.MANUFACTURER)
        socProbed = true
        val resolved = try {
            resolveInternal()
        } catch (e: Throwable) {
            engineeringEstimate(Build.MANUFACTURER)
        }
        cachedProfile = resolved
        return resolved
    }

    /** 测试专用：重置探测缓存 (Robolectric 同沙箱多用例需在用例间清理静态缓存) */
    internal fun resetProbeCache() {
        socProbed = false
        cachedProfile = null
    }

    private fun resolveInternal(): SocProfile {
        // ---- 型号检测链：Build.SOC_MODEL -> soc0 节点 -> cpuinfo -> 平台代号 ----
        val apiModel = readBuildSocModel()
        val soc0Model = detectFromSoc0Nodes()
        val cpuinfoModel = detectFromCpuinfo()
        val boardModel = detectFromPlatformCodeName()

        val rawModel = apiModel ?: soc0Model ?: cpuinfoModel ?: boardModel
        val modelSource = when {
            apiModel != null -> "实测"
            soc0Model != null -> "实测"
            cpuinfoModel != null -> "实测"
            else -> "品牌档案"
        }

        // ---- 厂商：Build.SOC_MANUFACTURER -> 型号 token 推断 -> 品牌体系 ----
        val apiVendor = readBuildSocManufacturer()
        val vendor = apiVendor
            ?: rawModel?.let { inferVendorFromModel(it) }
            ?: brandSocSystems.firstOrNull { Build.MANUFACTURER.lowercase().startsWith(it.first) }?.second
            ?: "主流旗舰 SoC 厂商"

        val platform = rawModel?.let { lookupPlatform(it) }

        val model = when {
            platform != null -> "\${platform.marketingName} [$modelSource]"
            rawModel != null -> "\${prettyModelToken(rawModel)} [$modelSource]"
            else -> "\${normalizeRawSocValue(Build.MANUFACTURER) ?: "Android"} ARM64 旗舰平台 [工程估算]"
        }

        // ---- 制程 / CPU / GPU：平台档案优先，不可识别时按厂商体系工程估算 ----
        val process = platform?.process?.let { "$it [品牌档案]" }
            ?: "主流旗舰制程 (以厂方规格为准) [工程估算]"
        val cpu = platform?.cpu?.let { "$it [品牌档案]" }
            ?: "8 核 64 位大小核架构 [工程估算]"
        val gpu = platform?.gpu?.let { "$it [品牌档案]" }
            ?: "平台集成旗舰 GPU [工程估算]"

        val vendorText = if (apiVendor != null) "$apiVendor [实测]" else "$vendor [品牌档案]"
        return SocProfile(
            model = model,
            vendor = vendorText,
            process = process,
            cpu = cpu,
            gpu = gpu
        )
    }

    /** 工程估算兜底档案：任何检测均不可得时按品牌体系给出中性可渲染值 */
    private fun engineeringEstimate(manufacturer: String): SocProfile {
        val brand = brandSocSystems.firstOrNull { manufacturer.lowercase().startsWith(it.first) }?.second
            ?: "主流旗舰 SoC 厂商"
        val brandName = normalizeRawSocValue(manufacturer) ?: "Android"
        return SocProfile(
            model = "$brandName ARM64 旗舰平台 [工程估算]",
            vendor = "$brand [工程估算]",
            process = "主流旗舰制程 (以厂方规格为准) [工程估算]",
            cpu = "8 核 64 位大小核架构 [工程估算]",
            gpu = "平台集成旗舰 GPU [工程估算]"
        )
    }

    // ==================== 检测源 ====================

    /** API 31+ Build.SOC_MODEL (ro.soc.model)，过滤 unknown / 空值 / Robolectric 占位 */
    private fun readBuildSocModel(): String? {
        if (Build.VERSION.SDK_INT < 31) return null
        val raw = Build.SOC_MODEL
        return normalizeRawSocValue(raw)
    }

    /** API 31+ Build.SOC_MANUFACTURER (ro.soc.manufacturer)，归一化为中文厂商名 */
    private fun readBuildSocManufacturer(): String? {
        if (Build.VERSION.SDK_INT < 31) return null
        return normalizeSocManufacturer(Build.SOC_MANUFACTURER)
    }

    /** soc0 节点探测：machine / family / model (多数内核 444 权限，普通应用可读) */
    private fun detectFromSoc0Nodes(): String? {
        val candidates = listOf("machine", "family", "model")
        return candidates.asSequence()
            .mapNotNull { name ->
                try {
                    val file = File("/sys/devices/soc0/$name")
                    if (file.isFile && file.canRead()) {
                        file.readText().trim().takeIf { it.isNotBlank() && !it.equals("unknown", true) }
                    } else {
                        null
                    }
                } catch (e: Throwable) {
                    null
                }
            }
            .firstOrNull { extractSocToken(it) != null }
    }

    /** /proc/cpuinfo "Hardware:" 行探测 (高通/联发科内核普遍填充 SoC 型号) */
    private fun detectFromCpuinfo(): String? = try {
        val file = File("/proc/cpuinfo")
        if (!file.canRead()) {
            null
        } else {
            parseCpuinfoHardwareLine(file.readText())
        }
    } catch (e: Throwable) {
        null
    }

    /** 平台代号探测：Build.BOARD / Build.DEVICE / Build.HARDWARE (pineapple / mt6989 / exynos2400 ...) */
    private fun detectFromPlatformCodeName(): String? =
        listOf(Build.BOARD, Build.DEVICE, Build.HARDWARE)
            .map { normalizeRawSocValue(it) ?: "" }
            .firstOrNull { lookupPlatform(it) != null }

    // ==================== 纯解析函数 (可单测) ====================

    /** 过滤系统属性占位值：空 / unknown / robolectric 测试占位 */
    internal fun normalizeRawSocValue(raw: String?): String? {
        val value = raw?.trim().orEmpty()
        return when {
            value.isEmpty() -> null
            value.equals("unknown", ignoreCase = true) -> null
            value.contains("robolectric", ignoreCase = true) -> null
            else -> value
        }
    }

    /**
     * 从 /proc/cpuinfo 全文中提取 "Hardware:" 行值
     * (高通: "Qualcomm Technologies, Inc. SM8650"；联发科: "MT6989"；树莓派: "BCM2711")
     */
    internal fun parseCpuinfoHardwareLine(cpuinfo: String): String? =
        cpuinfo.lineSequence()
            .mapNotNull { line ->
                val idx = line.indexOf(':')
                if (idx <= 0) {
                    null
                } else {
                    val key = line.substring(0, idx).trim()
                    if (key.equals("Hardware", ignoreCase = true)) {
                        line.substring(idx + 1).trim().takeIf { it.isNotEmpty() }
                    } else {
                        null
                    }
                }
            }
            .firstOrNull()

    /** 厂商名归一化：QTI -> Qualcomm 高通，Mediatek -> MediaTek 联发科 ... */
    internal fun normalizeSocManufacturer(raw: String?): String? {
        val value = normalizeRawSocValue(raw) ?: return null
        val lower = value.lowercase()
        return when {
            lower.contains("qualcomm") || lower == "qti" -> "Qualcomm 高通"
            lower.contains("mediatek") || lower.contains("mtk") -> "MediaTek 联发科"
            lower.contains("samsung") -> "Samsung 三星"
            lower.contains("google") -> "Google 谷歌"
            lower.contains("hisilicon") || lower.contains("kirin") -> "HiSilicon 海思"
            lower.contains("unisoc") || lower.contains("spreadtrum") -> "UNISOC 展锐"
            lower.contains("xiaomi") -> "Xiaomi 小米"
            lower.contains("rockchip") -> "Rockchip 瑞芯微"
            lower.contains("allwinner") -> "Allwinner 全志"
            lower.contains("apple") -> "Apple 苹果"
            else -> null
        }
    }

    /** 从任意原始字符串中提取 SoC 型号 token (sm8650 / mt6989 / pineapple / tensor ...) */
    internal fun extractSocToken(raw: String): String? {
        val lower = raw.lowercase()
        // 0) 拼接串命中平台代号 (兼容 "Exynos 2400" / "SM 8650" 等带空格写法)
        val squashed = lower.replace(Regex("[^a-z0-9]"), "")
        if (squashed.isNotEmpty()) {
            socPlatforms.forEach { entry ->
                entry.first.forEach { key ->
                    if (squashed == key || (key.length >= 5 && squashed.contains(key))) return key
                }
            }
        }
        // 1) 逐 token 精确命中平台代号 (防短键误匹配)
        val tokens = lower.split(Regex("[^a-z0-9+.-]+")).filter { it.isNotBlank() }
        tokens.firstOrNull { token -> socPlatforms.any { entry -> entry.first.any { it == token } } }
            ?.let { return it }
        // 2) 厂商型号格式 token: [字母1-6位][数字3-5位][可选后缀] (sm8650/mt6989/exynos2400/t760)
        tokens.firstOrNull { it.matches(Regex("[a-z]{1,6}\\\\d{3,5}[a-z0-9-]*")) }
            ?.let { return it }
        // 3) 纯代号 (pineapple/kona/zuma/tensor ...)
        tokens.firstOrNull { it.length >= 4 && it.all { c -> c.isLetter() } }
            ?.let { return it }
        return null
    }

    /** 由 SoC 型号 token 推断厂商 (SM* -> 高通，MT* -> 联发科 ...) */
    internal fun inferVendorFromModel(model: String): String? {
        val lower = model.lowercase()
        val token = extractSocToken(lower) ?: lower
        return when {
            token.startsWith("sm") || lower.contains("snapdragon") || lower.contains("adreno") || lower.contains("qcom") -> "Qualcomm 高通"
            token.startsWith("mt") || lower.contains("dimensity") || lower.contains("天玑") -> "MediaTek 联发科"
            lower.contains("tensor") -> "Google 谷歌"
            lower.contains("exynos") || lower.contains("xclipse") -> "Samsung 三星"
            lower.contains("kirin") || lower.contains("麒麟") || lower.contains("maleoon") -> "HiSilicon 海思"
            lower.contains("unisoc") || lower.contains("虎贲") || lower.contains("spreadtrum") -> "UNISOC 展锐"
            token.startsWith("rk") || lower.contains("rockchip") -> "Rockchip 瑞芯微"
            else -> null
        }
    }

    /** 平台规格档案查询：先精确/长键包含匹配，后营销名别名匹配 */
    private fun lookupPlatform(raw: String): PlatformSoc? {
        val lower = raw.lowercase().trim()
        if (lower.isEmpty()) return null
        // 精确 token 匹配 (防 "sun" 类短键误伤)
        socPlatforms.firstOrNull { entry -> entry.first.any { it == lower } }
            ?.let { return it.second }
        // 长键包含匹配 (键长 >= 5，避免短码误匹配)
        socPlatforms.firstOrNull { entry -> entry.first.any { key -> key.length >= 5 && lower.contains(key) } }
            ?.let { return it.second }
        // 营销名别名 (原始值直接给营销名的场景)
        marketingAliases.firstOrNull { entry -> entry.first.any { lower.contains(it) } }
            ?.let { return it.second }
        return null
    }

    /** 未命中档案时将原始 token 格式化为可读型号 (SM8650 -> SM8650，保留原值) */
    private fun prettyModelToken(raw: String): String =
        extractSocToken(raw)?.uppercase() ?: raw.trim()
}
`,
  },
  {
    id: 'main_activity',
    name: 'MainActivity.kt',
    path: 'android/app/src/main/java/com/battery/master/MainActivity.kt',
    language: 'kotlin',
    description: '应用入口：EdgeToEdge + Compose MaterialTheme 挂载 BatteryScreen（App 实际源码）',
    code: `package com.battery.master

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import com.battery.master.ui.BatteryScreen
import com.battery.master.ui.theme.DesignTokens
import com.battery.master.viewmodel.BatteryViewModel

class MainActivity : ComponentActivity() {

    private val batteryViewModel: BatteryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 外壳层审计修复：应用全局强制暗色 HUD (windowBackground #030712 恒暗)，
        // 系统栏图标对比度必须锚定应用自身暗底，而非跟随系统浅色/深色设置。
        // enableEdgeToEdge 默认 SystemBarStyle.auto 按系统模式切换图标明暗，
        // 系统浅色模式下深色图标画在暗色窗口背景上不可见 → 显式强制亮图标
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )

        setContent {
            // 统一品牌主题：Material3 色彩/字体体系映射到 DesignTokens 令牌，
            // 消除默认 Material 配色与 HUD 风格组件的割裂感
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = DesignTokens.BrandPrimary,
                    onPrimary = Color.White,
                    primaryContainer = DesignTokens.BgElevated,
                    onPrimaryContainer = DesignTokens.BrandPrimaryLight,
                    secondary = DesignTokens.InfoSky,
                    onSecondary = Color.White,
                    tertiary = DesignTokens.AccentCyan,
                    background = DesignTokens.BgDeep,
                    onBackground = DesignTokens.TextPrimary,
                    surface = DesignTokens.BgSurface,
                    onSurface = DesignTokens.TextPrimary,
                    surfaceVariant = DesignTokens.BgElevated,
                    onSurfaceVariant = DesignTokens.TextSecondary,
                    outline = DesignTokens.BorderStrong,
                    error = DesignTokens.DangerRose,
                    onError = Color.White
                ),
                typography = Typography(
                    // 全站数字/技术标签统一等宽字体，与 Web font-mono 令牌一致
                    bodyLarge = Typography().bodyLarge.copy(fontFamily = FontFamily.Monospace),
                    bodyMedium = Typography().bodyMedium.copy(fontFamily = FontFamily.Monospace),
                    labelLarge = Typography().labelLarge.copy(fontFamily = FontFamily.Monospace)
                )
            ) {
                BatteryScreen(viewModel = batteryViewModel)
            }
        }
    }

    // v1.2.4 P3 审计修复：1Hz 轮询生命周期门控——退后台/锁屏暂停 sysfs 轮询
    // (电池监测工具持续后台轮询属反向耗电缺陷)，回前台恢复；广播通道不受影响
    override fun onResume() {
        super.onResume()
        batteryViewModel.setTelemetryPollingActive(true)
    }

    override fun onPause() {
        super.onPause()
        batteryViewModel.setTelemetryPollingActive(false)
    }
}
`,
  },
  {
    id: 'device_profile',
    name: 'DeviceHardwareProfile.kt',
    path: 'android/app/src/main/java/com/battery/master/service/DeviceHardwareProfile.kt',
    language: 'kotlin',
    description: '设备硬件档案：PMIC/快充协议/电芯结构三级回退链（sysfs+DT 实测→品牌档案→工程估算）（App 实际源码）',
    code: `package com.battery.master.service

import android.os.Build
import java.io.File

/**
 * 设备硬件档案解析器：PMIC 型号 / 快充协议体系 / 电芯结构 / 化学体系
 *
 * 三级回退链，彻底消除"系统未上报"：
 * 1. [实测] Linux sysfs / device-tree 真实节点探测
 *    - PMIC：/proc/device-tree 顶层 compatible 节点 (qcom,pm* / mt6xxx / s2mps / max77xxx ...)
 *    - 快充：/sys/class/power_supply/usb/pd_active、battery/quick_charge_type、dc/online、hv_charge
 *    - 电芯：/sys/class/power_supply/{dc,battery2,maxfg} 双电芯路径、constant_voltage_max 恒压门限
 * 2. [推断] 品牌硬件档案 (Build.MANUFACTURER) 匹配品牌快充协议与 PMIC 体系
 * 3. [估算] 主流工程默认值兜底
 *
 * 输出字段均带来源标注，用户可明确区分实测值与推断值；
 * 静态硬件信息 (PMIC/电芯/化学) 只探测一次并缓存，协议实测带 10 秒 TTL，避免每秒轮询反复读节点。
 */
internal object DeviceHardwareProfile {

    /** 设备静态硬件档案解析结果 */
    data class Profile(
        val pmicModel: String,
        val fastChargeProtocol: String,
        val batteryChemistry: String,
        val cellStructure: String
    )

    // ===== 静态档案缓存（探测一次；null 也视为已探测，避免不可读设备反复扫描 device-tree）=====
    @Volatile private var pmicProbed = false
    @Volatile private var cachedPmic: String? = null
    @Volatile private var cachedCellStructure: String? = null
    @Volatile private var cachedChemistry: String? = null

    // ===== 协议实测 TTL 缓存 =====
    @Volatile private var lastProtocolProbeMs = 0L
    @Volatile private var cachedLiveProtocol: String? = null
    private const val PROTOCOL_TTL_MS = 10_000L

    /** 品牌快充协议体系档案 (推断层) */
    private val brandProtocols = listOf(
        "google" to "USB PD 3.0 (PPS)",
        "xiaomi" to "澎湃秒充 / HyperCharge",
        "redmi" to "澎湃秒充 / HyperCharge",
        "oppo" to "SUPERVOOC 超级闪充",
        "oneplus" to "SUPERVOOC 超级闪充",
        "realme" to "SUPERDART 超级闪充",
        "vivo" to "双芯闪充 (FlashCharge)",
        "iqoo" to "超快闪充 (FlashCharge)",
        "honor" to "超级快充 (HONOR SuperCharge)",
        "huawei" to "超级快充 (SCP)",
        "samsung" to "SFC 超级快充 (PD3.0 PPS)",
        "motorola" to "TurboPower 快充 (PD3.0)",
        "sony" to "USB PD 3.0 快充",
        "asus" to "HyperCharge 快充 (PD3.0)",
        "lenovo" to "超级闪充 (PD3.0)",
        "meizu" to "mCharge 超充",
        "nubia" to "Neotouch 超级快充",
        "zte" to "超级快充 (PD3.0)"
    )

    /** 品牌 PMIC 体系档案 (推断层) */
    private val brandPmics = listOf(
        "google" to "Tensor 专用电源管理芯片 (Shannon PMIC)",
        "samsung" to "Exynos PMIC 体系 (S2MPS 系列)",
        "xiaomi" to "澎湃 P2 快充芯片 + G1 电池管理",
        "redmi" to "小米澎湃电源管理芯片",
        "oppo" to "SUPERVOOC S 电源管理芯片",
        "oneplus" to "SUPERVOOC S 电源管理芯片",
        "realme" to "SUPERVOOC 电源管理芯片",
        "vivo" to "自研电源管理 + 双芯闪充芯片",
        "iqoo" to "自研电竞电源管理芯片",
        "honor" to "荣耀能效增强芯片 (HONOR E1)",
        "huawei" to "海思 Hi6xxx 电源管理 IC",
        "motorola" to "Qualcomm PMIC 电源管理 IC",
        "sony" to "Qualcomm PMIC 电源管理 IC"
    )

    /** 解析设备静态硬件档案（结果进程内缓存） */
    fun resolveProfile(): Profile {
        val manufacturer = Build.MANUFACTURER.lowercase()

        // --- PMIC：device-tree 实测优先，品牌档案回退，工程估算兜底 ---
        val pmicModel = detectPmicFromDeviceTree()
            ?: brandPmics.firstOrNull { manufacturer.startsWith(it.first) }?.second?.let { "$it [品牌档案]" }
            ?: "平台级 PMIC 电源管理 [工程估算]"

        // --- 快充协议体系：品牌档案 / 工程估算 (实测值由 probeLiveProtocol 动态叠加) ---
        val protocol = brandProtocols.firstOrNull { manufacturer.startsWith(it.first) }?.second?.let { "$it [品牌档案]" }
            ?: "USB PD / QC 兼容快充 [工程估算]"

        // --- 电芯结构：双电芯路径实测 → 恒压门限实测 → 主流估算 ---
        val cell = cachedCellStructure ?: detectCellStructure().also { cachedCellStructure = it }

        // --- 化学体系：恒压门限归档 → 主流兜底 ---
        val chemistry = cachedChemistry ?: detectChemistry().also { cachedChemistry = it }

        return Profile(pmicModel, protocol, chemistry, cell)
    }

    /**
     * 实测快充协议（带 10 秒 TTL 缓存，充电协商状态变化时自动刷新）
     * 返回 null 表示当前无可实测的协议节点，由上层回退到档案推断
     */
    fun probeLiveProtocol(): String? {
        // 启动闪退治理：探测整体兜底，任何 Throwable 均视为"无实测节点"
        return try {
            val now = System.currentTimeMillis()
            if (now - lastProtocolProbeMs < PROTOCOL_TTL_MS) return cachedLiveProtocol
            lastProtocolProbeMs = now
            cachedLiveProtocol = detectProtocolFromSysfs()
            cachedLiveProtocol
        } catch (e: Throwable) {
            null
        }
    }

    /**
     * 扫描 device-tree 顶层与一级子目录的 compatible 节点寻找 PMIC 型号
     * (限定两层深度，compatible 文件权限 444 普通应用可读)
     *
     * 启动闪退治理：/proc 扫描在部分 OEM ROM 会抛 Error 级异常，按 Throwable 全兜底
     */
    private fun detectPmicFromDeviceTree(): String? {
        if (pmicProbed) return cachedPmic
        pmicProbed = true
        val found = try {
            val root = File("/proc/device-tree")
            if (!root.isDirectory) {
                null
            } else {
                val candidates = mutableListOf<File>()
                root.listFiles()?.let { files ->
                    files.filterTo(candidates) { it.isFile && it.name == "compatible" }
                    files.filter { it.isDirectory }.forEach { dir ->
                        File(dir, "compatible").takeIf { it.exists() && it.canRead() }?.let { candidates.add(it) }
                    }
                }
                val matched = candidates.asSequence()
                    .mapNotNull { file ->
                        try {
                            file.readBytes().toString(Charsets.UTF_8)
                                .split('\\u0000')
                                .firstOrNull { isPmicCompatible(it) }
                        } catch (e: Throwable) {
                            null
                        }
                    }
                    .firstOrNull()
                matched?.let { formatPmicName(it) }
            }
        } catch (e: Throwable) {
            null
        }
        cachedPmic = found
        return cachedPmic
    }

    /** PMIC compatible 命名特征：高通 pm 系列 / 联发科 mt6xxx / Maxim / 三星 / RK / 海思 / TI 充电芯片 */
    private fun isPmicCompatible(name: String): Boolean = Regex(
        "qcom,pm[67k]?[0-9]|mt6[0-9]{3}|max77[0-9]|maxim,max77|s2mps|s2mpu|rk8[0-9a-z]|hi642[0-9]|bq25[0-9]|sm5703|fan5[0-9]|rt5033"
    ).containsMatchIn(name)

    /** 将 compatible 字符串格式化为可读 PMIC 型号 + [DT 实测] 标注 */
    private fun formatPmicName(compatible: String): String {
        val token = compatible.trim()
        val pretty = when {
            token.startsWith("qcom,") -> "Qualcomm " + token.substringAfter(',').uppercase()
            token.startsWith("mt6") -> "MediaTek " + token.uppercase()
            token.contains("s2mp") -> "Samsung " + token.uppercase()
            token.contains("max77") -> "Maxim " + token.uppercase()
            token.startsWith("rk8") -> "Rockchip " + token.uppercase()
            token.startsWith("hi64") -> "HiSilicon " + token.uppercase()
            token.startsWith("bq25") -> "TI " + token.uppercase()
            else -> token.uppercase()
        }
        return "$pretty [DT 实测]"
    }

    /** sysfs 实测快充协议（高通 pd_active / QC 档位 / OPPO 直充路径 / 高压快充标志） */
    private fun detectProtocolFromSysfs(): String? {
        // 高通 PD_ACTIVE：0 无 / 1 PD2.0 / 2 PD3.0-PPS
        when (BatterySysfs.readInt("/sys/class/power_supply/usb/pd_active")) {
            1 -> return "USB PD 2.0 [实测]"
            2 -> return "USB PD 3.0 (PPS) [实测]"
        }
        // PD 版本寄存器 (hex 编码，非 0 视为已协商 PD)
        BatterySysfs.readInt("/sys/class/power_supply/usb/pd_revision")?.let {
            if (it > 0) return "USB PD (Rev \${it.toString(16)}) [实测]"
        }
        // 高通 QC 档位节点
        BatterySysfs.readInt("/sys/class/power_supply/battery/quick_charge_type")?.let {
            if (it > 0) return "Quick Charge (档位 $it) [实测]"
        }
        // OPPO/一加双芯直充路径
        if (BatterySysfs.readInt("/sys/class/power_supply/dc/online") == 1) {
            return "SUPERVOOC 直充 [实测]"
        }
        // 高压快充标志
        if (BatterySysfs.readInt("/sys/class/power_supply/battery/hv_charge") == 1 ||
            BatterySysfs.readInt("/sys/class/power_supply/battery/hv_charging") == 1
        ) {
            return "高压快充 (HV) [实测]"
        }
        return null
    }

    /** 电芯结构探测：双电芯专用路径存在性 → 恒压门限 → 主流单电芯估算 */
    private fun detectCellStructure(): String {
        val dualCellPaths = listOf(
            "/sys/class/power_supply/dc",        // OPPO/一加 双电芯直充
            "/sys/class/power_supply/battery2",  // 通用第二电芯
            "/sys/class/power_supply/maxfg"      // Maxim 双芯电量计 (Pixel 8 Pro 等)
        )
        dualCellPaths.firstOrNull { File(it).exists() }?.let {
            return "串联双电芯分压快充 [实测]"
        }
        val cvMax = readConstantVoltageMax()
        return if (cvMax != null && cvMax >= 4400) {
            "单电芯高压聚合物 (恒压 \${cvMax}mV) [实测]"
        } else {
            "标准单电芯封装 [工程估算]"
        }
    }

    /** 化学体系归档：按恒压门限区分高压/标准电芯体系 */
    private fun detectChemistry(): String {
        val cvMax = readConstantVoltageMax()
        return when {
            cvMax == null -> "锂离子/聚合物电芯 (主流体系) [工程估算]"
            cvMax >= 4450 -> "高压硅碳/锂离子电芯 (恒压 \${cvMax}mV) [实测]"
            cvMax >= 4350 -> "高压锂聚合物电芯 (恒压 \${cvMax}mV) [实测]"
            else -> "标准锂离子电芯 (恒压 \${cvMax}mV) [实测]"
        }
    }

    /** 恒压门限读取 (化学体系与电芯结构共用) */
    private fun readConstantVoltageMax(): Int? =
        BatterySysfs.readInt("/sys/class/power_supply/battery/constant_voltage_max")
            ?: BatterySysfs.readInt("/sys/class/power_supply/battery/voltage_max")
}
`,
  },
  {
    id: 'hardware_lab',
    name: 'HardwareLabScreen.kt',
    path: 'android/app/src/main/java/com/battery/master/ui/HardwareLabScreen.kt',
    language: 'kotlin',
    description: '硬件实验室 UI：4 一键场景 / 6 滑杆 / 状态与健康枚举 / 提示音（App 实际源码）',
    code: `package com.battery.master.ui

import androidx.compose.animation.Crossfade
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import com.battery.master.ui.theme.DesignTokens
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import com.battery.master.viewmodel.LabScenario

/**
 * 硬件实验室 (与 Web 端 HardwareSimulationLab 对齐)：
 * 4 个一键场景 + 6 个滑杆 + 电池状态/健康枚举 + 提示音开关，
 * 模拟数据仅作用于展示层，退出后无缝恢复真实硬件遥测
 */
@Composable
fun HardwareLabScreen(viewModel: BatteryViewModel, state: BatteryState) {
    val lab by viewModel.labOverride.collectAsState()
    val soundEnabled by viewModel.labSoundEnabled.collectAsState()

    // 滑杆取值：模拟中读覆盖层，否则读真实遥测 (拖动时 VM 会自动进入模拟模式)
    val labActive = lab != null
    val pct = lab?.percentage ?: state.percentage
    // v1.2.3 P0 审计修复：真实 currentMa 可空 (设备不支持 CURRENT_NOW)，
    // 滑杆以 0 兜底展示，电流读数文本区分 "—"
    val currentMa = lab?.currentMa ?: state.currentMa ?: 0
    val voltageMv = lab?.voltageMv ?: state.voltageMv
    val temperature = lab?.temperatureCelsius ?: state.temperatureCelsius
    val cycleCount = lab?.cycleCount ?: state.cycleCount
    val status = lab?.status ?: state.status
    val health = lab?.healthQuality ?: state.healthQuality

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // ===== 模式状态与控制 =====
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        if (labActive) DesignTokens.BrandPrimary else DesignTokens.Border,
                        RoundedCornerShape(DesignTokens.RadiusPanel)
                    ),
                shape = RoundedCornerShape(DesignTokens.RadiusPanel),
                colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "硬件实验室与模拟调试",
                                fontSize = DesignTokens.FontXs,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = if (labActive) "模拟数据生效中 · 真实遥测已冻结" else "真实遥测 · 交互后自动进入模拟模式",
                                fontSize = DesignTokens.Font2xs,
                                fontFamily = FontFamily.Monospace,
                                color = if (labActive) DesignTokens.BrandPrimaryLight else DesignTokens.TextTertiary
                            )
                        }
                        // 提示音开关
                        OutlinedButton(
                            onClick = { viewModel.toggleLabSound() },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = if (soundEnabled) DesignTokens.BrandPrimaryLight else DesignTokens.TextTertiary
                            ),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (soundEnabled) "提示音 开" else "提示音 关",
                                fontSize = DesignTokens.Font2xs,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // v1.2.4 P3 审计修复：显式"进入模拟"入口——旧实现 enterLabMode()
                    // 全无 UI 调用点 (死代码)，进入提示音 TONE_PROP_ACK 永不触发；
                    // 现提供显式进入 (带提示音反馈)，与隐式滑杆进入并存
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(
                            onClick = { viewModel.enterLabMode() },
                            enabled = !labActive,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = DesignTokens.BrandPrimaryLight,
                                disabledContentColor = DesignTokens.TextDisabled
                            ),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "进入模拟模式",
                                fontSize = DesignTokens.FontXs,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Button(
                            onClick = { viewModel.exitLabMode() },
                            enabled = labActive,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = DesignTokens.DangerContainer,
                                disabledContainerColor = DesignTokens.Border,
                                disabledContentColor = DesignTokens.TextDisabled
                            )
                        ) {
                            Text(
                                text = "恢复真实硬件遥测",
                                fontSize = DesignTokens.FontXs,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // ===== 一键工作场景 =====
        item {
            Text(
                text = "一键工作场景模拟",
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Bold,
                color = DesignTokens.TextSecondary,
                fontFamily = FontFamily.Monospace
            )
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.FULL_CHARGE,
                    color = DesignTokens.BrandPrimary,
                    onClick = { viewModel.applyLabScenario(LabScenario.FULL_CHARGE) }
                )
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.FLASH_CHARGE,
                    color = DesignTokens.InfoSky,
                    onClick = { viewModel.applyLabScenario(LabScenario.FLASH_CHARGE) }
                )
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.GAMING_DISCHARGE,
                    color = DesignTokens.FeaturePurple,
                    onClick = { viewModel.applyLabScenario(LabScenario.GAMING_DISCHARGE) }
                )
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.OVERHEAT_ALERT,
                    color = DesignTokens.DangerRose,
                    onClick = { viewModel.applyLabScenario(LabScenario.OVERHEAT_ALERT) }
                )
            }
        }

        // ===== 交互滑杆区 =====
        item {
            Text(
                text = "逐项参数调节 (6 组滑杆)",
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Bold,
                color = DesignTokens.TextSecondary,
                fontFamily = FontFamily.Monospace
            )
        }

        item {
            LabCard {
                LabSlider(
                    label = "05. 电量百分比",
                    valueText = "$pct%",
                    value = pct.toFloat(),
                    valueRange = 0f..100f,
                    accent = DesignTokens.BrandPrimary,
                    onValueChange = { viewModel.updateLabPercentage(it.toInt()) }
                )
                // v1.2.3 P1 审计修复：滑杆区间与解析器合法区间单源对齐。
                // 旧实现区间窄于解析器钳制区间 (电流 ±2000~6000 vs ±20000、
                // 电压 3500~4600 vs 2000~12000、温度 0~55 vs -40~120、
                // 循环 0~1200 vs 0~10000、设计容量 1000~15000 vs 500~25000)，
                // 导致真实合法值被静默压成边界值 (双电芯 8800mV 一碰变 4600mV、
                // 120W 快充 8000mA 一碰变 6000mA、23800mAh 设备一拖变 15000)。
                // value 仍钳制在区间内防御越界 (文本显示真实值，语义不混淆)
                LabSlider(
                    label = "11. 瞬时电流",
                    valueText = "\${if (currentMa > 0) "+$currentMa" else currentMa} mA",
                    value = currentMa.toFloat()
                        .coerceIn(-BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA.toFloat(), BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA.toFloat()),
                    valueRange = (-BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA).toFloat()..BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA.toFloat(),
                    accent = DesignTokens.BrandPrimaryLight,
                    onValueChange = { viewModel.updateLabCurrent(it.toInt()) }
                )
                LabSlider(
                    label = "09. 电芯电压",
                    valueText = "$voltageMv mV",
                    value = voltageMv.toFloat()
                        .coerceIn(BatteryTelemetryParser.MIN_PLAUSIBLE_VOLTAGE_MV.toFloat(), BatteryTelemetryParser.MAX_PLAUSIBLE_VOLTAGE_MV.toFloat()),
                    valueRange = BatteryTelemetryParser.MIN_PLAUSIBLE_VOLTAGE_MV.toFloat()..BatteryTelemetryParser.MAX_PLAUSIBLE_VOLTAGE_MV.toFloat(),
                    accent = DesignTokens.InfoSky,
                    onValueChange = { viewModel.updateLabVoltage(it.toInt()) }
                )
                LabSlider(
                    label = "07. 传感器温度",
                    valueText = "$temperature °C",
                    value = temperature
                        .coerceIn(BatteryTelemetryParser.MIN_PLAUSIBLE_TEMPERATURE_C, BatteryTelemetryParser.MAX_PLAUSIBLE_TEMPERATURE_C),
                    valueRange = BatteryTelemetryParser.MIN_PLAUSIBLE_TEMPERATURE_C..BatteryTelemetryParser.MAX_PLAUSIBLE_TEMPERATURE_C,
                    accent = DesignTokens.WarningAmber,
                    onValueChange = { viewModel.updateLabTemperature(it) }
                )
                LabSlider(
                    label = "10. 循环计数",
                    valueText = "$cycleCount 次",
                    value = cycleCount.toFloat()
                        .coerceIn(0f, BatteryTelemetryParser.MAX_PLAUSIBLE_CYCLE_COUNT.toFloat()),
                    valueRange = 0f..BatteryTelemetryParser.MAX_PLAUSIBLE_CYCLE_COUNT.toFloat(),
                    accent = DesignTokens.AccentTeal,
                    onValueChange = { viewModel.updateLabCycleCount(it.toInt()) }
                )
                LabSlider(
                    label = "04. 出厂设计容量 (真实生效)",
                    valueText = "\${state.designCapacityMah} mAh",
                    // value 钳制在 valueRange 内：区间已与 Reader 三级链合法区间
                    // (500~25000 mAh) 对齐，正常设备恒在区间内；极端脏值防御性钳制。
                    // 数值文本仍显示真实设计容量，仅滑杆位置钳制
                    value = state.designCapacityMah.toFloat()
                        .coerceIn(BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH.toFloat(), BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH.toFloat()),
                    valueRange = BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH.toFloat()..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH.toFloat(),
                    accent = DesignTokens.FeaturePurple,
                    onValueChange = { viewModel.updateLabDesignCapacity(it.toInt()) }
                )
            }
        }

        // ===== 电池状态枚举 =====
        item {
            LabCard {
                Text(
                    text = "06. 电池状态强制切换",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("充电中", status == BatteryStatus.CHARGING, DesignTokens.BrandPrimary) {
                        viewModel.updateLabStatus(BatteryStatus.CHARGING)
                    }
                    StatusChip("放电中", status == BatteryStatus.DISCHARGING, DesignTokens.InfoSky) {
                        viewModel.updateLabStatus(BatteryStatus.DISCHARGING)
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("已充满", status == BatteryStatus.FULL, DesignTokens.FullTeal) {
                        viewModel.updateLabStatus(BatteryStatus.FULL)
                    }
                    StatusChip("未充电", status == BatteryStatus.NOT_CHARGING, DesignTokens.TextTertiary) {
                        viewModel.updateLabStatus(BatteryStatus.NOT_CHARGING)
                    }
                }
            }
        }

        // ===== 健康枚举 =====
        item {
            LabCard {
                Text(
                    text = "08. 硬件健康状态选择",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("良好", health == BatteryHealthQuality.GOOD, DesignTokens.BrandPrimary) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.GOOD)
                    }
                    StatusChip("过热", health == BatteryHealthQuality.OVERHEAT, DesignTokens.WarningAmber) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVERHEAT)
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("损坏", health == BatteryHealthQuality.DEAD, DesignTokens.DangerRose) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.DEAD)
                    }
                    StatusChip("超压", health == BatteryHealthQuality.OVER_VOLTAGE, DesignTokens.FeaturePurple) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVER_VOLTAGE)
                    }
                    StatusChip("未知", health == BatteryHealthQuality.UNKNOWN, DesignTokens.TextTertiary) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.UNKNOWN)
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/** 一键场景按钮：按压缩放微交互 + 主题色描边 */
@Composable
private fun LabScenarioButton(
    modifier: Modifier = Modifier,
    scenario: LabScenario,
    color: Color,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    // 微交互：按压回弹缩放（与 Web active:scale-95 对齐）
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = tween(durationMillis = DesignTokens.DurationFast),
        label = "scenario-press"
    )
    // 描边颜色随主题色渐入
    val borderColor by animateColorAsState(
        targetValue = if (pressed) color else DesignTokens.BorderStrong,
        animationSpec = tween(durationMillis = DesignTokens.DurationFast),
        label = "scenario-border"
    )
    Button(
        onClick = onClick,
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .border(1.dp, borderColor, RoundedCornerShape(DesignTokens.RadiusCard)),
        shape = RoundedCornerShape(DesignTokens.RadiusCard),
        colors = ButtonDefaults.buttonColors(containerColor = DesignTokens.BgElevated),
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 12.dp)
    ) {
        Column(horizontalAlignment = Alignment.Start) {
            Text(
                text = scenario.label,
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Bold,
                color = color,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = scenario.desc,
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

/** 实验室区块容器：玻璃拟态（半透明渐变底 + 顶部切面高光线） */
@Composable
private fun LabCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .drawBehind {
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            DesignTokens.BgGlass,
                            DesignTokens.BgSurface.copy(alpha = 0.96f)
                        )
                    )
                )
            }
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard)),
        shape = RoundedCornerShape(DesignTokens.RadiusCard),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Column(modifier = Modifier.padding(14.dp), content = content)
    }
}

/** 带标签的滑杆行 */
@Composable
private fun LabSlider(
    label: String,
    valueText: String,
    value: Float,
    valueRange: ClosedFloatingPointRange<Float>,
    accent: Color,
    onValueChange: (Float) -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, fontSize = DesignTokens.Font2xs, color = DesignTokens.TextSecondary)
            Text(
                text = valueText,
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = Color.White
            )
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            colors = SliderDefaults.colors(
                thumbColor = accent,
                activeTrackColor = accent,
                inactiveTrackColor = DesignTokens.Border
            )
        )
    }
}

/** 枚举选择胶囊：选中态颜色平滑过渡（微交互 250ms） */
@Composable
private fun StatusChip(label: String, selected: Boolean, accent: Color, onClick: () -> Unit) {
    // 选中/未选中：边框、容器、文字色统一缓动过渡，消除状态切换的生硬感
    val borderColor by animateColorAsState(
        targetValue = if (selected) accent else DesignTokens.BorderStrong,
        animationSpec = tween(durationMillis = DesignTokens.DurationSmooth),
        label = "chip-border"
    )
    val containerColor by animateColorAsState(
        targetValue = if (selected) DesignTokens.BgElevated else Color.Transparent,
        animationSpec = tween(durationMillis = DesignTokens.DurationSmooth),
        label = "chip-container"
    )
    val textColor by animateColorAsState(
        targetValue = if (selected) accent else DesignTokens.TextTertiary,
        animationSpec = tween(durationMillis = DesignTokens.DurationSmooth),
        label = "chip-text"
    )
    Surface(
        shape = RoundedCornerShape(DesignTokens.RadiusPill),
        color = containerColor,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        onClick = onClick
    ) {
        Text(
            text = label,
            fontSize = DesignTokens.Font2xs,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            color = textColor,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
`,
  },
];

export function NativeCodeViewer() {
  const [activeFileId, setActiveFileId] = useState<string>('reader');
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = NATIVE_CODE_FILES.find((f) => f.id === activeFileId) || NATIVE_CODE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Android 原生架构 (Kotlin + Jetpack Compose)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              已全量生成至工程 <code className="font-mono text-emerald-600 dark:text-emerald-400">/android</code> 目录，可直接用 Android Studio 导入运行。
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              代码快照为说明性展示，可能滞后于实际发布版本
            </p>
          </div>
        </div>

        {/* System Architecture Flow */}
        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Android 原生电量链路拓扑：
          </div>
          <div className="font-mono text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            [电芯采样芯片 PMIC / 库仑计]
            <br />
            ↓ Linux Kernel <code className="text-emerald-600 dark:text-emerald-400">/sys/class/power_supply/battery/*</code>
            <br />
            ↓ Android Health HAL & BatteryService
            <br />
            ↓ <code className="text-sky-600 dark:text-sky-400">Intent.ACTION_BATTERY_CHANGED</code> + <code className="text-sky-600 dark:text-sky-400">BatteryManager</code>
            <br />
            ↓ <code className="text-amber-600 dark:text-amber-400">BatteryHardwareReader.kt</code> (100% & 0-25 mA 充满判定)
            <br />
            ↓ <code className="text-purple-600 dark:text-purple-400">BatteryScreen.kt</code> (Jetpack Compose Material 3 渲染)
          </div>
        </div>
      </div>

      {/* File Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {NATIVE_CODE_FILES.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFileId(f.id)}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              activeFileId === f.id
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{f.name}</span>
          </button>
        ))}
      </div>

      {/* Code Viewer Container */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-md overflow-hidden text-slate-200">
        {/* Code Header */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate pr-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs text-slate-300 truncate">
              {currentFile.path}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-slate-200 font-medium transition-all flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>复制源码</span>
              </>
            )}
          </button>
        </div>

        {/* File Description */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[11px] text-slate-400">
          {currentFile.description}
        </div>

        {/* Code Content */}
        <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[460px] text-slate-300 selection:bg-emerald-800 selection:text-white">
          <code>{currentFile.code}</code>
        </pre>
      </div>

      {/* Android Studio Deployment Steps */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Android Studio 极速运行指南
        </div>
        <ol className="list-decimal pl-4 space-y-1 text-slate-500 dark:text-slate-400 leading-normal">
          <li>克隆或导出本工程，用 Android Studio 打开根目录下的 <code className="text-slate-800 dark:text-slate-200 font-mono">/android</code> 文件夹。</li>
          <li>Gradle 将自动同步 Compose BOM 与 Kotlin 2.0.21。</li>
          <li>连接任意 Android 8.0+（推荐 Android 14/15/16）真机或模拟器。</li>
          <li>点击顶部绿色运行图标（Run 'app'），应用将在手机中原生安装并获取真实传感器参数。</li>
        </ol>
      </div>
    </div>
  );
}
