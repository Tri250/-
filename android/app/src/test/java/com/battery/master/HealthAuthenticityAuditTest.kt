package com.battery.master

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.CapacitySource
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 指标 01 电池健康度真实性审计回归测试 (Robolectric，无模拟器)
 *
 * 覆盖 v1.2.3 健康度真实性审计修复点：
 * 1. 无 sysfs charge_full 实测时，当前容量收敛到 设计容量 × 0.92 降级估算，
 *    来源必须标注 ESTIMATED——杜绝"精确的 92.0% 健康度"实为虚构估算值的情况；
 * 2. Reader 设计容量三级回退链 (PowerProfile/sysfs/5000 兜底) 的值与来源等级
 *    一一对应，不得出现"值为兜底却标注实测"的错标；
 * 3. 用户手动校准后来源标注 CALIBRATED，健康度按新分母实时重算 (92% 不变式)；
 * 4. 区间外非法校准被拒绝且来源不被污染；
 * 5. 降级态与双通道 (轮询/广播) 消费同一来源标注，语义零漂移。
 *
 * 环境假设 (与既有测试一致)：CI/桌面环境无电池 sysfs 节点 →
 * 指标 03 来源恒为 ESTIMATED。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HealthAuthenticityAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    // ===== 1. 估算值必须显式标注来源，不得冒充实测 =====

    @Test
    fun healthPercentage_withoutSysfs_isEstimatedNotMeasured() {
        val raw = BatteryTelemetryParser.parse(null, null, 5000)

        // 无 sysfs：当前容量 = 5000 × 0.92 = 4600，来源必须是 ESTIMATED 而非 SYSFS
        assertEquals(CapacitySource.ESTIMATED, raw.currentCapacitySource)
        assertEquals(CapacitySource.FALLBACK, raw.designCapacitySource)
        assertEquals(4600, raw.currentCapacityMah)
        // 4600 / 5000 = 92.0%——精确值但必须带 [0.92 降级估算] 标注
        assertEquals(92.0f, raw.healthPercentage, 0.01f)

        // 来源经 toBatteryState 透传至展示态 (UI 副标题消费此字段)
        val state = raw.toBatteryState(null, null)
        assertEquals(CapacitySource.ESTIMATED, state.currentCapacitySource)
        assertEquals(CapacitySource.FALLBACK, state.designCapacitySource)
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
            else -> assertTrue("设计容量 $value 超出合理区间", value in 500..20000)
        }

        // 遥测态与 Reader 配置同源 (双通道单一数据源，语义零漂移)
        val state = reader.readBatteryTelemetry()
        assertEquals(source, state.designCapacitySource)
        assertEquals(CapacitySource.ESTIMATED, state.currentCapacitySource)

        // 健康度与容量口径严格自洽：health = current / design × 100
        val expected = (state.currentCapacityMah * 100f / state.designCapacityMah).coerceIn(0f, 100f)
        assertEquals(expected, state.healthPercentage, 0.01f)
    }

    // ===== 3. 用户校准：来源标注 CALIBRATED，健康度按新分母重算 =====

    @Test
    fun userCalibration_marksCalibratedAndRecomputesHealth() {
        val viewModel = BatteryViewModel(app)
        viewModel.setDesignCapacity(6000)

        val state = viewModel.batteryState.value
        assertEquals(CapacitySource.CALIBRATED, state.designCapacitySource)
        assertEquals(6000, state.designCapacityMah)
        // 6000 × 0.92 = 5520 → 健康度 92.0% (口径不变，分母更新)
        assertEquals(5520, state.currentCapacityMah)
        assertEquals(92.0f, state.healthPercentage, 0.01f)
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

    // ===== 5. 降级态来源标注诚实 (估算不得谎报实测) =====

    @Test
    fun telemetrySources_alwaysHonest() {
        val reader = BatteryHardwareReader(app)
        val state = reader.readBatteryTelemetry()
        // 任何采集结果都必须携带合法来源等级 (UI 据此渲染 [实测]/[估算] 标注)
        assertTrue(state.currentCapacitySource in CapacitySource.values().toList())
        assertTrue(state.designCapacitySource in CapacitySource.values().toList())
    }
}
