package com.battery.master

import com.battery.master.data.CapacitySource
import com.battery.master.service.BatterySysfs
import com.battery.master.service.BatteryTelemetryParser
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.nio.file.Files

/**
 * v2.0.0-alpha 批次A：多节点电量计探测链回归测试
 *
 * 背景：/sys/class/power_supply/battery 并非全平台挂载完整电量计——
 * 高通 QG/小米澎湃 G1 挂 bms、Pixel (Maxim) 挂 maxfg、OPPO/一加双电芯挂 dc。
 * 旧实现硬编码 battery 目录，这些机型容量/循环计数全部降级 0.92 估算。
 *
 * 覆盖：
 * 1. 目录优先级纯函数——品牌预设 > battery > 评分降序，低分噪声目录剔除；
 * 2. 机型预设联动——xiaomi/google/oppo 等预设目录存在时排到链首；
 * 3. 跨目录读取——readChargeFull 按优先级链取第一个可读电量计目录；
 * 4. 解析器集成——探测链命中后指标 03 来源升级为 SYSFS 实测 (Robolectric)。
 */
class BatteryNodeCatalogTest {

    private lateinit var root: File

    /** 构造模拟 power_supply 目录树，nodes 参数为该目录下创建的节点文件 */
    private fun createDir(name: String, vararg nodes: String): File {
        val dir = File(root, name).apply { mkdirs() }
        nodes.forEach { File(dir, it).writeText("100\n") }
        return dir
    }

    private fun newRoot() {
        root = Files.createTempDirectory("power_supply_test").toFile()
    }

    @After
    fun cleanup() {
        // 恢复空探测结果：后续测试类的解析器走经典 battery 兜底路径
        BatterySysfs.installProbeResultForTest(emptyList())
        BatterySysfs.scanRootOverride = null
        root?.let { dir -> dir.deleteRecursively() }
    }

    // ===== 1. 目录优先级纯函数 =====

    @Test
    fun selectDirs_brandPreset_ranksPreferredDirsFirst() {
        newRoot()
        val bms = createDir("bms", "charge_full", "charge_full_design", "current_now", "cycle_count")
        val maxfg = createDir("maxfg", "charge_full", "cycle_count")
        val battery = createDir("battery", "charge_full", "cycle_count")
        // 噪声目录：仅 1 个特征节点，评分 <2 不参与
        createDir("usb", "temp")

        val dirs = BatterySysfs.selectGaugeDirs(root, brandKey = "Xiaomi")
        assertEquals(
            "xiaomi 预设 [bms, maxfg] 应排在链首，battery 随后",
            listOf(bms.absolutePath, maxfg.absolutePath, battery.absolutePath),
            dirs
        )
    }

    @Test
    fun selectDirs_unknownBrand_batteryFirstThenByScore() {
        newRoot()
        val battery = createDir("battery", "charge_full", "cycle_count")
        val bms = createDir("bms", "charge_full", "charge_full_design", "current_now", "cycle_count", "temp")
        // 预设外的未知品牌：battery 目录优先，其余按评分降序 (bms 5 分)
        val dirs = BatterySysfs.selectGaugeDirs(root, brandKey = "acme")
        assertEquals(listOf(battery.absolutePath, bms.absolutePath), dirs)
    }

    @Test
    fun selectDirs_lowScoreDirsAndMissingRoot_ignored() {
        newRoot()
        createDir("usb", "temp")   // 评分 1：剔除
        assertTrue("全部目录评分不足时返回空链", BatterySysfs.selectGaugeDirs(root, "xiaomi").isEmpty())
        // 根目录不存在 (桌面环境无 /sys)：返回空链，由调用方兜底经典路径
        assertTrue(
            BatterySysfs.selectGaugeDirs(File(root, "nonexistent"), "xiaomi").isEmpty()
        )
    }

    // ===== 2. 跨目录读取：按优先级链取首个可读电量计 =====

    @Test
    fun readChargeFull_walksPriorityChain() {
        newRoot()
        val bms = createDir("bms", "charge_full", "current_now")
        val battery = createDir("battery", "charge_full")
        File(bms, "charge_full").writeText("4890000\n")       // μAh → 4890 mAh
        File(battery, "charge_full").writeText("4500000\n")   // μAh → 4500 mAh

        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath, battery.absolutePath))
        assertEquals("链首 bms 命中时不得读取 battery", 4890, BatterySysfs.readChargeFull()!!)

        BatterySysfs.installProbeResultForTest(listOf(battery.absolutePath, bms.absolutePath))
        assertEquals("链序反转后读取 battery", 4500, BatterySysfs.readChargeFull()!!)
    }

    @Test
    fun readChargeFull_probeEmpty_fallsBackToClassicBatteryPath() {
        newRoot()
        // 探测结果为空：回退经典 /sys/class/power_supply/battery (桌面环境不存在 → null)
        BatterySysfs.installProbeResultForTest(emptyList())
        assertEquals(null, BatterySysfs.readChargeFull())
    }
}

/**
 * 批次A 解析器集成 (Robolectric)：探测链命中后指标 03 升级 SYSFS 实测。
 * 旧实现硬编码 battery 目录：bms/maxfg/dc 平台 charge_full 永远读不到，
 * 指标 03 恒降级 0.92×设计容量估算。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ParserMultiNodeIntegrationTest {

    private lateinit var root: File

    @After
    fun cleanup() {
        BatterySysfs.installProbeResultForTest(emptyList())
        BatterySysfs.scanRootOverride = null
        root?.deleteRecursively()
    }

    @Test
    fun parser_chargeFullFromBmsDir_sourceUpgradesToSysfsMeasured() {
        root = Files.createTempDirectory("power_supply_parser_test").toFile()
        val bms = File(root, "bms").apply { mkdirs() }
        File(bms, "charge_full").writeText("4890000\n")   // μAh → 4890 mAh

        BatterySysfs.installProbeResultForTest(listOf(bms.absolutePath))

        val intent = android.content.Intent(android.content.Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(android.os.BatteryManager.EXTRA_LEVEL, 58)
            putExtra(android.os.BatteryManager.EXTRA_SCALE, 100)
            putExtra(android.os.BatteryManager.EXTRA_STATUS, android.os.BatteryManager.BATTERY_STATUS_DISCHARGING)
        }
        val raw = BatteryTelemetryParser.parse(intent, null, 5000)

        assertEquals(4890, raw.currentCapacityMah)
        assertEquals(CapacitySource.SYSFS, raw.currentCapacitySource)
        assertEquals(4890 * 58 / 100, raw.remainingCapacityMah)
    }
}
