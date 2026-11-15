package com.battery.master

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.battery.master.service.BatteryHistoryStore
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * v2.0.0-beta.1 P2 GA 修复：轻量崩溃捕获 (零三方依赖)
 *
 * GA 阻断项"崩溃监控与性能基线"的本地化实现——项目信条零权限/零上传/零三方
 * SDK，不引入 Crashlytics/Sentry 网络上报；崩溃堆栈写入应用私有目录
 * (filesDir/crash/)，用户可经"关于"卡一键导出分享给开发者。
 *
 * 设计：
 * - Thread.setDefaultUncaughtExceptionHandler 包装默认处理器，落盘后原样
 *   交还系统默认链 (进程按平台语义退出，不吞崩溃)；
 * - 单文件上限 CRASH_KEEP_MAX 份 (滑窗删除最旧)，单份含设备指纹 (型号/Android
 *   版本/应用版本/线程/堆栈)，不采集任何个人数据；
 * - 全链路 Throwable 兜底：捕获器自身异常不得影响崩溃退出路径；
 * - 导出：合并最近崩溃为单个文本文件写 cacheDir/exports/，经 FileProvider
 *   分享 (与遥测 CSV 同目录同授权，复用 file_paths.xml)。
 */
object CrashLogHandler {

    private const val CRASH_DIR_NAME = "crash"
    private const val EXPORT_DIR_NAME = BatteryHistoryStore.EXPORT_DIR_NAME
    private const val CRASH_KEEP_MAX = 10
    private const val FILE_TS_PATTERN = "yyyyMMdd_HHmmss"

    /**
     * 安装为进程默认未捕获异常处理器。
     * 在 Application.onCreate 调用；重复安装无害 (幂等覆盖)；任何异常吞掉不抛。
     */
    fun install(context: Context, versionName: String, versionCode: Int) {
        try {
            val appContext = context.applicationContext
            val previous = Thread.getDefaultUncaughtExceptionHandler()
            Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
                try {
                    writeCrashFile(appContext, thread, throwable, versionName, versionCode)
                } catch (e: Throwable) {
                    // 捕获器自身故障绝不阻塞默认崩溃链
                }
                try {
                    previous?.uncaughtException(thread, throwable)
                } catch (e: Throwable) {
                    // 默认链缺失时交还运行时默认行为
                    Runtime.getRuntime().exit(2)
                }
            }
        } catch (e: Throwable) {
            // 安装失败保持默认处理器，功能不受影响
        }
    }

    private fun writeCrashFile(
        context: Context,
        thread: Thread,
        throwable: Throwable,
        versionName: String,
        versionCode: Int
    ) {
        val dir = File(context.filesDir, CRASH_DIR_NAME)
        if (!dir.exists()) dir.mkdirs()
        val stamp = SimpleDateFormat(FILE_TS_PATTERN, Locale.US).format(Date())
        val file = File(dir, "crash-$stamp.txt")
        file.writeText(
            buildString {
                appendLine("=== Battery Master Crash Report ===")
                appendLine("time      : $stamp")
                appendLine("app       : v$versionName (versionCode=$versionCode)")
                appendLine("device    : ${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
                appendLine("android   : ${android.os.Build.VERSION.RELEASE} (API ${android.os.Build.VERSION.SDK_INT})")
                appendLine("thread    : ${thread.name}")
                appendLine("exception : ${throwable.javaClass.name}")
                appendLine("message   : ${throwable.message ?: "(none)"}")
                appendLine()
                appendLine(android.util.Log.getStackTraceString(throwable))
            },
            Charsets.UTF_8
        )
        pruneOldCrashes(dir)
    }

    /** 滑窗删除最旧崩溃文件，仅保留 CRASH_KEEP_MAX 份 */
    private fun pruneOldCrashes(dir: File) {
        val files = dir.listFiles { f -> f.name.startsWith("crash-") } ?: return
        if (files.size <= CRASH_KEEP_MAX) return
        files.sortedBy { it.name }
            .take(files.size - CRASH_KEEP_MAX)
            .forEach { it.delete() }
    }

    /** 列出本地崩溃报告 (时间升序)；目录不存在/读取失败返回空列表 */
    fun crashFiles(context: Context): List<File> = try {
        val dir = File(context.applicationContext.filesDir, CRASH_DIR_NAME)
        if (dir.exists()) {
            dir.listFiles { f -> f.name.startsWith("crash-") }?.sortedBy { it.name } ?: emptyList()
        } else emptyList()
    } catch (e: Throwable) {
        emptyList()
    }

    /** 本地崩溃报告份数 (关于卡展示"N 份崩溃记录"用) */
    fun crashCount(context: Context): Int = crashFiles(context).size

    /**
     * 导出崩溃报告并构建分享 Intent (合并最近崩溃为单个 txt)。
     * IO 密集，调用方须在协程/后台线程执行；无崩溃或导出失败返回 null。
     */
    fun buildShareIntent(context: Context): Intent? = try {
        val files = crashFiles(context)
        if (files.isEmpty()) {
            null
        } else {
            val exportDir = File(context.applicationContext.cacheDir, EXPORT_DIR_NAME)
            if (!exportDir.exists()) exportDir.mkdirs()
            val stamp = SimpleDateFormat(FILE_TS_PATTERN, Locale.US).format(Date())
            val out = File(exportDir, "crash_logs_$stamp.txt")
            out.bufferedWriter(Charsets.UTF_8).use { w ->
                files.forEach { f ->
                    w.write(f.readText(Charsets.UTF_8))
                    w.newLine()
                }
            }
            val uri = FileProvider.getUriForFile(
                context.applicationContext,
                "${context.applicationContext.packageName}.fileprovider",
                out
            )
            Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
        }
    } catch (e: Throwable) {
        null
    }
}
