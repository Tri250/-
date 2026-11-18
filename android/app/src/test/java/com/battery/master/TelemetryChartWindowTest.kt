package com.battery.master

import com.battery.master.data.BatteryState
import com.battery.master.ui.telemetrySeriesBounds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * v2.2.0 真实性审计：遥测分析曲线窗口真实性断言 (纯 JUnit，无 Robolectric)。
 *
 * 旧实现电压/电流/温度曲线使用固定归一化窗口 (3000~5000 mV / ±6000 mA / 0~60°C)，
 * 窗口外的真实读数被 coerceIn 削顶——双电芯整包 8800 mV、120W 快充 ±8000 mA、
 * 实验室滑杆 12000 mV、高温 >60°C 的曲线全部贴边失真，曲线不再与实际读数一致。
 * 修复后窗口由真实样本动态推导 (telemetrySeriesBounds)，本测试锁定该契约。
 */
class TelemetryChartWindowTest {

    private fun state(
        voltageMv: Int = 4000,
        currentMa: Int? = 0,
        temperatureCelsius: Float = 25f
    ) = BatteryState(
        voltageMv = voltageMv,
        voltageMeasured = true,
        currentMa = currentMa,
        temperatureCelsius = temperatureCelsius
    )

    @Test
    fun `双电芯整包电压 8800mV 完整落在窗口内 (旧固定窗口削顶失真)`() {
        val history = listOf(
            state(voltageMv = 7600),
            state(voltageMv = 8200),
            state(voltageMv = 8800) // 串联双电芯整包电压，旧窗口 3000~5000 全部贴顶
        )
        val (lo, hi) = telemetrySeriesBounds(history, { it.voltageMv.toFloat() }, 3000f, 5000f)
        history.forEach { s ->
            assertTrue("窗口 [$lo,$hi] 必须包含真实读数 ${s.voltageMv}", s.voltageMv.toFloat() in lo..hi)
        }
        // 旧固定窗口上界 5000 不得再出现 (削顶即失实)
        assertTrue("动态窗口上界应覆盖 8800 mV 读数而非旧固定 5000", hi >= 8800f)
    }

    @Test
    fun `120W 快充放电 -8000mA 完整落在窗口内 (旧固定窗口 ±6000 削顶)`() {
        val history = listOf(
            state(currentMa = 4800),
            state(currentMa = -6000),
            state(currentMa = -8000) // 120W 级快放，旧窗口 ±6000 贴底
        )
        val (lo, hi) = telemetrySeriesBounds(history, { (it.currentNowMa ?: 0).toFloat() }, -6000f, 6000f)
        history.forEach { s ->
            val v = (s.currentNowMa ?: 0).toFloat()
            assertTrue("窗口 [$lo,$hi] 必须包含真实电流 $v", v in lo..hi)
        }
        assertTrue("动态窗口下界应覆盖 -8000 mA 而非旧固定 -6000", lo <= -8000f)
    }

    @Test
    fun `高温 85C 读数完整落在窗口内 (旧固定窗口 0~60 削顶)`() {
        val history = listOf(state(temperatureCelsius = 30f), state(temperatureCelsius = 85f))
        val (lo, hi) = telemetrySeriesBounds(history, { it.temperatureCelsius }, 0f, 60f)
        assertTrue(85f in lo..hi)
    }

    @Test
    fun `典型单电芯读数窗口与旧固定窗口量级一致 (不回归)`() {
        val history = listOf(state(voltageMv = 3400), state(voltageMv = 4200))
        val (lo, hi) = telemetrySeriesBounds(history, { it.voltageMv.toFloat() }, 3000f, 5000f)
        // 动态窗口需覆盖全部样本且带 8% 余量，同时量级仍在单电芯区间 (不放大失真)
        assertTrue(lo <= 3400f)
        assertTrue(hi >= 4200f)
        assertTrue(lo >= 3000f - 400f)
        assertTrue(hi <= 5000f + 400f)
    }

    @Test
    fun `空历史回落典型窗口`() {
        val (lo, hi) = telemetrySeriesBounds(emptyList(), { it.voltageMv.toFloat() }, 3000f, 5000f)
        assertEquals(3000f, lo)
        assertEquals(5000f, hi)
    }

    @Test
    fun `平坦序列以真实读数为中心取小窗 (整条线不贴边)`() {
        val history = listOf(state(voltageMv = 8800), state(voltageMv = 8800))
        val (lo, hi) = telemetrySeriesBounds(history, { it.voltageMv.toFloat() }, 3000f, 5000f)
        // 读数居中：上下对称小窗，线不贴边且窗口含读数
        assertEquals(8800f, (lo + hi) / 2f, 0.5f)
        assertTrue(hi - lo >= 2f)
        assertTrue(8800f in lo..hi)
    }
}
