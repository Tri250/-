package com.battery.master

import android.app.Application
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.CapacitySource
import com.battery.master.service.BatteryHardwareReader
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config

/**
 * v2.0.0-alpha.4：电池健康度真实显示——端到端集成测试 (Robolectric)
 *
 * 验证链路：粘性广播 (EXTRA_LEVEL 放电序列) + 官方库仑计
 * BATTERY_PROPERTY_CHARGE_COUNTER (ShadowBatteryManager 注入电荷积分序列)
 * → Reader 轮询通道回归喂样 → OLS 收敛 → 健康度真实显示。
 *
 * 场景前提：sysfs charge_full 探测链全链路不可读 (Robolectric 桌面环境无 sysfs)——
 * 正是 v2.0.0-alpha.1 口径下"无法测算"的最常见机型形态。修复后：
 * 健康度不再卡死在"无法测算"，而经库仑计积分回归实测出真实值，
 * 来源标注 COULOMB_REGRESSION (库仑计回归)，无任何出厂保持率假设。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class BatteryHealthDisplayIntegrationTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @Before
    fun resetRegression() {
        BatteryHardwareReader(app).resetCapacityRegressionForTest()
    }

    @Test
    fun healthDisplay_coulombRegression_whenSysfsUnavailable() {
        val reader = BatteryHardwareReader(app)
        reader.resetCapacityRegressionForTest()
        // 固定设计容量 (校准语义)：回归值 3800 mAh / 5000 mAh = 76%，避开
        // Robolectric PowerProfile 反射值差异导致的健康度钳制
        reader.designCapacityMah = 5000
        val batteryManager =
            app.getSystemService(android.content.Context.BATTERY_SERVICE) as BatteryManager

        // 放电序列：p 100→64，库仑计电荷同步积分 (3800 mAh 真实满容量，μAh = mAh×1000)
        for (p in 100 downTo 64) {
            Shadows.shadowOf(batteryManager).setIntProperty(
                BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER,
                (3800L * p * 10L).toInt()   // μAh = mAh × 1000 × p/100
            )
            app.sendStickyBroadcast(
                Intent(Intent.ACTION_BATTERY_CHANGED).apply {
                    putExtra(BatteryManager.EXTRA_LEVEL, p)
                    putExtra(BatteryManager.EXTRA_SCALE, 100)
                    putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
                    putExtra(BatteryManager.EXTRA_TEMPERATURE, 300)
                    putExtra(BatteryManager.EXTRA_VOLTAGE, 3900)
                    putExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD)
                }
            )
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
            reader.readBatteryTelemetry()
        }

        val state = reader.readBatteryTelemetry()

        // 健康度真实显示：不再卡死"无法测算"，来源=库仑计回归
        assertEquals(CapacitySource.COULOMB_REGRESSION, state.currentCapacitySource)
        assertTrue("回归通道必须计入实测容量", state.hasMeasuredCapacity)
        assertTrue(
            "回归满容量必须收敛到 3800 mAh 附近，实际 ${state.currentCapacityMah}",
            kotlin.math.abs(state.currentCapacityMah - 3800) <= 10
        )
        // 健康度 = 回归满容量 / 设计容量 (校准固定 5000 mAh → 期望 76%)
        val expectedHealth = 3800f / state.designCapacityMah * 100f
        assertTrue(
            "健康度必须真实显示 (${state.healthPercentage}% vs 期望 $expectedHealth%)",
            kotlin.math.abs(state.healthPercentage - expectedHealth) <= 0.5f
        )
        assertTrue(state.healthPercentage in 70f..85f)
        // 回归通道状态标注透传 UI (健康档案卡/采集链路卡)
        assertTrue(
            "回归标注必须带样本量与置信度，实际 ${state.capacityRegressionInfo}",
            state.capacityRegressionInfo.contains("n=") && state.capacityRegressionInfo.contains("中置信")
        )
    }

    @Test
    fun healthDisplay_unmeasurable_beforeRegressionConverges() {
        val reader = BatteryHardwareReader(app)
        reader.resetCapacityRegressionForTest()
        val batteryManager =
            app.getSystemService(android.content.Context.BATTERY_SERVICE) as BatteryManager

        // 仅 5 个百分点跨度 (<30)：回归诚实门限未过；且全程 p<20 低于
        // v2.0.0-alpha.6 库仑计单点估算门限 (±1% 电量格舍入误差 >5% 不估)——
        // 双门限都未过 → 仍显示"无法测算"，不冒充实测
        for (p in 19 downTo 15) {
            Shadows.shadowOf(batteryManager).setIntProperty(
                BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, (3800L * p * 10L).toInt()
            )
            app.sendStickyBroadcast(
                Intent(Intent.ACTION_BATTERY_CHANGED).apply {
                    putExtra(BatteryManager.EXTRA_LEVEL, p)
                    putExtra(BatteryManager.EXTRA_SCALE, 100)
                    putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
                }
            )
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
            reader.readBatteryTelemetry()
        }

        val state = reader.readBatteryTelemetry()
        assertEquals(CapacitySource.UNAVAILABLE, state.currentCapacitySource)
        assertEquals("回归未收敛不得冒充实测", false, state.hasMeasuredCapacity)
        assertEquals(0, state.currentCapacityMah)
        assertEquals(0f, state.healthPercentage, 0.001f)
    }

    @Test
    fun healthDisplay_sysfsMeasured_takesPriorityOverRegression() {
        val reader = BatteryHardwareReader(app)
        reader.resetCapacityRegressionForTest()
        val batteryManager =
            app.getSystemService(android.content.Context.BATTERY_SERVICE) as BatteryManager

        // 先积累回归通道到收敛
        for (p in 100 downTo 64) {
            Shadows.shadowOf(batteryManager).setIntProperty(
                BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, (3800L * p * 10L).toInt()
            )
            app.sendStickyBroadcast(
                Intent(Intent.ACTION_BATTERY_CHANGED).apply {
                    putExtra(BatteryManager.EXTRA_LEVEL, p)
                    putExtra(BatteryManager.EXTRA_SCALE, 100)
                    putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
                }
            )
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
            reader.readBatteryTelemetry()
        }
        assertEquals(CapacitySource.COULOMB_REGRESSION, reader.readBatteryTelemetry().currentCapacitySource)

        // 注入探测链节点 (sysfs charge_full 可读)：sysfs 实测优先于回归通道
        val bmsDir = java.nio.file.Files.createTempDirectory("bms_probe")
        java.nio.file.Files.write(
            bmsDir.resolve("charge_full"),
            "5100000\n".toByteArray()   // 5100 mAh
        )
        com.battery.master.service.BatterySysfs.installProbeResultForTest(listOf(bmsDir.toString()))
        try {
            val state = reader.readBatteryTelemetry()
            assertEquals("sysfs 实测必须优先", CapacitySource.SYSFS, state.currentCapacitySource)
            assertEquals(5100, state.currentCapacityMah)
        } finally {
            com.battery.master.service.BatterySysfs.installProbeResultForTest(emptyList())
            bmsDir.toFile().deleteRecursively()
        }
    }
}
