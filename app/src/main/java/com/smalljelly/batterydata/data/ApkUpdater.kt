package com.smalljelly.batterydata.data

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.coroutines.coroutineContext

/**
 * 从 GitHub Release 下载 APK 并拉起系统安装器。
 *
 * 文件落 `cache/apk/`，用 FileProvider 暴露成 content:// 给安装器 ——
 * Android 7 以后直接把 file:// 丢给 Intent 会抛 FileUriExposedException。
 *
 * 安装失败最常见的原因不是代码，而是「未知来源」没开（Android 8 起按应用授权），
 * 所以 [install] 返回失败时调用方应该引导用户去 [installSettingsIntent]。
 */
object ApkUpdater {

    private const val TIMEOUT_MS = 20_000
    private const val BUFFER = 64 * 1024

    /** 下载目标路径：版本号进文件名，换版本重新下，不会命中上一次的残留 */
    fun apkFile(context: Context, version: String): File {
        val dir = File(context.cacheDir, "apk").apply { mkdirs() }
        return File(dir, "BatteryData-${version.ifBlank { "latest" }}.apk")
    }

    /**
     * 下载到 [apkFile]。已有同版本完整文件时直接复用。
     * [urls] 按国内可达性排序（镜像代理在前、GitHub 直链兜底），逐源尝试：
     * 某个源连不上/HTTP 错就清掉半截文件换下一个，全失败才抛错。
     * [onProgress] 在 IO 线程被调用（百分比与已下字节），total 未知时传 -1。
     */
    suspend fun download(
        context: Context,
        urls: List<String>,
        version: String,
        onProgress: (percent: Int, downloaded: Long, total: Long) -> Unit,
    ): File = withContext(Dispatchers.IO) {
        val candidates = urls.filter { it.isNotBlank() }
        if (candidates.isEmpty()) throw IllegalStateException("没有可用的下载地址")
        val target = apkFile(context, version)
        // 上次已下完的同版本包直接复用：重复点「下载」不用再等全量。
        // 复用前先验 ZIP 结构——上次异常退出可能留下不完整的包（装了才炸「解析失败」）
        if (target.exists() && target.length() > 0L) {
            if (isCompleteApk(target)) return@withContext target
            target.delete()
        }

        var lastError: Exception? = null
        for (url in candidates) {
            try {
                return@withContext downloadOnce(url, target, onProgress)
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                lastError = e
            }
        }
        throw lastError ?: IllegalStateException("所有下载源均失败")
    }

    /**
     * 轻量完整性检查：APK 是 ZIP，头两个字节必须是 PK，且尾部有
     * End-Of-Central-Directory 标记（PK\x05\x06）。能拦住被截断/写坏的半截包。
     */
    private fun isCompleteApk(file: File): Boolean = runCatching {
        if (file.length() < 22L) return false // EOCD 本身至少 22 字节
        file.inputStream().use { input ->
            val head = ByteArray(2)
            if (input.read(head) != 2 || head[0] != 'P'.code.toByte() || head[1] != 'K'.code.toByte()) {
                return false
            }
        }
        // EOCD 起点不定（后面跟着最长 64KB 的中央目录注释），在尾部窗口里从后往前找
        val tailLen = minOf(file.length(), 65_557L + 22L).toInt()
        val tail = ByteArray(tailLen)
        java.io.RandomAccessFile(file, "r").use { raf ->
            raf.seek(file.length() - tailLen)
            raf.readFully(tail)
        }
        for (i in tailLen - 4 downTo 0) {
            if (tail[i] == 'P'.code.toByte() && tail[i + 1] == 'K'.code.toByte() &&
                tail[i + 2] == 0x05.toByte() && tail[i + 3] == 0x06.toByte()
            ) {
                return true
            }
        }
        false
    }.getOrDefault(false)

    private suspend fun downloadOnce(
        url: String,
        target: File,
        onProgress: (percent: Int, downloaded: Long, total: Long) -> Unit,
    ): File {
        val partial = File(target.path + ".part")

        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = TIMEOUT_MS
            readTimeout = TIMEOUT_MS
            // GitHub 的下载地址会 302 到 objects.githubusercontent.com；镜像代理同样可能 302
            instanceFollowRedirects = true
            setRequestProperty("User-Agent", "BatteryData-Android")
        }
        try {
            val code = connection.responseCode
            if (code !in 200..299) throw IllegalStateException("下载失败：HTTP $code")
            val total = connection.contentLengthLong
            connection.inputStream.use { input ->
                partial.outputStream().use { output ->
                    val buffer = ByteArray(BUFFER)
                    var downloaded = 0L
                    while (true) {
                        coroutineContext.ensureActive()
                        val read = input.read(buffer)
                        if (read <= 0) break
                        output.write(buffer, 0, read)
                        downloaded += read
                        val percent = if (total > 0) (downloaded * 100 / total).toInt() else -1
                        onProgress(percent, downloaded, total)
                    }
                    output.flush()
                    // 连接被网络中途切断时 read 循环会“正常”结束但数据不全，
                    // 这里按 Content-Length 把关，不完整的包当场报错换下一个源
                    if (total > 0L && downloaded != total) {
                        throw IllegalStateException("下载不完整：$downloaded / $total")
                    }
                }
            }
            if (target.exists()) target.delete()
            if (!partial.renameTo(target)) throw IllegalStateException("写入安装包失败")
            return target
        } finally {
            runCatching { connection.disconnect() }
            runCatching { if (partial.exists()) partial.delete() }
        }
    }

    /** 清掉上次残留的安装包（升级完成后调用，cache 目录别越攒越大） */
    fun clean(context: Context) {
        runCatching {
            File(context.cacheDir, "apk").listFiles()?.forEach { it.delete() }
        }
    }

    /** 是否已被允许「安装未知应用」（Android 8+）。false 时安装会静默失败 */
    fun canInstall(context: Context): Boolean =
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            runCatching { context.packageManager.canRequestPackageInstalls() }.getOrDefault(true)
        } else {
            true
        }

    /** 跳「安装未知应用」授权页 */
    fun installSettingsIntent(context: Context): Intent =
        Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:${context.packageName}"),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    /** 拉起系统安装器（标准安装协议）；返回 false 表示没有安装器/URI 授权失败 */
    fun install(context: Context, apk: File): Boolean = runCatching {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apk)
        context.startActivity(
            Intent(Intent.ACTION_INSTALL_PACKAGE)
                .setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
        true
    }.getOrDefault(false)
}
