package com.battery.master

import com.battery.master.service.VoltageStressWearModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.pow

/**
 * v2.2.1 电压-寿命应力磨损模型数学断言 (Choi 2002 + Asakura 2003 公开方法学)。
 *
 * 核心不变量全部可溯源：
 * - rate(V) = 2^(10·(V−4.2))：由 "每 0.1V 循环寿命减半" (Choi 2002 Fig.1，
 *   Asakura 2003 交叉验证) 直接反演——4.2V 基准 ×1.00，4.3V ×2.00，4.1V ×0.50；
 * - 3.95V 以下钳制 (AccuBattery 公开方法学：SEI 钝化机制未量化，不虚构速率曲线)；
 * - 1 磨损循环 ≡ 4.2V 恒压暴露 2.5h (Choi 2002 实验条件：1C 充电 + CV 浮充
 *   2.5h + 1C 放电为完整循环，CV 段为主要伤害源)。
 */
class VoltageStressWearModelTest {

    /** 基准：rate(4.2V) = ×1.00 */
    @Test
    fun rateAtReferenceVoltage_isOne() {
        assertEquals(1.0, VoltageStressWearModel.relativeWearRate(4200)!!, 1e-9)
    }

    /** Choi/Asakura 定律：每 ±0.1V 速率翻倍/减半 */
    @Test
    fun rateDoublesPer100mV() {
        assertEquals(2.0, VoltageStressWearModel.relativeWearRate(4300)!!, 1e-9)
        assertEquals(0.5, VoltageStressWearModel.relativeWearRate(4100)!!, 1e-9)
        // 0.2V = 4 倍 (指数复合)
        assertEquals(4.0, VoltageStressWearModel.relativeWearRate(4400)!!, 1e-9)
        assertEquals(0.25, VoltageStressWearModel.relativeWearRate(4000)!!, 1e-9)
        // 非整档：4.35V = 2^1.5
        assertEquals(2.0.pow(1.5), VoltageStressWearModel.relativeWearRate(4350)!!, 1e-9)
    }

    /** 速率随电压单调递增 (高压 = 高应力，物理不变量) */
    @Test
    fun rateIsMonotonicallyIncreasing() {
        var prev = 0.0
        for (mv in 3950..4600 step 10) {
            val rate = VoltageStressWearModel.relativeWearRate(mv)!!
            assertTrue("rate($mv) 必须严格递增", rate > prev)
            prev = rate
        }
    }

    /** 3.95V 以下钳制：机制未量化，速率不再随电压下降 (不虚构曲线) */
    @Test
    fun rateClampedBelowQuantifiedFloor() {
        val floorRate = VoltageStressWearModel.relativeWearRate(3950)!!
        assertEquals(
            "3920-3950 之间的电压应按 3.95V 钳制",
            floorRate,
            VoltageStressWearModel.relativeWearRate(3940)!!,
            1e-9
        )
        assertEquals(floorRate, VoltageStressWearModel.relativeWearRate(3921)!!, 1e-9)
        assertEquals(
            "钳制值 = 2^(10·(3.95−4.2)) = 2^-2.5",
            2.0.pow(-2.5),
            floorRate,
            1e-9
        )
    }

    /** 有效读数域外返回 null (诚实不输出)：超域读数 (VBUS 总线端/过放毛刺) 不参与积分 */
    @Test
    fun rateNullOutsideValidDomain() {
        assertNull(VoltageStressWearModel.relativeWearRate(2999))
        assertNull(VoltageStressWearModel.relativeWearRate(4601))
        assertNull(VoltageStressWearModel.relativeWearRate(0))
    }

    /** 换算基准：4.2V 恒压暴露 2.5h (9,000,000 ms) = 1.0 磨损循环 */
    @Test
    fun wearCycles_referenceExposureEqualsOneCycle() {
        assertEquals(
            1.0,
            VoltageStressWearModel.wearCyclesFor(4200, 9_000_000L)!!,
            1e-9
        )
    }

    /** 积分线性：4.1V (rate=0.5) 暴露 2.5h = 0.5 循环；时长线性缩放 */
    @Test
    fun wearCycles_linearInRateAndDuration() {
        assertEquals(0.5, VoltageStressWearModel.wearCyclesFor(4100, 9_000_000L)!!, 1e-9)
        assertEquals(
            "时长减半磨损减半",
            0.5,
            VoltageStressWearModel.wearCyclesFor(4200, 4_500_000L)!!,
            1e-9
        )
    }

    /** 零/负时长 = 0 磨损；无效电压 = null */
    @Test
    fun wearCycles_degenerateInputs() {
        assertEquals(0.0, VoltageStressWearModel.wearCyclesFor(4200, 0L)!!, 1e-9)
        assertEquals(0.0, VoltageStressWearModel.wearCyclesFor(4200, -1L)!!, 1e-9)
        assertNull(VoltageStressWearModel.wearCyclesFor(5000, 9_000_000L))
    }

    /** 速率文案格式 (US locale 保证小数点) */
    @Test
    fun rateLabel_format() {
        assertEquals("×1.00", VoltageStressWearModel.rateLabel(1.0))
        assertEquals("×2.83", VoltageStressWearModel.rateLabel(2.8284271247461903))
    }
}
