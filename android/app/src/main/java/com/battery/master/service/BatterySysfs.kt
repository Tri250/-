package com.battery.master.service

import java.io.File
import kotlin.math.abs

/**
 * 电池 sysfs 节点读取与电流单位归一化工具
 *
 * 背景：BatteryManager.BATTERY_PROPERTY_CURRENT_NOW 官方规范返回微安 (μA)，
 * 但部分旧内核/芯片实际返回毫安 (mA)。若统一按某一单位换算，
 * 会在涓流区间 (0~25 mA) 产生 1000 倍误差，直接破坏指标 11 (瞬时电流)
 * 与指标 12 (完全充满判定) 的正确性，故做单位归一化处理。
 */
internal object BatterySysfs {

    /**
     * 从 Linux sysfs 读取电池节点数据
     * (例如高通/联发科平台的 /sys/class/power_supply/battery/)
     */
    fun readInt(path: String): Int? = try {
        val file = File(path)
        if (file.exists() && file.canRead()) file.readText().trim().toIntOrNull() else null
    } catch (e: Exception) {
        null
    }

    /**
     * 将 CURRENT_NOW 原始值归一化为毫安 (mA)，统一符号约定"充电为正、放电为负"
     *
     * v1.2.3 P0 审计修复：
     * 1. 可空语义：设备不支持 BATTERY_PROPERTY_CURRENT_NOW 时系统返回
     *    Int.MIN_VALUE (旧实现归一化为 0 mA，导致不支持该属性的机型在 100%
     *    电量时充满判定恒真、估算值被冒充实测锁定写盘)。现 Int.MIN_VALUE
     *    与 null 一律返回 null = 电流不可读，判定方走 UNKNOWN 而非 true。
     *    真实 0 mA (浮充截止) 仍是合法读数，返回 0。
     * 2. 符号归一：AOSP 未规定 current_now 符号方向，实际随平台/HAL 而变
     *    (大量高通/三星内核充电时上报负值)。旧实现只处理量纲不校验符号，
     *    使指标 12 判定 (0~25 mA) 在这类机型上永不成立。现按充放电状态
     *    校准符号：充电态取正值、放电态取负值，未知态保持原始符号。
     *
     * @param raw CURRENT_NOW 原始读数 (μA 或 mA，随 HAL 而定)，允许 null
     * @param isCharging 是否处于充电/满电状态 (null = 未知，不翻转符号)
     * @return 归一化后的 mA 值；不可读返回 null
     */
    fun normalizeCurrentToMilliAmps(raw: Int?, isCharging: Boolean?): Int? {
        // 不支持/不可读：返回 null，绝不归一化成 0 (0 是合法浮充读数，语义不同)
        if (raw == null || raw == Int.MIN_VALUE) return null
        if (raw == 0) return 0

        val normalized = normalizeCurrentToMilliAmpsInternal(raw).coerceIn(
            -BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA,
            BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA
        )

        // 符号校准：跨平台统一"充电为正、放电为负"口径
        return when {
            isCharging == true && normalized < 0 -> -normalized
            isCharging == false && normalized > 0 -> -normalized
            else -> normalized
        }
    }

