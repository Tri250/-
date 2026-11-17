package com.battery.master.service

import android.content.Context
import android.os.SystemClock
import android.provider.Settings
import com.battery.master.data.DeviceUsageSnapshot

/**
 * 设备使用时长追踪器 (真实数据，0 权限，v2.1.0 新增)
 *
 * 三项真实数据源：
 * 1. 本次开机时长：SystemClock.elapsedRealtime (含息屏待机，重启归零)
 * 2. 跨重启累计使用时长：应用存活期 1Hz 累加 + SharedPreferences 持久化；
 *    应用未运行的时间不计 (不虚构出厂首开时间，UI 明示口径)
 * 3. 真实开机次数：Settings.Global.BOOT_COUNT (系统级统计，自恢复出厂起)
 *
 * 重启检测双信号：
 * - 主信号：BOOT_COUNT 递增 (恢复出厂才会归零，应用升级/杀进程不清零)——
 *   覆盖"应用死于开机初期 + 长时间未运行"场景：此时 elapsed 漏判窗口
 *   (persisted last < 重启后 now) 由 BOOT_COUNT 兜住；
 * - 回退信号：elapsedRealtime 单调回退 (last > now 必为重启后归零重来)，
 *   BOOT_COUNT 不可读的 ROM 上仍然正确；无需 binder 调用，每拍即时判定。
 *
 * 时钟与 BOOT_COUNT 读取均为注入点 (仿 BatteryViewModel.elapsedClock 既有模式)，
 * 测试注入虚拟时钟获得确定性时序。
 */
internal class DeviceUsageTracker(context: Context) {

    /** 时钟注入点：生产走 SystemClock.elapsedRealtime；测试注入虚拟时钟 */
    internal var tickerClock: () -> Long = SystemClock::elapsedRealtime

    /** BOOT_COUNT 读取注入点：null 表示系统未提供 (ROM 差异)；测试注入虚拟值 */
    internal var bootCountReader: () -> Int? = { readBootCountFromSettings() }

    private val appContext: Context = context.applicationContext

    /** 与 BatteryHardwareReader 同一 prefs 文件 (单一存储域，备份规则已显式排除) */
    private val prefs = try {
        appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    } catch (e: Throwable) {
        null
    }

    // 启动闪退治理：持久化恢复异常不阻塞构造 (与 reader prefs 同款 try-catch)
    private var accumulatedMs: Long = 0L
    private var lastElapsedMs: Long = -1L
    private var lastBootCount: Int? = null

    /** 本次进程存活期内检测到过重启 (UI 角标"累计时长已保留") */
    var rebootDetected: Boolean = false
        private set

    private var ticksSincePersist = 0L
    private var ticksSinceBootCountRead = 0L

    init {
        try {
            val p = prefs
            if (p != null) {
                accumulatedMs = p.getLong(KEY_ACCUMULATED_MS, 0L)
                lastElapsedMs = p.getLong(KEY_LAST_ELAPSED_MS, -1L)
                if (p.contains(KEY_BOOT_COUNT_LAST)) {
                    lastBootCount = p.getInt(KEY_BOOT_COUNT_LAST, 0)
                }
            }
        } catch (e: Throwable) {
            // 恢复失败按首次使用处理，不影响启动
        }
    }

