package com.battery.master.service

import android.content.Context
import com.battery.master.BuildConfig
import com.battery.master.data.AppUpdateInfo
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * 应用内热更新检查器 (v2.1.0-beta.2)。
 * 直连 GitHub Releases API 获取最新版本元数据；网络调用必须运行在 IO 线程。
 *
 * 可注入性：[fetcher] 为 internal var（与 DeviceUsageTracker.tickerClock 同模式），
 * 单测用 fake JSON fixture 注入，无需真实网络。
 *
 * 隐私边界：仅 GET 版本元数据，不携带设备标识/电量数据，不上传任何内容。
 */
class AppUpdateChecker(context: Context) {

    companion object {
        const val RELEASES_LATEST_URL =
            "https://api.github.com/repos/Tri250/-/releases/latest"
        private const val PREFS_NAME = "app_update_prefs"
        private const val KEY_LAST_CHECK_AT = "update_last_check_at"
        private const val KEY_LAST_LATEST = "update_last_latest"
        private const val KEY_LAST_APK_URL = "update_last_apk_url"
        private const val KEY_LAST_NOTES = "update_last_notes"
        private const val KEY_LAST_PRERELEASE = "update_last_prerelease"
        private const val KEY_LAST_AUTO_CHECK_AT = "update_last_auto_check_at"
        private const val KEY_AUTO_ENABLED = "update_auto_enabled"
        const val AUTOCHECK_INTERVAL_MS = 24L * 60 * 60 * 1000
        private const val CONNECT_TIMEOUT_MS = 8000
        private const val READ_TIMEOUT_MS = 8000
    }

    private val appContext = context.applicationContext

    /** 网络 fetch 注入点：URL → 响应体；抛异常 = 网络失败。 */
    internal var fetcher: (String) -> String = ::defaultFetch

    private val prefs by lazy {
        try {
            appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        } catch (e: Throwable) {
            null
        }
    }

    /**
     * 检查更新：拉取 + 解析 + 版本比对 + 落盘。
     * 返回 null 表示网络/解析失败（不抛出，保证 UI 层可安全调用）。
     */
    fun checkForUpdate(): AppUpdateInfo? {
        val json = try {
            fetcher(RELEASES_LATEST_URL)
        } catch (e: Throwable) {
            null
        } ?: return null

        val parsed = parseReleaseJson(json, BuildConfig.VERSION_NAME) ?: return null
        persistSnapshot(parsed)
        return parsed
    }

    /**
     * 自动检查节流判定 (v2.1.0-beta.3)：从未检查过 → true；距上次自动检查 ≥ 间隔 → true；
     * 用户关闭自动检查 → false。nowMs/intervalMs 可注入以便单测。
     */
    fun autoCheckDue(
        nowMs: Long = System.currentTimeMillis(),
        intervalMs: Long = AUTOCHECK_INTERVAL_MS
    ): Boolean {
        if (!isAutoCheckEnabled()) return false
        val last = try {
            prefs?.getLong(KEY_LAST_AUTO_CHECK_AT, 0L) ?: 0L
        } catch (e: Throwable) {
            0L
        }
        return last <= 0 || nowMs - last >= intervalMs
    }

    /** 自动检查完成后落节流时间戳（与手动检查的 update_last_check_at 互不影响）。 */
    fun markAutoCheckDone(nowMs: Long = System.currentTimeMillis()) {
        val p = prefs ?: return
        try {
            p.edit().putLong(KEY_LAST_AUTO_CHECK_AT, nowMs).apply()
        } catch (e: Throwable) {
        }
    }

    /** 自动检查开关（默认开）；UI Switch 直连，落盘失败静默保持内存态。 */
    fun isAutoCheckEnabled(): Boolean = try {
        prefs?.getBoolean(KEY_AUTO_ENABLED, true) ?: true
    } catch (e: Throwable) {
        true
    }

    fun setAutoCheckEnabled(enabled: Boolean) {
        val p = prefs ?: return
        try {
            p.edit().putBoolean(KEY_AUTO_ENABLED, enabled).apply()
        } catch (e: Throwable) {
        }
    }