    private fun normalizeCurrentToMilliAmpsInternal(raw: Int): Int {
        if (raw == 0 || raw == Int.MIN_VALUE) return 0
        val absRaw = abs(raw)
        if (absRaw > 20000) return raw / 1000

        // v2.0.0-alpha.5 自检修复：先取电量计容量上报单位惯例 (同一驱动对
        // charge_full 与 current_now 的单位一致——mAh 上报内核两者皆 mA，
        // 规范 μAh 内核两者皆 μA)，供下方歧义分支裁决
        val milliStyleGauge = gaugeReportsMilliAmpStyleUnits()

        // v2.0.0-alpha 批次A：电流单位判定参照改为多节点探测链
        // (bms/maxfg 平台的 battery 目录无 current_now，旧硬编码路径拿不到参照)
        val sysfsCurrent = readCurrentNow()
        if (sysfsCurrent != null && abs(sysfsCurrent) > 0) {
            val ratio = abs(sysfsCurrent).toFloat() / absRaw
            if (ratio in 500f..2000f) return raw
            if (ratio in (1f / 2000f)..(1f / 500f)) return raw / 1000
            // 同源同值 (ratio≈1)：μA 内核与 mA 内核均落入此分支，量纲无法由比值裁决。
            // v2.0.0-alpha.5 修复：按电量计容量单位惯例裁决——mAh 上报内核的
            // current_now 亦为 mA，直接采用原始值。旧实现一律 /1000，使 mA 上报
            // 内核的 1150 mA 充电被系统性低报为 1 mA，连带污染指标 12 充满判定
            // (100% 时 1150 mA 落入 0~25 mA 浮充区间被误判"已充满")
            if (ratio in 0.5f..2f && milliStyleGauge) return raw
            return raw / 1000
        }
        // sysfs 电流参照缺失：同样按容量单位惯例裁决 (mA 上报内核原始值即 mA)。
        // 旧实现无 sysfs 参照时一律 /1000，同类低报通路
        if (milliStyleGauge) return raw
        return raw / 1000
    }

    /**
     * v2.0.0-alpha.5 自检修复：电量计容量上报单位惯例检测。
     *
     * 同一电量计驱动对 charge_full 与 current_now 的单位惯例一致：
     * charge_full 以 mAh 上报的内核 (见 [parseCapacityMah] 分支 2)，current_now 亦为 mA；
     * 规范 μAh 内核 current_now 亦为 μA。该提示仅用于 current_now 归一化的歧义裁决——
     * BatteryManager 属性与 sysfs 同源同值 (ratio≈1) 时比值无法区分 μA/mA 内核
     * (两者均为 ratio==1)，按容量单位惯例裁决。
     *
     * @return true = mAh 上报内核 (current_now 亦为 mA)；false = 规范 μAh 内核或节点不可读
     */
    private fun gaugeReportsMilliAmpStyleUnits(): Boolean {
        val raw = readAcrossDirs("charge_full") { readInt(it) } ?: return false
        val microAhCapacityMah = Math.round(raw / 1000f)
        if (microAhCapacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..
            BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH
        ) {
            return false // 规范 μAh 上报内核
        }
        return raw in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..
            BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH // mAh 上报内核
    }

    /**
     * 容量原始值 → mAh 双单位归一化 (指标 03 当前容量 / 指标 04 设计容量共用)
     *
     * 背景：charge_full / charge_full_design 规范单位为 μAh，但个别内核以 mAh 上报。
     * 判定链 (合理区间与 BatteryTelemetryParser 常量单源一致)：
     * 1. round(raw / 1000) ∈ [500, 25000] → 规范 μAh，四舍五入取整返回；
     * 2. raw ∈ [500, 25000] → μAh 单位下 0.5~25 mAh 电芯物理上不存在，
     *    必为 mAh 上报内核 → 直接返回原始值；
     * 3. 其余 (0 / 负值 / 越界) 一律视为脏数据返回 null，由调用方回退设计容量估算值。
     */
    fun parseCapacityMah(raw: Int): Int? {
        if (raw <= 0 || raw == Int.MIN_VALUE) return null
        val microAhCapacityMah = Math.round(raw / 1000f)
        if (microAhCapacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
            return microAhCapacityMah
        }
        if (raw in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
            return raw
        }
        return null
    }

    /** 读取 sysfs 容量节点并归一化为 mAh；不可读或脏数据返回 null */
    fun readCapacityMah(path: String): Int? = readInt(path)?.let(::parseCapacityMah)

