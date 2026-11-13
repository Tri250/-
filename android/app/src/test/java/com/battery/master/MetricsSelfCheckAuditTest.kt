package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryState
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeVerdict
import com.battery.master.service.BatterySysfs
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.ui.BatteryScreen
import com.battery.master.ui.CyberHeroBatteryCard
import com.battery.master.ui.FullChargeConditionCard
import com.battery.master.ui.TelemetrySourceCard
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import java.io.File
import java.nio.file.Files

/**
 * v2.0.0-alpha.5：12 项充放电核心指标逐项深度自检回归测试 (Robolectric + Compose Test)
 *
 * 本轮自检发现并修复的缺陷 (每项缺陷对应本文件一个测试组)：
 *
 * 缺陷 A (指标 11/12)：BatteryManager 属性与 sysfs current_now 同源同值 (ratio≈1) 时
 *   一律 /1000——mAh 上报内核的 1150 mA 充电被系统性低报为 1 mA，且连带污染指标 12
 *   充满判定 (100% 时 1150 mA 落入 0~25 mA 浮充区间被误判"已充满")。
 *   修复：按电量计容量上报单位惯例裁决 (charge_full mAh 内核 → current_now 亦 mA)。
 *
 * 缺陷 B (指标 02)：容量不可测但库仑计可读时，真实剩余电荷实测值被 UI 统一隐藏 "—"，
 *   且 Hero 行无条件渲染 "X / 0 mAh" 矛盾读数。
 *   修复：指标 02 卡与 Hero 行三分支口径完全一致——实测显示实测、空态显示空态。
 *
 * 缺陷 C (遥测链路卡)：sysfs 实测优先时"满容量回归"标注"未启用 (无有效库仑计样本)"
 *   失实——回归通道仍在持续积累样本作备用。
 *
 * 缺陷 F (指标 12 卡标题)："(估算)" 与实测锁定口径不符——锁定守卫 (容量 ≤0 拒绝锁定)
 * 已保证真实锁定值仅来自 sysfs/库仑计回归实测容量。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w1200dp-h3000dp")
class MetricsSelfCheckAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @get:Rule
    val composeRule = createComposeRule()

    private fun batteryManager(): BatteryManager =
        app.getSystemService(Context.BATTERY_SERVICE) as BatteryManager

    private fun batteryIntent(block: Intent.() -> Unit): Intent =
        Intent(Intent.ACTION_BATTERY_CHANGED).apply(block)

    // ==================== 缺陷 A：指标 11 瞬时电流 (mA 上报内核) ====================

    @Test
    fun currentNormalization_milliAmpStyleGauge_notDividedByThousand() {
        // mAh 上报内核探针：charge_full=4800 (mAh 惯例) + current_now=1150，
        // BatteryManager 属性与 sysfs 同源同值 (ratio==1)——μA/mA 量纲歧义分支
        val bms = File(Files.createTempDirectory("ms_probe").toFile().absolutePath, "bms")
            .apply { mkdirs() }
        File(bms, "charge_full").writeText("4800\n")
        File(bms, "current_now").writeText("1150\n")
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
        try {
            // 旧实现：ratio==1 → /1000 → 1 mA (1150 mA 充电被低报 1000 倍)
            assertEquals(1150, BatterySysfs.normalizeCurrentToMilliAmps(1150, true))
            // 放电态符号归一 (充电为正、放电为负) 不受量纲修复影响
            assertEquals(-1150, BatterySysfs.normalizeCurrentToMilliAmps(1150, false))
        } finally {
            BatterySysfs.installProbeResultForTest(emptyList())
            bms.deleteRecursively()
        }
    }

    @Test
    fun currentNormalization_microAmpStyleGauge_stillDividedByThousand() {
        // 对照组：规范 μAh 内核 (charge_full=4800000)，raw=1150 即 1.15 mA 涓流，
        // 必须照常 /1000——修复不得破坏规范内核的正确折算
        val bms = File(Files.createTempDirectory("ms_probe").toFile().absolutePath, "bms")
            .apply { mkdirs() }
        File(bms, "charge_full").writeText("4800000\n")
        File(bms, "current_now").writeText("1150\n")
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
        try {
            assertEquals(1, BatterySysfs.normalizeCurrentToMilliAmps(1150, null))
        } finally {
            BatterySysfs.installProbeResultForTest(emptyList())
            bms.deleteRecursively()
        }
    }

    @Test
    fun currentNormalization_milliStyleGaugeWithoutSysfsCurrent_keepsRaw() {
        // mAh 上报内核但 current_now 节点不可读：同样按容量单位惯例裁决，
        // 旧实现无 sysfs 参照时一律 /1000 (同类低报通路)
        val bms = File(Files.createTempDirectory("ms_probe").toFile().absolutePath, "bms")
            .apply { mkdirs() }
        File(bms, "charge_full").writeText("4800\n")
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
        try {
            assertEquals(1150, BatterySysfs.normalizeCurrentToMilliAmps(1150, true))
        } finally {
            BatterySysfs.installProbeResultForTest(emptyList())
            bms.deleteRecursively()
        }
    }

    @Test
    fun parser_fullChargeVerdict_notPrematureOnMilliStyleGauge() {
        // 集成链路 (指标 12 连带污染验证)：mAh 上报内核 100% 充电中实际 1150 mA——
        // 旧实现 currentMa 被低报为 1 mA → 落入 0~25 mA 浮充区间 → 误判 FULLY_CHARGED
        // 并把估算值锁定写盘。修复后 currentMa=1150 → 判定 NOT_YET
        val bms = File(Files.createTempDirectory("ms_probe").toFile().absolutePath, "bms")
            .apply { mkdirs() }
        File(bms, "charge_full").writeText("4800\n")
        File(bms, "current_now").writeText("1150\n")
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
        try {
            Shadows.shadowOf(batteryManager())
                .setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, 1150)
            val raw = BatteryTelemetryParser.parse(
                batteryIntent {
                    putExtra(BatteryManager.EXTRA_LEVEL, 100)
                    putExtra(BatteryManager.EXTRA_SCALE, 100)
                    putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
                },
                batteryManager(), 5000
            )
            assertEquals(1150, raw.currentMa)
            assertEquals(FullChargeVerdict.NOT_YET, raw.fullChargeVerdict)
            assertFalse(raw.isFullChargeConditionMet)
        } finally {
            BatterySysfs.installProbeResultForTest(emptyList())
            bms.deleteRecursively()
        }
    }

    // ==================== 缺陷 B：指标 02 剩余电量 (库仑计实测诚实显示) ====================

    @Test
    fun remainingCapacity_coulombReadingPreservedWhenCapacityUnmeasured() {
        // 容量不可测 (无电量计节点) 但 CHARGE_COUNTER 可读：剩余电荷仍是系统库仑计
        // 真实测量，解析层保留实测值与 COULOMB_COUNTER 口径标注——UI (指标 02 卡 +
        // Hero 行) 据此显示实测值而非 "—"
        BatterySysfs.installProbeResultForTest(emptyList())
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, 2_400_000)
        val raw = BatteryTelemetryParser.parse(
            batteryIntent {
                putExtra(BatteryManager.EXTRA_LEVEL, 52)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
            },
            batteryManager(), 5000
        )
        assertFalse(raw.hasMeasuredCapacity)
        assertEquals(0, raw.currentCapacityMah)
        assertEquals(2400, raw.remainingCapacityMah)
        assertEquals(CapacitySource.COULOMB_COUNTER, raw.remainingCapacitySource)
    }

    @Test
    fun remainingCapacity_clampedWhenCapacityMeasured() {
        // 容量实测时不变式保留：剩余 ≤ 当前容量 (库仑计读数抖动钳制)
        val bms = File(Files.createTempDirectory("ms_probe").toFile().absolutePath, "bms")
            .apply { mkdirs() }
        File(bms, "charge_full").writeText("4890000\n")
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
        try {
            Shadows.shadowOf(batteryManager())
                .setIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, 6_000_000)
            val raw = BatteryTelemetryParser.parse(
                batteryIntent {
                    putExtra(BatteryManager.EXTRA_LEVEL, 100)
                    putExtra(BatteryManager.EXTRA_SCALE, 100)
                },
                batteryManager(), 5000
            )
            assertTrue(raw.hasMeasuredCapacity)
            assertEquals(4890, raw.currentCapacityMah)
            // 6000 mAh 库仑计读数超容量 → 钳制到 4890
            assertEquals(4890, raw.remainingCapacityMah)
            assertEquals(CapacitySource.COULOMB_COUNTER, raw.remainingCapacitySource)
        } finally {
            BatterySysfs.installProbeResultForTest(emptyList())
            bms.deleteRecursively()
        }
    }

    // ==================== 缺陷 B (UI)：Hero 与指标 02 卡三分支口径一致 ====================

    private fun mountRealScreenWithCoulombOnlyState(): BatteryViewModel {
        // 真实链路组装：无电量计节点 + 库仑计可读 → VM 状态即容量不可测/剩余实测
        BatterySysfs.installProbeResultForTest(emptyList())
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, 2_400_000)
        return BatteryViewModel(app)
    }

    @Test
    fun screen_coulombMeasuredCapacityUnmeasured_coherentDisplay() {
        val vm = mountRealScreenWithCoulombOnlyState()
        composeRule.setContent { BatteryScreen(viewModel = vm) }
        composeRule.waitForIdle()

        val state = vm.batteryState.value
        assertFalse(state.hasMeasuredCapacity)
        assertEquals(CapacitySource.COULOMB_COUNTER, state.remainingCapacitySource)

        // Hero 行：库仑计实测分支 (旧实现渲染 "2400 / 0 mAh" 矛盾读数)
        composeRule.onNodeWithText("剩余电量: 2400 mAh · 库仑计实测", substring = true)
            .assertExists()
        // 指标 02 卡：实测值 + 库仑计口径标注 (旧实现显示 "—" 丢弃实测值)
        composeRule.onNodeWithText("库仑计实测剩余电荷 [容量未实测]", substring = true)
            .assertExists()
        // 旧实现的矛盾读数必须消失
        composeRule.onNodeWithText("/ 0 mAh", substring = true).assertDoesNotExist()
    }

    @Test
    fun screen_capacityUnmeasuredNoCoulomb_coherentEmptyState() {
        // 全空态 (无电量计 + 无库仑计)：Hero 与指标 02 卡一致显示诚实空态
        BatterySysfs.installProbeResultForTest(emptyList())
        val vm = BatteryViewModel(app)
        composeRule.setContent { BatteryScreen(viewModel = vm) }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("剩余电量: — (容量未实测)").assertExists()
        composeRule.onNodeWithText("无法测算 [容量未实测]").assertExists()
        composeRule.onNodeWithText("/ 0 mAh", substring = true).assertDoesNotExist()
    }

    @Test
    fun hero_measuredCapacity_fractionDisplay() {
        // 容量实测：保持 "X / Y mAh" 分式口径 (回归保护)
        val state = BatteryState(
            currentCapacityMah = 4780,
            hasMeasuredCapacity = true,
            remainingCapacityMah = 3800,
            remainingCapacitySource = CapacitySource.COULOMB_COUNTER
        )
        composeRule.setContent { CyberHeroBatteryCard(state) }
        composeRule.waitForIdle()
        composeRule.onNodeWithText("剩余电量: 3800 / 4780 mAh").assertExists()
    }

    // ==================== 缺陷 C：采集链路卡满容量回归标注 ====================

    @Test
    fun telemetrySourceCard_regressionRow_backupWhenSysfsPreferred() {
        // sysfs 实测优先：回归通道仍在积累样本作备用，不得标注"未启用"
        val state = BatteryState(
            hasMeasuredCapacity = true,
            currentCapacitySource = CapacitySource.SYSFS,
            capacityRegressionInfo = ""
        )
        composeRule.setContent { TelemetrySourceCard(state) }
        composeRule.waitForIdle()
        composeRule.onNodeWithText("备用通道 (sysfs 实测优先)").assertExists()
        composeRule.onNodeWithText("未启用 (无有效库仑计样本)").assertDoesNotExist()
    }

    @Test
    fun telemetrySourceCard_regressionRow_unenabledWhenNoSamples() {
        // 容量不可测 + 回归统计为空：诚实标注未启用
        val state = BatteryState(hasMeasuredCapacity = false)
        composeRule.setContent { TelemetrySourceCard(state) }
        composeRule.waitForIdle()
        composeRule.onNodeWithText("未启用 (无有效库仑计样本)").assertExists()
    }

    @Test
    fun telemetrySourceCard_regressionRow_showsInfoLabelWhenActive() {
        // 回归通道激活：信息标注原样透传
        val state = BatteryState(
            hasMeasuredCapacity = true,
            currentCapacitySource = CapacitySource.COULOMB_REGRESSION,
            capacityRegressionInfo = "n=14 · 中置信"
        )
        composeRule.setContent { TelemetrySourceCard(state) }
        composeRule.waitForIdle()
        composeRule.onNodeWithText("n=14 · 中置信").assertExists()
    }

    // ==================== 缺陷 F：指标 12 判定卡标题实测口径 ====================

    @Test
    fun fullChargeCard_titleMeasuredCaliber() {
        val state = BatteryState(
            fullChargeCapacityMah = 4890,
            lastFullChargeTimestamp = 1L,
            fullChargeVerdict = FullChargeVerdict.NOT_YET
        )
        composeRule.setContent {
            FullChargeConditionCard(
                state,
                simulationRemainingSec = 0L,
                onTriggerTest = {},
                onClearRecords = {}
            )
        }
        composeRule.waitForIdle()
        composeRule.onNodeWithText("12. 完全充满时的容量 (实测)").assertExists()
        // 旧"(估算)"口径必须消失
        composeRule.onNodeWithText("(估算)", substring = true).assertDoesNotExist()
    }
}
