package com.battery.master.service

import android.content.Context
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus

/**
 * 电压应力磨损积分器 (v2.2.1)：对充电/满充保持期的实测电压做时间离散积分
 *
 * - **积分对象**：充电族 (CHARGING/FULL) 且电压双通道实测帧——FULL (CV 浮充/
 *   满充保持) 正是 Choi 2002 Fig.2 认定的主要伤害段，与 CHARGING 同等参与积分；
 * - **放电/未充电不计** (模型口径为充电应力)；**电压不可测帧不积分且重置基线**
 *   (防跨断档把消失时长折算成高压暴露)；
 * - **同拍去重**：dt <= 0 跳过 (轮询 + 广播同秒双源各触发一次 publish)；
 * - **断流防御**：dt > [MAX_DT_MS] (进程休眠/后台被杀后恢复的第一帧) 视为断流，
 *   该段时长不计、基线重置为新样本时刻 (宁可少计不可虚计)；
 * - **持久化**：独立 prefs 文件，Double 以 raw bits 存取，30s 节流落盘 +
 *   flush() 强制；恢复失败按零重新积分，不阻塞启动 (启动闪退治理口径)；
 * - **诚实输出**：电压未实测/速率不可算时 [lastRate] 为 null，UI 显示 "—"；
 *   全部输出须由 UI 标注 "[模型预测]"，非实测值。
 *
 * 测试：时钟注入点 [wallClock]，与 DeviceUsageTracker/BatteryHistoryStore 同模式。
 */
internal class BatteryWearTracker(context: Context) {

    /** 时钟注入点：生产走 System.currentTimeMillis；测试注入虚拟时钟 */
    internal var wallClock: () -> Long = { System.currentTimeMillis() }

    private val appContext: Context = context.applicationContext

    private val prefs = try {
        appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    } catch (e: Throwable) {
        null
    }

    /** 上次积分基线 (充电族 + 电压实测帧的采样时刻)；-1 = 无基线 (下帧只建基线) */
    private var lastChargingSampleMs = -1L

    /** 最近一次可计算的相对磨损速率 (UI 实时展示；null = 不可测) */
    var lastRate: Double? = null
        private set

    /** 累计等效磨损循环 (4.2V 恒压暴露 2.5h = 1.0) */
    var accumulatedWearCycles: Double = 0.0
        private set

    /** >3.92V 高压暴露累计毫秒 (Choi 双机制拐点以上) */
    var highStressMs: Long = 0L
        private set

    /** 参与积分的样本间隔数 (非帧数——同拍去重与断流段不计) */
    var sampleCount: Long = 0L
        private set

    private var lastPersistMs = 0L

    init {
        try {
            val p = prefs
            if (p != null) {
                if (p.contains(KEY_ACCUMULATED)) {
                    accumulatedWearCycles = Double.fromBits(p.getLong(KEY_ACCUMULATED, 0L))
                }
                highStressMs = p.getLong(KEY_HIGH_STRESS_MS, 0L)
                sampleCount = p.getLong(KEY_SAMPLE_COUNT, 0L)
            }
        } catch (e: Throwable) {
            // 类型污染/损坏：按零重新积分，不影响启动 (与 Regressor/UsageTracker 同口径)
            accumulatedWearCycles = 0.0
            highStressMs = 0L
            sampleCount = 0L
        }
    }

