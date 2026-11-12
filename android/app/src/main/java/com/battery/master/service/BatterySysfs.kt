package com.battery.master.service

import java.io.File
import kotlin.math.abs

/**
 * 电池 sysfs 节点读取与电流单位归一化工具
 *
 * 背景：BatteryManager.BATTERY_PROPERTY_CURRENT_NOW 官方规范返回微安 (μA)，
 * 但部分旧内核/芯片实际返回毫安 (mA)。若统一按某一单位换算，
 * 会在涓流区间 (0~25 mA) 产生 1000 倍误差，直接破坏指标 11 (瞬时电流)
 * 与指标 12 (完全充满判定) 的正确性，故做单位归一化处理。
 */
internal object BatterySysfs {

    /** 电池当前容量合理区间 (mAh)：区间外视为 sysfs 单位异常/脏数据，回退估算值 */
    const val MIN_PLAUSIBLE_CAPACITY_MAH = 500
    const val MAX_PLAUSIBLE_CAPACITY_MAH = 20_000

    /**
     * 静态 sysfs 节点 TTL 缓存 (毫秒)：
     * charge_full / charge_full_design / cycle_count 变化频率极低 (分钟级)，
     * 1Hz 轮询下无需每秒 open/read/close；current_now 等瞬态节点不走缓存。
     * 仅主线程访问 (ViewModel 轮询 + 广播 onReceive 均在主线程)，无需并发防护。
     */
    private const val STATIC_NODE_TTL_MS = 30_000L
    private val staticNodeCache = HashMap<String, Pair<Long, Int>>()

    /**
     * 从 Linux sysfs 读取电池节点数据
     * (例如高通/联发科平台的 /sys/class/power_supply/battery/)
     */
    fun readInt(path: String): Int? = try {
        val file = File(path)
        if (file.exists() && file.canRead()) file.readText().trim().toIntOrNull() else null
    } catch (e: Exception) {
        null
    }

    /**
     * 静态节点带 TTL 缓存读取：TTL 内直接命中内存，过期后重新读盘。
     * 节点不可读 (null) 不缓存，下一拍自动重试，节点热插拔出现后 ≤1 拍即可恢复真实读数。
     */
    fun readIntCached(path: String): Int? {
        val now = System.currentTimeMillis()
        val hit = staticNodeCache[path]
        if (hit != null && now < hit.first) return hit.second
        val fresh = readInt(path)
        if (fresh != null) staticNodeCache[path] = (now + STATIC_NODE_TTL_MS) to fresh
        return fresh
    }

    /**
     * charge_full 原始值 → mAh 容量归一化 (指标 03「电池当前容量」)：
     *
     * 1. 标准内核以 μAh 上报 (sysfs 规范)：raw/1000 落入合理区间 → 直接采用；
     * 2. 个别内核以 mAh 上报：raw/1000 落入 0~20 mAh 非法区间，但 raw 本身
     *    落入合理区间 → 按 mAh 解释采用 (v1.2.3 修复：旧逻辑"一律回退估算值"
     *    会把真实读数丢弃、健康度恒伪造 92.0%，违背真实遥测目标)；
     * 3. 两者均不在区间 → 脏数据，返回 null 由调用方回退估算值。
     */
    fun normalizeChargeFullToMilliAmps(rawUah: Int?): Int? {
        if (rawUah == null || rawUah <= 0) return null
        val asMah = rawUah / 1000
        return when {
            asMah in MIN_PLAUSIBLE_CAPACITY_MAH..MAX_PLAUSIBLE_CAPACITY_MAH -> asMah
            rawUah in MIN_PLAUSIBLE_CAPACITY_MAH..MAX_PLAUSIBLE_CAPACITY_MAH -> rawUah
            else -> null
        }
    }

    /**
     * 将 CURRENT_NOW 原始值归一化为毫安 (mA)，保持符号 (充电为正、放电为负)
     *
     * 判定策略：
     * 1. |raw| > 20000：手机不可能通过 20A+ 电流，必定是 μA，直接 /1000；
     * 2. 可读取 sysfs current_now 时做交叉校验：
     *    - sysfs ≈ 1000 × raw → raw 是 mA，sysfs 是 μA → 直接返回 raw；
     *    - raw ≈ 1000 × sysfs → raw 是 μA → /1000；
     *    - 两者同单位 → 按 Android 官方规范默认 μA → /1000；
     * 3. 无 sysfs 时按官方规范默认 μA → /1000。
     */
    fun normalizeCurrentToMilliAmps(raw: Int): Int {
        if (raw == 0 || raw == Int.MIN_VALUE) return 0
        val absRaw = abs(raw)
        if (absRaw > 20000) return raw / 1000

        val sysfsCurrent = readInt("/sys/class/power_supply/battery/current_now")
        if (sysfsCurrent != null && abs(sysfsCurrent) > 0) {
            val ratio = abs(sysfsCurrent).toFloat() / absRaw
            if (ratio in 500f..2000f) return raw
            if (ratio in (1f / 2000f)..(1f / 500f)) return raw / 1000
            return raw / 1000
        }
        return raw / 1000
    }
}
