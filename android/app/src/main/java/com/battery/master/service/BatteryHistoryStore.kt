package com.battery.master.service

import android.content.Context
import com.battery.master.data.BatterySession
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import org.json.JSONException
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.ThreadFactory
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

/**
 * v2.0.0-beta.1 P0 GA 修复：遥测历史跨会话持久化 (长期数据连续性)
 *
 * GA 阻断项"长期数据连续性"的真实现：旧版遥测历史仅存于 ViewModel 内存
 * (120 点滑窗)，App 退出即清零——"最近 120 个采样点"跨进程重启后曲线归零，
 * 充放电长期行为无法回溯。本存储把发布源头的真实硬件样本落盘：
 *
 * - **样本 JSONL**：`filesDir/telemetry/samples.jsonl`，一行一条最小化 JSON
 *   (ts/pct/status/current/voltage/temp/capacity 等)，按行追加、滑窗轮转，
 *   重启时回填尾部样本接续内存曲线；
 * - **充放电会话**：从样本流检测状态族切换 (充电族 CHARGING/FULL ↔ 放电族
 *   DISCHARGING/NOT_CHARGING) 或采样断流 (间隔超 SESSION_GAP_MS，退后台/重启)
 *   自动闭合会话，独立 JSONL 落盘，保留更长统计窗口；
 * - **CSV 导出**：样本与会话均可导出为 CSV (缓存目录)，经 FileProvider 分享；
 * - **零依赖/零权限**：org.json 系统自带解析，文件写入私有目录，无任何三方
 *   依赖与权限申请；
 * - **全链路 Throwable 兜底**：磁盘满/权限异常/损坏行静默降级为内存态，
 *   任何持久化故障不得影响 UI 与遥测主链路。
 *
 * 线程模型：所有文件 IO 排入单线程后台执行器 (daemon)，主线程调用方立即返回；
 * 测试可注入同步执行器 (Runnable::run) 获得确定性时序。VM 发布路径 400ms 节流
 * 已在 BatteryViewModel.publish 保证，本类不重复节流。
 */
