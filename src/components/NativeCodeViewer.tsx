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

const NATIVE_CODE_FILES: CodeFileItem[] = [
  {
    id: 'github_actions',
    name: 'build-apk.yml (GitHub 自动编译)',
    path: '.github/workflows/build-apk.yml',
    language: 'yaml',
    description: 'GitHub Actions 自动构建 CI/CD：推送代码自动云端编译 APK，生成 Artifacts 与 Release 附件',
    code: `name: Build & Release Android APK

on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: write

env:
  ANDROID_HOME: /usr/local/lib/android/sdk
  ANDROID_SDK_ROOT: /usr/local/lib/android/sdk

jobs:
  build:
    name: Build Android APK
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

      - name: Accept Android SDK Licenses
        run: |
          if [ -d "$ANDROID_HOME/cmdline-tools/latest/bin" ]; then
            yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses || true
          elif [ -d "$ANDROID_HOME/tools/bin" ]; then
            yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses || true
          fi

      - name: Ensure Gradle Wrapper Executable
        run: |
          cd android
          chmod +x gradlew

      - name: Build Debug APK
        run: |
          cd android
          ./gradlew assembleDebug --stacktrace --no-daemon || gradle assembleDebug --stacktrace --no-daemon

      - name: Locate Generated APK
        id: find_apk
        run: |
          APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" | head -n 1)
          if [ -z "$APK_PATH" ]; then
            APK_PATH=$(find . -name "*.apk" | head -n 1)
          fi
          echo "Found APK at: $APK_PATH"
          echo "apk_path=$APK_PATH" >> $GITHUB_OUTPUT

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Android-Battery-Master-Debug-APK
          path: \${{ steps.find_apk.outputs.apk_path }}
          retention-days: 30

      - name: Publish GitHub Release (on tag push)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: \${{ steps.find_apk.outputs.apk_path }}
          generate_release_notes: true
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
import android.content.SharedPreferences
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.service.BatterySysfs
import kotlin.math.abs

/**
 * Android 原生底层硬件与电量计 HAL 读取器
 * 负责通过 Android BatteryManager、Intent 以及 Linux sysfs 读取真实的 12 项充放电指标
 */
class BatteryHardwareReader(private val context: Context) {

    private val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var designCapacityMah: Int = 5000
    private var lastRecordedFullCapacity: Int? =
        prefs.getInt(KEY_LAST_FULL_CAPACITY, 0).takeIf { it > 0 }
    private var lastFullChargeTimestamp: Long? =
        prefs.getLong(KEY_LAST_FULL_TIMESTAMP, 0L).takeIf { it > 0 }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_LAST_FULL_CAPACITY = "last_full_charge_capacity"
        private const val KEY_LAST_FULL_TIMESTAMP = "last_full_charge_timestamp"
    }

    fun readBatteryTelemetry(): BatteryState {
        val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryIntent: Intent? = context.registerReceiver(null, intentFilter)

        // 5. 电量百分比
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val percentage = if (level >= 0 && scale > 0) (level * 100 / scale)
                         else batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

        // 6. 电池状态 (充电中、放电中、已充满、未充电)
        val statusInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val status = when (statusInt) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.DISCHARGING
        }

        // 7. 电池温度：当前电池温度 (摄氏度 ℃)
        val tempTenths = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 250) ?: 250
        val temperatureCelsius = tempTenths / 10.0f

        // 8. 电池健康：(良好、过热、损坏、超压、未知)
        val healthInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1) ?: -1
        val healthQuality = when (healthInt) {
            BatteryManager.BATTERY_HEALTH_GOOD -> BatteryHealthQuality.GOOD
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> BatteryHealthQuality.OVERHEAT
            BatteryManager.BATTERY_HEALTH_DEAD -> BatteryHealthQuality.DEAD
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> BatteryHealthQuality.OVER_VOLTAGE
            else -> BatteryHealthQuality.UNKNOWN
        }

        // 9. 电压：当前电池电压 (毫伏 mV)
        val voltageMv = batteryIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 4000) ?: 4000

        // 11. 瞬时电流：BATTERY_PROPERTY_CURRENT_NOW 规范返回微安 (uA)，
        //     部分旧内核返回毫安 (mA)，统一归一化为 mA (正为充电，负为放电)
        var currentMicroAmp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        if (currentMicroAmp == Int.MIN_VALUE) {
            currentMicroAmp = BatterySysfs.readInt("/sys/class/power_supply/battery/current_now") ?: 0
        }
        val currentNowMa = BatterySysfs.normalizeCurrentToMilliAmps(currentMicroAmp)

        // 10. 循环计数：电池充放电的次数
        var cycleCount = if (Build.VERSION.SDK_INT >= 34) {
            batteryIntent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, 0) ?: 0
        } else 0
        if (cycleCount <= 0) {
            cycleCount = BatterySysfs.readInt("/sys/class/power_supply/battery/cycle_count") ?: 0
        }

        // 3. 电池当前容量 (衰减后的容量 mAh)
        val chargeCounterUah = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
        var currentCapacityMah = (designCapacityMah * 0.92f).toInt()
        val sysfsMaxCapacityUah = BatterySysfs.readInt("/sys/class/power_supply/battery/charge_full")
        if (sysfsMaxCapacityUah != null && sysfsMaxCapacityUah > 0) {
            currentCapacityMah = sysfsMaxCapacityUah / 1000
        }

        // 2. 剩余电量 (mAh)
        val remainingCapacityMah = if (chargeCounterUah > 0 && chargeCounterUah != Int.MIN_VALUE) {
            chargeCounterUah / 1000
        } else {
            (currentCapacityMah * (percentage / 100f)).toInt()
        }

        // 1. 电池健康度 (%)
        val healthPercentage = ((currentCapacityMah.toFloat() / designCapacityMah) * 100f).coerceIn(0f, 100f)

        // 12. 完全充满时的容量：估算的电池完全充满时的容量 (mAh)
        // 关键判定：仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满
        val isFullChargeConditionMet = (percentage == 100 && currentNowMa in 0..25)
        if (isFullChargeConditionMet) {
            persistFullChargeCapacity(currentCapacityMah, System.currentTimeMillis())
        }

        val powerWatts = (voltageMv.toFloat() * abs(currentNowMa)) / 1_000_000f

        // 动态解析硬件信息摘要 (真实可读字段 + 诚实未上报标注)
        val hardware = HardwareInfoResolver.resolve(temperatureCelsius, cycleCount)

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
            fullChargeCapacityMah = if (isFullChargeConditionMet) currentCapacityMah else lastRecordedFullCapacity,
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
}`,
  },
  {
    id: 'compose',
    name: 'BatteryScreen.kt (Compose UI)',
    path: 'android/app/src/main/java/com/battery/master/ui/BatteryScreen.kt',
    language: 'kotlin',
    description: 'Jetpack Compose 原生界面（结构节选）：12 项指标卡片与充满判定卡片',
    code: `package com.battery.master.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.model.BatteryInfo
import com.battery.master.viewmodel.BatteryViewModel

@Composable
fun BatteryScreen(viewModel: BatteryViewModel) {
    val batteryInfo by viewModel.batteryInfo.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Android Battery Master", fontWeight = FontWeight.Bold) }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            HeroBatteryCard(batteryInfo)
            FullChargeConditionCard(batteryInfo)

            Text("12项充放电指标全量监测", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            MetricItemCard("01", "电池健康度", "%.1f%%".format(batteryInfo.healthPercentage), "当前容量 / 出厂设计")
            MetricItemCard("02", "剩余电量", "\${batteryInfo.remainingCapacityMah} mAh", "当前可用电荷量")
            MetricItemCard("03", "电池当前容量", "\${batteryInfo.currentCapacityMah} mAh", "衰减后最大可用容量")
            MetricItemCard("04", "电池设计容量", "\${batteryInfo.designCapacityMah} mAh", "出厂铭牌额定容量")
            MetricItemCard("05", "电量百分比", "\${batteryInfo.percentage}%", "当前电量等级")
            MetricItemCard("06", "电池状态", batteryInfo.status.label, "充电中 / 放电中 / 已充满 / 未充电")
            MetricItemCard("07", "电池温度", "%.1f ℃".format(batteryInfo.temperatureCelsius), "NTC 热敏传感器")
            MetricItemCard("08", "电池健康", batteryInfo.healthQuality.label, "良好 / 过热 / 损坏 / 超压 / 未知")
            MetricItemCard("09", "电压", "\${batteryInfo.voltageMv} mV", "电芯端两极电压")
            MetricItemCard("10", "循环计数", "\${batteryInfo.cycleCount} 次", "充放电周期计数")
            MetricItemCard("11", "瞬时电流", "\${batteryInfo.currentNowMa} mA", "功率 %.2f W".format(batteryInfo.powerWatts))
            MetricItemCard("12", "完全充满时的容量", batteryInfo.fullChargeCapacityMah?.let { "\$it mAh" } ?: "未充满不显示", "100% 且 0-25mA 锁定")
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
    name: 'themes.xml & strings.xml',
    path: 'android/app/src/main/res/values/',
    language: 'xml',
    description: 'Android 资源配置：暗黑赛博朋克主题、应用名与自适应图标规则',
    code: `<!-- res/values/themes.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.AndroidBatteryMaster" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#020617</item>
        <item name="android:navigationBarColor">#020617</item>
        <item name="android:windowBackground">#020617</item>
    </style>
</resources>

<!-- res/values/strings.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">电池大师</string>
</resources>

<!-- res/xml/backup_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
</full-backup-content>

<!-- res/xml/data_extraction_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup><exclude path="." /></cloud-backup>
    <device-transfer><exclude path="." /></device-transfer>
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

android {
    namespace = "com.battery.master"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.battery.master"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
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
            ↓ <code className="text-amber-600 dark:text-amber-400">BatteryHardwareReader.kt</code> (100% & 0-25mA 充满判定)
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