    /** 解析 GitHub Releases JSON → AppUpdateInfo；畸形输入返回 null。 */
    internal fun parseReleaseJson(json: String, currentVersion: String): AppUpdateInfo? {
        if (json.isBlank()) return null
        return try {
            val root = JSONObject(json)
            val tagName = root.optString("tag_name").removePrefix("v").trim()
            if (tagName.isEmpty()) return null

            val assets: JSONArray = root.optJSONArray("assets") ?: JSONArray()
            var apkUrl: String? = null
            for (i in 0 until assets.length()) {
                val asset = assets.optJSONObject(i) ?: continue
                val name = asset.optString("name")
                val url = asset.optString("browser_download_url")
                if (name.endsWith(".apk") && url.startsWith("https://")) {
                    apkUrl = url
                    break
                }
            }

            val notes = root.optString("body").takeIf { it.isNotBlank() }
            val prerelease = root.optBoolean("prerelease", false)
            AppUpdateInfo(
                currentVersion = currentVersion,
                latestVersion = tagName,
                apkUrl = apkUrl,
                releaseNotes = notes?.take(2000),
                isPrerelease = prerelease,
                isNewer = compareVersions(currentVersion, tagName) < 0
            )
        } catch (e: Throwable) {
            null
        }
    }

    /**
     * 语义化版本比较（纯函数）：返回 <0 / 0 / >0。
     * 规则：核心版本段数值比较；核心相等时 GA > pre-release；
     * 同为 pre-release 按标识符逐段比较（数值段按值，如 beta.1 < beta.2）。
     * 非法段按 0 处理，不抛异常。
     */
    internal fun compareVersions(current: String, latest: String): Int {
        val (aCore, aPre) = splitVersion(current)
        val (bCore, bPre) = splitVersion(latest)

        for (i in 0 until maxOf(aCore.size, bCore.size)) {
            val a = aCore.getOrElse(i) { 0 }
            val b = bCore.getOrElse(i) { 0 }
            if (a != b) return a.compareTo(b)
        }

        // 核心版本相等：GA（无 pre 标识）大于任何 pre-release
        if (aPre == null && bPre == null) return 0
        if (aPre == null) return 1
        if (bPre == null) return -1

        // 同为 pre-release：逐段比较（beta.1 vs beta.2 / beta vs rc）
        val aParts = aPre.split('.')
        val bParts = bPre.split('.')
        for (i in 0 until maxOf(aParts.size, bParts.size)) {
            val a = aParts.getOrElse(i) { "" }
            val b = bParts.getOrElse(i) { "" }
            val cmp = comparePreSegment(a, b)
            if (cmp != 0) return cmp
        }
        return 0
    }

    private fun splitVersion(version: String): Pair<List<Int>, String?> {
        val v = version.trim().lowercase().removePrefix("v")
        val dash = v.indexOf('-')
        val corePart = if (dash >= 0) v.substring(0, dash) else v
        val prePart = if (dash >= 0) v.substring(dash + 1).takeIf { it.isNotEmpty() } else null
        val core = corePart.split('.').map { seg ->
            seg.filter { it.isDigit() }.toIntOrNull() ?: 0
        }
        return core to prePart
    }

    private fun comparePreSegment(a: String, b: String): Int {
        val aNum = a.toIntOrNull()
        val bNum = b.toIntOrNull()
        return when {
            aNum != null && bNum != null -> aNum.compareTo(bNum)
            aNum != null -> 1      // 数值段 > 标识段 (semver 规则)
            bNum != null -> -1
            else -> a.compareTo(b)
        }
    }

    /** 最近一次检查快照落盘（仅版本元数据，无个人信息）。 */
    private fun persistSnapshot(info: AppUpdateInfo) {
        val p = prefs ?: return
        try {
            p.edit()
                .putLong(KEY_LAST_CHECK_AT, System.currentTimeMillis())
                .putString(KEY_LAST_LATEST, info.latestVersion)
                .putString(KEY_LAST_APK_URL, info.apkUrl)
                .putString(KEY_LAST_NOTES, info.releaseNotes)
                .putBoolean(KEY_LAST_PRERELEASE, info.isPrerelease)
                .apply()
        } catch (e: Throwable) {
            // 持久化失败不影响本次检查结果
        }
    }

    private fun defaultFetch(url: String): String {
        val conn = URL(url).openConnection() as HttpURLConnection
        try {
            conn.connectTimeout = CONNECT_TIMEOUT_MS
            conn.readTimeout = READ_TIMEOUT_MS
            conn.setRequestProperty("Accept", "application/vnd.github+json")
            conn.setRequestProperty(
                "User-Agent",
                "AndroidBatteryMaster/${BuildConfig.VERSION_NAME}"
            )
            val stream = if (conn.responseCode in 200..299) {
                conn.inputStream
            } else {
                conn.errorStream
            }
            return stream?.use { it.readBytes().toString(Charsets.UTF_8) }
                ?: throw IllegalStateException("HTTP ${conn.responseCode}")
        } finally {
            conn.disconnect()
        }
    }
}
