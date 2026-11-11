package com.battery.master.service

import android.os.Build
import java.io.File

/**
 * 设备硬件档案解析器：PMIC 型号 / 快充协议体系 / 电芯结构 / 化学体系
 *
 * 三级回退链，彻底消除"系统未上报"：
 * 1. [实测] Linux sysfs / device-tree 真实节点探测
 *    - PMIC：/proc/device-tree 顶层 compatible 节点 (qcom,pm* / mt6xxx / s2mps / max77xxx ...)
 *    - 快充：/sys/class/power_supply/usb/pd_active、battery/quick_charge_type、dc/online、hv_charge
 *    - 电芯：/sys/class/power_supply/{dc,battery2,maxfg} 双电芯路径、constant_voltage_max 恒压门限
 * 2. [推断] 品牌硬件档案 (Build.MANUFACTURER) 匹配品牌快充协议与 PMIC 体系
 * 3. [估算] 主流工程默认值兜底
 *
 * 输出字段均带来源标注，用户可明确区分实测值与推断值；
 * 静态硬件信息 (PMIC/电芯/化学) 只探测一次并缓存，协议实测带 10 秒 TTL，避免每秒轮询反复读节点。
 */
internal object DeviceHardwareProfile {

    /** 设备静态硬件档案解析结果 */
    data class Profile(
        val pmicModel: String,
        val fastChargeProtocol: String,
        val batteryChemistry: String,
        val cellStructure: String
    )

    // ===== 静态档案缓存（探测一次；null 也视为已探测，避免不可读设备反复扫描 device-tree）=====
    @Volatile private var pmicProbed = false
    @Volatile private var cachedPmic: String? = null
    @Volatile private var cachedCellStructure: String? = null
    @Volatile private var cachedChemistry: String? = null

    // ===== 协议实测 TTL 缓存 =====
    @Volatile private var lastProtocolProbeMs = 0L
    @Volatile private var cachedLiveProtocol: String? = null
    private const val PROTOCOL_TTL_MS = 10_000L

    /** 品牌快充协议体系档案 (推断层) */
    private val brandProtocols = listOf(
        "google" to "USB PD 3.0 (PPS)",
        "xiaomi" to "澎湃秒充 / HyperCharge",
        "redmi" to "澎湃秒充 / HyperCharge",
        "oppo" to "SUPERVOOC 超级闪充",
        "oneplus" to "SUPERVOOC 超级闪充",
        "realme" to "SUPERDART 超级闪充",
        "vivo" to "双芯闪充 (FlashCharge)",
        "iqoo" to "超快闪充 (FlashCharge)",
        "honor" to "超级快充 (HONOR SuperCharge)",
        "huawei" to "超级快充 (SCP)",
        "samsung" to "SFC 超级快充 (PD3.0 PPS)",
        "motorola" to "TurboPower 快充 (PD3.0)",
        "sony" to "USB PD 3.0 快充",
        "asus" to "HyperCharge 快充 (PD3.0)",
        "lenovo" to "超级闪充 (PD3.0)",
        "meizu" to "mCharge 超充",
        "nubia" to "Neotouch 超级快充",
        "zte" to "超级快充 (PD3.0)"
    )

    /** 品牌 PMIC 体系档案 (推断层) */
    private val brandPmics = listOf(
        "google" to "Tensor 专用电源管理芯片 (Shannon PMIC)",
        "samsung" to "Exynos PMIC 体系 (S2MPS 系列)",
        "xiaomi" to "澎湃 P2 快充芯片 + G1 电池管理",
        "redmi" to "小米澎湃电源管理芯片",
        "oppo" to "SUPERVOOC S 电源管理芯片",
        "oneplus" to "SUPERVOOC S 电源管理芯片",
        "realme" to "SUPERVOOC 电源管理芯片",
        "vivo" to "自研电源管理 + 双芯闪充芯片",
        "iqoo" to "自研电竞电源管理芯片",
        "honor" to "荣耀能效增强芯片 (HONOR E1)",
        "huawei" to "海思 Hi6xxx 电源管理 IC",
        "motorola" to "Qualcomm PMIC 电源管理 IC",
        "sony" to "Qualcomm PMIC 电源管理 IC"
    )

