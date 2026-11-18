package com.battery.master.ui.derived

import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * 续航测算纯函数回归测试 (数据诚实性红线)：
 * - 电流不可读 → UNREADABLE，不虚构时长；
 * - 浮充/待机死区 → IDLE，线性外推不产出夸张值；
 * - 放电/充电双方向 + 库仑计/估算双口径标注；
 * - 时长格式化进位。
 */
@RunWith(RobolectricTestRunner::class)
class RuntimeScoreTest {

    private fun state(
        percentage: Int = 50,
        currentMa: Int? = -1000,
        remainingMah: Int = 2400,
        currentCapacityMah: Int = 4800,
        remainingSource: CapacitySource = CapacitySource.COULOMB_COUNTER,
        status: BatteryStatus = BatteryStatus.DISCHARGING
    ) = BatteryState(
        percentage = percentage,
        currentMa = currentMa,
        remainingCapacityMah = remainingMah,
        remainingCapacitySource = remainingSource,
        currentCapacityMah = currentCapacityMah,
        hasMeasuredCapacity = currentCapacityMah > 0,
        status = status
    )

    @Test
    fun discharge_coulombMeasured_extrapolatesFromRealCharge() {
        // 2400 mAh ÷ 1000 mA = 2.4h → "2h24m"
        val estimate = RuntimeScore.estimate(state())
        assertEquals(RuntimeDirection.DISCHARGE, estimate.direction)
        assertEquals("2h24m", estimate.formatted)
        assertEquals(RuntimeScore.BASIS_COULOMB, estimate.basisLabel)
    }

    @Test
    fun discharge_estimatedBasis_fallsBackToPercentage() {
        // 无库仑计口径：4800 × 50% = 2400 mAh ÷ 1000 mA = 2.4h
        val estimate = RuntimeScore.estimate(
            state(remainingSource = CapacitySource.ESTIMATED, remainingMah = 0)
        )
        assertEquals(RuntimeDirection.DISCHARGE, estimate.direction)
        assertEquals("2h24m", estimate.formatted)
        assertEquals(RuntimeScore.BASIS_ESTIMATED, estimate.basisLabel)
    }

    @Test
    fun charge_extrapolatesTimeToFull() {
        // 距充满 4800-2400=2400 mAh ÷ 1000 mA = 2.4h
        val estimate = RuntimeScore.estimate(
            state(
                percentage = 50,
                currentMa = 1000,
                status = BatteryStatus.CHARGING
            )
        )
        assertEquals(RuntimeDirection.CHARGE, estimate.direction)
        assertEquals("2h24m", estimate.formatted)
    }

    @Test
    fun currentUnreadable_isHonestUnreadable() {
        val estimate = RuntimeScore.estimate(state(currentMa = null))
        assertEquals(RuntimeDirection.UNREADABLE, estimate.direction)
        assertTrue(estimate.hours <= 0f)
    }

    @Test
    fun floatCurrent_isIdleNotExtrapolated() {
        val estimate = RuntimeScore.estimate(state(currentMa = 16))
        assertEquals(RuntimeDirection.IDLE, estimate.direction)
    }

    @Test
    fun noCapacityData_isUnreadable() {
        val estimate = RuntimeScore.estimate(
            state(
                remainingSource = CapacitySource.ESTIMATED,
                remainingMah = 0,
                currentCapacityMah = 0
            )
        )
        assertEquals(RuntimeDirection.UNREADABLE, estimate.direction)
    }

    @Test
    fun formatDuration_boundaries() {
        assertEquals("<1m", RuntimeScore.formatDuration(0f))
        assertEquals("<1m", RuntimeScore.formatDuration(0.001f))
        assertEquals("48m", RuntimeScore.formatDuration(0.8f))
        assertEquals("1h0m", RuntimeScore.formatDuration(1f))
        assertEquals("1d2h", RuntimeScore.formatDuration(26f))
    }
}
