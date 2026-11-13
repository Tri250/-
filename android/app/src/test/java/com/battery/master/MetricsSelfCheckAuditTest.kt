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
import com.battery.master.service.BatteryHardwareReader
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

    // ==================== v2.0.0-alpha.6：指标 01 健康度真实显示 (三通道) ====================

    private fun installGaugeProbe(nodes: Map<String, String>): File {
        val dir = File(Files.createTempDirectory("gauge_probe").toFile(), "battery").apply { mkdirs() }
        nodes.forEach { (k, v) -> File(dir, k).writeText(v) }
        BatterySysfs.installProbeResultForTest(listOf(dir.absolutePath))
        return dir
    }

    private fun cleanupProbe(dir: File) {
        BatterySysfs.installProbeResultForTest(emptyList())
        dir.deleteRecursively()
    }

    private fun newReader(): BatteryHardwareReader {
        BatterySysfs.installProbeResultForTest(emptyList())
        val reader = BatteryHardwareReader(app)
        reader.resetCapacityRegressionForTest()
        return reader
    }

    private fun sendBatterySticky(level: Int, chargeCounterUah: Int) {
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, chargeCounterUah)
        app.sendStickyBroadcast(
            batteryIntent {
                putExtra(BatteryManager.EXTRA_LEVEL, level)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
            }
        )
    }

    // ===== 通道一：sysfs energy_full 探测扩展 (energy-only 机型) =====

    @Test
    fun sysfs_energyFullFallback_convertedToMah() {
        // energy-only 机型：charge_full 缺席，energy_full=18_480_000 μWh
        // @ voltage_now=3_850_000 μV → 18480000/3850 = 4800 mAh
        val dir = installGaugeProbe(mapOf("energy_full" to "18480000", "voltage_now" to "3850000"))
        try {
            assertEquals(4800, BatterySysfs.readChargeFull())
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun sysfs_energyFullDesignFallback_convertedToMah() {
        // 设计容量同款折算：energy_full_design=19_250_000 μWh → 5000 mAh
        val dir = installGaugeProbe(mapOf("energy_full_design" to "19250000", "voltage_now" to "3850000"))
        try {
            assertEquals(5000, BatterySysfs.readChargeFullDesign())
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun sysfs_chargeFullPriority_overEnergyFull() {
        // 规范节点在场时优先 (μAh 直接读数零折算误差，energy 折算仅兜底)
        val dir = installGaugeProbe(
            mapOf(
                "charge_full" to "4890000", "energy_full" to "18480000",
                "voltage_now" to "3850000"
            )
        )
        try {
            assertEquals(4890, BatterySysfs.readChargeFull())
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun sysfs_energyFull_voltageClampedToNominalWindow() {
        // 满充电压 4.4V 超出标称窗口 [3400, 4000] → 钳制 4000 → 18480000/4000 = 4620，
        // 防满充/关机电压极值引入 ~10% 折算失真
        val dir = installGaugeProbe(mapOf("energy_full" to "18480000", "voltage_now" to "4400000"))
        try {
            assertEquals(4620, BatterySysfs.readChargeFull())
        } finally {
            cleanupProbe(dir)
        }
    }

    // ===== 通道二：库仑计单点瞬时估算 (回归收敛前的立即显示) =====

    @Test
    fun reader_instantCoulombEstimate_fusedWhenSysfsMissing() {
        // 无 sysfs + CHARGE_COUNTER 实测 2400 mAh @52% → F=4615 mAh → 健康度 92.3%
        // 旧实现：回归未收敛 (需覆盖 30%) → 永远"无法测算"
        sendBatterySticky(52, 2_400_000)
        val reader = newReader()
        // 固定设计容量：避开 Robolectric ShadowPowerProfile 环境差异 (与回归集成测试同款)
        reader.designCapacityMah = 5000
        val state = reader.readBatteryTelemetry()
        assertTrue(state.hasMeasuredCapacity)
        assertEquals(CapacitySource.INSTANT_COULOMB, state.currentCapacitySource)
        assertEquals(4615, state.currentCapacityMah)
        assertEquals(92.3f, state.healthPercentage, 0.01f)
        // 剩余电量保留库仑计实测读数 (F×p/100 ≡ c/1000 恒等)
        assertEquals(2400, state.remainingCapacityMah)
        assertEquals(CapacitySource.COULOMB_COUNTER, state.remainingCapacitySource)
    }

    @Test
    fun reader_instantEstimate_belowThreshold_honestUnmeasured() {
        // p=15 < 20 门限 (±1% 电量格舍入误差 >5%) → 不估，诚实"无法测算"
        sendBatterySticky(15, 2_400_000)
        val state = newReader().readBatteryTelemetry()
        assertFalse(state.hasMeasuredCapacity)
        assertEquals(CapacitySource.UNAVAILABLE, state.currentCapacitySource)
        assertEquals(0, state.currentCapacityMah)
    }

    @Test
    fun reader_instantEstimate_outOfPlausibleRange_notEstimated() {
        // 500 mAh 剩余 @40% → F=1250 mAh 越出物理区间 [1500, 15000] → 读数毛刺不估
        sendBatterySticky(40, 500_000)
        val state = newReader().readBatteryTelemetry()
        assertFalse(state.hasMeasuredCapacity)
        assertEquals(CapacitySource.UNAVAILABLE, state.currentCapacitySource)
    }

    @Test
    fun reader_instantEstimate_atFullPercentage_exactReading() {
        // 100% 时库仑计读数即满充电荷 → F=4800 精确 (4800/5000 → 96.0%)
        sendBatterySticky(100, 4_800_000)
        val reader = newReader()
        reader.designCapacityMah = 5000
        val state = reader.readBatteryTelemetry()
        assertTrue(state.hasMeasuredCapacity)
        assertEquals(4800, state.currentCapacityMah)
        assertEquals(96.0f, state.healthPercentage, 0.01f)
    }

    @Test
    fun reader_regressionSamplingProgress_reportedWhilePending() {
        // 采样中：p 15→16 且电荷同步上升 → 提交 1 个有效样本 (n=1 积累中)，
        // p=16 仍低于单点门限 → 诚实未测算但显示采样进度
        val reader = newReader()
        sendBatterySticky(15, 2_300_000)
        reader.readBatteryTelemetry()
        sendBatterySticky(16, 2_345_000)
        val state = reader.readBatteryTelemetry()
        assertFalse(state.hasMeasuredCapacity)
        assertEquals("n=1 · 积累中", state.capacityRegressionInfo)
    }

    // ===== 通道三 (UI)：单点估算健康度端到端真实显示 =====

    @Test
    fun screen_instantEstimate_healthDisplaysEndToEnd() {
        // 真实链路组装：无 sysfs 探测链 + 库仑计实测 2400 mAh @52%
        // → 01 健康度卡立即显示 92.3% (旧实现显示 "— 无法测算")
        BatterySysfs.installProbeResultForTest(emptyList())
        sendBatterySticky(52, 2_400_000)
        val vm = BatteryViewModel(app)
        // 固定设计容量 (用户校准通道)：避开 Robolectric ShadowPowerProfile 环境差异，
        // setDesignCapacity 立即重读发布 → 健康度 = 4615/5000 = 92.3%
        vm.setDesignCapacity(5000)
        composeRule.setContent { BatteryScreen(viewModel = vm) }
        composeRule.waitForIdle()

        val state = vm.batteryState.value
        assertTrue(state.hasMeasuredCapacity)
        assertEquals(CapacitySource.INSTANT_COULOMB, state.currentCapacitySource)

        // 01 健康度卡：数值 + 单点估算来源诚实标注
        composeRule.onNodeWithText("92.3%").assertExists()
        composeRule.onNodeWithText("实测健康度 [库仑计单点估算]").assertExists()
        // Hero 分式口径回归保护 (F×p/100 ≡ c/1000，无 "X / 0 mAh" 矛盾读数)
        composeRule.onNodeWithText("剩余电量: 2400 / 4615 mAh").assertExists()
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

    // ==================== v2.0.0-alpha.7：指标 09 电芯电压 (双通道 + 诚实口径) ====================
    //
    // 本轮自检发现并修复的缺陷：
    // 缺陷 V1：EXTRA_VOLTAGE 单通道——部分 ROM 广播缺电压 Extra 但 sysfs voltage_now
    //   节点完好，旧实现使这类设备电压恒显默认 4000 mV。
    //   修复：EXTRA_VOLTAGE (广播实测) → sysfs voltage_now (内核实测) 双通道回退。
    // 缺陷 V2：双通道均不可得时 4000 mV 中性默认值被伪装成真实读数展示。
    //   修复：voltageMeasured 标志全链路透传，UI 显示 "—" 并标注"双通道不可读"。
    // 缺陷 V3：默认 4000 mV × 真实电流 = 虚构功率，污染 Hero 功率展示与
    //   HardwareInfoResolver 快充档位推断。
    //   修复：电压未实测时 powerWatts 置 null (UI "— W"、档位不触发)。
    // 缺陷 V4：09 卡无电压状态分级 (低电压/正常/满充/异常/多电芯)。
    //   修复：voltageStateLabel 单源分级，09 卡与 Hero 统一消费。

    @Test
    fun sysfs_voltageNow_rawChannelNotClamped() {
        // 原始通道语义：4400 mV (满充极值) 不得被 energy 折算的标称窗口 [3400,4000] 钳制——
        // 旧实现 readVoltageNowMilliVolts 私有且带 coerceIn，遥测无法复用
        val dir = installGaugeProbe(mapOf("voltage_now" to "4400000"))
        try {
            assertEquals(4400, BatterySysfs.readVoltageNowMilliVolts())
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun sysfs_voltageNow_dirtyData_returnsNull() {
        // 0 / 负值 (传感器故障) → null，由解析层兜底判定未实测
        val dir = installGaugeProbe(mapOf("voltage_now" to "-1200000"))
        try {
            assertEquals(null, BatterySysfs.readVoltageNowMilliVolts())
            File(dir, "voltage_now").writeText("0\n")
            assertEquals(null, BatterySysfs.readVoltageNowMilliVolts())
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun parser_voltage_extraChannel_measured() {
        // 广播通道命中：EXTRA_VOLTAGE=4150 → 实测透传
        val raw = BatteryTelemetryParser.parse(
            batteryIntent { putExtra(BatteryManager.EXTRA_VOLTAGE, 4150) },
            batteryManager(), 5000
        )
        assertEquals(4150, raw.voltageMv)
        assertTrue(raw.voltageMeasured)
        val state = raw.toBatteryState(null, null)
        assertTrue(state.voltageMeasured)
    }

    @Test
    fun parser_voltage_sysfsFallbackChannel_measured() {
        // 广播缺 EXTRA_VOLTAGE + sysfs voltage_now=4123456 μV → 4123 mV 内核实测
        // (V1 修复：旧实现单通道恒显默认 4000)
        val dir = installGaugeProbe(mapOf("voltage_now" to "4123456"))
        try {
            val raw = BatteryTelemetryParser.parse(batteryIntent {}, batteryManager(), 5000)
            assertEquals(4123, raw.voltageMv)
            assertTrue(raw.voltageMeasured)
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun parser_voltage_dualChannelUnavailable_honestUnmeasured() {
        // 双通道均不可得：值收敛中性默认 4000 但 voltageMeasured=false (V2 修复)
        BatterySysfs.installProbeResultForTest(emptyList())
        val raw = BatteryTelemetryParser.parse(batteryIntent {}, batteryManager(), 5000)
        assertEquals(4000, raw.voltageMv)
        assertFalse(raw.voltageMeasured)
        val state = raw.toBatteryState(null, null)
        assertFalse(state.voltageMeasured)
    }

    @Test
    fun parser_power_gatedByVoltageMeasurement() {
        // V3 修复：电压未实测时真实电流 (1150 mA) 不得与默认 4000 mV 相乘——
        // 旧实现虚构 4.6 W 功率 (污染 Hero 展示与快充档位推断)
        BatterySysfs.installProbeResultForTest(emptyList())
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, 1_150_000)
        val unmeasured = BatteryTelemetryParser.parse(
            batteryIntent {
                putExtra(BatteryManager.EXTRA_LEVEL, 58)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
                putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            },
            batteryManager(), 5000
        )
        assertEquals(1150, unmeasured.currentMa)
        assertFalse(unmeasured.voltageMeasured)
        assertEquals(null, unmeasured.powerWatts)
        assertEquals(0f, unmeasured.toBatteryState(null, null).powerWatts)

        // 对照组：电压实测 (EXTRA_VOLTAGE=4000) → 功率正常推导 4.6 W
        val measured = BatteryTelemetryParser.parse(
            batteryIntent {
                putExtra(BatteryManager.EXTRA_VOLTAGE, 4000)
                putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            },
            batteryManager(), 5000
        )
        assertTrue(measured.voltageMeasured)
        assertEquals(4.6f, measured.powerWatts!!, 0.01f)
    }

    @Test
    fun voltageStateLabel_gradesSingleSource() {
        // 分级阈值单源：<3400 保护区 / <3600 偏低 / ≤4200 正常 / ≤4400 接近满充 /
        // ≤5000 异常偏高 / >5000 多电芯串联；未实测 → 双通道不可读
        with(BatteryTelemetryParser) {
            assertEquals("低电压保护区", voltageStateLabel(3300, true))
            assertEquals("电压偏低", voltageStateLabel(3500, true))
            assertEquals("正常工作区间", voltageStateLabel(3800, true))
            assertEquals("正常工作区间", voltageStateLabel(4200, true))
            assertEquals("接近满充", voltageStateLabel(4300, true))
            assertEquals("电压异常偏高", voltageStateLabel(4600, true))
            assertEquals("多电芯串联整包", voltageStateLabel(7400, true))
            assertEquals("双通道不可读", voltageStateLabel(4000, false))
        }
    }

    @Test
    fun reader_degradedState_voltageMarkedUnmeasured() {
        // Reader 降级态 (采集全失败)：电压 4000 仅为中性默认，必须标注未实测
        val state = newReader().readBatteryTelemetry()
        assertFalse(state.voltageMeasured)
        assertEquals(4000, state.voltageMv)
    }

    @Test
    fun screen_voltage_measured_displaysValueAndGrade() {
        // 端到端：广播 EXTRA_VOLTAGE=4150 → 09 卡显示数值 + 分级，Hero 显示 4.15 V
        BatterySysfs.installProbeResultForTest(emptyList())
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, 2_400_000)
        app.sendStickyBroadcast(
            batteryIntent {
                putExtra(BatteryManager.EXTRA_LEVEL, 52)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
                putExtra(BatteryManager.EXTRA_VOLTAGE, 4150)
            }
        )
        val vm = BatteryViewModel(app)
        composeRule.setContent { BatteryScreen(viewModel = vm) }
        composeRule.waitForIdle()

        assertTrue(vm.batteryState.value.voltageMeasured)
        composeRule.onNodeWithText("4150").assertExists()
        composeRule.onNodeWithText("电势差 4.15 V · 正常工作区间").assertExists()
        // Hero 行完整口径 (电流不可读 → "— mA · — W"，电压实测 → "4.15 V")
        composeRule.onNodeWithText("— mA · — W · 4.15 V").assertExists()
    }

    @Test
    fun screen_voltage_unmeasured_coherentEmptyState() {
        // 端到端：双通道均不可得 → 09 卡 "—/双通道不可读"，Hero "— V"、"— W"
        // (旧实现伪装显示 "4000 mV / 4.00 V")
        BatterySysfs.installProbeResultForTest(emptyList())
        val vm = BatteryViewModel(app)
        composeRule.setContent { BatteryScreen(viewModel = vm) }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("广播/sysfs 电压通道均不可读").assertExists()
        composeRule.onNodeWithText("mV").assertDoesNotExist()
        composeRule.onNodeWithText("— V", substring = true).assertExists()
    }

    // ==================== v2.0.0-alpha.8：指标 09/11 真机无正常显示修复 ====================
    //
    // alpha.7 发布后真机反馈"电芯电压/瞬时电流无正常显示"，深度自检锁定 6 项根因：
    // R1 sysfs 电压盲目 μV 假设：mV 上报内核 4350 被折成 4 mV 后被区间拒绝 → 通道死亡
    // R2 电压单节点 + 仅电量计评分目录：voltage_avg/batt/ocv 与低评分目录不消费
    // R3 EXTRA_VOLTAGE μV 注入内核：4,150,000 超出 mV 区间被拒绝
    // R4 指标 11 唯一取值通道 = CURRENT_NOW 属性：HAL 不支持 (Int.MIN_VALUE) 的机型
    //    即便 sysfs 电流节点完好也恒显 "—" (sysfs 仅作单位参照，从不作为取值通道)
    // R5 HAL 损坏恒 0：伪造 "0 mA" 展示
    // R6 电流单节点：current_avg/bms_current/BatteryAverageCurrent (MTK) 不消费

    @Test
    fun sysfs_voltage_mVReportingKernel_dualUnitAdjudication() {
        // R1 修复：mV 上报内核 voltage_now="4350" → 直接采用 (旧实现折成 4 mV 被区间拒绝)
        val dir = installGaugeProbe(mapOf("voltage_now" to "4350"))
        try {
            assertEquals(4350, BatterySysfs.readVoltageNowMilliVolts())
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun sysfs_voltage_multiNodeChain_avgFallback() {
        // R2 修复：voltage_now 缺失 → voltage_avg (μV) 兜底命中
        val dir = installGaugeProbe(mapOf("voltage_avg" to "4100000"))
        try {
            assertEquals(4100, BatterySysfs.readVoltageNowMilliVolts())
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun parser_voltage_extraMicroVoltInjected_normalized() {
        // R3 修复：μV 注入 Extra (4,150,000) → /1000 复验命中 → 4150 mV 实测
        BatterySysfs.installProbeResultForTest(emptyList())
        BatterySysfs.installAllSupplyDirsForTest(emptyList())
        val raw = BatteryTelemetryParser.parse(
            batteryIntent { putExtra(BatteryManager.EXTRA_VOLTAGE, 4_150_000) },
            batteryManager(), 5000
        )
        assertEquals(4150, raw.voltageMv)
        assertTrue(raw.voltageMeasured)
    }

    @Test
    fun parser_current_propertyUnsupported_sysfsValueFallback() {
        // R4 修复 (指标 11 核心)：CURRENT_NOW 属性不支持 (Int.MIN_VALUE，shadow 默认)
        // → sysfs current_now=1150000 μA 作为**取值**通道 → 放电态符号校准 -1150 mA
        // (旧实现 sysfs 仅作单位参照，取值恒 null → 恒显 "—")
        BatterySysfs.installAllSupplyDirsForTest(emptyList())
        val dir = installGaugeProbe(mapOf("current_now" to "1150000"))
        try {
            val raw = BatteryTelemetryParser.parse(batteryIntent {}, batteryManager(), 5000)
            assertEquals(-1150, raw.currentMa)
            assertFalse(raw.voltageMeasured)
            // 功率门控联动：电压未实测 → 功率仍 null (不因电流恢复而伪造)
            assertEquals(null, raw.powerWatts)
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun parser_current_propertyZeroHalBroken_sysfsCrossCheck() {
        // R5 修复：HAL 损坏恒 0 → sysfs 真实读数 (850000 μA → 850 mA) 替代伪造 "0 mA"；
        // sysfs 也无读数时保留 0 (合法浮充读数)
        BatterySysfs.installAllSupplyDirsForTest(emptyList())
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, 0)
        val dir = installGaugeProbe(mapOf("current_now" to "850000"))
        try {
            val raw = BatteryTelemetryParser.parse(
                batteryIntent {
                    putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
                },
                batteryManager(), 5000
            )
            assertEquals(850, raw.currentMa)
            File(dir, "current_now").delete()
            val noSysfs = BatteryTelemetryParser.parse(batteryIntent {}, batteryManager(), 5000)
            assertEquals(0, noSysfs.currentMa)
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun sysfs_current_multiNodeChain_avgFallback() {
        // R6 修复：current_now 缺失 → current_avg 兜底；μA 归一 + 放电符号校准
        BatterySysfs.installAllSupplyDirsForTest(emptyList())
        val dir = installGaugeProbe(mapOf("current_avg" to "2300000"))
        try {
            assertEquals(-2300, BatterySysfs.readCurrentNowMilliAmps(false))
            assertEquals(2300, BatterySysfs.readCurrentNowMilliAmps(true))
        } finally {
            cleanupProbe(dir)
        }
    }

    @Test
    fun parser_voltage_mVKernelSysfs_measured() {
        // 端到端：mV 上报内核 + 广播缺 EXTRA → sysfs 多节点+双单位通道命中 4350 mV 实测
        BatterySysfs.installAllSupplyDirsForTest(emptyList())
        val dir = installGaugeProbe(mapOf("voltage_now" to "4350"))
        try {
            val raw = BatteryTelemetryParser.parse(batteryIntent {}, batteryManager(), 5000)
            assertEquals(4350, raw.voltageMv)
            assertTrue(raw.voltageMeasured)
            assertEquals("接近满充", BatteryTelemetryParser.voltageStateLabel(4350, true))
        } finally {
            cleanupProbe(dir)
        }
    }
}