    // ===== v2.0.0-alpha 批次A：多节点电量计探测链 =====
    //
    // 背景：/sys/class/power_supply/battery 并非全平台都挂载完整电量计节点——
    // 高通 QG 平台与小米澎湃 G1 挂 bms、Pixel (Maxim) 挂 maxfg、OPPO/一加双电芯挂 dc。
    // 旧实现硬编码 battery 目录，这些机型 charge_full/charge_full_design/current_now
    // 全部不可读，指标 03/04 降级 0.92 估算、指标 11 电流符号校准缺少 sysfs 参照。
    // 探测链：按品牌预设优先级 + 特征节点评分自动选出真实电量计目录，探测一次缓存。

    /** 探测根目录可注入 (单元测试用临时目录验证目录优先级逻辑) */
    @Volatile internal var scanRootOverride: String? = null

    private const val DEFAULT_SCAN_ROOT = "/sys/class/power_supply"

    /** 电量计特征节点：命中越多越可信是该平台的真实电量计目录
     *  (v2.0.0-alpha.6：energy 系节点加入签名——energy_full-only 机型识别) */
    private val gaugeSignatureNodes = listOf(
        "charge_full_design", "charge_full", "energy_full_design", "energy_full",
        "current_now", "cycle_count", "temp", "voltage_now"
    )

    /**
     * 机型预设节点联动：品牌 → 优先探测目录 (排名分先后)。
     * 预设仅在目录真实存在且含足够电量计特征节点时生效，不存在自动滑落到
     * battery 目录与其余评分目录，预设错误不会导致误读
     */
    private val brandPreferredGaugeDirs = listOf(
        "xiaomi" to listOf("bms", "maxfg"),
        "redmi" to listOf("bms", "maxfg"),
        "poco" to listOf("bms", "maxfg"),
        "google" to listOf("maxfg", "bms"),
        "oppo" to listOf("dc", "bms"),
        "oneplus" to listOf("dc", "bms"),
        "realme" to listOf("dc", "bms"),
        "vivo" to listOf("bms", "battery"),
        "iqoo" to listOf("bms", "battery"),
        "samsung" to listOf("battery", "bms"),
        "honor" to listOf("battery", "bms"),
        "huawei" to listOf("battery", "bms"),
        "asus" to listOf("maxfg", "battery"),
        "motorola" to listOf("battery", "bms"),
        "nubia" to listOf("bms", "battery"),
        "zte" to listOf("bms", "battery")
    )

    // 探测结果缓存：探测一次 (空结果也缓存，避免不可读设备每秒重扫 power_supply)
    @Volatile private var probed = false
    @Volatile private var cachedGaugeDirs: List<String> = emptyList()

    /** 电量计目录评分：特征节点命中数 (存在且可读) */
    private fun scoreGaugeDir(dir: File): Int =
        gaugeSignatureNodes.count { node ->
            runCatching { File(dir, node).let { it.exists() && it.canRead() } }.getOrDefault(false)
        }

    /**
     * 纯函数 (测试可直接驱动)：扫描 power_supply 根目录并给出电量计目录优先级链。
     * 优先级：品牌预设目录 (存在且评分≥2) > battery > 其余按评分降序；
     * 评分 <2 (至少两个特征节点) 的目录视为噪声目录不参与
     */
    internal fun selectGaugeDirs(root: File, brandKey: String): List<String> {
        val brand = brandKey.lowercase()
        val scored = runCatching {
            root.listFiles()?.filter { it.isDirectory }?.map { it to scoreGaugeDir(it) }
        }.getOrNull() ?: return emptyList()
        val valid = scored.filter { it.second >= 2 }
        if (valid.isEmpty()) return emptyList()

        val ordered = mutableListOf<File>()
        val preferred = brandPreferredGaugeDirs
            .firstOrNull { brand.startsWith(it.first) }?.second ?: emptyList()
        preferred.forEach { name -> valid.firstOrNull { it.first.name == name }?.let { ordered.add(it.first) } }
        valid.filter { it.first.name == "battery" && it.first !in ordered }.forEach { ordered.add(it.first) }
        valid.sortedByDescending { it.second }.forEach { if (it.first !in ordered) ordered.add(it.first) }
        return ordered.map { it.absolutePath }
    }