    /** 解析设备静态硬件档案（结果进程内缓存） */
    fun resolveProfile(): Profile {
        val manufacturer = Build.MANUFACTURER.lowercase()

        // --- PMIC：device-tree 实测优先，品牌档案回退，工程估算兜底 ---
        val pmicModel = detectPmicFromDeviceTree()
            ?: brandPmics.firstOrNull { manufacturer.startsWith(it.first) }?.second?.let { "$it [品牌档案]" }
            ?: "平台级 PMIC 电源管理 [工程估算]"

        // --- 快充协议体系：品牌档案 / 工程估算 (实测值由 probeLiveProtocol 动态叠加) ---
        val protocol = brandProtocols.firstOrNull { manufacturer.startsWith(it.first) }?.second?.let { "$it [品牌档案]" }
            ?: "USB PD / QC 兼容快充 [工程估算]"

        // --- 电芯结构：双电芯路径实测 → 恒压门限实测 → 主流估算 ---
        val cell = cachedCellStructure ?: detectCellStructure().also { cachedCellStructure = it }

        // --- 化学体系：恒压门限归档 → 主流兜底 ---
        val chemistry = cachedChemistry ?: detectChemistry().also { cachedChemistry = it }

        return Profile(pmicModel, protocol, chemistry, cell)
    }

    /**
     * 实测快充协议（带 10 秒 TTL 缓存，充电协商状态变化时自动刷新）
     * 返回 null 表示当前无可实测的协议节点，由上层回退到档案推断
     */
    fun probeLiveProtocol(): String? {
        val now = System.currentTimeMillis()
        if (now - lastProtocolProbeMs < PROTOCOL_TTL_MS) return cachedLiveProtocol
        lastProtocolProbeMs = now
        cachedLiveProtocol = detectProtocolFromSysfs()
        return cachedLiveProtocol
    }

    /**
     * 扫描 device-tree 顶层与一级子目录的 compatible 节点寻找 PMIC 型号
     * (限定两层深度，compatible 文件权限 444 普通应用可读)
     */
    private fun detectPmicFromDeviceTree(): String? {
        if (pmicProbed) return cachedPmic
        pmicProbed = true
        val found = try {
            val root = File("/proc/device-tree")
            if (!root.isDirectory) {
                null
            } else {
                val candidates = mutableListOf<File>()
                root.listFiles()?.let { files ->
                    files.filterTo(candidates) { it.isFile && it.name == "compatible" }
                    files.filter { it.isDirectory }.forEach { dir ->
                        File(dir, "compatible").takeIf { it.exists() && it.canRead() }?.let { candidates.add(it) }
                    }
                }
                val matched = candidates.asSequence()
                    .mapNotNull { file ->
                        try {
                            file.readBytes().toString(Charsets.UTF_8)
                                .split('\u0000')
                                .firstOrNull { isPmicCompatible(it) }
                        } catch (e: Exception) {
                            null
                        }
                    }
                    .firstOrNull()
                matched?.let { formatPmicName(it) }
            }
        } catch (e: Exception) {
            null
        }
        cachedPmic = found
        return cachedPmic
    }

    /** PMIC compatible 命名特征：高通 pm 系列 / 联发科 mt6xxx / Maxim / 三星 / RK / 海思 / TI 充电芯片 */
    private fun isPmicCompatible(name: String): Boolean = Regex(
        "qcom,pm[67k]?[0-9]|mt6[0-9]{3}|max77[0-9]|maxim,max77|s2mps|s2mpu|rk8[0-9a-z]|hi642[0-9]|bq25[0-9]|sm5703|fan5[0-9]|rt5033"
    ).containsMatchIn(name)