    /**
     * 每帧遥测喂入 (真实硬件帧，发布源头调用)；返回当前电压相对磨损速率 (可空)。
     * 与历史入档同语义：无论 UI 展示态 (模拟冻结/实验室覆盖) 如何，真实硬件帧
     * 均如实积分——调用方须在冻结判定之前喂入。
     */
    fun observe(state: BatteryState): Double? {
        return try {
            val rate = if (state.voltageMeasured) {
                VoltageStressWearModel.relativeWearRate(state.voltageMv)
            } else {
                null
            }
            lastRate = rate

            val charging = state.status == BatteryStatus.CHARGING ||
                state.status == BatteryStatus.FULL
            val ts = state.sampleTimestampMs
            val integrable = charging && state.voltageMeasured && ts > 0

            if (integrable) {
                val last = lastChargingSampleMs
                lastChargingSampleMs = ts
                if (last >= 0) {
                    val dt = ts - last
                    if (dt > 0 && dt <= MAX_DT_MS) {
                        VoltageStressWearModel.wearCyclesFor(state.voltageMv, dt)?.let { wear ->
                            accumulatedWearCycles += wear
                            sampleCount++
                            if (state.voltageMv > VoltageStressWearModel.STRESS_KNEE_MV) {
                                highStressMs += dt
                            }
                            persistThrottled(ts)
                        }
                    }
                    // dt <= 0：同拍重复 (轮询+广播同秒)，跳过不重复积分；
                    // dt > MAX_DT_MS：断流，基线已刷新，该段时长不计 (宁可少计)
                }
            } else if (!charging || !state.voltageMeasured) {
                // 放电/未充电/电压不可测：断开积分链，防止恢复帧把间隙折算成暴露
                lastChargingSampleMs = -1L
            }
            // ts <= 0 的充电帧 (旧样本/未打点)：不积分也不刷新基线，等下一可信帧
            rate
        } catch (e: Throwable) {
            null
        }
    }

    /** 退出前强制落盘当前积分 (ViewModel.onCleared 调用)，防止最后一段丢失 */
    fun flush() {
        try {
            persistNow()
        } catch (e: Throwable) {
        }
    }

    /**
     * 清除全部磨损积分数据 (用户操作闭环入口：设置页/磨损卡"清除磨损数据")。
     * 内存态归零 + prefs 整文件清除 + 积分基线断开——恢复实例按零重新积分，
     * 与"未使用过"状态完全一致 (无残留半值)。
     */
    fun reset() {
        try {
            accumulatedWearCycles = 0.0
            highStressMs = 0L
            sampleCount = 0L
            lastRate = null
            lastChargingSampleMs = -1L
            lastPersistMs = 0L
            prefs?.edit()?.clear()?.apply()
        } catch (e: Throwable) {
            // 清除失败不影响调用方 (UI 快照由 VM 独立归零)；最坏残留旧值由下拍覆盖
        }
    }

    private fun persistThrottled(nowMs: Long) {
        if (nowMs - lastPersistMs >= PERSIST_EVERY_MS) persistNow()
    }

    private fun persistNow() {
        lastPersistMs = wallClock()
        val p = prefs ?: return
        try {
            val editor = p.edit()
            editor.putLong(KEY_ACCUMULATED, accumulatedWearCycles.toRawBits())
            editor.putLong(KEY_HIGH_STRESS_MS, highStressMs)
            editor.putLong(KEY_SAMPLE_COUNT, sampleCount)
            editor.apply()
        } catch (e: Throwable) {
        }
    }

    companion object {
        private const val PREFS_NAME = "battery_wear_prefs"
        private const val KEY_ACCUMULATED = "wear_accumulated_bits"
        private const val KEY_HIGH_STRESS_MS = "wear_high_stress_ms"
        private const val KEY_SAMPLE_COUNT = "wear_sample_count"

        /**
         * 积分间隔防御上限：publish 节流 400ms / 轮询 1s，120s 内视为连续充电
         * (广播突发抖动余量)；超过即断流 (进程休眠/被杀)，该段不计。
         * 上限过大会把后台消失时长虚计成高压暴露，过小会漏计快充连续段
         */
        private const val MAX_DT_MS = 120_000L

        /** 持久化节流：30s 一次 + flush 强制，最坏丢失约 30s 积分，语义不受影响 */
        private const val PERSIST_EVERY_MS = 30_000L
    }
}

/**
 * 磨损模型快照 (UI 单源)。全部字段为 [模型预测] 输出，UI 必须显式标注来源：
 * accumulatedWearCycles = 累计等效磨损循环 (4.2V×2.5h=1.0，时间积分)；
 * highStressMs = >3.92V 高压暴露累计 (Choi 双机制拐点以上)；
 * sampleCount = 参与积分的样本间隔数；lastRate = 当前电压相对磨损速率
 * (4.2V=×1.00 基准；null = 电压不可测/未计算)
 */
data class WearSnapshot(
    val accumulatedWearCycles: Double = 0.0,
    val highStressMs: Long = 0L,
    val sampleCount: Long = 0L,
    val lastRate: Double? = null
)
