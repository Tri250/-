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

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.9'

      - name: Ensure Android SDK Components
        run: |
          if [ -d "$ANDROID_HOME/cmdline-tools/latest/bin" ]; then
            yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1 || true
            $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" || true
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
      - name: Run Startup Crash Regression Tests (Robolectric)
        run: |
          cd android
          ./gradlew testDebugUnitTest --no-daemon --stacktrace || gradle testDebugUnitTest --no-daemon --stacktrace

      - name: Build Release APK (R8 minified + signed)
        run: |
          cd android
          ./gradlew assembleRelease --stacktrace --no-daemon || gradle assembleRelease --stacktrace --no-daemon

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

      # 签名校验：正式签名构建必须通过 apksigner verify，防止未签名/损坏包发布
      - name: Verify APK Signature (apksigner)
        if: env.keystore_available == 'true'
        run: |
          APK_PATH="\${{ steps.find_apk.outputs.apk_path }}"
          APKSIGNER=$(find "$ANDROID_HOME/build-tools" -name apksigner -type f | sort -V | tail -n 1)
          if [ -z "$APKSIGNER" ]; then
            echo "::warning::apksigner not found, skipping signature verification"
            exit 0
          fi
          "$APKSIGNER" verify --verbose "$APK_PATH" | head -n 10 || { echo "::error::APK signature verification failed"; exit 1; }
          echo "APK signature verified."

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
          echo "Web dist verified: index.html + $ASSET_COUNT asset files."

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

      - name: Download Android APK
        uses: actions/download-artifact@v4
        with:
          name: Android-Battery-Master-APK
          path: artifacts/

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
            | \`Android-Battery-Master-v\${{ steps.version.outputs.version_name }}-release.apk\` | Android 原生 APK（**正式 Release 签名**，R8 混淆 + 资源收缩，可直接安装） |
            | \`web-demo-dist.zip\` | Web 演示端静态产物（解压后任意静态服务器托管，或直接用浏览器打开 \`index.html\`） |
            | \`SHA256SUMS.txt\` | 全部资产 SHA256 校验和 |

            ### 安装说明
            1. 下载 APK 后在设备上点击安装（需在系统设置中允许"安装未知来源应用"）。
            2. 首次启动授予**零运行时权限**：应用不申请任何敏感权限，安装后即可使用全部功能。
            3. 覆盖安装：版本号 \`versionCode=\${{ steps.version.outputs.version_code }}\` 单调递增，直接安装即可覆盖旧版（含 v1.0.0，versionCode=1），数据不丢失。

            ### 卸载说明
            - 常规卸载：系统设置 → 应用管理 → 电池大师 → 卸载， SharedPreferences 与应用数据随包体一并清除，无残留。
            - 备份策略：已配置 \`dataExtractionRules\` 与 \`fullBackupContent\` 排除全部应用数据，云备份与换机传输均不会携带本应用数据。

            ### 权限说明
            - 声明权限数：**0**（无运行时权限、无敏感权限）。
            - 电池指标全部来自公开系统 API（BatteryManager 属性 / \`ACTION_BATTERY_CHANGED\` 广播）与 sysfs 节点，无需任何授权。

            ### 五维自检摘要
            - **稳定性**：广播注册/注销全容错（异常 ROM 下退化为轮询通道不崩溃）、系统服务安全转换、空安全与除零防护、Gradle 分发下载超时放宽至 120s。
            - **性能**：Compose 单数据源 1Hz 刷新、双通道（广播+轮询）共享 Reader 配置避免重复解析、Web 遥测定时器 ref 化消除每拍重建。
            - **兼容性**：minSdk 26 / targetSdk 35，API 31+/34+ 分级适配（SoC 型号、循环计数）、中文字体回退栈、\`prefers-reduced-motion\` 无障碍支持。
            - **权限管理**：0 运行时权限，备份规则显式排除应用数据。
            - **安装卸载**：\`applicationId=com.battery.master\`、\`versionCode=\${{ steps.version.outputs.version_code }}\` 单调递增支持覆盖安装、自适应图标（anydpi-v26 + 五密度 PNG 兜底）、版本化产物命名、CI 安装属性自检（aapt2 badging）与 tag↔versionName 一致性校验。

            ---
            *以下为自动生成的提交记录*
          generate_release_notes: true
          draft: false
          prerelease: false
          fail_on_unmatched_files: true
          files: |
            artifacts/*.apk
            artifacts/*.zip
            artifacts/SHA256SUMS.txt
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`,
  },
  {
    id: 'reader',
    name: 'BatteryHardwareReader.kt',
    path: 'android/app/src/main/java/com/battery/master/service/BatteryHardwareReader.kt',
    language: 'kotlin',
    description: '核心硬件采集：调用 Android BatteryManager 与 sysfs，完整实现全部 12 项充放电指标及充满判定',
    code: `package com.battery.master.service

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import kotlin.math.abs

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

    // 默认或从数据库读取的出厂设计容量 (mAh)：构造时从系统解析一次，之后可被用户覆盖
    // (Receiver 事件通道共享此值，保证轮询/广播双通道数据一致，用户设置不被广播覆盖)
    var designCapacityMah: Int = runCatching { getDesignCapacity(context) }
        .getOrDefault(FALLBACK_DESIGN_CAPACITY)

    // 记录上一轮充满锁定的容量 (从持久化恢复)
    private var lastRecordedFullCapacity: Int? =
        runCatching { prefs?.getInt(KEY_LAST_FULL_CAPACITY, -1)?.takeIf { it > 0 } }.getOrNull()

    // 上一次满足充满判定条件的时间戳 (广播通道共享读取，与锁定容量同源)
    var lastFullChargeTimestamp: Long? =
        runCatching { prefs?.getLong(KEY_LAST_FULL_TIMESTAMP, -1L)?.takeIf { it > 0 } }.getOrNull()

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

        // 5. 电量百分比
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val percentage = if (level >= 0 && scale > 0) {
            (level * 100 / scale)
        } else {
            // 部分设备无 BATTERY_PROPERTY_CAPACITY 时返回 Int.MIN_VALUE，需防护
            val capacityProp = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                ?: Int.MIN_VALUE
            if (capacityProp in 0..100) capacityProp else 0
        }

        // 6. 电池状态 (充电中、放电中、已充满、未充电)
        val statusInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val status = when (statusInt) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.NOT_CHARGING
        }

        // 7. 电池温度：当前电池温度（摄氏度 ℃）
        val tempTenths = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 250) ?: 250
        val temperatureCelsius = tempTenths / 10.0f

        // 8. 电池健康状况 (良好、过热、损坏、超压、未知)
        val healthInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1) ?: -1
        val healthQuality = when (healthInt) {
            BatteryManager.BATTERY_HEALTH_GOOD -> BatteryHealthQuality.GOOD
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> BatteryHealthQuality.OVERHEAT
            BatteryManager.BATTERY_HEALTH_DEAD -> BatteryHealthQuality.DEAD
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> BatteryHealthQuality.OVER_VOLTAGE
            else -> BatteryHealthQuality.UNKNOWN
        }

        // 9. 电压：当前电池电压（毫伏 mV）
        val voltageMv = batteryIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 4000) ?: 4000

        // 11. 瞬时电流：当前电池的瞬时电流（毫安 mA）
        // BATTERY_PROPERTY_CURRENT_NOW 规范返回微安 (μA)，部分旧内核返回毫安 (mA)，需归一化
        val currentMicroAmp = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
            ?: 0
        val currentNowMa = BatterySysfs.normalizeCurrentToMilliAmps(currentMicroAmp)

        // 10. 循环计数：电池充放电的次数
        // Android 14+ 原生 API 与 Linux sysfs 双重支持；均不可用时返回 0 (UI 显示"系统未上报")
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ 原生 API
            cycleCount = batteryIntent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, 0) ?: 0
        }
        if (cycleCount <= 0) {
            cycleCount = BatterySysfs.readIntCached("/sys/class/power_supply/battery/cycle_count") ?: 0
        }

        // 3. 电池当前容量（衰减后的容量 mAh）
        // sysfs charge_full 经单位归一化 (μAh 规范 + mAh 上报内核双重解释)，
        // 合理区间外视为脏数据，回退设计容量估算值，避免非法容量流入指标 12 锁定与持久化
        val chargeCounterUah = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
            ?: 0
        val fallbackCapacityMah = (designCapacityMah * 0.92f).toInt()
        val currentCapacityMah = BatterySysfs.normalizeChargeFullToMilliAmps(
            BatterySysfs.readIntCached("/sys/class/power_supply/battery/charge_full")
        ) ?: fallbackCapacityMah

        // 2. 剩余电量（mAh）
        // 不变式：剩余电量恒 ≤ 当前可用容量，与 Web 端 (百分比 × 当前容量) 口径一致，
        // 避免库仑计读数抖动导致指标 2 大于指标 3
        val remainingCapacityMah = if (chargeCounterUah > 0 && chargeCounterUah != Int.MIN_VALUE) {
            (chargeCounterUah / 1000).coerceAtMost(currentCapacityMah)
        } else {
            (currentCapacityMah * (percentage / 100f)).toInt()
        }

        // 1. 电池健康度 (%)
        val healthPercentage = ((currentCapacityMah.toFloat() / designCapacityMah) * 100f).coerceIn(0f, 100f)

        // 12. 完全充满时的容量：估算的电池完全充满时的容量（毫安时）
        // 核心规则：仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满
        val isFullChargeConditionMet = (percentage == 100 && currentNowMa in 0..25)
        val fullChargeCapacityMah = lockFullChargeIfCriteriaMet(currentCapacityMah, percentage, currentNowMa)

        // 计算瞬时功率 (W = V * I)
        val powerWatts = (voltageMv.toFloat() * abs(currentNowMa)) / 1_000_000f

        // 动态解析硬件信息摘要 (真实可读字段 + 快充档位功率推断 + 诚实未上报标注)
        val hardware = HardwareInfoResolver.resolve(temperatureCelsius, cycleCount, powerWatts)

        return BatteryState(
            healthPercentage = healthPercentage,
            remainingCapacityMah = remainingCapacityMah,
            currentCapacityMah = currentCapacityMah,
            designCapacityMah = designCapacityMah,
            percentage = percentage,
            status = if (isFullChargeConditionMet) BatteryStatus.FULL else status,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            cycleCount = cycleCount,
            currentMa = currentNowMa,
            fullChargeCapacityMah = fullChargeCapacityMah,
            lastFullChargeTimestamp = lastFullChargeTimestamp,
            isFullChargeConditionMet = isFullChargeConditionMet,
            powerWatts = powerWatts,
            socModel = hardware.socModel,
            socVendor = hardware.socVendor,
            socProcess = hardware.socProcess,
            socCpu = hardware.socCpu,
            socGpu = hardware.socGpu,
            pmicModel = hardware.pmicModel,
            batteryChemistry = hardware.batteryChemistry,
            fastChargeProtocol = hardware.fastChargeProtocol,
            internalResistanceMohm = hardware.internalResistanceMohm,
            halVersion = hardware.halVersion,
            cellStructure = hardware.cellStructure,
            thermalThrottlingState = hardware.thermalThrottlingState
        )
    }

    /** 安全默认态：任何采集都不可用时 UI 仍有可渲染的中性数据 (保留已锁定的指标 12 不丢失) */
    private fun buildSafeDefaultState(): BatteryState {
        // 健康度与容量口径自洽：容量回退估算 (设计×0.92) 时健康度同步现算，
        // 杜绝旧版 "当前容量 92% / 健康度却显示 100%" 的跨指标矛盾
        val capacity = (designCapacityMah * 0.92f).toInt()
        val health = (capacity.toFloat() / designCapacityMah * 100f).coerceIn(0f, 100f)
        return BatteryState(
            currentCapacityMah = capacity,
            healthPercentage = health,
            remainingCapacityMah = 0,
            voltageMv = 4000,
            temperatureCelsius = 25.0f,
            percentage = 0,
            socModel = "平台 SoC 解析中",
            pmicModel = "平台级 PMIC 电源管理 [工程估算]",
            fullChargeCapacityMah = lastRecordedFullCapacity,
            lastFullChargeTimestamp = lastFullChargeTimestamp
        )
    }

    /**
     * 持久化指标 12 的充满锁定容量与时间戳 (供 ViewModel 模拟充满时调用)
     */
    fun persistFullChargeCapacity(capacityMah: Int, timestampMs: Long) {
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
     * 特性 12 共享判定：仅当 percentage == 100 且 currentNow ∈ [0, 25] mA 时，
     * 锁定并持久化完全充满容量（同步刷新内存锁定时间戳）；
     * 未满足条件时保留上次锁定值，不因通道切换而丢失。
     * 轮询通道 (readBatteryTelemetry) 与广播通道 (BatteryReceiver) 共用，
     * 保证两通道指标 12 语义完全一致。
     *
     * 写盘去重：仅在进入判定区间的第一拍、或锁定容量发生变化时才持久化；
     * 满足条件期间每秒遥测不再重复写 SharedPreferences (首次锁定时间戳语义保留)。
     */
    fun lockFullChargeIfCriteriaMet(currentCapacityMah: Int, percentage: Int, currentNowMa: Int): Int? {
        if (percentage == 100 && currentNowMa in 0..25) {
            if (!wasInFullChargeBand || lastRecordedFullCapacity != currentCapacityMah) {
                persistFullChargeCapacity(currentCapacityMah, System.currentTimeMillis())
            }
            wasInFullChargeBand = true
            return currentCapacityMah
        }
        wasInFullChargeBand = false
        return lastRecordedFullCapacity
    }

    /**
     * 指标 04 设计容量三级回退链：
     * PowerProfile 反射 -> sysfs charge_full_design -> 主流 5000mAh 兜底
     *
     * 注意：PowerProfile 构造在部分 OEM ROM 上会抛出 ExceptionInInitializerError /
     * NoClassDefFoundError 等 Error (非 Exception)，必须按 Throwable 捕获，
     * 否则会直接引发启动闪退。
     */
    private fun getDesignCapacity(context: Context): Int {
        try {
            val powerProfileClass = Class.forName("com.android.internal.os.PowerProfile")
            val constructor = powerProfileClass.getConstructor(Context::class.java)
            val powerProfile = constructor.newInstance(context)
            val getBatteryCapacityMethod = powerProfileClass.getMethod("getBatteryCapacity")
            val capacity = getBatteryCapacityMethod.invoke(powerProfile) as? Double
            // 合理区间校验：损坏 ROM 的 power_profile.xml 可能含异常标称，
            // 区间外不直接采信，回退 sysfs / 兜底链
            if (capacity != null &&
                capacity.toInt() in BatterySysfs.MIN_PLAUSIBLE_CAPACITY_MAH..BatterySysfs.MAX_PLAUSIBLE_CAPACITY_MAH
            ) {
                return capacity.toInt()
            }
        } catch (e: Throwable) {}

        // charge_full_design 与 charge_full 同源同单位歧义：标准内核 μAh，
        // 个别内核 mAh。旧实现 raw/1000 在 mAh 内核下得到 5 mAh 级设计容量，
        // 指标 01 健康度恒钳 100%、指标 02 剩余电量折算全线失真 → 统一走双解释归一化
        val sysfsDesign = BatterySysfs.normalizeChargeFullToMilliAmps(
            BatterySysfs.readIntCached("/sys/class/power_supply/battery/charge_full_design")
        )
        if (sysfsDesign != null) return sysfsDesign

        return FALLBACK_DESIGN_CAPACITY
    }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_LAST_FULL_CAPACITY = "last_full_capacity_mah"
        private const val KEY_LAST_FULL_TIMESTAMP = "last_full_timestamp_ms"

        /** 设计容量兜底值：与 BatteryState 默认口径一致 */
        const val FALLBACK_DESIGN_CAPACITY = 5000
    }
}`,
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.model.BatteryInfo
import com.battery.master.viewmodel.BatteryViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BatteryScreen(
    viewModel: BatteryViewModel
) {
    // 经 BatteryInfo (BatteryState 业务别名) 消费 ViewModel 兼容别名 batteryInfo
    val state: BatteryInfo by viewModel.batteryInfo.collectAsState()

    // 指标 04 设计容量校准对话框开关 (激活 ViewModel.setDesignCapacity)
    var showDesignCapacityDialog by remember { mutableStateOf(false) }

    // 一键模拟充满保持期剩余秒数 (0 = 无模拟，UI 倒计时反馈)
    val simulationRemainingSec by viewModel.simulationRemainingSec.collectAsState()

    // 顶层双 Tab：状态总览 / 硬件实验室 (对齐 Web 端 AndroidNavBar 信息架构)
    var selectedTab by remember { mutableStateOf(0) }
    val tabTitles = listOf("状态总览", "硬件实验室")

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
                                text = "ANDROID BATTERY MASTER",
                                fontSize = DesignTokens.FontSm,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.sp,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "Android 15 Battery AIDL HAL · 原生硬件遥测",
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
                        modifier = Modifier.height(44.dp)
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

            // 2. 硬件信息汇总栏 (Hardware Information Summary Bar)
            item {
                HardwareSummaryCard(state, onCalibrateDesignCapacity = { showDesignCapacityDialog = true })
            }

            // 3. 特性 12 充满判定卡片 (100% 且 0-25 mA)
            item {
                FullChargeConditionCard(
                    state,
                    simulationRemainingSec = simulationRemainingSec,
                    onTriggerTest = { viewModel.triggerFullChargeSimulation() }
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
                        value = "\${String.format("%.1f", state.healthPercentage)}%",
                        sub = "出厂设计保持率",
                        accentColor = DesignTokens.BrandPrimary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "02",
                        title = "剩余电量",
                        value = "\${state.remainingCapacityMah}",
                        unit = "mAh",
                        sub = "当前可用电荷量",
                        accentColor = DesignTokens.AccentCyanDark
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "03",
                        title = "电池当前容量",
                        value = "\${state.currentCapacityMah}",
                        unit = "mAh",
                        sub = "衰减后最大可用",
                        accentColor = DesignTokens.FeaturePurple
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "04",
                        title = "电池设计容量",
                        value = "\${state.designCapacityMah}",
                        unit = "mAh",
                        sub = "出厂铭牌标称",
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
                        value = "\${state.temperatureCelsius}",
                        unit = "°C",
                        // 温度评估口径与 Web 端三段制完全对齐 (>45 严重 / 38-45 偏热 / ≤0 过冷 / 其余正常)
                        sub = when {
                            state.temperatureCelsius > 45 -> "严重发热 (>45°C)"
                            state.temperatureCelsius >= 38 -> "偏热预警 (38-45°C)"
                            state.temperatureCelsius <= 0 -> "过冷保护 (≤0°C)"
                            else -> "温度正常"
                        },
                        accentColor = when {
                            state.temperatureCelsius > 45 || state.temperatureCelsius <= 0 -> DesignTokens.DangerRose
                            state.temperatureCelsius >= 38 -> DesignTokens.WarningAmber
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
                        sub = "电势差 \${(state.voltageMv / 1000f)} V",
                        accentColor = DesignTokens.InfoSky
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "10",
                        title = "充放电循环",
                        value = if (state.cycleCount > 0) "\${state.cycleCount}" else "—",
                        unit = if (state.cycleCount > 0) "次" else "",
                        sub = if (state.cycleCount > 0) "Cycle Count" else "系统未上报循环数据",
                        accentColor = DesignTokens.AccentTeal
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "11",
                        title = "瞬时电流",
                        // 指标 11：经 BatteryState.currentNowMa 别名读取 (激活别名，与 currentMa 同源)
                        value = "\${if (state.currentNowMa > 0) "+\${state.currentNowMa}" else state.currentNowMa}",
                        unit = "mA",
                        sub = "功率 \${String.format("%.2f", state.powerWatts)} W",
                        accentColor = if (state.currentNowMa > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
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

            item {
                Spacer(modifier = Modifier.height(28.dp))
            }
        }
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
                    parsed > 20000 -> "容量超出合理范围 (最大 20000 mAh)"
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
            val currentMa = state.currentNowMa
            val powerW = state.powerWatts
            Surface(
                shape = RoundedCornerShape(DesignTokens.RadiusChip),
                color = DesignTokens.BgInset,
                border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
            ) {
                Text(
                    text = "\${if (currentMa > 0) "+$currentMa" else currentMa} mA · \${String.format("%.2f", powerW)} W · \${(state.voltageMv / 1000f)} V",
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
                HardwareItem(modifier = Modifier.weight(1f), label = "快充协议", value = state.fastChargeProtocol)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电芯内阻", value = "\${state.internalResistanceMohm} mΩ")
                HardwareItem(modifier = Modifier.weight(1f), label = "化学材料体系", value = state.batteryChemistry)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电芯结构", value = state.cellStructure)
                HardwareItem(modifier = Modifier.weight(1f), label = "AIDL 规范", value = state.halVersion)
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
            Text(
                text = value,
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextPrimary,
                maxLines = maxLines
            )
        }
    }
}

/**
 * 特性 12 充满判定卡片
 */
@Composable
fun FullChargeConditionCard(
    state: BatteryState,
    simulationRemainingSec: Long,
    onTriggerTest: () -> Unit
) {
    // 直接消费 State.isFullChargeConditionMet (双通道单一数据源，不本地重算)
    val isFullMet = state.isFullChargeConditionMet
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
                    text = if (isFullMet) "已达充满判定 (100% & 0-25 mA)" else "等待条件满足",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = if (isFullMet) DesignTokens.BrandPrimaryLight else DesignTokens.TextAmberStrong
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (state.fullChargeCapacityMah != null) {
                    "\${state.fullChargeCapacityMah} mAh"
                } else {
                    "— 未完全充满暂不显示 (需100%且电流0~25mA) —"
                },
                fontSize = DesignTokens.Font2xl,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = if (state.fullChargeCapacityMah != null) DesignTokens.BrandPrimaryLight else DesignTokens.TextTertiary
            )

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
}`,
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

</manifest>`,
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
        <item name="android:statusBarColor">#020617</item>
        <item name="android:navigationBarColor">#020617</item>
        <item name="android:windowBackground">#030712</item>
    </style>
</resources>

<!-- android/app/src/main/res/values/strings.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">电池大师</string>
</resources>

<!-- android/app/src/main/res/values/colors.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#020617</color>
    <color name="neon_emerald">#10B981</color>
</resources>

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
</data-extraction-rules>`,
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
val releaseKeyPass = System.getenv("KEY_PASSWORD")
val hasReleaseSigning = releaseKeystoreFile != null &&
    releaseKeystorePass != null && releaseKeyPass != null

android {
    namespace = "com.battery.master"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.battery.master"
        minSdk = 26
        targetSdk = 35
        versionCode = 6
        versionName = "1.2.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseKeystoreFile as String)
                storePassword = releaseKeystorePass
                keyAlias = "battery-master"
                keyPassword = releaseKeyPass
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
}`,
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
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatterySysfs
import com.battery.master.service.HardwareInfoResolver
import kotlin.math.abs

/**
 * 监听 Android 底层硬件广播 ACTION_BATTERY_CHANGED
 * 提取电压、温度、瞬时电流、健康状态并根据条件 12 判定完全充满
 * 设计容量等配置共享 BatteryHardwareReader 单一数据源，避免双通道数据不一致
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

        // 5. 电量百分比 (0 - 100) (extras 缺失时回退 CAPACITY 属性，与轮询通道口径完全一致；
        //    真实 0% 电量不被 CAPACITY 属性污染，保证双通道指标 5 与指标 12 判定一致)
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val percentage = if (level >= 0 && scale > 0) {
            (level * 100 / scale)
        } else {
            val capacityProp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            if (capacityProp in 0..100) capacityProp else 0
        }

        // 6. 电池状态
        val rawStatus = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val status = when (rawStatus) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.NOT_CHARGING
        }

        // 7. 电池温度：EXTRA_TEMPERATURE 返回的是 0.1 摄氏度 (默认 25.0℃，与轮询通道一致)
        val rawTemp = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 250)
        val temperatureCelsius = rawTemp / 10.0f

        // 8. 电池健康状况
        val rawHealth = intent.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)
        val healthQuality = when (rawHealth) {
            BatteryManager.BATTERY_HEALTH_GOOD -> BatteryHealthQuality.GOOD
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> BatteryHealthQuality.OVERHEAT
            BatteryManager.BATTERY_HEALTH_DEAD -> BatteryHealthQuality.DEAD
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> BatteryHealthQuality.OVER_VOLTAGE
            else -> BatteryHealthQuality.UNKNOWN
        }

        // 9. 电压：毫伏 (mV) (默认 4000mV，与轮询通道一致)
        val voltageMv = intent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 4000)

        // 11. 瞬时电流 (mA)：BATTERY_PROPERTY_CURRENT_NOW 规范返回微安 (μA)，需归一化
        val currentUa = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        val currentMa = BatterySysfs.normalizeCurrentToMilliAmps(currentUa)

        // 10. 循环计数 (Android 14+ API 34 支持直接从 Intent EXTRA_CYCLE_COUNT 获取，或读取 sysfs)
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            try {
                cycleCount = intent.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, -1)
            } catch (e: Exception) {}
        }
        if (cycleCount <= 0) {
            cycleCount = BatterySysfs.readIntCached("/sys/class/power_supply/battery/cycle_count") ?: 0
        }

        // 4. 电池出厂设计容量 (共享 Reader 单一数据源：PowerProfile -> sysfs -> 5000mAh)
        val designCapacityMah = reader.designCapacityMah

        // 3. 电池当前容量 (衰减后容量，从 sysfs charge_full 读取或由电量计芯片校准)
        // charge_full 单位归一化：μAh 规范内核 / mAh 上报内核双重解释，脏数据回退估算
        val currentCapacityMah = BatterySysfs.normalizeChargeFullToMilliAmps(
            BatterySysfs.readIntCached("/sys/class/power_supply/battery/charge_full")
        ) ?: (designCapacityMah * 0.92f).toInt()

        // 2. 剩余电量 (mAh)
        // 从 BATTERY_PROPERTY_CHARGE_COUNTER 获取 (uAh -> mAh)，或由百分比折算
        // 不变式：剩余电量恒 ≤ 当前可用容量，与轮询通道口径一致
        val chargeCounterUah = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
        val remainingCapacityMah = if (chargeCounterUah > 0 && chargeCounterUah != Int.MIN_VALUE) {
            (chargeCounterUah / 1000).coerceAtMost(currentCapacityMah)
        } else {
            (currentCapacityMah * (percentage / 100.0f)).toInt()
        }

        // 1. 电池健康度 (%)
        val healthPercentage = ((currentCapacityMah.toFloat() / designCapacityMah) * 100).coerceIn(0f, 100f)

        // 12. 完全充满时的容量：估算完全充满时的容量 (mAh)
        // 核心规则：仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满
        // 与轮询通道共享锁定逻辑：满足则锁定+持久化，未满足保留上次锁定值不抹除
        val isFullCriteriaMet = percentage == 100 && (currentMa in 0..25)
        val fullChargeCapacityMah = reader.lockFullChargeIfCriteriaMet(currentCapacityMah, percentage, currentMa)

        // 瞬时功率 (W = V × I)：与轮询通道一致，始终计算
        val powerWatts = (voltageMv.toFloat() * abs(currentMa)) / 1_000_000f

        // 动态解析硬件信息摘要 (真实可读字段 + 快充档位功率推断 + 诚实未上报标注)
        val hardware = HardwareInfoResolver.resolve(temperatureCelsius, cycleCount, powerWatts)

        val updatedState = BatteryState(
            healthPercentage = healthPercentage,
            remainingCapacityMah = remainingCapacityMah,
            currentCapacityMah = currentCapacityMah,
            designCapacityMah = designCapacityMah,
            percentage = percentage,
            status = if (isFullCriteriaMet) BatteryStatus.FULL else status,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            cycleCount = cycleCount,
            currentMa = currentMa,
            fullChargeCapacityMah = fullChargeCapacityMah,
            lastFullChargeTimestamp = reader.lastFullChargeTimestamp,
            powerWatts = powerWatts,
            isFullChargeConditionMet = isFullCriteriaMet,
            socModel = hardware.socModel,
            socVendor = hardware.socVendor,
            socProcess = hardware.socProcess,
            socCpu = hardware.socCpu,
            socGpu = hardware.socGpu,
            pmicModel = hardware.pmicModel,
            batteryChemistry = hardware.batteryChemistry,
            fastChargeProtocol = hardware.fastChargeProtocol,
            internalResistanceMohm = hardware.internalResistanceMohm,
            halVersion = hardware.halVersion,
            cellStructure = hardware.cellStructure,
            thermalThrottlingState = hardware.thermalThrottlingState
        )

        onBatteryUpdate(updatedState)
    }
}`,
  },
  {
    id: 'state',
    name: 'BatteryState.kt',
    path: 'android/app/src/main/java/com/battery/master/data/BatteryState.kt',
    language: 'kotlin',
    description: '12 项充放电指标数据模型 + 硬件信息汇总 + 双枚举（App 实际源码）',
    code: `package com.battery.master.data

/**
 * 电池全部 12 项充放电指标数据模型 + 硬件信息汇总
 */
data class BatteryState(
    // 1、电池健康度 (百分比，例如 94.5%)
    val healthPercentage: Float = 100.0f,

    // 2、剩余电量 (mAh，例如 3800 mAh)
    val remainingCapacityMah: Int = 0,

    // 3、电池当前容量 (电池衰减后的容量 mAh，例如 4700 mAh)
    val currentCapacityMah: Int = 5000,

    // 4、电池设计容量 (电池出厂容量 mAh，例如 5000 mAh)
    val designCapacityMah: Int = 5000,

    // 5、电量：当前电池电量的百分比 (0 - 100)
    val percentage: Int = 0,

    // 6、电池状态：充电中、放电中、已充满、未充电
    val status: BatteryStatus = BatteryStatus.NOT_CHARGING,

    // 7、电池温度：摄氏度 (例如 32.5°C)
    val temperatureCelsius: Float = 0.0f,

    // 8、电池健康：良好、过热、损坏、超压、未知
    val healthQuality: BatteryHealthQuality = BatteryHealthQuality.GOOD,

    // 9、电压：毫伏 mV (例如 4150 mV)
    val voltageMv: Int = 0,

    // 10、循环计数：电池充放电的次数
    val cycleCount: Int = 0,

    // 11、电流：瞬时电流 mA (充电流入为正，放电消耗为负)
    val currentMa: Int = 0,

    // 12、完全充满时的容量 (mAh)
    // 仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满并记录
    val fullChargeCapacityMah: Int? = null,

    // 满足 100% 且电流 0-25 mA 充满条件的判定时间戳
    val lastFullChargeTimestamp: Long? = null,

    // 功率 (W)
    val powerWatts: Float = 0.0f,

    // 是否符合充满判定标准
    val isFullChargeConditionMet: Boolean = false,

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
    val halVersion: String = "Android Battery AIDL HAL",
    val cellStructure: String = "标准单电芯封装 [工程估算]",
    val thermalThrottlingState: String = "正常供电 (无节流)"
) {
    // 别名兼容
    val currentNowMa: Int get() = currentMa
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
}`,
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
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.abs

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

    // 一键模拟充满后的保持期 (毫秒)：期间不覆盖模拟数据，15 秒后恢复真实遥测
    private var simulationHoldUntilMs = 0L

    // 模拟保持期剩余秒数 (供 UI 显示倒计时反馈，0 表示无模拟)
    private val _simulationRemainingSec = MutableStateFlow(0L)
    val simulationRemainingSec: StateFlow<Long> = _simulationRemainingSec.asStateFlow()

    // 广播注册状态标记：仅成功注册后才允许注销，防止 onCleared 重复注销崩溃
    private var isReceiverRegistered = false

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
     */
    private fun startSimulationCountdown() {
        viewModelScope.launch {
            while (isActive) {
                try {
                    val remainingMs = simulationHoldUntilMs - System.currentTimeMillis()
                    _simulationRemainingSec.value = if (remainingMs > 0) (remainingMs + 999) / 1000 else 0L
                } catch (e: Throwable) {
                    // 倒计时异常不致命，下一拍继续刷新
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
        super.onCleared()
    }

    /**
     * 统一发布遥测数据：
     * 1. 模拟保持期内不覆盖 (一键充满演示可持续观察 15 秒)；
     * 2. 若新数据未满足充满条件、但上一轮已锁定充满容量，
     *    则保留指标 12 的锁定容量与时间戳不丢失
     */
    private fun publish(fresh: BatteryState) {
        // 启动闪退治理：发布链路任何异常都不能逃逸到协程 (未捕获异常会直接杀进程)
        try {
            if (System.currentTimeMillis() < simulationHoldUntilMs) return
            // 硬件实验室模拟中：冻结真实遥测覆盖，保持滑杆/场景设定值稳定展示
            if (_labOverride.value != null) return

            val current = _batteryState.value
            _batteryState.value =
                if (!fresh.isFullChargeConditionMet &&
                    current.isFullChargeConditionMet &&
                    current.fullChargeCapacityMah != null
                ) {
                    fresh.copy(
                        fullChargeCapacityMah = current.fullChargeCapacityMah,
                        lastFullChargeTimestamp = current.lastFullChargeTimestamp
                    )
                } else {
                    fresh
                }
        } catch (e: Throwable) {
            // 单拍发布失败保留上一帧数据，下一拍自动恢复
        }
    }

    private fun startTelemetryPolling() {
        viewModelScope.launch {
            while (isActive) {
                // 启动闪退治理：轮询体整体兜底，硬件读取异常只跳过本拍，协程不中断
                try {
                    publish(reader.readBatteryTelemetry())
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
            reader.designCapacityMah = capacityMah
            simulationHoldUntilMs = 0L // 手动改配置立即恢复真实遥测
            publish(reader.readBatteryTelemetry())
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
            currentMa = cur.currentMa,
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
                cur.percentage, cur.currentMa, cur.voltageMv, cur.temperatureCelsius,
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
                        cur.percentage, cur.currentMa, cur.voltageMv, cur.temperatureCelsius,
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
    fun updateLabCurrent(v: Int) = mutateLab { it.copy(currentMa = v.coerceIn(-2000, 6000)) }
    fun updateLabVoltage(v: Int) = mutateLab { it.copy(voltageMv = v.coerceIn(3500, 4600)) }
    fun updateLabTemperature(v: Float) = mutateLab { it.copy(temperatureCelsius = v.coerceIn(0f, 55f)) }
    fun updateLabCycleCount(v: Int) = mutateLab { it.copy(cycleCount = v.coerceIn(0, 1200)) }
    fun updateLabStatus(v: BatteryStatus) = mutateLab { it.copy(status = v) }
    fun updateLabHealthQuality(v: BatteryHealthQuality) = mutateLab {
        val t = if (v == BatteryHealthQuality.OVERHEAT) 49.2f else it.temperatureCelsius
        it.copy(healthQuality = v, temperatureCelsius = t)
    }

    /** 设计容量滑杆：直接作用于 Reader 配置 (真实生效，与总览页校准入口同源) */
    fun updateLabDesignCapacity(v: Int) {
        setDesignCapacity(v.coerceIn(1000, 15000))
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
            val isFullMet = lab.percentage == 100 && lab.currentMa in 0..25
            val effectiveStatus = if (isFullMet) BatteryStatus.FULL else lab.status
            val remaining = (base.currentCapacityMah * (lab.percentage / 100f)).toInt()
            _batteryState.value = base.copy(
                percentage = lab.percentage,
                currentMa = lab.currentMa,
                voltageMv = lab.voltageMv,
                temperatureCelsius = lab.temperatureCelsius,
                status = effectiveStatus,
                healthQuality = lab.healthQuality,
                cycleCount = lab.cycleCount,
                remainingCapacityMah = remaining.coerceAtMost(base.currentCapacityMah),
                powerWatts = (abs(lab.voltageMv * lab.currentMa)) / 1_000_000f,
                isFullChargeConditionMet = isFullMet,
                fullChargeCapacityMah = if (isFullMet) (base.fullChargeCapacityMah ?: base.currentCapacityMah)
                else base.fullChargeCapacityMah
            )
        } catch (e: Throwable) {
            // 忽略：保持上一帧展示
        }
    }

    /**
     * 一键模拟完全充满判定条件 (电量 100% 且瞬时电流 0~25mA)
     * 模拟结果同时持久化，保持期结束后锁定容量依然可回显 (指标 12)
     */
    fun triggerFullChargeSimulation() {
        // UI 回调入口兜底
        try {
            val current = _batteryState.value
            val timestamp = System.currentTimeMillis()
            simulationHoldUntilMs = timestamp + 15_000
            reader.persistFullChargeCapacity(current.currentCapacityMah, timestamp)
            _batteryState.value = current.copy(
                percentage = 100,
                currentMa = 16,
                status = BatteryStatus.FULL,
                isFullChargeConditionMet = true,
                fullChargeCapacityMah = current.currentCapacityMah,
                lastFullChargeTimestamp = timestamp
            )
        } catch (e: Throwable) {
            // 忽略：保持当前展示数据
        }
    }
}`,
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

    /** 电池当前容量合理区间 (mAh)：区间外视为 sysfs 单位异常/脏数据，回退估算值 */
    const val MIN_PLAUSIBLE_CAPACITY_MAH = 500
    const val MAX_PLAUSIBLE_CAPACITY_MAH = 20_000

    /**
     * 静态 sysfs 节点 TTL 缓存 (毫秒)：
     * charge_full / charge_full_design / cycle_count 变化频率极低 (分钟级)，
     * 1Hz 轮询下无需每秒 open/read/close；current_now 等瞬态节点不走缓存。
     * 仅主线程访问 (ViewModel 轮询 + 广播 onReceive 均在主线程)，无需并发防护。
     */
    private const val STATIC_NODE_TTL_MS = 30_000L
    private val staticNodeCache = HashMap<String, Pair<Long, Int>>()

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
     * 静态节点带 TTL 缓存读取：TTL 内直接命中内存，过期后重新读盘。
     * 节点不可读 (null) 不缓存，下一拍自动重试，节点热插拔出现后 ≤1 拍即可恢复真实读数。
     */
    fun readIntCached(path: String): Int? {
        val now = System.currentTimeMillis()
        val hit = staticNodeCache[path]
        if (hit != null && now < hit.first) return hit.second
        val fresh = readInt(path)
        if (fresh != null) staticNodeCache[path] = (now + STATIC_NODE_TTL_MS) to fresh
        return fresh
    }

    /**
     * charge_full 原始值 → mAh 容量归一化 (指标 03「电池当前容量」)：
     *
     * 1. 标准内核以 μAh 上报 (sysfs 规范)：raw/1000 落入合理区间 → 直接采用；
     * 2. 个别内核以 mAh 上报：raw/1000 落入 0~20 mAh 非法区间，但 raw 本身
     *    落入合理区间 → 按 mAh 解释采用 (v1.2.3 修复：旧逻辑"一律回退估算值"
     *    会把真实读数丢弃、健康度恒伪造 92.0%，违背真实遥测目标)；
     * 3. 两者均不在区间 → 脏数据，返回 null 由调用方回退估算值。
     */
    fun normalizeChargeFullToMilliAmps(rawUah: Int?): Int? {
        if (rawUah == null || rawUah <= 0) return null
        val asMah = rawUah / 1000
        return when {
            asMah in MIN_PLAUSIBLE_CAPACITY_MAH..MAX_PLAUSIBLE_CAPACITY_MAH -> asMah
            rawUah in MIN_PLAUSIBLE_CAPACITY_MAH..MAX_PLAUSIBLE_CAPACITY_MAH -> rawUah
            else -> null
        }
    }

    /**
     * 将 CURRENT_NOW 原始值归一化为毫安 (mA)，保持符号 (充电为正、放电为负)
     *
     * 判定策略：
     * 1. |raw| > 20000：手机不可能通过 20A+ 电流，必定是 μA，直接 /1000；
     * 2. 可读取 sysfs current_now 时做交叉校验：
     *    - sysfs ≈ 1000 × raw → raw 是 mA，sysfs 是 μA → 直接返回 raw；
     *    - raw ≈ 1000 × sysfs → raw 是 μA → /1000；
     *    - 两者同单位 → 按 Android 官方规范默认 μA → /1000；
     * 3. 无 sysfs 时按官方规范默认 μA → /1000。
     */
    fun normalizeCurrentToMilliAmps(raw: Int): Int {
        if (raw == 0 || raw == Int.MIN_VALUE) return 0
        val absRaw = abs(raw)
        if (absRaw > 20000) return raw / 1000

        val sysfsCurrent = readInt("/sys/class/power_supply/battery/current_now")
        if (sysfsCurrent != null && abs(sysfsCurrent) > 0) {
            val ratio = abs(sysfsCurrent).toFloat() / absRaw
            if (ratio in 500f..2000f) return raw
            if (ratio in (1f / 2000f)..(1f / 500f)) return raw / 1000
            return raw / 1000
        }
        return raw / 1000
    }
}`,
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
                halVersion = "Android \${Build.VERSION.RELEASE} Battery AIDL HAL",
                cellStructure = "标准单电芯封装 [工程估算]",
                thermalThrottlingState = "正常供电 (无节流)"
            )
        }
    }

    private fun resolveInternal(temperatureCelsius: Float, cycleCount: Int, powerWatts: Float): HardwareTelemetry {
        val profile = staticProfile

        // SoC 主控五字段：型号 / 厂商 / 制程 / CPU / GPU (SoCHardwareProfile 全量检测链)
        val soc = SoCHardwareProfile.resolveSoc()

        // 温控节流状态：按电芯温度推导 (阈值与 Web 端一致)
        val thermalThrottlingState = when {
            temperatureCelsius >= 44f -> "过热急停 (限制 50%)"
            temperatureCelsius >= 38.5f -> "温控保护 (限流 15%)"
            else -> "正常供电 (无节流)"
        }

        // 电芯动态内阻：基础值 + 循环老化 + 高温附加估算模型 (与 Web 端一致)
        val internalResistance = 14.8f +
            (cycleCount.coerceAtLeast(0) / 300f) * 1.5f +
            if (temperatureCelsius > 40f) (temperatureCelsius - 40f) * 0.3f else 0f

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
            internalResistanceMohm = (internalResistance * 10f).toInt() / 10f,
            halVersion = "Android \${Build.VERSION.RELEASE} Battery AIDL HAL",
            cellStructure = profile.cellStructure,
            thermalThrottlingState = thermalThrottlingState
        )
    }
}`,
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
}`,
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
        enableEdgeToEdge()

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
}`,
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
}`,
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
    val currentMa = lab?.currentMa ?: state.currentMa
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

                    // 退出模拟：恢复真实遥测
                    Button(
                        onClick = { viewModel.exitLabMode() },
                        enabled = labActive,
                        modifier = Modifier.fillMaxWidth(),
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
                LabSlider(
                    label = "11. 瞬时电流",
                    valueText = "\${if (currentMa > 0) "+$currentMa" else currentMa} mA",
                    value = currentMa.toFloat(),
                    valueRange = -2000f..6000f,
                    accent = DesignTokens.BrandPrimaryLight,
                    onValueChange = { viewModel.updateLabCurrent(it.toInt()) }
                )
                LabSlider(
                    label = "09. 电芯电压",
                    valueText = "$voltageMv mV",
                    value = voltageMv.toFloat(),
                    valueRange = 3500f..4600f,
                    accent = DesignTokens.InfoSky,
                    onValueChange = { viewModel.updateLabVoltage(it.toInt()) }
                )
                LabSlider(
                    label = "07. 传感器温度",
                    valueText = "$temperature °C",
                    value = temperature,
                    valueRange = 0f..55f,
                    accent = DesignTokens.WarningAmber,
                    onValueChange = { viewModel.updateLabTemperature(it) }
                )
                LabSlider(
                    label = "10. 循环计数",
                    valueText = "$cycleCount 次",
                    value = cycleCount.toFloat(),
                    valueRange = 0f..1200f,
                    accent = DesignTokens.AccentTeal,
                    onValueChange = { viewModel.updateLabCycleCount(it.toInt()) }
                )
                LabSlider(
                    label = "04. 出厂设计容量 (真实生效)",
                    valueText = "\${state.designCapacityMah} mAh",
                    value = state.designCapacityMah.toFloat(),
                    valueRange = 1000f..15000f,
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
}`,
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
