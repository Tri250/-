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
 * 应用更新检查：CDN 镜像 + GitHub Releases 双源。
 *
 * ```
 * https://cdn.jsdelivr.net/gh/Tri250/-@main/update/latest.json   ← 国内直连
 * https://api.github.com/repos/Tri250/-/releases/latest          ← 科学上网
 * ```
 *
 * 国内用户连 api.github.com 基本超时，所以首选源是 jsDelivr 读仓库内的
 * `update/latest.json`（release 工作流发布后自动生成并推回 main，见 release.yml）。
 * jsDelivr 多域名顺序回退，其中任何一个可达就能完成检查。
 *
 * [Source.AUTO] 会**并行**查所有源，取版本号更大的那个；版本相同时优先能直接下 APK 的，
 * 同能下则优先 CDN 镜像（国内直连）。用户在关于页可以手动锁定某一个源。
 */
object UpdateChecker {

    /** 更新源；`storageValue` 是写进 SharedPreferences 的值，别随便改（会丢用户设置） */
    enum class Source(val label: String, val storageValue: String, val description: String) {
        AUTO("自动", "auto", "所有源都查，取版本更新的那个"),
        // 原为 Gitee 源（仓库从未真实发布，国内用户拿到的是 404）。沿用旧
        // storageValue "gitee"，已保存该选项的用户无缝迁移到同样国内可达的 CDN 源
        CDN("CDN 镜像", "gitee", "jsDelivr 读仓库内更新清单，国内直连"),
        GITHUB("GitHub", "github", "api.github.com，国内可能要代理"),
        ;

        companion object {
            fun fromStorage(value: String?): Source =
                entries.firstOrNull { it.storageValue == value } ?: AUTO
        }
    }

    private data class Endpoint(
        val source: Source,
        val name: String,
        /** 多个地址按顺序回退：任何一个 200 且能解析即用 */
        val latestApis: List<String>,
        val releasesPage: String,
        val accept: String? = null,
    )

    private const val GITHUB_RELEASES = "https://github.com/Tri250/-/releases"

    private const val LATEST_JSON_PATH = "update/latest.json"

    private val ENDPOINTS = listOf(
        Endpoint(
            source = Source.CDN,
            name = "CDN 镜像",
            // jsDelivr 三域名按可用性排序回退；raw.githubusercontent 只是最后兜底（国内基本不可达）
            latestApis = listOf(
                "https://cdn.jsdelivr.net/gh/Tri250/-@main/$LATEST_JSON_PATH",
                "https://fastly.jsdelivr.net/gh/Tri250/-@main/$LATEST_JSON_PATH",
                "https://testingcf.jsdelivr.net/gh/Tri250/-@main/$LATEST_JSON_PATH",
                "https://raw.githubusercontent.com/Tri250/-/main/$LATEST_JSON_PATH",
            ),
            releasesPage = GITHUB_RELEASES,
        ),
        Endpoint(
            source = Source.GITHUB,
            name = "GitHub",
            latestApis = listOf("https://api.github.com/repos/Tri250/-/releases/latest"),
            releasesPage = GITHUB_RELEASES,
            // GitHub API 必须带 User-Agent，否则直接 403
            accept = "application/vnd.github+json",
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
        /** APK 主下载直链；为空表示这次 release 没挂安装包 */
        val downloadUrl: String? = null,
        /**
         * 全部下载地址，按国内可达性排序（镜像代理在前，GitHub 直链兜底）。
         * 下载器按顺序尝试，镜像全挂了才落到直链。
         */
        val downloadUrls: List<String> = emptyList(),
        /** release 网页地址，作为兜底入口 */
        val releasePage: String = GITHUB_RELEASES,
        val assetName: String? = null,
        val assetSize: Long = 0L,
        /** 这个结果来自哪个源（"CDN 镜像" / "GitHub"） */
        val source: String = "CDN 镜像",
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
            Source.CDN -> ENDPOINTS.filter { it.source == Source.CDN }
        }

        // 并行的意义：自动模式下两个源同时查，总耗时 = 较慢的那个，而不是相加
        val results = coroutineScope {
            targets.map { endpoint -> async { fetch(endpoint, currentName) } }.awaitAll()
        }
        merge(results, currentName)
    }

