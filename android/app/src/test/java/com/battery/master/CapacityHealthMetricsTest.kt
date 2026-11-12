package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatterySysfs
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

/**
 * 指标 01「电池健康度」/ 02「剩余电量」/ 03「电池当前容量」全量深度自检回归测试
 * (Robolectric，无模拟器)
 *
 * 覆盖 v1.2.3 审计修复点：
 * 1. charge_full 单位归一化真值表：μAh 规范内核 / mAh 上报内核 / 脏数据三分类，
 *    mAh 上报内核不再被"一律回退估算值"丢弃真实读数 (旧缺陷：健康度恒伪造 92.0%)；
 * 2. 真实遥测路径指标 01/02/03 跨指标口径自洽：
 *    健康度 = 当前容量 / 设计容量、剩余电量恒 ≤ 当前容量；
 * 3. 设计容量校准真实路径联动：容量估算回退与健康度同步随新设计容量现算；
 * 4. 实验室内校准设计容量：指标 01 健康度实时重算，不再冻结为进入实验室时的旧快照，
 *    退出实验室后真实遥测沿用新配置；
 * 5. 静态 sysfs 节点 TTL 缓存：TTL 内返回缓存值、不可读节点不缓存持续重试。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class CapacityHealthMetricsTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    // ===== 1. charge_full 单位归一化真值表 (指标 03) =====

    @Test
    fun normalizeChargeFull_standardMicroAmpKernel() {
        // 标准内核按 sysfs 规范以 μAh 上报：raw/1000 落入合理区间直接采用
        assertEquals(4800, BatterySysfs.normalizeChargeFullToMilliAmps(4_800_000))
        assertEquals(5000, BatterySysfs.normalizeChargeFullToMilliAmps(5_000_000))
        // 合理区间边界 (含 500 / 20000 mAh)
        assertEquals(500, BatterySysfs.normalizeChargeFullToMilliAmps(500_000))
        assertEquals(20_000, BatterySysfs.normalizeChargeFullToMilliAmps(20_000_000))
    }

    @Test
    fun normalizeChargeFull_milliAmpReportingKernel_keepsRealReading() {
        // mAh 上报内核：旧实现 raw/1000 = 4 → 非法区间 → 丢弃真实读数回退估算，
        // 健康度恒伪造 92.0%；修复后按 mAh 解释保留真实读数
        assertEquals(4900, BatterySysfs.normalizeChargeFullToMilliAmps(4900))
        assertEquals(4600, BatterySysfs.normalizeChargeFullToMilliAmps(4600))
        assertEquals(500, BatterySysfs.normalizeChargeFullToMilliAmps(500))
        assertEquals(20_000, BatterySysfs.normalizeChargeFullToMilliAmps(20_000))
    }

    @Test
    fun normalizeChargeFull_dirtyOrInvalid_returnsNull() {
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(null))
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(0))
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(-1))
        // 脏数据：μAh 与 mAh 两种解释均不在合理区间
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(25))
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(499))
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(499_000)) // 499 mAh，低于下限
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(20_500_000)) // 20500 mAh，高于上限
        assertNull(BatterySysfs.normalizeChargeFullToMilliAmps(Int.MAX_VALUE)) // 2147483 mAh
    }

    // ===== 2. 真实遥测路径：指标 01/02/03 跨指标口径自洽 =====

    @Test
    fun parse_metricsCrossConsistency_whenSysfsUnavailable() {
        val batteryManager = app.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 50)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_VOLTAGE, 4000)
        }
        val raw = BatteryTelemetryParser.parse(intent, batteryManager, 5000)

        // Robolectric 无 /sys/class/power_supply：当前容量回退估算 = 0.92 × 设计容量
        assertEquals(4600, raw.currentCapacityMah)
        // 健康度与容量同源现算 (旧缺陷：容量 92% 估算但健康度显示默认 100%)
        assertEquals(92.0f, raw.healthPercentage, 0.01f)
        // 剩余电量 = 当前容量 × 百分比，不变式：恒 ≤ 当前容量
        assertEquals(2300, raw.remainingCapacityMah)
        assertTrue(raw.remainingCapacityMah <= raw.currentCapacityMah)
    }

    @Test
    fun reader_setDesignCapacity_realPathRecomputesCapacityAndHealth() {
        val vm = BatteryViewModel(app)
        vm.setDesignCapacity(8000)

        val state = vm.batteryState.value
        assertEquals(8000, state.designCapacityMah)
        // 真实路径：容量估算回退随设计容量联动 (0.92 × 8000)
        assertEquals(7360, state.currentCapacityMah)
        assertEquals(92.0f, state.healthPercentage, 0.01f)
    }

    @Test
    fun reader_designCapacity_alwaysWithinPlausibleBand() {
        // 指标 04 回退链 (PowerProfile → sysfs charge_full_design → 5000) 任一环节
        // 都不得产出 5 mAh 级 (mAh 上报内核旧缺陷) 或 50000 mAh 级脏标称
        val design = BatteryHardwareReader(app).designCapacityMah
        assertTrue(design in BatterySysfs.MIN_PLAUSIBLE_CAPACITY_MAH..BatterySysfs.MAX_PLAUSIBLE_CAPACITY_MAH)
    }

    // ===== 3. 实验室校准设计容量 → 指标 01 实时重算 (旧缺陷回归) =====

    @Test
    fun labMode_designCapacityCalibration_recomputesHealthLive() {
        val vm = BatteryViewModel(app)
        // Robolectric 真实快照：当前容量 = 0.92 × 5000 = 4600，健康度 92%
        assertEquals(4600, vm.batteryState.value.currentCapacityMah)
        assertEquals(92.0f, vm.batteryState.value.healthPercentage, 0.01f)

        vm.enterLabMode()
        // 旧实现：实验室态 publish 被拦截且 publishLab 不重算健康度 → 冻结 92% 显示
        vm.updateLabDesignCapacity(8000)

        val state = vm.batteryState.value
        assertEquals(8000, state.designCapacityMah)
        // 物理容量 (衰减后) 不随设计容量配置变化
        assertEquals(4600, state.currentCapacityMah)
        // 健康度按新设计容量实时重算：4600 / 8000 = 57.5%
        assertEquals(57.5f, state.healthPercentage, 0.01f)
    }

    @Test
    fun labMode_designCapacityCalibration_reflectedAfterExit() {
        val vm = BatteryViewModel(app)
        vm.enterLabMode()
        vm.updateLabDesignCapacity(8000)
        vm.exitLabMode()

        // 退出实验室后真实遥测沿用新设计容量：估算容量与健康度同步现算
        val state = vm.batteryState.value
        assertEquals(8000, state.designCapacityMah)
        assertEquals(7360, state.currentCapacityMah)
        assertEquals(92.0f, state.healthPercentage, 0.01f)
    }

    // ===== 4. 静态 sysfs 节点 TTL 缓存 =====

    @Test
    fun readIntCached_servesStaticNodeWithinTtl() {
        val file = File(app.cacheDir, "static_node_ttl_test")
        file.writeText("4700000\n")
        val path = file.absolutePath
        try {
            assertEquals(4_700_000, BatterySysfs.readIntCached(path))
            // TTL 内：文件内容变化后仍返回缓存值 (静态节点 1Hz 轮询不再每秒读盘)
            file.writeText("9999999\n")
            assertEquals(4_700_000, BatterySysfs.readIntCached(path))
        } finally {
            file.delete()
        }
    }

    @Test
    fun readIntCached_missingNode_returnsNullWithoutCaching() {
        // 节点不可读不缓存：连续读取均返回 null，节点出现后下一拍即可恢复真实读数
        repeat(3) {
            assertNull(BatterySysfs.readIntCached("/sys/class/power_supply/battery/charge_full"))
        }
    }
}
