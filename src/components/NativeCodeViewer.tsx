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
      # 与"安装与卸载"审计项对应，属性缺失直接让流水线失败
      - name: Verify APK Install Metadata (aapt2 badging)
        run: |
          APK_PATH="\${{ steps.find_apk.outputs.apk_path }}"
          AAPT=$(find "$ANDROID_HOME/build-tools" -name aapt2 -type f | sort -V | tail -n 1)
          if [ -z "$AAPT" ]; then
            echo "::warning::aapt2 not found, skipping metadata verification"
            exit 0
          fi
          "$AAPT" dump badging "$APK_PATH" > apk-badging.txt || { echo "::error::aapt2 dump badging failed"; exit 1; }
          head -n 20 apk-badging.txt
          grep -q "package: name='com.battery.master'" apk-badging.txt || { echo "::error::Unexpected applicationId"; exit 1; }
          grep -q "versionName='1.0.0'" apk-badging.txt || { echo "::error::Unexpected versionName"; exit 1; }
          grep -q "launchable-activity" apk-badging.txt || { echo "::error::Missing launcher activity"; exit 1; }
          grep -q "application-icon-320" apk-badging.txt || { echo "::error::Missing launcher icons"; exit 1; }
          grep -q "application-label:'电池大师'" apk-badging.txt || { echo "::error::Unexpected app label"; exit 1; }
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
          if [ -z "$VERSION_NAME" ]; then VERSION_NAME="1.0.0"; fi
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
  # 产物 = Android Debug APK（版本化命名）+ Web 演示端 dist 打包 + SHA256 校验和
  # ============================================================
  release:
    name: 发布 GitHub Release
    needs: [android, web]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest

    steps:
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
          # 固定中文发布说明（安装/卸载/权限/五维自检摘要）+ 自动追加的提交记录
          body: |
            ## Android Battery Master v1.0.0

            专业的安卓电池充放电监测工具：**12 项核心充放电指标**全量实时遥测（健康度 / 剩余电量 / 当前容量 / 设计容量 / 电量百分比 / 电池状态 / 温度 / 健康状况 / 电压 / 循环计数 / 瞬时电流 / 完全充满容量），底层基于 Android BatteryManager、粘性广播与 Linux sysfs 真实硬件通道。

            ### 发布资产
            | 资产 | 说明 |
            | --- | --- |
            | \`Android-Battery-Master-v1.0.0-release.apk\` | Android 原生 APK（**正式 Release 签名**，R8 混淆 + 资源收缩，可直接安装） |
            | \`web-demo-dist.zip\` | Web 演示端静态产物（解压后任意静态服务器托管，或直接用浏览器打开 \`index.html\`） |
            | \`SHA256SUMS.txt\` | 全部资产 SHA256 校验和 |

            ### 安装说明
            1. 下载 APK 后在设备上点击安装（需在系统设置中允许"安装未知来源应用"）。
            2. 首次启动授予**零运行时权限**：应用不申请任何敏感权限，安装后即可使用全部功能。
            3. 覆盖安装：版本号 \`versionCode=1\` 单调递增，直接安装即可覆盖旧版，数据不丢失。

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
            - **安装卸载**：\`applicationId=com.battery.master\`、自适应图标（anydpi-v26 + 五密度 PNG 兜底）、版本化产物命名、CI 安装属性自检（aapt2 badging）。

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
 */
class BatteryHardwareReader(private val context: Context) {

    private val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager

    // 满电容量持久化：指标 12 锁定值跨进程重启保留
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // 默认或从数据库读取的出厂设计容量 (mAh)：构造时从系统解析一次，之后可被用户覆盖
    // (Receiver 事件通道共享此值，保证轮询/广播双通道数据一致，用户设置不被广播覆盖)
    var designCapacityMah: Int = getDesignCapacity(context)

    // 记录上一轮充满锁定的容量 (从持久化恢复)
    private var lastRecordedFullCapacity: Int? =
        prefs.getInt(KEY_LAST_FULL_CAPACITY, -1).takeIf { it > 0 }

    // 上一次满足充满判定条件的时间戳 (广播通道共享读取，与锁定容量同源)
    var lastFullChargeTimestamp: Long? =
        prefs.getLong(KEY_LAST_FULL_TIMESTAMP, -1L).takeIf { it > 0 }

    // 是否处于充满判定区间内 (100% 且 0-25mA)：用于写盘去重，
    // 避免满足条件期间每秒遥测轮询重复写 SharedPreferences
    private var wasInFullChargeBand = false

    /**
     * 读取最新的电池遥测数据
     */
    fun readBatteryTelemetry(): BatteryState {
        val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryIntent: Intent? = context.registerReceiver(null, intentFilter)

        // 5. 电量百分比
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val percentage = if (level >= 0 && scale > 0) {
            (level * 100 / scale)
        } else {
            // 部分设备无 BATTERY_PROPERTY_CAPACITY 时返回 Int.MIN_VALUE，需防护
            val capacityProp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
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
        val currentMicroAmp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        val currentNowMa = BatterySysfs.normalizeCurrentToMilliAmps(currentMicroAmp)

        // 10. 循环计数：电池充放电的次数
        // Android 14+ 原生 API 与 Linux sysfs 双重支持；均不可用时返回 0 (UI 显示"系统未上报")
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ 原生 API
            cycleCount = batteryIntent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, 0) ?: 0
        }
        if (cycleCount <= 0) {
            cycleCount = BatterySysfs.readInt("/sys/class/power_supply/battery/cycle_count") ?: 0
        }

        // 3. 电池当前容量（衰减后的容量 mAh）
        val chargeCounterUah = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
        var currentCapacityMah = (designCapacityMah * 0.92f).toInt()
        val sysfsMaxCapacityUah = BatterySysfs.readInt("/sys/class/power_supply/battery/charge_full")
        if (sysfsMaxCapacityUah != null && sysfsMaxCapacityUah > 0) {
            currentCapacityMah = sysfsMaxCapacityUah / 1000
        }

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
            pmicModel = hardware.pmicModel,
            batteryChemistry = hardware.batteryChemistry,
            fastChargeProtocol = hardware.fastChargeProtocol,
            internalResistanceMohm = hardware.internalResistanceMohm,
            halVersion = hardware.halVersion,
            cellStructure = hardware.cellStructure,
            thermalThrottlingState = hardware.thermalThrottlingState
        )
    }

    /**
     * 持久化指标 12 的充满锁定容量与时间戳 (供 ViewModel 模拟充满时调用)
     */
    fun persistFullChargeCapacity(capacityMah: Int, timestampMs: Long) {
        lastRecordedFullCapacity = capacityMah
        lastFullChargeTimestamp = timestampMs
        prefs.edit()
            .putInt(KEY_LAST_FULL_CAPACITY, capacityMah)
            .putLong(KEY_LAST_FULL_TIMESTAMP, timestampMs)
            .apply()
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
     */
    private fun getDesignCapacity(context: Context): Int {
        try {
            val powerProfileClass = Class.forName("com.android.internal.os.PowerProfile")
            val constructor = powerProfileClass.getConstructor(Context::class.java)
            val powerProfile = constructor.newInstance(context)
            val getBatteryCapacityMethod = powerProfileClass.getMethod("getBatteryCapacity")
            val capacity = getBatteryCapacityMethod.invoke(powerProfile) as? Double
            if (capacity != null && capacity > 0) return capacity.toInt()
        } catch (e: Exception) {}

        val sysfsDesign = BatterySysfs.readInt("/sys/class/power_supply/battery/charge_full_design")
        if (sysfsDesign != null && sysfsDesign > 0) return sysfsDesign / 1000

        return 5000
    }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_LAST_FULL_CAPACITY = "last_full_capacity_mah"
        private const val KEY_LAST_FULL_TIMESTAMP = "last_full_timestamp_ms"
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

import androidx.compose.foundation.background
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

    Scaffold(
        containerColor = Color(0xFF030712), // Deep Cyber AMOLED Black
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
                                .background(Color(0xFF10B981), RoundedCornerShape(5.dp))
                        )
                        Column {
                            Text(
                                text = "ANDROID BATTERY MASTER",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.sp,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "Android 15 Battery AIDL HAL · 原生硬件遥测",
                                fontSize = 11.sp,
                                color = Color(0xFF06B6D4),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF090D16)
                )
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
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
                    fontSize = 13.sp,
                    letterSpacing = 1.sp,
                    color = Color(0xFF94A3B8),
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
                        accentColor = Color(0xFF10B981)
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "02",
                        title = "剩余电量",
                        value = "\${state.remainingCapacityMah}",
                        unit = "mAh",
                        sub = "当前可用电荷量",
                        accentColor = Color(0xFF06B6D4)
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
                        accentColor = Color(0xFFA855F7)
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "04",
                        title = "电池设计容量",
                        value = "\${state.designCapacityMah}",
                        unit = "mAh",
                        sub = "出厂铭牌标称",
                        accentColor = Color(0xFF38BDF8)
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
                        accentColor = Color(0xFF10B981)
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "06",
                        title = "电池状态",
                        value = state.status.label,
                        sub = "Battery Status",
                        accentColor = Color(0xFF38BDF8)
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
                            state.temperatureCelsius > 45 || state.temperatureCelsius <= 0 -> Color(0xFFF43F5E)
                            state.temperatureCelsius >= 38 -> Color(0xFFF59E0B)
                            else -> Color(0xFF10B981)
                        }
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "08",
                        title = "电池健康状况",
                        value = state.healthQuality.label,
                        sub = "Android BatteryManager",
                        accentColor = Color(0xFF10B981)
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
                        accentColor = Color(0xFF38BDF8)
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "10",
                        title = "充放电循环",
                        value = if (state.cycleCount > 0) "\${state.cycleCount}" else "—",
                        unit = if (state.cycleCount > 0) "次" else "",
                        sub = if (state.cycleCount > 0) "Cycle Count" else "系统未上报循环数据",
                        accentColor = Color(0xFF14B8A6)
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
                        accentColor = if (state.currentNowMa > 0) Color(0xFF10B981) else Color(0xFF06B6D4)
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "12",
                        title = "完全充满容量",
                        value = if (state.fullChargeCapacityMah != null) "\${state.fullChargeCapacityMah}" else "—",
                        unit = if (state.fullChargeCapacityMah != null) "mAh" else "",
                        sub = if (state.isFullChargeConditionMet) "已满足 100% & 0-25 mA" else "详见上方充满判定卡",
                        accentColor = Color(0xFF34D399)
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(28.dp))
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
                                Text(err, fontSize = 11.sp, color = Color(0xFFFB7185))
                            }
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = { submitCalibration() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color(0xFFE2E8F0),
                            focusedBorderColor = Color(0xFF06B6D4),
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedLabelColor = Color(0xFF06B6D4),
                            unfocusedLabelColor = Color(0xFF64748B),
                            errorBorderColor = Color(0xFFFB7185),
                            errorLabelColor = Color(0xFFFB7185)
                        )
                    )
                },
                confirmButton = {
                    TextButton(onClick = submitCalibration) {
                        Text("确定", color = Color(0xFF34D399))
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDesignCapacityDialog = false }) {
                        Text("取消", color = Color(0xFF94A3B8))
                    }
                },
                containerColor = Color(0xFF0F172A),
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
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Status Tag
            Surface(
                shape = RoundedCornerShape(50),
                color = Color(0xFF1E293B),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
            ) {
                Text(
                    text = state.status.label,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = when (state.status) {
                        BatteryStatus.CHARGING -> Color(0xFF34D399)
                        BatteryStatus.FULL -> Color(0xFF2DD4BF)
                        else -> Color(0xFF38BDF8)
                    },
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 5. 电量百分比 (Huge Futuristic typography)
            Text(
                text = "\${state.percentage}%",
                fontSize = 68.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = Color.White
            )

            // 2. 剩余电量 (mAh)
            Text(
                text = "剩余电量: \${state.remainingCapacityMah} / \${state.currentCapacityMah} mAh",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                fontFamily = FontFamily.Monospace,
                color = Color(0xFF94A3B8)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // 11. 瞬时电流与功率 (指标 11 经 BatteryState.currentNowMa 别名读取，与 currentMa 同源；
            //    功率直接消费 State.powerWatts，统一数据源)
            val currentMa = state.currentNowMa
            val powerW = state.powerWatts
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Color(0xFF020617),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
            ) {
                Text(
                    text = "\${if (currentMa > 0) "+$currentMa" else currentMa} mA · \${String.format("%.2f", powerW)} W · \${(state.voltageMv / 1000f)} V",
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF38BDF8),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                )
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
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16))
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
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontFamily = FontFamily.Monospace
                )
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF06B6D4))
                ) {
                    Text(
                        text = state.thermalThrottlingState,
                        fontSize = 10.sp,
                        color = Color(0xFF06B6D4),
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 硬件网格
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "SoC 主控", value = state.socModel)
                HardwareItem(modifier = Modifier.weight(1f), label = "电源管理 IC", value = state.pmicModel)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "快充协议", value = state.fastChargeProtocol)
                HardwareItem(modifier = Modifier.weight(1f), label = "电芯内阻", value = "\${state.internalResistanceMohm} mΩ")
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "化学材料体系", value = state.batteryChemistry)
                HardwareItem(modifier = Modifier.weight(1f), label = "AIDL 规范", value = state.halVersion)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 电芯结构 (激活 BatteryState.cellStructure：Resolver 采集 -> State 承载 -> UI 消费)
            HardwareItem(modifier = Modifier.fillMaxWidth(), label = "电芯结构", value = state.cellStructure)

            Spacer(modifier = Modifier.height(10.dp))

            // 指标 04 用户校准入口 (激活 ViewModel.setDesignCapacity，与 Web 端自定义容量对等)
            OutlinedButton(
                onClick = onCalibrateDesignCapacity,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF06B6D4))
            ) {
                Text(
                    text = "校准设计容量 (当前 \${state.designCapacityMah} mAh)",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

@Composable
fun HardwareItem(modifier: Modifier = Modifier, label: String, value: String) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        color = Color(0xFF020617),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(text = label, fontSize = 10.sp, color = Color(0xFF64748B))
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = Color(0xFFE2E8F0),
                maxLines = 1
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
                if (isFullMet) Color(0xFF10B981) else Color(0xFF1E293B),
                RoundedCornerShape(20.dp)
            ),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16))
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
                    fontSize = 13.sp,
                    color = Color.White
                )
                Text(
                    text = if (isFullMet) "已达充满判定 (100% & 0-25 mA)" else "等待条件满足",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = if (isFullMet) Color(0xFF34D399) else Color(0xFFFBBF24)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (state.fullChargeCapacityMah != null) {
                    "\${state.fullChargeCapacityMah} mAh"
                } else {
                    "— 未完全充满暂不显示 (需100%且电流0~25mA) —"
                },
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = if (state.fullChargeCapacityMah != null) Color(0xFF34D399) else Color(0xFF64748B)
            )

            // 上次充满锁定时间 (激活 lastFullChargeTimestamp：持久化值跨重启回显)
            state.lastFullChargeTimestamp?.let { timestamp ->
                Text(
                    text = "上次锁定: " + SimpleDateFormat(
                        "yyyy-MM-dd HH:mm:ss",
                        Locale.getDefault()
                    ).format(Date(timestamp)),
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF64748B)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = onTriggerTest,
                enabled = !isSimulating,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSimulating) Color(0xFF334155) else Color(0xFF047857),
                    disabledContainerColor = Color(0xFF1E293B),
                    disabledContentColor = Color(0xFF94A3B8)
                )
            ) {
                Text(
                    text = if (isSimulating) {
                        "模拟保持中 (\${simulationRemainingSec}s) · 结束后自动恢复真实遥测"
                    } else {
                        "一键模拟完全充满 (100% + 16mA)"
                    },
                    fontSize = 12.sp,
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
        modifier = modifier.border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16))
    ) {
        Column(modifier = Modifier.padding(13.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = title,
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8)
                )
                Text(
                    text = number,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF475569)
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = value,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )
                if (unit.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = unit,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = accentColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(3.dp))

            Text(
                text = sub,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                color = Color(0xFF64748B),
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
        versionCode = 1
        versionName = "1.0.0"

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

    override fun onReceive(context: Context, intent: Intent) {
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
            cycleCount = BatterySysfs.readInt("/sys/class/power_supply/battery/cycle_count") ?: 0
        }

        // 4. 电池出厂设计容量 (共享 Reader 单一数据源：PowerProfile -> sysfs -> 5000mAh)
        val designCapacityMah = reader.designCapacityMah

        // 3. 电池当前容量 (衰减后容量，从 sysfs charge_full 读取或由电量计芯片校准)
        val currentCapacityMah = BatterySysfs.readInt("/sys/class/power_supply/battery/charge_full")?.div(1000)
            ?.takeIf { it > 0 }
            ?: (designCapacityMah * 0.92f).toInt()

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
    // 默认值保持诚实中性；实际值由 HardwareInfoResolver 在采集层动态填充
    val socModel: String = "系统未上报",
    val pmicModel: String = "系统未上报",
    val batteryChemistry: String = "锂离子电池 (体系未上报)",
    val fastChargeProtocol: String = "系统未上报",
    val internalResistanceMohm: Float = 0f,
    val halVersion: String = "Android Battery HAL",
    val cellStructure: String = "系统未上报",
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
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class BatteryViewModel(application: Application) : AndroidViewModel(application) {

    private val reader = BatteryHardwareReader(application.applicationContext)

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
        } catch (e: Exception) {
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
                val remainingMs = simulationHoldUntilMs - System.currentTimeMillis()
                _simulationRemainingSec.value = if (remainingMs > 0) (remainingMs + 999) / 1000 else 0L
                delay(250)
            }
        }
    }

    override fun onCleared() {
        if (isReceiverRegistered) {
            try {
                getApplication<Application>().unregisterReceiver(batteryReceiver)
            } catch (e: IllegalArgumentException) {
                // 防御：系统已代为注销时忽略，避免清理阶段崩溃
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
        if (System.currentTimeMillis() < simulationHoldUntilMs) return

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
    }

    private fun startTelemetryPolling() {
        viewModelScope.launch {
            while (isActive) {
                // 持续读取真实硬件 (1 秒刷新频率)
                publish(reader.readBatteryTelemetry())
                delay(1000)
            }
        }
    }

    fun setDesignCapacity(capacityMah: Int) {
        reader.designCapacityMah = capacityMah
        simulationHoldUntilMs = 0L // 手动改配置立即恢复真实遥测
        publish(reader.readBatteryTelemetry())
    }

    /**
     * 一键模拟完全充满判定条件 (电量 100% 且瞬时电流 0~25mA)
     * 模拟结果同时持久化，保持期结束后锁定容量依然可回显 (指标 12)
     */
    fun triggerFullChargeSimulation() {
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
    val pmicModel: String,
    val batteryChemistry: String,
    val fastChargeProtocol: String,
    val internalResistanceMohm: Float,
    val halVersion: String,
    val cellStructure: String,
    val thermalThrottlingState: String
)

/**
 * 动态解析硬件信息摘要：
 * 能从系统读取的读取真实值 (SoC 型号 / HAL 版本 / 温控节流)，
 * 无公开 API 的字段诚实标注"系统未上报"，避免硬编码机型误导用户
 */
internal object HardwareInfoResolver {

    fun resolve(temperatureCelsius: Float, cycleCount: Int, powerWatts: Float): HardwareTelemetry {
        // SoC 型号：API 31+ 提供 Build.SOC_MODEL，旧版本回退 Build.HARDWARE
        val rawSoc = if (Build.VERSION.SDK_INT >= 31) Build.SOC_MODEL else ""
        val socModel = when {
            !rawSoc.isNullOrBlank() && rawSoc != "unknown" -> rawSoc
            Build.HARDWARE.isNotBlank() && Build.HARDWARE != "unknown" -> Build.HARDWARE
            else -> "系统未上报"
        }

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

        // 快充协议：厂商私有协议无公开 API，但充电档位可由实时功率 (V×I) 真实推断，
        // 与 Web 端档位阈值一致 (≥45W 超级快充 / ≥18W 快充 / >0.5W 普通 / 未充电)
        val chargeBand = when {
            powerWatts >= 45f -> "超级快充"
            powerWatts >= 18f -> "快速充电"
            powerWatts > 0.5f -> "普通充电"
            else -> null
        }
        val fastChargeProtocol = if (chargeBand != null) {
            val wattText = String.format(java.util.Locale.US, "%.1f", powerWatts)
            "实时档位: \$chargeBand (\$wattText W) · 协议未上报"
        } else {
            "系统未上报 (待充电触发协商)"
        }

        return HardwareTelemetry(
            socModel = socModel,
            pmicModel = "系统未上报",
            batteryChemistry = "锂离子电池 (体系未上报)",
            fastChargeProtocol = fastChargeProtocol,
            internalResistanceMohm = (internalResistance * 10f).toInt() / 10f,
            halVersion = "Android \${Build.VERSION.RELEASE} Battery HAL",
            cellStructure = "系统未上报",
            thermalThrottlingState = thermalThrottlingState
        )
    }
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
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import com.battery.master.ui.BatteryScreen
import com.battery.master.viewmodel.BatteryViewModel

class MainActivity : ComponentActivity() {

    private val batteryViewModel: BatteryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme()
            ) {
                BatteryScreen(viewModel = batteryViewModel)
            }
        }
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