    /**
     * 每拍推进 (1Hz，由 ViewModel 轮询循环在前后台门控之外调用——
     * 后台存活期仍属"应用运行期"，轮询循环 delay 不中断，累计不漏拍)。
     * 全链路 try-catch，任何异常只跳过本拍，不逃逸到调用方。
     */
    fun tick() {
        try {
            val now = tickerClock()
            ticksSinceBootCountRead++

            // 快速路径：elapsed 单调回退 = 重启 (每拍即时判定)。
            // 重启瞬间顺带刷新 BOOT_COUNT (低频事件，binder 调用仅此一次)，
            // 保证 UI 开机次数角标立即反映新值
            if (lastElapsedMs >= 0L && lastElapsedMs > now) {
                val freshBootCount = try {
                    bootCountReader()
                } catch (e: Throwable) {
                    null
                }
                handleReboot(now, newBootCount = freshBootCount)
                return
            }

            // 慢速路径：BOOT_COUNT 周期性读取 (binder 调用降频，1 次/10 拍)——
            // 系统级主信号，覆盖 elapsed 漏判窗口 (见类注释)
            if (lastElapsedMs < 0L || ticksSinceBootCountRead >= BOOT_COUNT_READ_EVERY_TICKS) {
                ticksSinceBootCountRead = 0L
                val currentBootCount = try {
                    bootCountReader()
                } catch (e: Throwable) {
                    null
                }
                if (currentBootCount != null) {
                    val last = lastBootCount
                    if (last != null && currentBootCount > last) {
                        handleReboot(now, newBootCount = currentBootCount)
                        return
                    }
                    lastBootCount = currentBootCount
                }
            }

            if (lastElapsedMs < 0L) {
                // 首拍：建立引用基线，累计从本拍起增长 (不追溯进程启动前的时长)
                lastElapsedMs = now
                persistNow()
                return
            }

            // 单拍 delta 防御上限 (24h)：elapsedRealtime 理论单调连续，上限仅防异常时钟源
            val delta = (now - lastElapsedMs).coerceIn(0L, MAX_TICK_DELTA_MS)
            lastElapsedMs = now
            accumulatedMs += delta
            ticksSincePersist++
            if (ticksSincePersist >= PERSIST_EVERY_TICKS) persistNow()
        } catch (e: Throwable) {
            // 单拍失败不影响累计语义，下一拍继续
        }
    }

    /** 快照 (UI 单源)：uptime 实时读钟，累计/开机次数读内存态 */
    fun snapshot(): DeviceUsageSnapshot = try {
        DeviceUsageSnapshot(
            uptimeMs = tickerClock().coerceAtLeast(0L),
            cumulativeMs = accumulatedMs.coerceAtLeast(0L),
            bootCount = lastBootCount,
            rebootDetected = rebootDetected
        )
    } catch (e: Throwable) {
        DeviceUsageSnapshot(0L, accumulatedMs.coerceAtLeast(0L), lastBootCount, rebootDetected)
    }

    /** 退出前落盘当前累计段 (ViewModel.onCleared 调用)，防止最后一段使用时长丢失 */
    fun flush() {
        try {
            if (lastElapsedMs >= 0L) {
                val now = tickerClock()
                val delta = (now - lastElapsedMs).coerceIn(0L, MAX_TICK_DELTA_MS)
                accumulatedMs += delta
                lastElapsedMs = now
            }
            persistNow()
        } catch (e: Throwable) {
        }
    }

    /** 重启处理：保留累计、重置 elapsed 引用 (重启间隙不计)、立即落盘 */
    private fun handleReboot(nowElapsed: Long, newBootCount: Int?) {
        rebootDetected = true
        lastElapsedMs = nowElapsed
        newBootCount?.let { lastBootCount = it }
        persistNow()
    }

    private fun persistNow() {
        ticksSincePersist = 0L
        val p = prefs ?: return
        try {
            val editor = p.edit()
            editor.putLong(KEY_ACCUMULATED_MS, accumulatedMs)
            if (lastElapsedMs >= 0L) {
                editor.putLong(KEY_LAST_ELAPSED_MS, lastElapsedMs)
            }
            lastBootCount?.let { editor.putInt(KEY_BOOT_COUNT_LAST, it) }
            editor.apply()
        } catch (e: Throwable) {
        }
    }

    private fun readBootCountFromSettings(): Int? = try {
        Settings.Global.getInt(appContext.contentResolver, Settings.Global.BOOT_COUNT)
    } catch (e: Throwable) {
        null
    }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_ACCUMULATED_MS = "usage_accumulated_ms"
        private const val KEY_LAST_ELAPSED_MS = "usage_last_elapsed_ms"
        private const val KEY_BOOT_COUNT_LAST = "usage_boot_count_last"

        /** 落盘节奏：每 10 拍 + 重启检测瞬间 + flush；最坏丢失约 10s 计量，语义不受影响 */
        private const val PERSIST_EVERY_TICKS = 10

        /** BOOT_COUNT binder 读取降频：每 10 拍 1 次 (首拍必读建立基线) */
        private const val BOOT_COUNT_READ_EVERY_TICKS = 10

        /** 单拍 delta 防御上限 (24h) */
        private const val MAX_TICK_DELTA_MS = 24L * 60 * 60 * 1000
    }
}
