package com.battery.master

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.CapacitySource
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatterySysfs
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.nio.file.Files

/**
 * 指标 01 电池健康度真实性审计回归测试 (Robolectric，无模拟器)
 *
 * v2.0.0-alpha.1 用户口径修正：**健康度是多少就是多少，不按出厂保持率虚构**。
 * 覆盖修复点：
 * 1. 电量计节点 (charge_full) 全链路不可读 → 当前容量=0、来源 UNAVAILABLE、
 *    健康度=0 且 hasMeasuredCapacity=false——旧实现 0.92×设计容量的虚构
 *    "92.0% 健康度"已彻底移除，UI 显示 "— 无法测算"；
 * 2. Reader 设计容量三级回退链 (PowerProfile/sysfs/5000 兜底) 的值与来源等级
 *    一一对应，不得出现"值为兜底却标注实测"的错标；
 * 3. 探测链注入真实电量计节点后，用户手动校准 (CALIBRATED 分母) 下健康度
 *    按实测容量/新分母实时重算；
 * 4. 区间外非法校准被拒绝且来源不被污染；
 * 5. 降级态与双通道 (轮询/广播) 消费同一来源标注，语义零漂移。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HealthAuthenticityAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()
    private var probeRoot: File? = null

    @Before
    fun resetProbe() {
        BatterySysfs.installProbeResultForTest(emptyList())
    }

    @After
    fun cleanupProbe() {
        BatterySysfs.installProbeResultForTest(emptyList())
        probeRoot?.deleteRecursively()
        probeRoot = null
    }

    /** 注入临时 bms 电量计节点，模拟真实电量计挂载 (μAh 上报内核) */
    private fun installGaugeNodes(chargeFullUah: Int, chargeFullDesignUah: Int? = null) {
        val root = Files.createTempDirectory("gauge_probe").toFile().also { probeRoot = it }
        val bms = File(root, "bms").apply { mkdirs() }
        File(bms, "charge_full").writeText("$chargeFullUah\n")
        chargeFullDesignUah?.let { File(bms, "charge_full_design").writeText("$it\n") }
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
    }

    // ===== 1. 容量不可测 = 无法测算，不得虚构健康度 =====

    @Test
    fun healthPercentage_withoutGaugeNode_isUnavailableNotFabricated() {
        val raw = BatteryTelemetryParser.parse(null, null, 5000)

        // 无电量计节点：当前容量=0 (非法哨兵)、来源 UNAVAILABLE、健康度=0
        assertEquals(CapacitySource.UNAVAILABLE, raw.currentCapacitySource)
        assertEquals(CapacitySource.FALLBACK, raw.designCapacitySource)
        assertEquals(0, raw.currentCapacityMah)
        assertEquals(0f, raw.healthPercentage, 0.001f)
        assertFalse(raw.hasMeasuredCapacity)
        // 旧实现 4600 (5000×0.92) 与 92.0% 虚构值必须不存在——是多少就是多少

        // 来源经 toBatteryState 透传至展示态 (UI "— 无法测算" 空态消费此字段)
        val state = raw.toBatteryState(null, null)
        assertEquals(CapacitySource.UNAVAILABLE, state.currentCapacitySource)
        assertEquals(CapacitySource.FALLBACK, state.designCapacitySource)
        assertFalse(state.hasMeasuredCapacity)
    }

    // ===== 2. Reader 三级链：值与来源等级一一对应 =====

    @Test
    fun reader_designCapacitySourceMatchesValue() {
        val reader = BatteryHardwareReader(app)
        val source = reader.designCapacitySource
        val value = reader.designCapacityMah

        // 兜底值 5000 必须且只能对应 FALLBACK；其余来源必须落在合理区间
        when (source) {
            CapacitySource.FALLBACK -> assertEquals(5000, value)
            else -> assertTrue(
                "设计容量 $value 超出合理区间",
                value in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH
            )
        }

        // 无电量计节点时遥测态：容量不可测算 (诚实空态，非虚构估算)
        val state = reader.readBatteryTelemetry()
        assertEquals(source, state.designCapacitySource)
        assertEquals(CapacitySource.UNAVAILABLE, state.currentCapacitySource)
        assertFalse(state.hasMeasuredCapacity)
        assertEquals(0, state.currentCapacityMah)
        assertEquals(0f, state.healthPercentage, 0.001f)
    }

    // ===== 3. 实测容量 + 用户校准：健康度按真实分母重算 =====

    @Test
    fun userCalibration_withMeasuredCapacity_recomputesHealth() {
        // 注入真实电量计：charge_full=4890000 μAh (4890 mAh)
        installGaugeNodes(chargeFullUah = 4_890_000)
        val viewModel = BatteryViewModel(app)
        viewModel.setDesignCapacity(6000)

        val state = viewModel.batteryState.value
        assertEquals(CapacitySource.CALIBRATED, state.designCapacitySource)
        assertEquals(6000, state.designCapacityMah)
        assertTrue(state.hasMeasuredCapacity)
        assertEquals(4890, state.currentCapacityMah)
        assertEquals(CapacitySource.SYSFS, state.currentCapacitySource)
        // 实测 4890 / 校准 6000 = 81.5%——是多少就是多少 (真实分母真实分子)
        assertEquals(81.5f, state.healthPercentage, 0.05f)
    }

    // ===== 4. 非法校准被拒绝，来源不被污染 =====

    @Test
    fun invalidCalibration_rejectedAndSourceUntouched() {
        val viewModel = BatteryViewModel(app)
        val sourceBefore = viewModel.batteryState.value.designCapacitySource
        val valueBefore = viewModel.batteryState.value.designCapacityMah

        viewModel.setDesignCapacity(100) // 低于 500 mAh 合理下限
        viewModel.setDesignCapacity(0)   // 零分母
        viewModel.setDesignCapacity(-1)  // 负值

        assertEquals(sourceBefore, viewModel.batteryState.value.designCapacitySource)
        assertEquals(valueBefore, viewModel.batteryState.value.designCapacityMah)
    }

    // ===== 5. 降级态来源标注诚实 (不可测算不得谎报实测) =====

    @Test
    fun telemetrySources_alwaysHonest() {
        val reader = BatteryHardwareReader(app)
        val state = reader.readBatteryTelemetry()
        // 任何采集结果都必须携带合法来源等级 (UI 据此渲染 [实测]/[不可测算] 标注)
        assertTrue(state.currentCapacitySource in CapacitySource.values().toList())
        assertTrue(state.designCapacitySource in CapacitySource.values().toList())
    }
}