    /** 运行时探测 (带缓存与 Throwable 兜底)；测试可经 installProbeResultForTest 注入 */
    private fun resolveGaugeDirs(): List<String> {
        if (probed) return cachedGaugeDirs
        probed = true
        cachedGaugeDirs = try {
            selectGaugeDirs(
                File(scanRootOverride ?: DEFAULT_SCAN_ROOT),
                android.os.Build.MANUFACTURER.lowercase()
            )
        } catch (e: Throwable) {
            emptyList()
        }
        return cachedGaugeDirs
    }

    /** 测试注入探测结果 (Robolectric 桌面环境无真实 /sys) */
    internal fun installProbeResultForTest(dirs: List<String>) {
        probed = true
        cachedGaugeDirs = dirs
    }

    /** 电量计目录优先级链 (含兜底)：探测为空时回退经典 battery 路径，兼容只读受限环境 */
    private fun gaugeDirsOrDefault(): List<String> {
        val dirs = resolveGaugeDirs()
        return if (dirs.isNotEmpty()) dirs else listOf("$DEFAULT_SCAN_ROOT/battery")
    }

    /**
     * v2.0.0-alpha.1：探测链命中节点标签 (如 "bms"/"maxfg"/"battery")，
     * 遥测分析 Tab 采集链路卡展示真实数据来源。
     * v2.0.0-alpha.3 诚实口径：探测链未命中任何存在目录时显示"无"——
     * 旧实现回退展示 "battery" 名，但此时并未从 battery 目录读到任何数据，
     * 属失实标注 (是多少就是多少)
     */
    fun gaugeNodeLabel(): String {
        val dirs = resolveGaugeDirs()
        return if (dirs.isNotEmpty()) java.io.File(dirs.first()).name else "无"
    }

    private fun <T> readAcrossDirs(node: String, transform: (String) -> T?): T? =
        gaugeDirsOrDefault().firstNotNullOfOrNull { dir -> transform("$dir/$node") }

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 charge_full (衰减后容量，μAh/mAh 双归一)
     *  v2.0.0-alpha.6：charge_full 全链不可读时回退 energy_full (μWh 经实测电压折算)——
     *  部分设备 (Pixel 部分世代/联发科平台) 只导出 energy 系节点，旧探测链直接错过，
     *  指标 01/03 永远"无法测算" */
    fun readChargeFull(): Int? =
        readAcrossDirs("charge_full") { readCapacityMah(it) }
            ?: readEnergyNodeCapacityMah("energy_full")

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 charge_full_design (设计容量)
     *  v2.0.0-alpha.6：同理回退 energy_full_design 折算 */
    fun readChargeFullDesign(): Int? =
        readAcrossDirs("charge_full_design") { readCapacityMah(it) }
            ?: readEnergyNodeCapacityMah("energy_full_design")

    /**
     * v2.0.0-alpha.6：energy 系节点 (μWh) → 容量 (mAh) 物理折算。
     *
     * power_supply class 规范：energy_full / energy_full_design 单位 μWh，
     * Q(mAh) = E(μWh) / V(mV) (E = Q·V/1000，量纲恒等变形)。
     * 折算电压取节点 voltage_now (规范单位 μV → mV)，钳制到标称窗口 [3400, 4000] mV——
     * 满充 4.4V+/关机 3.3V- 极值会引入 ~10% 折算失真，窗口外回落标称 3850 mV
     * (锂电行业标称电压惯例)；节点不可读同样用标称值兜底。
     */
    private fun readEnergyNodeCapacityMah(node: String): Int? {
        val energyUwh = readAcrossDirs(node) { readInt(it) } ?: return null
        if (energyUwh <= 0 || energyUwh == Int.MIN_VALUE) return null
        val voltageMv = nominalVoltageForEnergyConversion()
        val capacityMah: Int = Math.round(energyUwh.toDouble() / voltageMv).toInt()
        return if (capacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..
            BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH
        ) capacityMah else null
    }

