package com.smalljelly.batterydata.data

import android.content.Context
import android.os.Build
import org.json.JSONArray
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * 设计容量解析：系统 sysfs 节点 → 内置机型库 → 在线机型库（可配置）。
 *
 * Android 没有公开的设计容量 API，很多厂商（尤其小米）不暴露 CHARGE_FULL_DESIGN 节点，
 * 这时按机型名从机型库里查官方标称容量作为参考值。
 */
object DesignCapacityResolver {

    /** 在线机型库地址：填入返回内置库同格式 JSON 的 URL 即可启用联网更新；留空表示关闭。 */
    const val REMOTE_URL = ""

    private const val ASSET_FILE = "battery_models.json"
    private const val CACHE_FILE = "remote_battery_models.json"
    private const val MIN_SANE_MAH = 1500f
    // 2026 年硅碳/双电芯大电池已到 8000mAh+(如 K90 Max 8550),上限随行业放宽到 12000
    private const val MAX_SANE_MAH = 12000f

    /** (设计容量 mAh, 来源描述)，同一进程内只解析一次。 */
    @Volatile
    private var cached: Pair<Float, String>? = null

    /** 机型库查不到也要记下来：采样流每秒都会来要，不记就会每次都重读 assets 解析一遍 */
    @Volatile
    private var missCached = false

    @Volatile
    private var identifiersCache: List<String>? = null

    @Synchronized
    fun resolve(context: Context, allowRemote: Boolean): Pair<Float, String>? {
        cached?.let { return it }
        if (missCached) return null
        val identifiers = identifiersCache ?: deviceIdentifiers().also { identifiersCache = it }
        val result = fromModelDb(context, allowRemote, identifiers)
        if (result != null) cached = result else missCached = true
        return result
    }

    /**
     * 各家 ROM 里存“市场名”的系统属性。国内机型的 Build.MODEL 通常只是代号
     * （OPPO 的 PJZ110、vivo 的 V2415A），机型库的键（oppo find x9 / x300 pro …）
     * 只能靠这些属性命中，否则补了库也用不上。
     */
    private val marketNameProps = listOf(
        "ro.product.marketname",       // 小米 / HyperOS，部分一加
        "ro.vendor.oplus.market.name", // OPPO / 一加 / realme（ColorOS）
        "ro.oppo.market.name",         // 老 ColorOS
        "ro.vivo.market.name",         // vivo / iQOO（OriginOS）
    )

    private fun deviceIdentifiers(): List<String> {
        val props = readSystemProps()
        val marketNames = marketNameProps.mapNotNull { props[it] }
            .takeIf { it.isNotEmpty() }
            // getprop 整体读取失败时退回单条查询，行为与旧版一致
            ?: listOf(getProp("ro.product.marketname"))

        return (marketNames + listOf(props["ro.product.model"], Build.MODEL, Build.DEVICE, Build.PRODUCT))
            .filterNotNull()
            .filter { it.isNotBlank() }
            .map { it.lowercase().replace('_', ' ').trim() }
            .distinct()
    }

    /** 一次性读出全部系统属性（一次进程开销），失败返回空表。 */
    private fun readSystemProps(): Map<String, String> = runCatching {
        val process = Runtime.getRuntime().exec(arrayOf("getprop"))
        val text = process.inputStream.bufferedReader().use { it.readText() }
        process.waitFor()
        text.lineSequence().mapNotNull { line ->
            // 输出格式： [ro.product.marketname]: [小米17 Pro Max]
            if (!line.startsWith("[") || !line.endsWith("]")) return@mapNotNull null
            val split = line.indexOf("]: [")
            if (split <= 1) return@mapNotNull null
            line.substring(1, split) to line.substring(split + 4, line.length - 1)
        }.toMap()
    }.getOrDefault(emptyMap())

    private fun getProp(key: String): String = runCatching {
        Runtime.getRuntime().exec(arrayOf("getprop", key))
            .inputStream.bufferedReader().readText().trim()
    }.getOrDefault("")

    /** 在机型库里按“最长命中键”匹配，保证 note 12 pro+ 不会错命中 note 12 的条目。 */
    private fun fromModelDb(
        context: Context,
        allowRemote: Boolean,
        identifiers: List<String>,
    ): Pair<Float, String>? {
        val remoteEntries = if (allowRemote) loadRemote(context) else null
        remoteEntries?.let { entries ->
            longestMatch(entries, identifiers)?.let { return it to "网络机型库" }
        }
        val bundledEntries = loadBundled(context)
        longestMatch(bundledEntries, identifiers)?.let { return it to "机型库" }
        return null
    }

    private fun longestMatch(
        entries: List<ModelEntry>,
        identifiers: List<String>,
    ): Float? {
        var best: ModelEntry? = null
        var bestLength = 0
        for (entry in entries) {
            for (key in entry.keys) {
                for (id in identifiers) {
                    if ((id == key || id.contains(key)) && key.length > bestLength) {
                        best = entry
                        bestLength = key.length
                    }
                }
            }
        }
        return best?.capacity
            ?.takeIf { it in MIN_SANE_MAH..MAX_SANE_MAH }
    }

    private fun parse(text: String): List<ModelEntry> = runCatching {
        val array = JSONArray(text)
        val result = ArrayList<ModelEntry>(array.length())
        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            val capacity = obj.optDouble("capacity", Double.NaN).toFloat()
            if (capacity.isNaN()) continue
            val keys = mutableListOf<String>()
            val keysArray = obj.optJSONArray("keys")
            if (keysArray != null) {
                for (j in 0 until keysArray.length()) {
                    keys.add(keysArray.getString(j).lowercase().replace('_', ' ').trim())
                }
            } else {
                obj.optString("name").takeIf { it.isNotBlank() }?.let { keys.add(it.lowercase().trim()) }
            }
            if (keys.isNotEmpty()) result.add(ModelEntry(keys, capacity))
        }
        result
    }.getOrDefault(emptyList())

    private fun loadBundled(context: Context): List<ModelEntry> = runCatching {
        context.assets.open(ASSET_FILE).bufferedReader().use { it.readText() }
    }.map(::parse).getOrDefault(emptyList())

    /** 读缓存的在线库；没有缓存且填了 REMOTE_URL 时联网下载一次并落盘。 */
    private fun loadRemote(context: Context): List<ModelEntry>? {
        val cache = File(context.filesDir, CACHE_FILE)
        if (cache.exists()) {
            runCatching { return parse(cache.readText()) }
        }
        if (REMOTE_URL.isBlank()) return null
        return runCatching {
            val connection = URL(REMOTE_URL).openConnection() as HttpURLConnection
            connection.connectTimeout = 5_000
            connection.readTimeout = 5_000
            connection.setRequestProperty("User-Agent", "battery-data-app")
            val text = connection.inputStream.bufferedReader().use { it.readText() }
            val entries = parse(text)
            if (entries.isNotEmpty()) {
                runCatching { cache.writeText(text) }
            }
            connection.disconnect()
            entries.ifEmpty { null }
        }.getOrNull()
    }

    private data class ModelEntry(val keys: List<String>, val capacity: Float)
}