class BatteryHistoryStore(
    context: Context,
    /** 文件 IO 执行器；生产 = 单线程 daemon，测试可注入同步执行器 */
    private val ioExecutor: Executor = defaultDaemonExecutor(),
    /** 样本时间戳时钟注入点 (测试确定性) */
    private val wallClock: () -> Long = { System.currentTimeMillis() }
) {

    private val appContext: Context = context.applicationContext

    /** 会话闭合回调 (后台线程触发)；VM 用它刷新会话 StateFlow */
    var onSessionClosed: ((BatterySession) -> Unit)? = null

    // ---- 存储文件 ----

    private val telemetryDir: File = File(context.filesDir, DIR_NAME).also {
        // 目录创建失败不致命：后续写路径各自兜底
        try {
            it.mkdirs()
        } catch (e: Throwable) {
        }
    }
    private val samplesFile = File(telemetryDir, SAMPLES_FILE_NAME)
    private val sessionsFile = File(telemetryDir, SESSIONS_FILE_NAME)

    // ---- 会话检测状态 (主线程单写者：VM publish 路径) ----

    private var openSessionType: BatterySession.SessionType? = null
    private var openSessionStartMs = 0L
    private var openSessionStartPct = 0
    private var openSessionMinPct = 0
    private var openSessionMaxPct = 0
    private var openSessionEndMs = 0L
    private var openSessionEndPct = 0
    private var openSessionCurrentSumMa = 0L
    private var openSessionCurrentCount = 0
    private var openSessionSampleCount = 0
    private var openSessionLastSampleMs = 0L

    // ---- 轮转计数器 (executor 线程读写，Atomic 保证跨线程可见) ----

    private val sampleLineCount = AtomicInteger(0)
    private val sessionLineCount = AtomicInteger(0)

    /** 文件 IO 故障计数 (诊断用，不阻塞主链路) */
    val ioFailureCount = AtomicLong(0)

    init {
        // 启动恢复：从持久化尾部统计行数 (供轮转计数)；损坏文件按 0 处理
        sampleLineCount.set(countLinesSafely(samplesFile))
        sessionLineCount.set(countLinesSafely(sessionsFile))
    }

    // ============================================================
    // 样本持久化
    // ============================================================

    /**
     * 追加一条真实遥测样本 (异步落盘) + 推进会话检测。
     * 样本缺时间戳 (sampleTimestampMs <= 0) 时统一打点 (发布源头遗漏兜底)。
     */
    fun appendSample(state: BatteryState) {
        val stamped = if (state.sampleTimestampMs > 0) state
        else state.copy(sampleTimestampMs = wallClock())
        advanceSession(stamped)
        ioExecutor.execute {
            try {
                if (sampleLineCount.get() >= SAMPLES_ROTATE_THRESHOLD) {
                    rotateSamplesFile()
                }
                ensureTrailingNewline(samplesFile)
                FileOutputStream(samplesFile, true).use { out ->
                    out.write(encodeSample(stamped).toByteArray(Charsets.UTF_8))
                }
                sampleLineCount.incrementAndGet()
            } catch (e: Throwable) {
                ioFailureCount.incrementAndGet()
            }
        }
    }

    /**
     * v2.2.0 数据库维度审计修复：JSONL 尾行崩溃自愈。
     * 进程被杀可能留下**无换行结尾的半行 JSON**——直接追加会把新样本粘连到
     * 损坏行上 (decode 整行失败 = 新样本永久丢失)。写入前检测文件尾字节，
     * 非 "\n" 先补换行，让损坏半行成为独立行由 decode 静默跳过，新样本无损。
     * (RandomAccessFile 单字节 peek，1Hz 遥测频率下开销可忽略)
     */
    private fun ensureTrailingNewline(file: File) {
        try {
            if (!file.exists() || file.length() == 0L) return
            java.io.RandomAccessFile(file, "rw").use { raf ->
                raf.seek(raf.length() - 1)
                if (raf.read() != '\n'.code) {
                    raf.seek(raf.length())
                    raf.write('\n'.code)
                }
            }
        } catch (e: Throwable) {
            // 自愈失败不阻塞追加：最坏情况粘连行由 decode 静默跳过
        }
    }

    /** 样本 → 单行 JSON (键名压缩，最小化落盘体积) */
    internal fun encodeSample(s: BatteryState): String {
        val json = JSONObject()
        json.put("ts", s.sampleTimestampMs)
        json.put("pct", s.percentage)
        json.put("st", s.status.name)
        s.currentMa?.let { json.put("cur", it) }
        if (s.voltageMeasured) json.put("v", s.voltageMv)
        json.put("t", Math.round(s.temperatureCelsius * 10f))
        if (s.hasMeasuredCapacity) json.put("cap", s.currentCapacityMah)
        json.put("rem", s.remainingCapacityMah)
        json.put("design", s.designCapacityMah)
        return "${json.toString()}\n"
    }

    /** 单行 JSON → 部分字段恢复的 BatteryState (仅遥测曲线真实字段，其余默认)。
     *  数据质量门：无有效时间戳 (ts<=0) 的行视为损坏拒绝——时间轴是历史曲线/
     *  会话统计的根基，无 ts 样本回填只会污染时间序 */
    internal fun decodeSample(line: String): BatteryState? = try {
        val json = JSONObject(line)
        val ts = json.optLong("ts", 0L)
        if (ts <= 0) null
        else {
            val status = try {
                BatteryStatus.valueOf(json.optString("st", "NOT_CHARGING"))
            } catch (e: Throwable) {
                BatteryStatus.NOT_CHARGING
            }
            BatteryState(
                sampleTimestampMs = ts,
                percentage = json.optInt("pct", 0),
                status = status,
                currentMa = if (json.has("cur")) json.getInt("cur") else null,
                voltageMv = json.optInt("v", 0),
                voltageMeasured = json.has("v"),
                temperatureCelsius = json.optInt("t", 250) / 10f,
                currentCapacityMah = json.optInt("cap", 0),
                hasMeasuredCapacity = json.has("cap"),
                remainingCapacityMah = json.optInt("rem", 0),
                designCapacityMah = json.optInt("design", 0)
            )
        }
    } catch (e: Throwable) {
        null // 损坏行静默跳过
    }

    /**
     * 读取持久化尾部样本 (重启回填)。返回按时间升序、最多 [maxSamples] 条。
     * 文件缺失/损坏返回空列表 (首启场景)，绝不抛异常。
     */
    fun loadRecentSamples(maxSamples: Int = SAMPLES_RESTORE_MAX): List<BatteryState> = try {
        if (!samplesFile.exists()) emptyList()
        else {
            val lines = samplesFile.readLines(Charsets.UTF_8).filter { it.isNotBlank() }
            lines.takeLast(maxSamples).mapNotNull { decodeSample(it) }
                .sortedBy { it.sampleTimestampMs }
        }
    } catch (e: Throwable) {
        ioFailureCount.incrementAndGet()
        emptyList()
    }

    /** 轮转样本文件：仅保留最近 SAMPLES_KEEP 行 (滑窗，防文件无限膨胀) */
    private fun rotateSamplesFile() {
        try {
            val lines = samplesFile.readLines(Charsets.UTF_8).filter { it.isNotBlank() }
            val keep = lines.takeLast(SAMPLES_KEEP)
            // v2.0.0-beta.1 P0 修复：joinToString 分隔符必须为 "\n"——
            // 旧实现空分隔符把保留的 JSONL 行粘连成单行，轮转后 2999/3000 条
            // 样本磁盘级不可解析 (历史永久损坏)，且既有测试断言过弱未能拦截
            // v2.2.0 数据库维度审计修复：轮转重写改为 tmp+rename 原子替换——
            // 旧 writeText 直接截断重写目标文件，轮转瞬间进程被杀会留下半截文件，
            // 最多 SAMPLES_KEEP 行历史永久丢失且无 decode 兜底可救；
            // tmp+rename (POSIX rename(2) 同目录原子覆盖) 保证 rename 成功前
            // 旧文件始终完好，失败/被杀只损失 tmp，历史数据无损
            val content = if (keep.isEmpty()) "" else keep.joinToString("\n", postfix = "\n")
            val tmp = File(telemetryDir, "$SAMPLES_FILE_NAME.tmp")
            tmp.writeText(content)
            if (!tmp.renameTo(samplesFile)) {
                // rename 失败 (极端文件系统/文件占用)：退回直接重写，数据仍落盘
                samplesFile.writeText(content)
                tmp.delete()
            }
            sampleLineCount.set(keep.size)
        } catch (e: Throwable) {
            ioFailureCount.incrementAndGet()
            // 轮转失败重置计数避免每拍重试大文件重写
            sampleLineCount.set(0)
        }
    }

    // ============================================================
    // 充放电会话检测
    // ============================================================

    /** 状态 → 会话族：充电族 (CHARGING/FULL) / 放电族 (DISCHARGING/NOT_CHARGING) */
    internal fun sessionTypeFor(status: BatteryStatus): BatterySession.SessionType? = when (status) {
        BatteryStatus.CHARGING, BatteryStatus.FULL -> BatterySession.SessionType.CHARGE
        BatteryStatus.DISCHARGING, BatteryStatus.NOT_CHARGING -> BatterySession.SessionType.DISCHARGE
    }

    /**
     * 会话状态机推进 (调用方线程：VM publish，单写者)。
     * 闭合条件：状态族切换 或 采样间隔 > SESSION_GAP_MS (退后台/进程重启断流)。
     *
     * 边界样本语义：族切换时，切换拍样本更新旧会话终点 (endTs/endPct/min/max)——
     * 该读数反映切换瞬间的真实电池状态 (如拔线瞬间已落到 10%)，但电流/样本数
     * 不计入旧会话 (电流已属新族方向)；同一样本同时作为新会话起点。
     */
    private fun advanceSession(s: BatteryState) {
        val ts = s.sampleTimestampMs
        val type = sessionTypeFor(s.status) ?: return
        // 族切换闭合：边界样本更新旧会话终点后闭合
        if (openSessionType != null && openSessionType != type) {
            openSessionEndMs = ts
            openSessionEndPct = s.percentage
            if (s.percentage < openSessionMinPct) openSessionMinPct = s.percentage
            if (s.percentage > openSessionMaxPct) openSessionMaxPct = s.percentage
            closeOpenSession()
        }
        // 断流闭合：间隔超阈值时先闭合打开中的会话 (断流拍属于新时段，不回填旧终点)
        else if (openSessionType != null && ts - openSessionLastSampleMs > SESSION_GAP_MS) {
            closeOpenSession()
        }
        if (openSessionType == null) {
            openSessionType = type
            openSessionStartMs = ts
            openSessionStartPct = s.percentage
            openSessionMinPct = s.percentage
            openSessionMaxPct = s.percentage
            openSessionCurrentSumMa = 0L
            openSessionCurrentCount = 0
            openSessionSampleCount = 0
        }
        openSessionEndMs = ts
        openSessionEndPct = s.percentage
        if (s.percentage < openSessionMinPct) openSessionMinPct = s.percentage
        if (s.percentage > openSessionMaxPct) openSessionMaxPct = s.percentage
        s.currentMa?.let {
            openSessionCurrentSumMa += it
            openSessionCurrentCount++
        }
        openSessionSampleCount++
        openSessionLastSampleMs = ts
    }

    /** 闭合打开中的会话并异步落盘；无打开会话时为空操作 */
    internal fun closeOpenSession() {
        val type = openSessionType ?: return
        val session = BatterySession(
            type = type,
            startTimestampMs = openSessionStartMs,
            endTimestampMs = openSessionEndMs,
            startPercentage = openSessionStartPct,
            endPercentage = openSessionEndPct,
            minPercentage = openSessionMinPct,
            maxPercentage = openSessionMaxPct,
            durationMs = (openSessionEndMs - openSessionStartMs).coerceAtLeast(0),
            averageCurrentMa = if (openSessionCurrentCount > 0)
                (openSessionCurrentSumMa / openSessionCurrentCount).toInt() else null,
            sampleCount = openSessionSampleCount,
            isOpen = false
        )
        resetOpenSession()
        ioExecutor.execute {
            try {
                if (sessionLineCount.get() >= SESSIONS_ROTATE_THRESHOLD) {
                    rotateSessionsFile()
                }
                ensureTrailingNewline(sessionsFile)
                FileOutputStream(sessionsFile, true).use { out ->
                    out.write(encodeSession(session).toByteArray(Charsets.UTF_8))
                }
                sessionLineCount.incrementAndGet()
            } catch (e: Throwable) {
                ioFailureCount.incrementAndGet()
            }
        }
        onSessionClosed?.invoke(session)
    }

    private fun resetOpenSession() {
        openSessionType = null
        openSessionStartMs = 0
        openSessionStartPct = 0
        openSessionMinPct = 0
        openSessionMaxPct = 0
        openSessionEndMs = 0
        openSessionEndPct = 0
        openSessionCurrentSumMa = 0
        openSessionCurrentCount = 0
        openSessionSampleCount = 0
        openSessionLastSampleMs = 0
    }

    internal fun encodeSession(s: BatterySession): String {
        val json = JSONObject()
        json.put("type", s.type.name)
        json.put("startTs", s.startTimestampMs)
        json.put("endTs", s.endTimestampMs)
        json.put("startPct", s.startPercentage)
        json.put("endPct", s.endPercentage)
        json.put("minPct", s.minPercentage)
        json.put("maxPct", s.maxPercentage)
        json.put("durationMs", s.durationMs)
        s.averageCurrentMa?.let { json.put("avgMa", it) }
        json.put("samples", s.sampleCount)
        return "${json.toString()}\n"
    }

    internal fun decodeSession(line: String): BatterySession? = try {
        val json = JSONObject(line)
        val type = try {
            BatterySession.SessionType.valueOf(json.optString("type", "CHARGE"))
        } catch (e: Throwable) {
            null
        } ?: return null
        BatterySession(
            type = type,
            startTimestampMs = json.optLong("startTs", 0),
            endTimestampMs = json.optLong("endTs", 0),
            startPercentage = json.optInt("startPct", 0),
            endPercentage = json.optInt("endPct", 0),
            minPercentage = json.optInt("minPct", 0),
            maxPercentage = json.optInt("maxPct", 0),
            durationMs = json.optLong("durationMs", 0),
            averageCurrentMa = if (json.has("avgMa")) json.getInt("avgMa") else null,
            sampleCount = json.optInt("samples", 0),
            isOpen = false
        )
    } catch (e: Throwable) {
        null
    }

    /** 读取持久化会话历史 (时间升序、最多 [maxSessions] 条) */
    fun loadSessions(maxSessions: Int = SESSIONS_RESTORE_MAX): List<BatterySession> = try {
        if (!sessionsFile.exists()) emptyList()
        else {
            sessionsFile.readLines(Charsets.UTF_8)
                .filter { it.isNotBlank() }
                .takeLast(maxSessions)
                .mapNotNull { decodeSession(it) }
        }
    } catch (e: Throwable) {
        ioFailureCount.incrementAndGet()
        emptyList()
    }

    private fun rotateSessionsFile() {
        try {
            val lines = sessionsFile.readLines(Charsets.UTF_8).filter { it.isNotBlank() }
            val keep = lines.takeLast(SESSIONS_KEEP)
            // v2.0.0-beta.1 P0 修复：与 rotateSamplesFile 同源缺陷，分隔符必须为 "\n"
            // v2.2.0 数据库维度审计修复：与 rotateSamplesFile 同款 tmp+rename 原子替换
            val content = if (keep.isEmpty()) "" else keep.joinToString("\n", postfix = "\n")
            val tmp = File(telemetryDir, "$SESSIONS_FILE_NAME.tmp")
            tmp.writeText(content)
            if (!tmp.renameTo(sessionsFile)) {
                sessionsFile.writeText(content)
                tmp.delete()
            }
            sessionLineCount.set(keep.size)
        } catch (e: Throwable) {
            ioFailureCount.incrementAndGet()
            sessionLineCount.set(0)
        }
    }

    // ============================================================
    // CSV 导出 (FileProvider 分享)
    // ============================================================

    /**
     * 导出样本历史 CSV 到缓存目录，返回文件 (失败返回 null，不抛异常)。
     * 列：时间 ISO、epoch 毫秒、电量百分比、状态、瞬时电流 mA、电压 mV、
     * 温度 °C、当前容量 mAh、剩余电量 mAh、设计容量 mAh
     */
    fun exportSamplesCsv(): File? = try {
        val samples = loadRecentSamples(Int.MAX_VALUE)
        if (samples.isEmpty()) null else {
            val file = exportFile(SAMPLES_CSV_PREFIX)
            file.writeText(buildSamplesCsv(samples), Charsets.UTF_8)
            file
        }
    } catch (e: Throwable) {
        ioFailureCount.incrementAndGet()
        null
    }

    /** 导出会话历史 CSV，列：类型、开始、结束、时长分、起止电量、Δ电量、均值电流、样本数 */
    fun exportSessionsCsv(): File? = try {
        val sessions = loadSessions(Int.MAX_VALUE)
        if (sessions.isEmpty()) null else {
            val file = exportFile(SESSIONS_CSV_PREFIX)
            file.writeText(buildSessionsCsv(sessions), Charsets.UTF_8)
            file
        }
    } catch (e: Throwable) {
        ioFailureCount.incrementAndGet()
        null
    }

    /** 导出文件落位：cacheDir/exports/ (FileProvider 只授权该目录，避免全缓存暴露) */
    internal fun exportFile(prefix: String): File {
        val dir = File(appContext.cacheDir, EXPORT_DIR_NAME)
        if (!dir.exists()) {
            dir.mkdirs()
        }
        val stamp = java.text.SimpleDateFormat("yyyyMMdd_HHmmss", java.util.Locale.US)
            .format(java.util.Date(wallClock()))
        return File(dir, "${prefix}_$stamp.csv")
    }

    internal fun buildSamplesCsv(samples: List<BatteryState>): String {
        val sb = StringBuilder()
        sb.append("time_iso,timestamp_ms,percentage,status,current_ma,voltage_mv,temperature_c,current_capacity_mah,remaining_capacity_mah,design_capacity_mah\n")
        val fmt = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US)
        samples.forEach { s ->
            val time = if (s.sampleTimestampMs > 0) fmt.format(java.util.Date(s.sampleTimestampMs)) else ""
            sb.append(time).append(',')
            sb.append(s.sampleTimestampMs).append(',')
            sb.append(s.percentage).append(',')
            sb.append(s.status.name).append(',')
            sb.append(s.currentMa ?: "").append(',')
            sb.append(if (s.voltageMeasured) s.voltageMv.toString() else "").append(',')
            sb.append(String.format(java.util.Locale.US, "%.1f", s.temperatureCelsius)).append(',')
            sb.append(if (s.hasMeasuredCapacity) s.currentCapacityMah.toString() else "").append(',')
            sb.append(s.remainingCapacityMah).append(',')
            sb.append(s.designCapacityMah).append('\n')
        }
        return sb.toString()
    }

    internal fun buildSessionsCsv(sessions: List<BatterySession>): String {
        val sb = StringBuilder()
        sb.append("type,start_iso,end_iso,duration_min,start_pct,end_pct,delta_pct,avg_current_ma,samples\n")
        val fmt = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US)
        sessions.forEach { s ->
            sb.append(s.type.name).append(',')
            sb.append(fmt.format(java.util.Date(s.startTimestampMs))).append(',')
            sb.append(fmt.format(java.util.Date(s.endTimestampMs))).append(',')
            sb.append(s.durationMs / 60000).append(',')
            sb.append(s.startPercentage).append(',')
            sb.append(s.endPercentage).append(',')
            sb.append(s.deltaPercentage).append(',')
            sb.append(s.averageCurrentMa ?: "").append(',')
            sb.append(s.sampleCount).append('\n')
        }
        return sb.toString()
    }

    // ============================================================
    // 清理与生命周期
    // ============================================================

    /** 清空全部持久化数据与内存会话状态 (用户主动清除历史入口) */
    fun clearAll() {
        resetOpenSession()
        ioExecutor.execute {
            try {
                samplesFile.delete()
                sessionsFile.delete()
            } catch (e: Throwable) {
                ioFailureCount.incrementAndGet()
            }
        }
        sampleLineCount.set(0)
        sessionLineCount.set(0)
    }

    /** 进程退出前冲刷：闭合打开中的会话，等待队列排空 (同步语义) */
    fun flush() {
        closeOpenSession()
        try {
            val done = java.util.concurrent.CountDownLatch(1)
            ioExecutor.execute { done.countDown() }
            done.await()
        } catch (e: Throwable) {
        }
    }

    private fun countLinesSafely(file: File): Int = try {
        if (file.exists()) file.readLines(Charsets.UTF_8).count { it.isNotBlank() } else 0
    } catch (e: Throwable) {
        ioFailureCount.incrementAndGet()
        0
    }

    companion object {
        private const val DIR_NAME = "telemetry"
        private const val SAMPLES_FILE_NAME = "samples.jsonl"
        private const val SESSIONS_FILE_NAME = "sessions.jsonl"

        /** 样本滑窗：轮转阈值 (触达即重写保留 SAMPLES_KEEP 行) */
        const val SAMPLES_ROTATE_THRESHOLD = 4000
        const val SAMPLES_KEEP = 3000

        /** 重启回填样本上限 (内存曲线仍受 VM 120 点滑窗约束，回填量留裕量给跨重启连续性) */
        const val SAMPLES_RESTORE_MAX = 200

        /** 会话历史回填上限 (UI 仅展示最近若干条，持久化层保留 SESSIONS_KEEP) */
        const val SESSIONS_RESTORE_MAX = 300

        /** 会话滑窗：轮转阈值与保留行数 */
        const val SESSIONS_ROTATE_THRESHOLD = 600
        const val SESSIONS_KEEP = 500

        /** 会话断流判定 (ms)：超过即视为会话中断 (退后台超时/进程重启) */
        const val SESSION_GAP_MS = 60_000L

        private const val SAMPLES_CSV_PREFIX = "battery_samples"
        private const val SESSIONS_CSV_PREFIX = "battery_sessions"

        /** 导出目录 (cacheDir/exports/)：FileProvider file-paths 对应 cache-path */
        const val EXPORT_DIR_NAME = "exports"

        /** 生产执行器：单线程 daemon，不阻塞 JVM 退出 (单测环境友好) */
        fun defaultDaemonExecutor(): Executor = Executors.newSingleThreadExecutor(object : ThreadFactory {
            private val seq = AtomicInteger(0)
            override fun newThread(r: Runnable): Thread =
                Thread(r, "battery-history-io-${seq.incrementAndGet()}").apply { isDaemon = true }
        })
    }
}