    /**
     * v2.0.0-alpha.7：sysfs 实时电压第二通道 (指标 09)——原始读数，不施加钳制。
     *
     * EXTRA_VOLTAGE (Intent 广播通道) 与 voltage_now (sysfs 通道) 是两条独立硬件通路：
     * 部分 ROM 广播缺失 EXTRA_VOLTAGE 但 sysfs 节点完好，旧解析层单通道消费
     * 导致这类设备电压恒显默认 4000 mV。本函数作为解析层第二回退通道。
     * 注：不钳制——钳制语义属 energy 容量折算专用 (nominalVoltageForEnergyConversion)，
     * 遥测主通道必须呈现真实读数并如实标注测量状态。
     *
     * v2.0.0-alpha.8 真机自检修复 (指标 09 无正常显示根因)：
     * 1. 多节点探测链——voltage_now / voltage_avg / voltage_batt / voltage_ocv，
     *    并扩扫 power_supply 全量目录 (旧实现仅扫描电量计特征评分≥2 的目录，
     *    只导出电压节点的平台被评分过滤器直接排除，电压通道整机失效)；
     * 2. 双单位裁决——power_supply ABI 规范 voltage_now 单位 μV，但部分内核
     *    以 mV 上报：旧实现盲目 /1000 把 4350 mV 折成 4 mV 后被合理区间
     *    [2000,12000] 拒绝，通道静默死亡。现先按 μV 折算校验、再按 mV 原值校验。
     */
    fun readVoltageNowMilliVolts(): Int? {
        val raw = readMultiNode(VOLTAGE_NODE_CANDIDATES) ?: return null
        if (raw <= 0 || raw == Int.MIN_VALUE) return null
        val microVoltToMv = Math.round(raw / 1000f).toInt()
        return when {
            microVoltToMv in BatteryTelemetryParser.MIN_PLAUSIBLE_VOLTAGE_MV..
                BatteryTelemetryParser.MAX_PLAUSIBLE_VOLTAGE_MV -> microVoltToMv
            raw in BatteryTelemetryParser.MIN_PLAUSIBLE_VOLTAGE_MV..
                BatteryTelemetryParser.MAX_PLAUSIBLE_VOLTAGE_MV -> raw
            else -> null
        }
    }

    /** 电压节点探测链 (节点优先级)：now 实时 > avg 均值 > batt 别名 > ocv 开路电压
     *  (ocv 与端电压差 IR 压降，仅作深度兜底) */
    private val VOLTAGE_NODE_CANDIDATES = listOf(
        "voltage_now", "voltage_avg", "voltage_batt", "voltage_ocv"
    )

    /** 电流节点探测链：now 实时 > avg 均值 > bms/battery 别名 > MTK BatteryAverageCurrent */
    private val CURRENT_NODE_CANDIDATES = listOf(
        "current_now", "current_avg", "bms_current", "battery_current", "BatteryAverageCurrent"
    )

    /**
     * v2.0.0-alpha.8：多节点跨目录读取 (节点优先级 > 目录链)。
     * 目录链 = 电量计探测链 (品牌预设优先) + power_supply 全量子目录去重——
     * 电压/电流节点可能独立存在于评分 <2 的低特征目录 (如纯测量目录)，
     * 旧"仅电量计评分目录"的扫描范围使这类平台通道整机不可用。
     */
    private fun readMultiNode(nodes: List<String>): Int? {
        val gauge = gaugeDirsOrDefault()
        val extra = resolveAllSupplyDirs().filter { it !in gauge }
        val dirs = gauge + extra
        return nodes.firstNotNullOfOrNull { node ->
            dirs.firstNotNullOfOrNull { dir -> readInt("$dir/$node") }
        }
    }

