package com.battery.master

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatterySession
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.service.BatteryHistoryStore
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * v2.0.0-beta.1 P0 GA 修复：遥测历史持久化 (BatteryHistoryStore) 全链路单测
 *
 * 覆盖 GA 阻断项"长期数据连续性"：
 * - JSONL 样本编码/解码往返一致性 (含 null 电流、未实测电压/容量的缺省口径)；
 * - 落盘 → 重启 (新 Store 实例) → 尾部回填完整链路；
 * - 滑窗轮转：超阈值重写保留尾部，不无限膨胀；
 * - 充放电会话状态机：族切换闭合 / 断流闭合 / 无会话不误闭合；
 * - 会话持久化往返 + CSV 导出 (表头/行数/字段)；
 * - clearAll 清空 (文件删除 + 计数归零)；
 * - 全链路 Throwable 兜底：损坏行静默跳过，不抛异常。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class BatteryHistoryStoreTest {

    private lateinit var store: BatteryHistoryStore

    /** 同步执行器：文件 IO 立即执行，测试时序确定 */
    private val directExecutor = java.util.concurrent.Executor { it.run() }

    private fun sample(
        ts: Long,
        pct: Int,
        status: BatteryStatus = BatteryStatus.CHARGING,
        cur: Int? = 1200,
        v: Int = 4200,
        t: Float = 31.5f,
        cap: Int? = 4760,
        rem: Int = 2260,
        design: Int = 5000
    ): BatteryState = BatteryState(
        percentage = pct,
        status = status,
        currentMa = cur,
        voltageMv = v,
        voltageMeasured = v > 0,
        temperatureCelsius = t,
        currentCapacityMah = cap ?: 0,
        hasMeasuredCapacity = cap != null,
        remainingCapacityMah = rem,
        designCapacityMah = design,
        sampleTimestampMs = ts
    )

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        // Robolectric filesDir 每用例独立，clearAll 防御性清理
        store = BatteryHistoryStore(context, directExecutor)
        store.clearAll()
        store.flush()
    }

    // ---- 编码/解码往返 ----

    @Test
    fun sampleEncodeDecodeRoundTripPreservesFields() {
        val original = sample(ts = 1_700_000_000_000L, pct = 45, cur = -1150, t = 32.7f)
        val decoded = store.decodeSample(store.encodeSample(original).trim())
        assertNotNull(decoded)
        assertEquals(original.sampleTimestampMs, decoded!!.sampleTimestampMs)
        assertEquals(original.percentage, decoded.percentage)
        assertEquals(original.status, decoded.status)
        assertEquals(original.currentMa, decoded.currentMa)
        assertEquals(original.voltageMv, decoded.voltageMv)
        assertTrue(decoded.voltageMeasured)
        assertEquals(original.temperatureCelsius, decoded.temperatureCelsius, 0.05f)
        assertEquals(original.currentCapacityMah, decoded.currentCapacityMah)
        assertTrue(decoded.hasMeasuredCapacity)
        assertEquals(original.remainingCapacityMah, decoded.remainingCapacityMah)
        assertEquals(original.designCapacityMah, decoded.designCapacityMah)
    }

    @Test
    fun decodeSampleOmitsUnmeasuredVoltageAndCapacity() {
        // 电压/容量未实测 → 编码缺省 (诚实口径)，解码 voltageMeasured=false / hasMeasuredCapacity=false
        val original = sample(ts = 1L, pct = 30, v = 0, cap = null).copy(voltageMeasured = false)
        val line = store.encodeSample(original)
        assertFalse("未实测电压不应落盘", line.contains("\"v\""))
        assertFalse("未实测容量不应落盘", line.contains("\"cap\""))
        val decoded = store.decodeSample(line.trim())!!
        assertFalse(decoded.voltageMeasured)
        assertFalse(decoded.hasMeasuredCapacity)
        assertEquals(0, decoded.currentCapacityMah)
    }

    @Test
    fun decodeCorruptedLineReturnsNullNotThrow() {
        assertNull(store.decodeSample("not-a-json"))
        assertNull(store.decodeSample("{\"ts\":\"broken-array\"}"))
        assertNull(store.decodeSample(""))
    }

    // ---- 落盘 → 重启回填 ----

    @Test
    fun appendSamplePersistsAndReloadAcrossRestart() {
        val samples = (1..5).map { sample(ts = it * 1000L, pct = it * 10) }
        samples.forEach { store.appendSample(it) }

        // 模拟进程重启：全新 Store 实例读同一文件
        val context = ApplicationProvider.getApplicationContext<Context>()
        val restarted = BatteryHistoryStore(context, directExecutor)
        val restored = restarted.loadRecentSamples()
        assertEquals(5, restored.size)
        assertEquals(1000L, restored.first().sampleTimestampMs)
        assertEquals(5000L, restored.last().sampleTimestampMs)
        assertEquals(50, restored.last().percentage)
    }

    @Test
    fun loadRecentSamplesCapsAtRequestedMax() {
        (1..10).forEach { store.appendSample(sample(ts = it * 1000L, pct = it * 10)) }
        val restored = store.loadRecentSamples(maxSamples = 3)
        assertEquals(3, restored.size)
        assertEquals(8000L, restored.first().sampleTimestampMs)
        assertEquals(10000L, restored.last().sampleTimestampMs)
    }

    @Test
    fun missingTimestampIsStampedAtAppend() {
        var now = 1_700_000_000_999L
        val stampedStore = BatteryHistoryStore(
            ApplicationProvider.getApplicationContext(),
            directExecutor,
            wallClock = { now }
        )
        val state = sample(ts = 0, pct = 66) // 发布源头遗漏打点
        stampedStore.appendSample(state)
        val restored = stampedStore.loadRecentSamples()
        assertEquals(1, restored.size)
        assertEquals(now, restored.first().sampleTimestampMs)
    }

    // ---- 滑窗轮转 ----

    @Test
    fun samplesFileRotatesBeyondThreshold() {
        (1..BatteryHistoryStore.SAMPLES_ROTATE_THRESHOLD + 50).forEach {
            store.appendSample(sample(ts = it * 1000L, pct = (it % 100)))
        }
        val restored = store.loadRecentSamples(Int.MAX_VALUE)
        // v2.0.0-beta.1 P0 回归：轮转重写必须保持 JSONL 逐行格式。
        // 旧实现 joinToString 空分隔符把 3000 行粘连成单行 → 轮转后仅 1 条可解析
        // (数据永久损坏)，旧断言 "size <= KEEP" 无法拦截，故收敛为精确计数：
        // 4050 条写入 → 触发轮转保留 3000 → 再追加 50 → 恰好 3050 条全部可解码
        assertEquals(
            "轮转后样本数应精确等于 KEEP + 轮转后追加数 (粘连损坏会导致数量锐减)",
            BatteryHistoryStore.SAMPLES_KEEP + 50,
            restored.size
        )
        // 尾部样本必须保留 (滑窗语义：丢最旧保最新)
        assertEquals(
            (BatteryHistoryStore.SAMPLES_ROTATE_THRESHOLD + 50).toLong() * 1000L,
            restored.last().sampleTimestampMs
        )
        // 头部样本 = 轮转时刻窗口的第一条 (第 THRESHOLD 拍触发轮转保留最后 KEEP 条，
        // 其后追加只扩展尾部不重新裁剪) → ts = THRESHOLD-KEEP+1
        assertEquals(
            (BatteryHistoryStore.SAMPLES_ROTATE_THRESHOLD - BatteryHistoryStore.SAMPLES_KEEP + 1).toLong() * 1000L,
            restored.first().sampleTimestampMs
        )
    }

    // ---- 会话滑窗轮转 (v2.0.0-beta.1 P0 回归：与样本轮转同源缺陷) ----

    @Test
    fun sessionsFileRotatesBeyondThreshold() {
        // 交替充放状态族 → 每次切换闭合一个会话；660 拍产生约 660 条闭合会话，
        // 超过 SESSIONS_ROTATE_THRESHOLD(600) 触发轮转 (保留 SESSIONS_KEEP=500)
        (1..BatteryHistoryStore.SESSIONS_ROTATE_THRESHOLD + 60).forEach {
            store.appendSample(
                sample(
                    ts = it * 1000L,
                    pct = if (it % 2 == 0) 40 else 60,
                    status = if (it % 2 == 0) BatteryStatus.CHARGING else BatteryStatus.DISCHARGING,
                    cur = if (it % 2 == 0) 2000 else -800
                )
            )
        }
        store.flush() // 闭合最后一个进行中的会话
        val restored = store.loadSessions(Int.MAX_VALUE)
        // 轮转后必须仍有至少 SESSIONS_KEEP 条可解码会话——
        // 粘连损坏会让该数锐减到 ~1，精确下限拦截磁盘级会话丢失
        assertTrue(
            "会话轮转后数量应收敛到 KEEP 窗口 (粘连损坏会导致锐减)",
            restored.size in BatteryHistoryStore.SESSIONS_KEEP..BatteryHistoryStore.SESSIONS_KEEP + 60
        )
        // 时间升序且尾部会话为最后闭合的那条
        assertTrue(restored.zipWithNext().all { (a, b) -> a.endTimestampMs <= b.endTimestampMs })
        assertEquals(
            (BatteryHistoryStore.SESSIONS_ROTATE_THRESHOLD + 60).toLong() * 1000L,
            restored.last().endTimestampMs
        )
    }

    // ---- 充放电会话状态机 ----

    @Test
    fun sessionClosesOnStatusFamilySwitch() {
        val closed = mutableListOf<BatterySession>()
        store.onSessionClosed = { closed.add(it) }

        store.appendSample(sample(ts = 1_000L, pct = 30, status = BatteryStatus.CHARGING, cur = 2000))
        store.appendSample(sample(ts = 2_000L, pct = 60, status = BatteryStatus.FULL, cur = 20))
        store.appendSample(sample(ts = 3_000L, pct = 90, status = BatteryStatus.DISCHARGING, cur = -800))

        // 充电族 (CHARGING/FULL) 在切到 DISCHARGING 时闭合为一个会话
        assertEquals(1, closed.size)
        val charge = closed.first()
        assertEquals(BatterySession.SessionType.CHARGE, charge.type)
        assertEquals(30, charge.startPercentage)
        assertEquals(90, charge.endPercentage)
        assertEquals(2000L, charge.durationMs)
        // 族切换边界样本更新旧会话终点 (endPct=90) 但不计入样本数/均值电流 (电流属新族)
        assertEquals(2, charge.sampleCount)
        assertTrue(charge.averageCurrentMa!! > 0)
    }

    @Test
    fun sessionClosesOnSamplingGap() {
        val closed = mutableListOf<BatterySession>()
        store.onSessionClosed = { closed.add(it) }

        store.appendSample(sample(ts = 1_000L, pct = 50, status = BatteryStatus.CHARGING))
        // 超过 SESSION_GAP_MS 断流 (退后台/重启)
        store.appendSample(
            sample(
                ts = 1_000L + BatteryHistoryStore.SESSION_GAP_MS + 1,
                pct = 70,
                status = BatteryStatus.CHARGING
            )
        )
        assertEquals(1, closed.size)
        assertEquals(50, closed.first().startPercentage)
        assertEquals(50, closed.first().endPercentage)
    }

    @Test
    fun noSessionClosedWithoutSamples() {
        val closed = mutableListOf<BatterySession>()
        store.onSessionClosed = { closed.add(it) }
        store.flush()
        assertTrue(closed.isEmpty())
    }

    @Test
    fun openSessionClosedByFlush() {
        val closed = mutableListOf<BatterySession>()
        store.onSessionClosed = { closed.add(it) }
        store.appendSample(sample(ts = 5_000L, pct = 80, status = BatteryStatus.DISCHARGING, cur = -300))
        store.flush() // VM onCleared 路径：闭合打开中的会话
        assertEquals(1, closed.size)
        assertEquals(BatterySession.SessionType.DISCHARGE, closed.first().type)
        assertEquals(80, closed.first().startPercentage)
    }

    @Test
    fun sessionsPersistAndReloadAcrossRestart() {
        store.appendSample(sample(ts = 1_000L, pct = 20, status = BatteryStatus.DISCHARGING, cur = -500))
        store.appendSample(sample(ts = 2_000L, pct = 10, status = BatteryStatus.CHARGING, cur = 1500))
        store.appendSample(sample(ts = 30_000L, pct = 30, status = BatteryStatus.NOT_CHARGING, cur = 0))

        val context = ApplicationProvider.getApplicationContext<Context>()
        val restarted = BatteryHistoryStore(context, directExecutor)
        val sessions = restarted.loadSessions()
        assertEquals(2, sessions.size)
        assertEquals(BatterySession.SessionType.DISCHARGE, sessions[0].type)
        assertEquals(-10, sessions[0].deltaPercentage)
        assertEquals(BatterySession.SessionType.CHARGE, sessions[1].type)
        assertEquals(20, sessions[1].deltaPercentage)
    }

    // ---- CSV 导出 ----

    @Test
    fun samplesCsvExportHasHeaderAndRows() {
        store.appendSample(sample(ts = 1_700_000_000_000L, pct = 45, cur = -1150))
        val csv = store.buildSamplesCsv(store.loadRecentSamples(Int.MAX_VALUE))
        val lines = csv.trim().lines()
        assertTrue(lines[0].startsWith("time_iso,timestamp_ms,percentage,status,current_ma"))
        assertEquals(2, lines.size)
        assertTrue(lines[1].contains("45"))
        assertTrue(lines[1].contains("-1150"))
        assertTrue(lines[1].contains("CHARGING"))
    }

    @Test
    fun sessionsCsvExportHasHeaderAndRows() {
        store.appendSample(sample(ts = 1_000L, pct = 20, status = BatteryStatus.DISCHARGING, cur = -500))
        store.appendSample(sample(ts = 2_000L, pct = 10, status = BatteryStatus.CHARGING))
        store.flush() // 闭合打开中的会话，两个会话均落盘
        val csv = store.buildSessionsCsv(store.loadSessions())
        val lines = csv.trim().lines()
        assertTrue(lines[0].startsWith("type,start_iso,end_iso,duration_min"))
        assertEquals(3, lines.size)
        assertTrue(lines[1].startsWith("DISCHARGE,"))
        assertTrue(lines[2].startsWith("CHARGE,"))
    }

    @Test
    fun exportSamplesCsvWritesFileToExportsDir() {
        store.appendSample(sample(ts = 1_700_000_000_000L, pct = 45))
        val file = store.exportSamplesCsv()
        assertNotNull(file)
        assertTrue(file!!.exists())
        assertTrue(file.absolutePath.contains(BatteryHistoryStore.EXPORT_DIR_NAME))
        assertTrue(file.length() > 0)
        // 空历史导出 → null (诚实不输出空文件)
        store.clearAll()
        store.flush()
        assertNull(store.exportSamplesCsv())
    }

    // ---- 清空 ----

    @Test
    fun clearAllRemovesFilesAndCounters() {
        store.appendSample(sample(ts = 1_000L, pct = 50))
        store.appendSample(sample(ts = 2_000L, pct = 60, status = BatteryStatus.DISCHARGING))
        store.appendSample(sample(ts = 3_000L, pct = 70))
        store.flush()

        val context = ApplicationProvider.getApplicationContext<Context>()
        store.clearAll()
        store.flush()
        assertTrue(store.loadRecentSamples().isEmpty())
        assertTrue(store.loadSessions().isEmpty())

        // 重启后同样为空 (文件确已删除)
        val restarted = BatteryHistoryStore(context, directExecutor)
        assertTrue(restarted.loadRecentSamples().isEmpty())
    }

    // ---- v2.2.0 数据库维度审计：轮转原子性与崩溃韧性 ----

    @Test
    fun rotationLeavesNoTmpResidueAndLegacyTmpDoesNotCorruptRestore() {
        // 1) 正常轮转后 telemetry 目录不得残留 .tmp 中间文件
        (1..BatteryHistoryStore.SAMPLES_ROTATE_THRESHOLD + 10).forEach {
            store.appendSample(sample(ts = it * 1000L, pct = (it % 100)))
        }
        val context = ApplicationProvider.getApplicationContext<Context>()
        val telemetryDir = java.io.File(context.filesDir, "telemetry")
        assertTrue(
            "轮转完成后不得残留 tmp 中间文件",
            telemetryDir.listFiles()!!.none { it.name.endsWith(".tmp") }
        )
        // 2) 崩溃遗留的 tmp 垃圾文件 (上次轮转被杀) 不影响新实例恢复与后续轮转
        java.io.File(telemetryDir, "samples.jsonl.tmp").writeText("garbage-from-killed-process")
        java.io.File(telemetryDir, "sessions.jsonl.tmp").writeText("garbage-from-killed-process")
        val restarted = BatteryHistoryStore(context, directExecutor)
        assertTrue(restarted.loadRecentSamples().isNotEmpty())
        // 再次触发轮转 (样本与会话均超阈值)：遗留 tmp 必须被覆盖清理，正式文件不受污染
        (1..BatteryHistoryStore.SAMPLES_ROTATE_THRESHOLD + 10).forEach {
            restarted.appendSample(
                sample(
                    ts = 100_000_000L + it * 1000L,
                    pct = if (it % 2 == 0) 40 else 60,
                    status = if (it % 2 == 0) BatteryStatus.CHARGING else BatteryStatus.DISCHARGING,
                    cur = if (it % 2 == 0) 2000 else -800
                )
            )
        }
        restarted.flush()
        assertTrue(
            "再次轮转后遗留 tmp 应被清理",
            telemetryDir.listFiles()!!.none { it.name.endsWith(".tmp") }
        )
        val samplesText = java.io.File(telemetryDir, "samples.jsonl").readText()
        val sessionsText = java.io.File(telemetryDir, "sessions.jsonl").readText()
        assertFalse("tmp 垃圾内容不得混入正式样本文件", samplesText.contains("garbage"))
        assertFalse("tmp 垃圾内容不得混入正式会话文件", sessionsText.contains("garbage"))
    }

    @Test
    fun truncatedLastLineFromProcessKillIsSkippedOnRestore() {
        // 模拟进程被杀：追加写入只落了半行 JSON (无完整行)
        (1..5).forEach { store.appendSample(sample(ts = it * 1000L, pct = it * 10)) }
        val context = ApplicationProvider.getApplicationContext<Context>()
        val telemetryDir = java.io.File(context.filesDir, "telemetry")
        java.io.File(telemetryDir, "samples.jsonl")
            .appendText("{\"ts\":6000,\"pct\":6")   // 半行截断
        // 新实例恢复：损坏行静默跳过，完整样本全部恢复，不抛异常
        val restarted = BatteryHistoryStore(context, directExecutor)
        val restored = restarted.loadRecentSamples(Int.MAX_VALUE)
        assertEquals("半行损坏必须跳过且不污染其余样本", 5, restored.size)
        assertEquals(1000L, restored.first().sampleTimestampMs)
        assertEquals(5000L, restored.last().sampleTimestampMs)
        // 恢复后继续写入正常 (损坏行不得阻塞追加链路)
        restarted.appendSample(sample(ts = 7_000L, pct = 70))
        assertEquals(6, restarted.loadRecentSamples(Int.MAX_VALUE).size)
    }
}