    private fun fetch(endpoint: Endpoint, currentName: String): Result {
        // 多地址顺序回退：CDN 的四个域名只要一个活着就能完成检查
        var lastError: Throwable? = null
        for (api in endpoint.latestApis) {
            val attempt = fetchOnce(endpoint, api, currentName)
            if (attempt.error == null || attempt.error?.endsWith("还没有发布版本") == true) return attempt
            // 网络失败才换下一个地址；HTTP 4xx/5xx 属于"这个源确实不行"，同样换下一个
            lastError = RuntimeException(attempt.error ?: "网络异常")
        }
        val e = lastError ?: RuntimeException("网络异常")
        return Result(
            hasUpdate = false,
            currentVersion = currentName,
            releasePage = endpoint.releasesPage,
            source = endpoint.name,
            error = "${endpoint.name}：${e.message ?: "网络异常"}",
        )
    }

    private fun fetchOnce(endpoint: Endpoint, api: String, currentName: String): Result = runCatching {
        val connection = (URL(api).openConnection() as HttpURLConnection).apply {
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

    /** 同版本时的偏好：能直接下安装包 > CDN 镜像（国内下载稳） */
    private fun rank(result: Result): Int {
        var score = 0
        if (result.downloadUrl != null) score += 2
        if (result.source.contains("CDN")) score += 1
        if (result.downloadUrls.size > 1) score += 1
        return score
    }

    /** 镜像代理前缀：拼在 GitHub 直链前面就能代理下载，国内可达；服务可能波动，所以备多个并保留直链兜底 */
    private val DOWNLOAD_MIRRORS = listOf(
        "https://gh-proxy.com/",
        "https://ghfast.top/",
        "https://mirror.ghproxy.com/",
    )

    /** GitHub 直链 → [镜像, ..., 直链] 的下载地址列表 */
    private fun withMirrors(directUrl: String): List<String> =
        DOWNLOAD_MIRRORS.map { it + directUrl } + directUrl

    private fun parse(json: JSONObject, currentName: String, endpoint: Endpoint): Result {
        val tag = json.optString("tag_name").trim()
        val latest = normalizeVersion(tag).ifBlank { tag }
        // latest.json（自造格式）没有 html_url；GitHub release JSON 才有
        val page = json.optString("html_url").takeIf { it.isNotBlank() }
            ?: json.optString("release_page").takeIf { it.isNotBlank() }
            ?: endpoint.releasesPage

        // latest.json 的 apk_urls 已带镜像列表（工作流生成）；GitHub API 格式则从 assets 取直链再拼镜像
        val urlsFromJson = json.optJSONArray("apk_urls")?.let { arr ->
            (0 until arr.length()).mapNotNull { i ->
                arr.optString(i).takeIf { it.isNotBlank() }
            }
        }.orEmpty()

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
                apkSize = asset.optLong("size", 0L)
                if (apkUrl != null) break
            }
        }

        val urls = when {
            urlsFromJson.isNotEmpty() -> urlsFromJson
            apkUrl != null -> withMirrors(apkUrl!!)
            else -> emptyList()
        }
        apkName = json.optString("asset_name").takeIf { it.isNotBlank() } ?: apkName
        apkUrl = urls.firstOrNull() ?: apkUrl

        // latest.json 的说明是工作流从 release 正文提取的纯文本，不再过一遍去标记
        val rawNotes = if (json.has("notes")) json.optString("notes") else json.optString("body")
        val notes = if (json.has("notes")) rawNotes.takeIf { it.isNotBlank() } else releaseNotes(rawNotes)

        return Result(
            hasUpdate = compareVersions(latest, currentName) > 0,
            currentVersion = currentName,
            latestVersion = latest.ifBlank { null },
            notes = notes,
            downloadUrl = apkUrl,
            downloadUrls = urls,
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