    /** 将 compatible 字符串格式化为可读 PMIC 型号 + [DT 实测] 标注 */
    private fun formatPmicName(compatible: String): String {
        val token = compatible.trim()
        val pretty = when {
            token.startsWith("qcom,") -> "Qualcomm " + token.substringAfter(',').uppercase()
            token.startsWith("mt6") -> "MediaTek " + token.uppercase()
            token.contains("s2mp") -> "Samsung " + token.uppercase()
            token.contains("max77") -> "Maxim " + token.uppercase()
            token.startsWith("rk8") -> "Rockchip " + token.uppercase()
            token.startsWith("hi64") -> "HiSilicon " + token.uppercase()
            token.startsWith("bq25") -> "TI " + token.uppercase()
            else -> token.uppercase()
        }
        return "$pretty [DT 实测]"
    }

    /** sysfs 实测快充协议（高通 pd_active / QC 档位 / OPPO 直充路径 / 高压快充标志） */
    private fun detectProtocolFromSysfs(): String? {
        // 高通 PD_ACTIVE：0 无 / 1 PD2.0 / 2 PD3.0-PPS
        when (BatterySysfs.readInt("/sys/class/power_supply/usb/pd_active")) {
            1 -> return "USB PD 2.0 [实测]"
            2 -> return "USB PD 3.0 (PPS) [实测]"
        }
        // PD 版本寄存器 (hex 编码，非 0 视为已协商 PD)
        BatterySysfs.readInt("/sys/class/power_supply/usb/pd_revision")?.let {
            if (it > 0) return "USB PD (Rev ${it.toString(16)}) [实测]"
        }
        // 高通 QC 档位节点
        BatterySysfs.readInt("/sys/class/power_supply/battery/quick_charge_type")?.let {
            if (it > 0) return "Quick Charge (档位 $it) [实测]"
        }
        // OPPO/一加双芯直充路径
        if (BatterySysfs.readInt("/sys/class/power_supply/dc/online") == 1) {
            return "SUPERVOOC 直充 [实测]"
        }
        // 高压快充标志
        if (BatterySysfs.readInt("/sys/class/power_supply/battery/hv_charge") == 1 ||
            BatterySysfs.readInt("/sys/class/power_supply/battery/hv_charging") == 1
        ) {
            return "高压快充 (HV) [实测]"
        }
        return null
    }

    /** 电芯结构探测：双电芯专用路径存在性 → 恒压门限 → 主流单电芯估算 */
    private fun detectCellStructure(): String {
        val dualCellPaths = listOf(
            "/sys/class/power_supply/dc",        // OPPO/一加 双电芯直充
            "/sys/class/power_supply/battery2",  // 通用第二电芯
            "/sys/class/power_supply/maxfg"      // Maxim 双芯电量计 (Pixel 8 Pro 等)
        )
        dualCellPaths.firstOrNull { File(it).exists() }?.let {
            return "串联双电芯分压快充 [实测]"
        }
        val cvMax = readConstantVoltageMax()
        return if (cvMax != null && cvMax >= 4400) {
            "单电芯高压聚合物 (恒压 ${cvMax}mV) [实测]"
        } else {
            "标准单电芯封装 [工程估算]"
        }
    }

    /** 化学体系归档：按恒压门限区分高压/标准电芯体系 */
    private fun detectChemistry(): String {
        val cvMax = readConstantVoltageMax()
        return when {
            cvMax == null -> "锂离子/聚合物电芯 (主流体系) [工程估算]"
            cvMax >= 4450 -> "高压硅碳/锂离子电芯 (恒压 ${cvMax}mV) [实测]"
            cvMax >= 4350 -> "高压锂聚合物电芯 (恒压 ${cvMax}mV) [实测]"
            else -> "标准锂离子电芯 (恒压 ${cvMax}mV) [实测]"
        }
    }

    /** 恒压门限读取 (化学体系与电芯结构共用) */
    private fun readConstantVoltageMax(): Int? =
        BatterySysfs.readInt("/sys/class/power_supply/battery/constant_voltage_max")
            ?: BatterySysfs.readInt("/sys/class/power_supply/battery/voltage_max")
}
