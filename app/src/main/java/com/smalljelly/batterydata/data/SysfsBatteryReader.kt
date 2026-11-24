package com.smalljelly.batterydata.data

import java.io.File
import kotlin.math.abs

/**
 * 读取 /sys/class/power_supply 里的原始节点，拿到设计容量、满电容量、循环次数等
 * BatteryManager 没有公开的数据。部分机型这些节点不可读，此时返回 null 由 UI 降级展示。
 */
internal class SysfsBatteryReader {

    data class Raw(
        val fullChargeMah: Float? = null,
        val designCapacityMah: Float? = null,
        val cycleCount: Int? = null,
    ) {
        val isEmpty: Boolean get() = fullChargeMah == null && designCapacityMah == null && cycleCount == null
    }

    private var cache: Raw = Raw()
    private var lastReadAt = 0L
    /** 电池目录定位结果缓存：readInstant 每秒调用，不能再做全目录 type 探测 */
    @Volatile private var cachedBatteryDir: File? = null

    fun read(force: Boolean = false): Raw {
        val now = System.currentTimeMillis()
        if (!force && now - lastReadAt < CACHE_WINDOW_MS) return cache
        lastReadAt = now
        cache = runCatching { readNow() }.getOrDefault(Raw())
        return cache
    }

    /**
     * 即时读电流/电压（电池目录由 [batteryDirCached] 定位）。
     * 这两个是每秒变化的快变量，不能走 15 秒缓存；厂商节点不统一，按常见度逐个尝试。
     * 返回 (电流 mA, 电压 mV)，读不到的项为 null。
     */
    fun readInstant(): Pair<Float?, Float?> = runCatching {
        val dir = batteryDirCached() ?: return null to null
        // 节点单位基本是 µA / µV（个别老内核 mA/mV，数值 < 10000 时按原值用）
        val currentMa = listOf("current_now", "current_avg")
            .firstNotNullOfOrNull { readValue(File(dir, it))?.toFloatOrNull() }
            ?.let { if (abs(it) > 10_000f) it / 1000f else it }
        val voltageMv = listOf("voltage_now", "voltage_avg")
            .firstNotNullOfOrNull { readValue(File(dir, it))?.toFloatOrNull() }
            ?.let { if (it > 10_000f) it / 1000f else it }
        currentMa to voltageMv
    }.getOrDefault(null to null)

    /** 定位电池目录：只做一次全目录扫描，之后每秒直接复用路径（读不到 current/voltage 再重定位） */
    private fun batteryDirCached(): File? {
        cachedBatteryDir?.let { return it }
        val root = File("/sys/class/power_supply")
        val dir = batteryDirOrNull(root.listFiles()?.filter { it.isDirectory }.orEmpty()) ?: return null
        // 校验这个目录真的挂了电流/电压节点，防止误锁定 usb/dc 节点
        val usable = listOf("current_now", "current_avg", "voltage_now", "voltage_avg")
            .any { File(dir, it).let { f -> f.exists() && f.canRead() } }
        if (usable) {
            cachedBatteryDir = dir
            return dir
        }
        return null
    }

    private fun batteryDirOrNull(dirs: List<File>): File? {
        val battery = dirs.firstOrNull { dir ->
            readValue(File(dir, "type"))?.contains("Battery", true) == true
        }
        return battery ?: dirs.firstOrNull { it.name.contains("batt", true) }
    }

    private fun readNow(): Raw {
        val root = File("/sys/class/power_supply")
        val dirs = root.listFiles()?.filter { it.isDirectory } ?: return Raw()
        if (dirs.isEmpty()) return Raw()

        // 电池节点可能叫 battery / bms / maxfuelgauge 等，先按 type 判断
        val batteryDir = dirs.firstOrNull { dir ->
            readValue(File(dir, "type"))?.contains("Battery", true) == true
        } ?: dirs.firstOrNull { it.name.contains("batt", true) }

        val batteryProps = batteryDir?.let { loadProps(it) }.orEmpty()

        fun value(vararg keys: String): String? {
            // 1) 电池节点 uevent + 单文件
            keys.forEach { key ->
                batteryProps[key]?.let { if (it.isNotEmpty()) return it }
                batteryDir?.let {
                    readValue(File(it, key.lowercase()))?.let { v -> if (v.isNotEmpty()) return v }
                }
            }
            // 2) 设计容量等常被厂商挂在 bms / fuelgauge 等非电池节点上，全局兜底扫描
            dirs.forEach { dir ->
                keys.forEach { key ->
                    readValue(File(dir, key.lowercase()))?.let { v -> if (v.isNotEmpty()) return v }
                    loadProps(dir)[key]?.let { v -> if (v.isNotEmpty()) return v }
                }
            }
            return null
        }

        val fullCharge = value("POWER_SUPPLY_CHARGE_FULL", "CHARGE_FULL")
            ?.toFloatOrNull()
            ?.let { if (it > 10_000f) it / 1000f else it }
            ?.takeIf { it > 100f }

        val design = value(
            "POWER_SUPPLY_CHARGE_FULL_DESIGN",
            "CHARGE_FULL_DESIGN",
            "POWER_SUPPLY_DESIGN_CAPACITY",
            "DESIGN_CAPACITY",
        )
            ?.toFloatOrNull()
            ?.let { if (it > 10_000f) it / 1000f else it }
            ?.takeIf { it > 100f }

        val cycles = value("POWER_SUPPLY_CYCLE_COUNT", "CYCLE_COUNT")
            ?.toIntOrNull()
            ?.takeIf { it >= 0 }

        return Raw(fullChargeMah = fullCharge, designCapacityMah = design, cycleCount = cycles)
    }

    private fun loadProps(dir: File): Map<String, String> = runCatching {
        File(dir, "uevent").readLines().mapNotNull { line ->
            val index = line.indexOf('=')
            if (index <= 0) null else {
                line.substring(0, index).uppercase() to line.substring(index + 1).trim()
            }
        }.toMap()
    }.getOrDefault(emptyMap())

    private fun readValue(file: File): String? = runCatching {
        if (!file.canRead()) null else file.readText().trim().takeIf { it.isNotEmpty() }
    }.getOrNull()

    private companion object {
        const val CACHE_WINDOW_MS = 15_000L
    }
}