    // 全量目录扫描缓存：探测一次 (空结果也缓存，避免 1Hz 轮询重扫 sysfs)
    @Volatile private var allDirsProbed = false
    @Volatile private var cachedAllSupplyDirs: List<String> = emptyList()

    /** power_supply 根目录下全部子目录 (不限电量计特征评分)；Throwable 级兜底 */
    private fun resolveAllSupplyDirs(): List<String> {
        if (allDirsProbed) return cachedAllSupplyDirs
        allDirsProbed = true
        cachedAllSupplyDirs = runCatching {
            File(scanRootOverride ?: DEFAULT_SCAN_ROOT)
                .listFiles()?.filter { it.isDirectory }?.map { it.absolutePath }
        }.getOrNull() ?: emptyList()
        return cachedAllSupplyDirs
    }

    /** 测试注入全量目录扫描结果 (与 installProbeResultForTest 并列) */
    internal fun installAllSupplyDirsForTest(dirs: List<String>) {
        allDirsProbed = true
        cachedAllSupplyDirs = dirs
    }

    /** energy 系容量折算专用标称电压 (mV)：实测值钳制到标称窗口 [3400, 4000]
     *  (满充 4.4V+/关机 3.3V- 极值会引入 ~10% 折算失真)，不可读回落标称 3850 mV。
     *  与遥测主通道 [readVoltageNowMilliVolts] 的"原始呈现"语义分离，互不干扰 */
    private fun nominalVoltageForEnergyConversion(): Int =
        readVoltageNowMilliVolts()?.coerceIn(MIN_NOMINAL_VOLTAGE_MV, MAX_NOMINAL_VOLTAGE_MV)
            ?: NOMINAL_VOLTAGE_MV

    /** energy 折算标称电压窗口 (mV)：窗口外 (满充/关机极值) 回落标称 3850 mV */
    private const val NOMINAL_VOLTAGE_MV = 3850
    private const val MIN_NOMINAL_VOLTAGE_MV = 3400
    private const val MAX_NOMINAL_VOLTAGE_MV = 4000

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 cycle_count (循环计数) */
    fun readCycleCount(): Int? = readAcrossDirs("cycle_count") { readInt(it) }

    /** v2.0.0-alpha 批次A：跨电量计目录链读取 current_now 原始值 (μA/mA 单位判定参照)
     *  v2.0.0-alpha.8：扩为多节点探测链 (current_avg/bms_current/BatteryAverageCurrent)，
     *  bms/maxfg 平台 battery 目录无 current_now 时参照不再缺失 */
    fun readCurrentNow(): Int? = readMultiNode(CURRENT_NODE_CANDIDATES)

    /**
     * v2.0.0-alpha.8：sysfs 电流值通道 (指标 11 真机无正常显示核心修复)。
     *
     * 旧实现 BATTERY_PROPERTY_CURRENT_NOW 是唯一取值通道，sysfs current_now 仅作
     * 单位裁决参照——HAL 不支持该属性的机型 (返回 Int.MIN_VALUE，MTK/部分华为三星
     * 常见) 即便 sysfs 电流节点完好，指标 11 也恒显 "—"。本通道把 sysfs 多节点
     * 读数作为**取值**回退：单位归一与符号校准完整复用 normalizeCurrentToMilliAmps
     * (sysfs 原始值与其内部参照同源同值，ratio≈1 落入容量单位惯例裁决分支)。
     *
     * @param isCharging 充放电状态 (符号校准)，null = 未知不翻转
     */
    fun readCurrentNowMilliAmps(isCharging: Boolean?): Int? =
        readMultiNode(CURRENT_NODE_CANDIDATES)?.let { normalizeCurrentToMilliAmps(it, isCharging) }
}
