package com.smalljelly.batterydata.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * 应用更新检查：GitHub Releases + Gitee Releases 双源。
 *
 * ```
 * https://api.github.com/repos/Tri250/-/releases/latest
 * https://gitee.com/api/v5/repos/littlejelly/BatteryData/releases/latest
 * ```
 *
 * 两家的 release JSON 结构基本一致（`tag_name` / `body` / `assets[].browser_download_url`），
 * 所以解析只有一份；Gitee 的 assets 没有 `size` 字段，取不到就按 0 处理。
 *
 * [Source.AUTO] 会**并行**查两个源，取版本号更大的那个；版本相同时优先能直接下 APK 的，
 * 都能下则优先 Gitee（国内直连，下载比 GitHub 的 objects.githubusercontent.com 稳）。
 * 用户在关于页可以手动锁定某一个源。
 */
object UpdateChecker {

    /** 更新源；`storageValue` 是写进 SharedPreferences 的值，别随便改（会丢用户设置） */
    enum class Source(val label: String, val storageValue: String, val description: String) {
        AUTO("自动", "auto", "两个源都查，取版本更新的那个"),
        GITHUB("GitHub", "github", "api.github.com，国内可能要代理"),
        GITEE("Gitee", "gitee", "国内直连，下载更快"),
        ;

        companion object {
            fun fromStorage(value: String?): Source =
                entries.firstOrNull { it.storageValue == value } ?: AUTO
        }
    }

    private data class Endpoint(
        val source: Source,
        val name: String,
        val latestApi: String,
        val releasesPage: String,
        val accept: String? = null,
    )

    private const val GITHUB_RELEASES = "https://github.com/Tri250/-/releases"

    private val ENDPOINTS = listOf(
        Endpoint(
            source = Source.GITHUB,
            name = "GitHub",
            latestApi = "https://api.github.com/repos/Tri250/-/releases/latest",
            releasesPage = GITHUB_RELEASES,
            // GitHub API 必须带 User-Agent，否则直接 403
            accept = "application/vnd.github+json",
        ),
        Endpoint(
            source = Source.GITEE,
            name = "Gitee",
            latestApi = "https://gitee.com/api/v5/repos/littlejelly/BatteryData/releases/latest",
            releasesPage = "https://gitee.com/littlejelly/BatteryData/releases",
        ),
    )

    private const val UA = "BatteryData-Android"

    /** 两个源并行查，单源的超时就是整体等待上限，别设太长 */
    private const val TIMEOUT_MS = 6_000

    data class Result(
        val hasUpdate: Boolean,
        val currentVersion: String,
        val latestVersion: String? = null,
        /** release 说明（正文），已按行整理，用于对话框 */
        val notes: String? = null,
        /** APK 直链；为空表示这次 release 没挂安装包 */
        val downloadUrl: String? = null,
        /** release 网页地址，作为兜底入口 */
        val releasePage: String = GITHUB_RELEASES,
        val assetName: String? = null,
        val assetSize: Long = 0L,
        /** 这个结果来自哪个源（"GitHub" / "Gitee"） */
        val source: String = "GitHub",
        val error: String? = null,
    )

    suspend fun check(
        context: Context,
        source: Source = Source.AUTO,
    ): Result = withContext(Dispatchers.IO) {
        val pm = context.packageManager
        val currentName = runCatching {
            pm.getPackageInfo(context.packageName, 0).versionName
        }.getOrNull() ?: "1.0.0"

        val targets = when (source) {
            Source.AUTO -> ENDPOINTS
            Source.GITHUB -> ENDPOINTS.filter { it.source == Source.GITHUB }
            Source.GITEE -> ENDPOINTS.filter { it.source == Source.GITEE }
        }

        // 并行的意义：自动模式下两个源同时查，总耗时 = 较慢的那个，而不是相加
        val results = coroutineScope {
            targets.map { endpoint -> async { fetch(endpoint, currentName) } }.awaitAll()
        }
        merge(results, currentName)
    }

    private fun fetch(endpoint: Endpoint, currentName: String): Result = runCatching {
        val connection = (URL(endpoint.latestApi).openConnection() as HttpURLConnection).apply {
            connectTimeout = TIMEOUT_MS
            readTimeout = TIMEOUT_MS
            requestMethod = "GET"
            setRequestProperty("User-Agent", UA)
            endpoint.accept?.let { setRequestProperty("Accept", it) }
        }
        try {
            val code = connection.responseCode
            if (code == HttpURLConnection.HTTP_NOT_FOUND) {
                return@runCatching Result(
                    hasUpdate = false,
                    currentVersion = currentName,
                    releasePage = endpoint.releasesPage,
                    source = endpoint.name,
                    error = "${endpoint.name} 还没有发布版本",
                )
            }
            if (code !in 200..299) {
                return@runCatching Result(
                    hasUpdate = false,
                    currentVersion = currentName,
                    releasePage = endpoint.releasesPage,
                    source = endpoint.name,
                    error = "${endpoint.name} 返回 $code",
                )
            }
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            parse(JSONObject(body), currentName, endpoint)
        } finally {
            connection.disconnect()
        }
    }.getOrElse { error ->
        Result(
            hasUpdate = false,
            currentVersion = currentName,
            releasePage = endpoint.releasesPage,
            source = endpoint.name,
            error = "${endpoint.name}：${error.message ?: "网络异常"}",
        )
    }

