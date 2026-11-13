package com.battery.master

import android.app.Application
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatterySysfs
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.nio.file.Files

/**
 * 指标 01/02/03/04 容量体系审计回归测试 (Robolectric，无模拟器)
 *
 * 覆盖 v1.2.3 审计修复点：
 * 1. sysfs 容量节点双单位归一化 (规范 μAh，兼容 mAh 上报内核) + 合理区间校验；
 * 2. 指标 04 设计容量三级回退链 (PowerProfile/sysfs/兜底) 统一区间校验；
 * 3. 指标 02 剩余电量四舍五入 (消除浮点截断 1mAh 级漂移) 与 ≤ 当前容量不变式；
 * 4. 指标 01 健康度与 当前容量/设计容量 口径自洽；
 * 5. ViewModel 设计容量入口拒绝区间外非法值 (防级联污染指标 01/02/03)。
 *
 * 环境假设 (与既有测试一致)：CI/桌面环境无电池 sysfs 节点 →
 * 指标 03 收敛到设计容量 × 0.92 降级估算。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class CapacityMetricsAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    // ===== 指标 03/04：sysfs 容量节点双单位归一化 =====

    @Test
    fun parseCapacityMah_normalizesMicroAmpHoursWithRounding() {
        assertEquals(5000, BatterySysfs.parseCapacityMah(5_000_000))
        assertEquals(20000, BatterySysfs.parseCapacityMah(20_000_000))
        // 4999999 μAh = 4999.999 mAh：四舍五入 5000 (旧实现 /1000 截断得 4999)
        assertEquals(5000, BatterySysfs.parseCapacityMah(4_999_999))
    }

    @Test
    fun parseCapacityMah_acceptsMilliAmpHourReportingKernels() {
        // μAh 解释下 4.7 mAh / 0.6 mAh 电芯物理上不存在 → 判定为 mAh 上报内核，接受原始值
        assertEquals(4700, BatterySysfs.parseCapacityMah(4700))
        assertEquals(600, BatterySysfs.parseCapacityMah(600))
    }

    @Test
    fun parseCapacityMah_rejectsDirtyData() {
        assertNull(BatterySysfs.parseCapacityMah(0))
        assertNull(BatterySysfs.parseCapacityMah(-3_500_000))
        assertNull(BatterySysfs.parseCapacityMah(Int.MIN_VALUE))
        assertNull(BatterySysfs.parseCapacityMah(499))        // 低于合理下限 500 mAh
        assertNull(BatterySysfs.parseCapacityMah(30_000_000)) // 30000 mAh 超出合理上限 25000 mAh
    }

    // ===== 指标 01/02/03：解析口径自洽与精度 =====

    @Test
    fun parser_remainingCapacityRoundsInsteadOfTruncating() {
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 53)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
        }
        // batteryManager 传 null：CHARGE_COUNTER 不可用 → 走百分比折算通道；
        // v2.0.0-alpha.1：注入探测链实测容量 (4890000 μAh → 4890 mAh)，
        // 旧实现 0.92 降级估算 (4600) 已移除——健康度口径是多少就是多少
        val bms = Files.createTempDirectory("cap_probe").toFile()
        File(bms, "charge_full").writeText("4890000\n")
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
        try {
            val raw = BatteryTelemetryParser.parse(intent, null, 5000)

            // 指标 03：探测链命中 → 实测 4890 mAh [sysfs 实测]
            assertEquals(4890, raw.currentCapacityMah)
            assertTrue(raw.hasMeasuredCapacity)
            // 指标 02：round(4890 × 53%) = 2592 (旧实现浮点截断得 2591，漂移 1mAh)
            assertEquals(2592, raw.remainingCapacityMah)
            // 不变式：剩余电量 ≤ 当前可用容量
            assertTrue(raw.remainingCapacityMah <= raw.currentCapacityMah)
        } finally {
            BatterySysfs.installProbeResultForTest(emptyList())
            bms.deleteRecursively()
        }
    }

    @Test
    fun parser_healthPercentage_consistentWithCapacityRatio() {
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 100)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
        }
        // 实测路径：注入 charge_full = 5000000 μAh (5000 mAh)，设计容量兜底 5000
        val bms = Files.createTempDirectory("cap_probe").toFile()
        File(bms, "charge_full").writeText("5000000\n")
        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))
        try {
            val raw = BatteryTelemetryParser.parse(intent, null, 5000)

            assertEquals(100, raw.percentage)
            assertTrue(raw.hasMeasuredCapacity)
            // 100% 折算恰好等于当前容量 (不变式上界，无截断损耗)
            assertEquals(raw.currentCapacityMah, raw.remainingCapacityMah)
            // 指标 01：健康度 = 当前容量 / 设计容量 × 100，钳制 0~100
            assertEquals(100f, raw.healthPercentage, 0.01f)
            assertTrue(raw.healthPercentage in 0f..100f)
        } finally {
            BatterySysfs.installProbeResultForTest(emptyList())
            bms.deleteRecursively()
        }

        // 空态路径 (v2.0.0-alpha.1 口径)：无电量计节点 → 容量 0、健康度 0，
        // 旧实现 0.92 虚构的 92.0% 已移除——测不到就不展示
        val noGauge = BatteryTelemetryParser.parse(intent, null, 5000)
        assertEquals(0, noGauge.currentCapacityMah)
        assertEquals(0f, noGauge.healthPercentage, 0.001f)
        assertFalse(noGauge.hasMeasuredCapacity)
    }

    // ===== 指标 04：设计容量回退链与入口防线 =====

    @Test
    fun reader_designCapacity_fallsBackWithinPlausibleRange() {
        val reader = BatteryHardwareReader(app)
        // 无论三级链命中哪一级 (PowerProfile / sysfs / 5000 兜底)，均不得越界
        assertTrue(reader.designCapacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH)
    }

    @Test
    fun viewModel_setDesignCapacity_rejectsOutOfRangeValues() {
        val vm = BatteryViewModel(app)
        vm.setDesignCapacity(6800)
        assertEquals(6800, vm.batteryState.value.designCapacityMah)

        // 低于下限 / 超出上限 / 非法值：拒绝写入，指标 04 维持上次有效值，
        // 防止非法分母级联污染指标 01 (健康度)、02 (剩余电量)、03 (当前容量估算)
        // (上限 25000 内为合法区间——覆盖 23800mAh 三防大电池机；30000 为越界样本)
        vm.setDesignCapacity(3)
        assertEquals(6800, vm.batteryState.value.designCapacityMah)
        vm.setDesignCapacity(30_000)
        assertEquals(6800, vm.batteryState.value.designCapacityMah)
        vm.setDesignCapacity(0)
        assertEquals(6800, vm.batteryState.value.designCapacityMah)
    }
}
