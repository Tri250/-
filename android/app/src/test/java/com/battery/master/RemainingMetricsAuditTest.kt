package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatterySysfs
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 指标 05~12 剩余核心指标审计回归测试 (Robolectric，无模拟器)
 *
 * 覆盖 v1.2.3 审计修复点：
 * 1. 指标 07 温度物理合理区间钳制 (传感器故障值收敛 -40~120℃)；
 * 2. 指标 09 电压合理区间校验 (2000~12000mV 覆盖单/双电芯，故障值回退 4000mV)；
 * 3. 指标 10 循环计数合理区间收敛 (占位值 65535 → 10000 上限，负值归一 0)；
 * 4. 指标 11 瞬时电流归一化边界 ±20A 物理上限收敛；
 * 5. 链路闭环：实验室"设计容量"滑杆 → Reader 配置 → 指标 01/02/03 → UI 数值联动；
 * 6. 双通道 (广播/轮询) 钳制语义一致。
 *
 * 指标 05 (电量百分比归一化)、06 (状态枚举映射)、12 (充满判定) 的
 * 既有回归覆盖见 FullChargeCapacityTest，本轮复核确认无新增缺陷。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class RemainingMetricsAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    private val batteryManager: BatteryManager?
        get() = app.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager

    private fun batteryIntent(block: Intent.() -> Unit): Intent =
        Intent(Intent.ACTION_BATTERY_CHANGED).apply(block)

    // ===== 指标 07 温度物理合理区间 =====

    @Test
    fun parser_temperature_clampsSensorFaultsToPhysicalBand() {
        // 传感器故障垃圾值收敛到物理区间
        val hot = BatteryTelemetryParser.parse(
            batteryIntent { putExtra(BatteryManager.EXTRA_TEMPERATURE, 8000) }, batteryManager, 5000
        )
        assertEquals(120f, hot.temperatureCelsius, 0.01f)
        val cold = BatteryTelemetryParser.parse(
            batteryIntent { putExtra(BatteryManager.EXTRA_TEMPERATURE, -3000) }, batteryManager, 5000
        )
        assertEquals(-40f, cold.temperatureCelsius, 0.01f)

        // 正常值精确透传 (0.1℃ 精度)
        val normal = BatteryTelemetryParser.parse(
            batteryIntent { putExtra(BatteryManager.EXTRA_TEMPERATURE, 326) }, batteryManager, 5000
        )
        assertEquals(32.6f, normal.temperatureCelsius, 0.01f)

        // 缺失时默认 25.0℃
        val missing = BatteryTelemetryParser.parse(batteryIntent {}, batteryManager, 5000)
        assertEquals(25.0f, missing.temperatureCelsius, 0.01f)
    }

    // ===== 指标 09 电压合理区间 =====

    @Test
    fun parser_voltage_rejectsUnplausibleValues() {
        // 单电芯正常值与双电芯串联整包 (8.8V) 必须接受，不得误判
        assertEquals(
            4187,
            BatteryTelemetryParser.parse(
                batteryIntent { putExtra(BatteryManager.EXTRA_VOLTAGE, 4187) }, batteryManager, 5000
            ).voltageMv
        )
        assertEquals(
            8800,
            BatteryTelemetryParser.parse(
                batteryIntent { putExtra(BatteryManager.EXTRA_VOLTAGE, 8800) }, batteryManager, 5000
            ).voltageMv
        )

        // 传感器故障 0 / 负 / 超大 → 中性默认 4000 mV
        for (fault in listOf(0, -500, 99999, 1)) {
            assertEquals(
                4000,
                BatteryTelemetryParser.parse(
                    batteryIntent { putExtra(BatteryManager.EXTRA_VOLTAGE, fault) }, batteryManager, 5000
                ).voltageMv
            )
        }

        // 缺失 → 4000 mV
        assertEquals(
            4000,
            BatteryTelemetryParser.parse(batteryIntent {}, batteryManager, 5000).voltageMv
        )
    }

    // ===== 指标 10 循环计数合理区间 =====

    @Test
    fun parser_cycleCount_clampsPlaceholderValues() {
        // 正常值透传
        assertEquals(
            320,
            BatteryTelemetryParser.parse(
                batteryIntent { putExtra(BatteryManager.EXTRA_CYCLE_COUNT, 320) }, batteryManager, 5000
            ).cycleCount
        )
        // 内核占位/脏数据 65535 → 收敛到 10000 上限
        assertEquals(
            10_000,
            BatteryTelemetryParser.parse(
                batteryIntent { putExtra(BatteryManager.EXTRA_CYCLE_COUNT, 65535) }, batteryManager, 5000
            ).cycleCount
        )
        // 负值归一为 0
        assertEquals(
            0,
            BatteryTelemetryParser.parse(
                batteryIntent { putExtra(BatteryManager.EXTRA_CYCLE_COUNT, -7) }, batteryManager, 5000
            ).cycleCount
        )
    }

    // ===== 指标 11 瞬时电流归一化边界 =====

    @Test
    fun currentNormalization_clampsToPhysicalCeiling() {
        // μA 规范值正常折算 (无 sysfs 交叉校验环境下按规范默认 μA)
        assertEquals(2350, BatterySysfs.normalizeCurrentToMilliAmps(2_350_000))
        // 垃圾 μA (等效 200A) 收敛到 ±20A 物理上限
        assertEquals(20_000, BatterySysfs.normalizeCurrentToMilliAmps(200_000_000))
        assertEquals(-20_000, BatterySysfs.normalizeCurrentToMilliAmps(-200_000_000))
        // |raw| ≤ 20000 且无 sysfs 时按规范 μA 折算
        assertEquals(4, BatterySysfs.normalizeCurrentToMilliAmps(4800))
        // 边界：0 / Int.MIN_VALUE → 0
        assertEquals(0, BatterySysfs.normalizeCurrentToMilliAmps(0))
        assertEquals(0, BatterySysfs.normalizeCurrentToMilliAmps(Int.MIN_VALUE))
    }

    // ===== 链路闭环：实验室设计容量滑杆 → Reader → 指标 01/02/03 → UI =====

    @Test
    fun viewModel_labDesignCapacitySlider_updatesStateClosedLoop() {
        val vm = BatteryViewModel(app)

        // 进入实验室：真实遥测冻结，覆盖层以当前真实值为基准
        vm.enterLabMode()
        val before = vm.batteryState.value

        // 实验室内拖动"出厂设计容量"滑杆 (1000~15000 mAh)
        vm.updateLabDesignCapacity(6800)

        val after = vm.batteryState.value
        // 旧实现：publish 被实验室覆盖层拦截 → designCapacityMah 保持 5000，
        // 滑杆数值回弹。现必须刷新
        assertEquals(6800, after.designCapacityMah)
        // 基底刷新后指标 01/02/03 同口径联动：当前容量 = 0.92 × 6800 = 6256，健康度 92%
        assertEquals(6256, after.currentCapacityMah)
        assertEquals(92.0f, after.healthPercentage, 0.01f)
        // 实验室覆盖层其余参数 (电量等) 不受设计容量变更影响
        assertEquals(before.percentage, after.percentage)
        assertEquals(before.currentMa, after.currentMa)

        // 退出实验室：恢复真实遥测，设计容量配置跨实验室会话保留
        vm.exitLabMode()
        val real = vm.batteryState.value
        assertEquals(6800, real.designCapacityMah)
        assertEquals(6256, real.currentCapacityMah)
    }

    @Test
    fun viewModel_labDesignCapacity_outOfRangeRejected() {
        val vm = BatteryViewModel(app)
        vm.updateLabDesignCapacity(6800)
        // 实验室滑杆本身钳制 1000~15000；VM 层对越界值二次拒绝 (单源防线)
        vm.setDesignCapacity(3)
        assertEquals(6800, vm.batteryState.value.designCapacityMah)
    }

    // ===== 双通道 (广播/轮询) 钳制语义一致 =====

    @Test
    fun receiverChannel_clampedValuesConsistentWithPolling() {
        val reader = BatteryHardwareReader(app)
        var emitted: BatteryState? = null
        val receiver = BatteryReceiver(reader) { emitted = it }

        // 广播通道注入传感器故障值
        receiver.onReceive(
            app,
            batteryIntent {
                putExtra(BatteryManager.EXTRA_LEVEL, 80)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
                putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
                putExtra(BatteryManager.EXTRA_TEMPERATURE, 8000) // 故障：800℃
                putExtra(BatteryManager.EXTRA_VOLTAGE, 0)        // 故障：0 mV
                putExtra(BatteryManager.EXTRA_CYCLE_COUNT, 65535) // 占位脏数据
            }
        )

        val state = emitted!!
        assertEquals(120f, state.temperatureCelsius, 0.01f)
        assertEquals(4000, state.voltageMv)
        assertEquals(10_000, state.cycleCount)
        assertEquals(BatteryStatus.DISCHARGING, state.status)
        // 指标 06 状态枚举映射完整：放电态透传
        assertEquals(80, state.percentage)

        // 轮询通道 (无电池环境)：同样收敛在合理区间内
        val polled = reader.readBatteryTelemetry()
        assertTrue(polled.temperatureCelsius in -40f..120f)
        assertTrue(polled.voltageMv in 2000..12000)
        assertTrue(polled.cycleCount in 0..10_000)
        assertTrue(polled.percentage in 0..100)
    }
}