    /** 挑出「最值得告诉用户」的那一条：版本更高优先，同版本则优先能直接下 APK / Gitee */
    private fun merge(results: List<Result>, currentName: String): Result {
        val ok = results.filter { it.error == null }
        if (ok.isEmpty()) {
            val allMissing = results.isNotEmpty() && results.all { it.error?.endsWith("还没有发布版本") == true }
            val message = when {
                allMissing && results.size > 1 -> "两个更新源都还没有发布版本"
                allMissing -> results.first().error ?: "还没有发布版本"
                else -> results.joinToString("；") { it.error ?: "未知错误" }
            }
            return Result(hasUpdate = false, currentVersion = currentName, error = message)
        }

        var best = ok.first()
        for (candidate in ok.drop(1)) {
            val cmp = compareVersions(candidate.latestVersion ?: "", best.latestVersion ?: "")
            val takeCandidate = when {
                cmp > 0 -> true
                cmp < 0 -> false
                else -> rank(candidate) > rank(best)
            }
            if (takeCandidate) best = candidate
        }
        return best
    }

    /** 同版本时的偏好：能直接下安装包 > Gitee（国内下载稳） */
    private fun rank(result: Result): Int {
        var score = 0
        if (result.downloadUrl != null) score += 2
        if (result.source == Source.GITEE.name) score += 1
        return score
    }

    private fun parse(json: JSONObject, currentName: String, endpoint: Endpoint): Result {
        val tag = json.optString("tag_name").trim()
        val latest = normalizeVersion(tag).ifBlank { tag }
        // Gitee 的 release JSON 没有 html_url，退回仓库的 releases 页
        val page = json.optString("html_url").takeIf { it.isNotBlank() } ?: endpoint.releasesPage

        // 只认 .apk 资源；两家都叫 browser_download_url
        var apkUrl: String? = null
        var apkName: String? = null
        var apkSize = 0L
        val assets = json.optJSONArray("assets")
        if (assets != null) {
            for (i in 0 until assets.length()) {
                val asset = assets.optJSONObject(i) ?: continue
                val name = asset.optString("name")
                if (!name.endsWith(".apk", ignoreCase = true)) continue
                apkUrl = asset.optString("browser_download_url").takeIf { it.isNotBlank() }
                apkName = name
                // Gitee 不给 size，保持 0；对话框里 0 就不显示"安装包 xx"
                apkSize = asset.optLong("size", 0L)
                if (apkUrl != null) break
            }
        }

        return Result(
            hasUpdate = compareVersions(latest, currentName) > 0,
            currentVersion = currentName,
            latestVersion = latest.ifBlank { null },
            notes = releaseNotes(json.optString("body")),
            downloadUrl = apkUrl,
            releasePage = page,
            assetName = apkName,
            assetSize = apkSize,
            source = endpoint.name,
        )
    }

    /**
     * release 正文 → 对话框里能直接读的说明。
     *
     * GitHub / Gitee 上写的都是 Markdown（`##` 分节、`-` 条目、`**` 加粗）。这里不做渲染，
     * 只做「去标记 + **保留分行**」。之前是把前几行用「；」拼成一行，标题、说明、
     * 安装包大小全糊在一起，读起来就是一串乱码（`BatteryData v1.0.2；修复版：…；修复`）。
     * 现在保持原来的换行结构，交给对话框按行显示、超出滚动。
     */
    private fun releaseNotes(body: String): String? {
        val lines = body
            .replace("\r\n", "\n")
            .replace("\r", "\n")
            .lineSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            // 跳过 HTML 注释 / 徽章这类不给人看的内容
            .filterNot { it.startsWith("<!--") || it.startsWith("[![") || it.startsWith("![") }
            .map { line ->
                line
                    .removePrefix("- [ ] ")
                    .removePrefix("- [x] ")
                    .trimStart('#', '>', '-', '*', '+', ' ')
                    .replace("**", "")
                    .replace("__", "")
                    .replace("`", "")
                    .trim()
            }
            .filter { it.isNotEmpty() }
            // 首行通常是「BatteryData v1.0.2」，版本号标题里已经写了，不重复
            .filterNot { it.startsWith("BatteryData v", ignoreCase = true) }
            .filterNot { it.startsWith("Full Changelog", ignoreCase = true) }
            .toList()

        if (lines.isEmpty()) return null
        // 安装 / 签名这些小节跟「这次更新了什么」无关，遇到就停
        val stopAt = setOf("安装", "签名", "下载", "已知问题", "注意事项")
        val visible = lines.takeWhile { it !in stopAt }.ifEmpty { lines }
        // 每行压到 56 字以内：一条修复常常上百字，整段塞进弹窗会顶成一堵墙
        val compact = visible.take(8).map { line ->
            if (line.length > 56) line.take(56).trimEnd() + "…" else line
        }
        return compact.joinToString("\n")
    }

    /** `v1.2.3` → `1.2.3` */
    private fun normalizeVersion(raw: String): String = raw.trim().removePrefix("v").removePrefix("V")

    /**
     * 逐段比较数字版本号，返回 >0 表示 [a] 更新。
     * 非数字段忽略（`1.0.0-beta` 里 beta 不参与），段数不同时缺的按 0 算。
     */
    fun compareVersions(a: String, b: String): Int {
        val left = versionParts(a)
        val right = versionParts(b)
        val size = maxOf(left.size, right.size)
        for (i in 0 until size) {
            val l = left.getOrElse(i) { 0 }
            val r = right.getOrElse(i) { 0 }
            if (l != r) return l.compareTo(r)
        }
        return 0
    }

    private fun versionParts(raw: String): List<Int> =
        normalizeVersion(raw)
            .split('.', '-', '+', '_')
            .mapNotNull { it.filter { ch -> ch.isDigit() }.toIntOrNull() }
}
