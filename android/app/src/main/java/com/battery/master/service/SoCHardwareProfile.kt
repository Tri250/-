package com.battery.master.service

import android.os.Build
import java.io.File

/**
 * SoC 主控芯片档案解析结果
 *
 * @property model   SoC 型号 (营销名优先，如 "Snapdragon 8 Gen 3")
 * @property vendor  SoC 厂商 (如 "Qualcomm 高通")
 * @property process 制程工艺 (如 "4nm (TSMC N4P)")
 * @property cpu     CPU 架构与核心配置
 * @property gpu     GPU 型号
 */
internal data class SocProfile(
    val model: String,
    val vendor: String,
    val process: String,
    val cpu: String,
    val gpu: String
)

/**
 * SoC 主控功能模块：型号 / 厂商 / 制程 / CPU 架构 / GPU 五字段全量解析
 *
 * 检测链与 DeviceHardwareProfile (PMIC) 同构，彻底消除"系统未上报"：
 * 1. [实测] API 31+ Build.SOC_MODEL / Build.SOC_MANUFACTURER (ro.soc.model 系统属性)
 * 2. [实测] Linux soc0 节点 /sys/devices/soc0/{machine,family,model} (权限 444 可读)
 * 3. [实测] /proc/cpuinfo "Hardware:" 行 (高通/联发科普遍填充 SoC 型号)
 * 4. [品牌档案] 平台代号档案 (Build.BOARD/DEVICE/HARDWARE，如 pineapple/kona/mt6989)
 *    命中后映射营销名 + 制程/CPU/GPU 完整规格 (来源：各厂商官方规格页)
 * 5. [工程估算] 品牌平台估算兜底 (按 Build.MANUFACTURER 推断 SoC 厂商体系)
 *
 * 启动闪退治理：/proc 与 /sys 扫描在部分 OEM ROM 会抛 Error 级异常，
 * 全链路按 Throwable 兜底；静态档案探测一次即缓存，不参与每秒轮询。
 */
internal object SoCHardwareProfile {

    /** 设备 SoC 静态档案：探测一次即缓存 (null 也视为已探测) */
    @Volatile private var socProbed = false
    @Volatile private var cachedProfile: SocProfile? = null

    /** 平台规格档案：代号/型号 token -> 营销名 + 厂商 + 制程 + CPU + GPU */
    private data class PlatformSoc(
        val vendor: String,
        val marketingName: String,
        val process: String,
        val cpu: String,
        val gpu: String
    )

    private val socPlatforms: List<Pair<List<String>, PlatformSoc>> = listOf(
        // ===== Qualcomm 骁龙 8 系旗舰 =====
        listOf("sm8650", "pineapple") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Gen 3 (第三代骁龙 8)",
            "4nm (TSMC N4P)",
            "1×Cortex-X4@3.3GHz + 5×Cortex-A720@3.2GHz + 2×Cortex-A520@2.3GHz (Kryo)",
            "Adreno 750"
        ),
        listOf("sm8750", "sun") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Elite (骁龙 8 至尊版)",
            "3nm (TSMC N3E)",
            "2×Oryon 超大核@4.32GHz + 6×Oryon 大核@3.53GHz (自研 8 核)",
            "Adreno 830"
        ),
        listOf("sm8850") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Elite Gen 5 (第五代骁龙 8 至尊版)",
            "3nm (TSMC N3P)",
            "2×Oryon 三代超大核@4.74GHz + 6×Oryon 大核 (自研 8 核)",
            "Adreno 840 (12CU @1.2GHz)"
        ),
        listOf("sm8550", "kalama") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Gen 2 (第二代骁龙 8)",
            "4nm (TSMC N4P)",
            "1×Cortex-X3@3.2GHz + 4×Cortex-A715@2.8GHz + 3×Cortex-A510@2.0GHz",
            "Adreno 740"
        ),
        listOf("sm8475") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8+ Gen 1 (骁龙 8+ Gen 1)",
            "4nm (TSMC N4)",
            "1×Cortex-X2@3.2GHz + 3×Cortex-A710@2.75GHz + 4×Cortex-A510@1.8GHz",
            "Adreno 730"
        ),
        listOf("sm8450", "waipio") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8 Gen 1 (全新骁龙 8)",
            "4nm (Samsung 4LPE)",
            "1×Cortex-X2@3.0GHz + 3×Cortex-A710@2.5GHz + 4×Cortex-A510@1.8GHz",
            "Adreno 730"
        ),
        listOf("sm8635") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8s Gen 3 (第三代骁龙 8s)",
            "4nm (TSMC N4P)",
            "1×Cortex-X4@3.0GHz + 4×Cortex-A720@2.8GHz + 3×Cortex-A520@2.0GHz",
            "Adreno 735"
        ),
        listOf("sm8475q", "sm8550p") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 8+ Gen 1 / 8 Gen 2 高频版",
            "4nm (TSMC N4)",
            "1×Cortex-X2@3.2GHz + 3×Cortex-A710@2.75GHz + 4×Cortex-A510@1.8GHz",
            "Adreno 730"
        ),
        listOf("lahaina") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 888 (骁龙 888)",
            "5nm (Samsung 5LPE)",
            "1×Cortex-X1@2.84GHz + 3×Cortex-A78@2.42GHz + 4×Cortex-A55@1.8GHz (Kryo 680)",
            "Adreno 660"
        ),
        listOf("kona") to PlatformSoc(
            "Qualcomm 高通", "Snapdragon 865 (骁龙 865)",
            "7nm (TSMC N7P)",
            "1×Cortex-A77@2.84GHz + 3×Cortex-A77@2.42GHz + 4×Cortex-A55@1.8GHz (Kryo 585)",
            "Adreno 650"
        ),
        // ===== MediaTek 天玑旗舰 =====
        listOf("mt6991") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9500 (天玑 9500)",
            "3nm (TSMC N3P)",
            "1×Arm C1-Ultra@4.21GHz + 3×C1-Premium + 4×C1-Pro (全大核 8 核)",
            "Arm Mali-G1 Ultra MC12"
        ),
        listOf("mt6990") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9400 (天玑 9400)",
            "3nm (TSMC N3E)",
            "1×Cortex-X925@3.62GHz + 3×Cortex-X4@3.3GHz + 4×Cortex-A720@2.4GHz (全大核)",
            "Immortalis-G925 MC12"
        ),
        listOf("mt6989") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9300 (天玑 9300)",
            "4nm (TSMC N4P)",
            "4×Cortex-X4@3.25GHz + 4×Cortex-A720@2.0GHz (全大核 8 核)",
            "Immortalis-G720 MC12"
        ),
        listOf("mt6985") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9200 (天玑 9200)",
            "4nm (TSMC N4P)",
            "1×Cortex-X3@3.05GHz + 3×Cortex-A715@2.85GHz + 4×Cortex-A510@1.8GHz",
            "Immortalis-G715 MC11"
        ),
        listOf("mt6983") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 9200 / 9200+ (天玑 9200 系列)",
            "4nm (TSMC N4P)",
            "1×Cortex-X3@3.05GHz + 3×Cortex-A715@2.85GHz + 4×Cortex-A510@1.8GHz",
            "Immortalis-G715 MC11"
        ),
        listOf("mt6897") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 8300 Ultra (天玑 8300-Ultra)",
            "4nm (TSMC N4P)",
            "1×Cortex-A715@3.35GHz + 3×Cortex-A715@3.2GHz + 4×Cortex-A510@2.2GHz",
            "Mali-G615 MC6"
        ),
        listOf("mt8798") to PlatformSoc(
            "MediaTek 联发科", "Dimensity 8500 系列 (天玑 8500)",
            "4nm",
            "全大核 8×Cortex-A725 (至高 3.4GHz)",
            "Arm Mali-G720 MC8"
        ),
        // ===== Google Tensor =====
        listOf("tensor", "g4", "zuma") to PlatformSoc(
            "Google 谷歌", "Google Tensor G4",
            "4nm (Samsung 4LPP)",
            "1×Cortex-X4@3.1GHz + 3×Cortex-A720@2.6GHz + 4×Cortex-A520@1.92GHz",
            "Arm Mali-G715 MC7"
        ),
        listOf("g3", "ripcurrent") to PlatformSoc(
            "Google 谷歌", "Google Tensor G3",
            "4nm (Samsung 4LPP)",
            "1×Cortex-X3@2.91GHz + 4×Cortex-A715@2.61GHz + 4×Cortex-A510@1.83GHz",
            "Arm Mali-G710 MC7"
        ),
        // ===== Samsung Exynos =====
        listOf("exynos2400", "s5e9945") to PlatformSoc(
            "Samsung 三星", "Samsung Exynos 2400",
            "4nm (Samsung 4LPP)",
            "10 核 (1×Cortex-X4@3.21GHz + 2+3×Cortex-A720 + 4×Cortex-A520)",
            "Samsung Xclipse 940 (AMD RDNA3)"
        ),
        listOf("exynos2200", "s5e9925") to PlatformSoc(
            "Samsung 三星", "Samsung Exynos 2200",
            "4nm (Samsung 4LPE)",
            "1×Cortex-X2@2.95GHz + 3×Cortex-A710@2.5GHz + 4×Cortex-A510@1.8GHz",
            "Samsung Xclipse 920 (AMD RDNA2)"
        ),
        // ===== HiSilicon 海思麒麟 =====
        listOf("kirin9000", "hi36a0") to PlatformSoc(
            "HiSilicon 海思", "Kirin 9000 (麒麟 9000)",
            "5nm (TSMC N5)",
            "1×Cortex-A77@3.13GHz + 3×Cortex-A77@2.54GHz + 4×Cortex-A55@2.05GHz",
            "Mali-G78 MP24"
        ),
        listOf("kirin9000s", "hi36c0") to PlatformSoc(
            "HiSilicon 海思", "Kirin 9000S (麒麟 9000S)",
            "7nm 级 (N+2)",
            "8 核 (1 超大核 + 3 大核 + 4 能效核)",
            "Maleoon 910"
        ),
        // ===== UNISOC 展锐 =====
        listOf("t760", "unisoc") to PlatformSoc(
            "UNISOC 展锐", "UNISOC T760 (虎贲 T760)",
            "6nm (EUV)",
            "1×Cortex-A76@2.2GHz + 3×Cortex-A76@2.0GHz + 4×Cortex-A55@1.8GHz",
            "Mali-G57 MC4"
        )
    )

    /** 按平台代号键查找规格档案 (供营销名别名表引用，避免下标硬编码) */
    private fun platformOf(vararg keys: String): PlatformSoc =
        socPlatforms.first { entry -> entry.first.any { it in keys } }.second

    /** 营销名匹配键 (Build.SOC_MODEL 等原始值直接给营销名时命中) */
    private val marketingAliases: List<Pair<List<String>, PlatformSoc>> = listOf(
        listOf("snapdragon 8 gen 3", "骁龙8 gen 3", "骁龙 8 gen 3", "sd 8 gen 3") to platformOf("sm8650"),
        listOf("snapdragon 8 elite gen 5", "第五代骁龙8至尊版", "第五代骁龙 8 至尊版", "8 elite gen 5") to platformOf("sm8850"),
        listOf("snapdragon 8 elite", "骁龙8至尊版", "骁龙 8 至尊版") to platformOf("sm8750"),
        listOf("snapdragon 8 gen 2", "骁龙8 gen 2", "骁龙 8 gen 2") to platformOf("sm8550"),
        listOf("snapdragon 8s gen 3", "第三代骁龙8s", "第三代骁龙 8s") to platformOf("sm8635"),
        listOf("dimensity 9500", "天玑9500", "天玑 9500") to platformOf("mt6991"),
        listOf("dimensity 9400", "天玑9400", "天玑 9400") to platformOf("mt6990"),
        listOf("dimensity 9300", "天玑9300", "天玑 9300") to platformOf("mt6989"),
        listOf("dimensity 8500", "天玑8500", "天玑 8500") to platformOf("mt8798"),
        listOf("tensor g4") to platformOf("g4"),
        listOf("tensor g3") to platformOf("g3")
    )

    /** 品牌 SoC 体系估算档案 (回退层：按整机厂商推断典型 SoC 厂商体系) */
    private val brandSocSystems = listOf(
        "google" to "Google 谷歌",
        "samsung" to "Samsung 三星",
        "xiaomi" to "Qualcomm 高通 / MediaTek 联发科",
        "redmi" to "Qualcomm 高通 / MediaTek 联发科",
        "oppo" to "Qualcomm 高通 / MediaTek 联发科",
        "oneplus" to "Qualcomm 高通 / MediaTek 联发科",
        "realme" to "Qualcomm 高通 / MediaTek 联发科",
        "vivo" to "Qualcomm 高通 / MediaTek 联发科",
        "iqoo" to "Qualcomm 高通 / MediaTek 联发科",
        "honor" to "Qualcomm 高通 / MediaTek 联发科",
        "huawei" to "HiSilicon 海思",
        "motorola" to "Qualcomm 高通 / MediaTek 联发科",
        "sony" to "Qualcomm 高通",
        "asus" to "Qualcomm 高通",
        "lenovo" to "Qualcomm 高通",
        "meizu" to "Qualcomm 高通 / Samsung 三星",
        "nubia" to "Qualcomm 高通",
        "zte" to "Qualcomm 高通",
        "nothing" to "Qualcomm 高通"
    )

    /**
     * 解析设备 SoC 主控档案 (结果进程内缓存，静态硬件信息仅探测一次)
     */
    fun resolveSoc(): SocProfile {
        if (socProbed) return cachedProfile ?: engineeringEstimate(Build.MANUFACTURER)
        socProbed = true
        val resolved = try {
            resolveInternal()
        } catch (e: Throwable) {
            engineeringEstimate(Build.MANUFACTURER)
        }
        cachedProfile = resolved
        return resolved
    }

    /** 测试专用：重置探测缓存 (Robolectric 同沙箱多用例需在用例间清理静态缓存) */
    internal fun resetProbeCache() {
        socProbed = false
        cachedProfile = null
    }

    private fun resolveInternal(): SocProfile {
        // ---- 型号检测链：Build.SOC_MODEL -> soc0 节点 -> cpuinfo -> 平台代号 ----
        val apiModel = readBuildSocModel()
        val soc0Model = detectFromSoc0Nodes()
        val cpuinfoModel = detectFromCpuinfo()
        val boardModel = detectFromPlatformCodeName()

        val rawModel = apiModel ?: soc0Model ?: cpuinfoModel ?: boardModel
        val modelSource = when {
            apiModel != null -> "实测"
            soc0Model != null -> "实测"
            cpuinfoModel != null -> "实测"
            else -> "品牌档案"
        }

        // ---- 厂商：Build.SOC_MANUFACTURER -> 型号 token 推断 -> 品牌体系 ----
        val apiVendor = readBuildSocManufacturer()
        val vendor = apiVendor
            ?: rawModel?.let { inferVendorFromModel(it) }
            ?: brandSocSystems.firstOrNull { Build.MANUFACTURER.lowercase().startsWith(it.first) }?.second
            ?: "主流旗舰 SoC 厂商"

        val platform = rawModel?.let { lookupPlatform(it) }

        val model = when {
            platform != null -> "${platform.marketingName} [$modelSource]"
            rawModel != null -> "${prettyModelToken(rawModel)} [$modelSource]"
            else -> "${normalizeRawSocValue(Build.MANUFACTURER) ?: "Android"} ARM64 旗舰平台 [工程估算]"
        }

        // ---- 制程 / CPU / GPU：平台档案优先，不可识别时按厂商体系工程估算 ----
        val process = platform?.process?.let { "$it [品牌档案]" }
            ?: "主流旗舰制程 (以厂方规格为准) [工程估算]"
        val cpu = platform?.cpu?.let { "$it [品牌档案]" }
            ?: "8 核 64 位大小核架构 [工程估算]"
        val gpu = platform?.gpu?.let { "$it [品牌档案]" }
            ?: "平台集成旗舰 GPU [工程估算]"

        val vendorText = if (apiVendor != null) "$apiVendor [实测]" else "$vendor [品牌档案]"
        return SocProfile(
            model = model,
            vendor = vendorText,
            process = process,
            cpu = cpu,
            gpu = gpu
        )
    }

    /** 工程估算兜底档案：任何检测均不可得时按品牌体系给出中性可渲染值 */
    private fun engineeringEstimate(manufacturer: String): SocProfile {
        val brand = brandSocSystems.firstOrNull { manufacturer.lowercase().startsWith(it.first) }?.second
            ?: "主流旗舰 SoC 厂商"
        val brandName = normalizeRawSocValue(manufacturer) ?: "Android"
        return SocProfile(
            model = "$brandName ARM64 旗舰平台 [工程估算]",
            vendor = "$brand [工程估算]",
            process = "主流旗舰制程 (以厂方规格为准) [工程估算]",
            cpu = "8 核 64 位大小核架构 [工程估算]",
            gpu = "平台集成旗舰 GPU [工程估算]"
        )
    }

    // ==================== 检测源 ====================

    /** API 31+ Build.SOC_MODEL (ro.soc.model)，过滤 unknown / 空值 / Robolectric 占位 */
    private fun readBuildSocModel(): String? {
        if (Build.VERSION.SDK_INT < 31) return null
        val raw = Build.SOC_MODEL
        return normalizeRawSocValue(raw)
    }

    /** API 31+ Build.SOC_MANUFACTURER (ro.soc.manufacturer)，归一化为中文厂商名 */
    private fun readBuildSocManufacturer(): String? {
        if (Build.VERSION.SDK_INT < 31) return null
        return normalizeSocManufacturer(Build.SOC_MANUFACTURER)
    }

    /** soc0 节点探测：machine / family / model (多数内核 444 权限，普通应用可读) */
    private fun detectFromSoc0Nodes(): String? {
        val candidates = listOf("machine", "family", "model")
        return candidates.asSequence()
            .mapNotNull { name ->
                try {
                    val file = File("/sys/devices/soc0/$name")
                    if (file.isFile && file.canRead()) {
                        file.readText().trim().takeIf { it.isNotBlank() && !it.equals("unknown", true) }
                    } else {
                        null
                    }
                } catch (e: Throwable) {
                    null
                }
            }
            .firstOrNull { extractSocToken(it) != null }
    }

    /** /proc/cpuinfo "Hardware:" 行探测 (高通/联发科内核普遍填充 SoC 型号) */
    private fun detectFromCpuinfo(): String? = try {
        val file = File("/proc/cpuinfo")
        if (!file.canRead()) {
            null
        } else {
            parseCpuinfoHardwareLine(file.readText())
        }
    } catch (e: Throwable) {
        null
    }

    /** 平台代号探测：Build.BOARD / Build.DEVICE / Build.HARDWARE (pineapple / mt6989 / exynos2400 ...) */
    private fun detectFromPlatformCodeName(): String? =
        listOf(Build.BOARD, Build.DEVICE, Build.HARDWARE)
            .map { normalizeRawSocValue(it) ?: "" }
            .firstOrNull { lookupPlatform(it) != null }

    // ==================== 纯解析函数 (可单测) ====================

    /** 过滤系统属性占位值：空 / unknown / robolectric 测试占位 */
    internal fun normalizeRawSocValue(raw: String?): String? {
        val value = raw?.trim().orEmpty()
        return when {
            value.isEmpty() -> null
            value.equals("unknown", ignoreCase = true) -> null
            value.contains("robolectric", ignoreCase = true) -> null
            else -> value
        }
    }

    /**
     * 从 /proc/cpuinfo 全文中提取 "Hardware:" 行值
     * (高通: "Qualcomm Technologies, Inc. SM8650"；联发科: "MT6989"；树莓派: "BCM2711")
     */
    internal fun parseCpuinfoHardwareLine(cpuinfo: String): String? =
        cpuinfo.lineSequence()
            .mapNotNull { line ->
                val idx = line.indexOf(':')
                if (idx <= 0) {
                    null
                } else {
                    val key = line.substring(0, idx).trim()
                    if (key.equals("Hardware", ignoreCase = true)) {
                        line.substring(idx + 1).trim().takeIf { it.isNotEmpty() }
                    } else {
                        null
                    }
                }
            }
            .firstOrNull()

    /** 厂商名归一化：QTI -> Qualcomm 高通，Mediatek -> MediaTek 联发科 ... */
    internal fun normalizeSocManufacturer(raw: String?): String? {
        val value = normalizeRawSocValue(raw) ?: return null
        val lower = value.lowercase()
        return when {
            lower.contains("qualcomm") || lower == "qti" -> "Qualcomm 高通"
            lower.contains("mediatek") || lower.contains("mtk") -> "MediaTek 联发科"
            lower.contains("samsung") -> "Samsung 三星"
            lower.contains("google") -> "Google 谷歌"
            lower.contains("hisilicon") || lower.contains("kirin") -> "HiSilicon 海思"
            lower.contains("unisoc") || lower.contains("spreadtrum") -> "UNISOC 展锐"
            lower.contains("xiaomi") -> "Xiaomi 小米"
            lower.contains("rockchip") -> "Rockchip 瑞芯微"
            lower.contains("allwinner") -> "Allwinner 全志"
            lower.contains("apple") -> "Apple 苹果"
            else -> null
        }
    }

    /** 从任意原始字符串中提取 SoC 型号 token (sm8650 / mt6989 / pineapple / tensor ...) */
    internal fun extractSocToken(raw: String): String? {
        val lower = raw.lowercase()
        // 0) 拼接串命中平台代号 (兼容 "Exynos 2400" / "SM 8650" 等带空格写法)
        val squashed = lower.replace(Regex("[^a-z0-9]"), "")
        if (squashed.isNotEmpty()) {
            socPlatforms.forEach { entry ->
                entry.first.forEach { key ->
                    if (squashed == key || (key.length >= 5 && squashed.contains(key))) return key
                }
            }
        }
        // 1) 逐 token 精确命中平台代号 (防短键误匹配)
        val tokens = lower.split(Regex("[^a-z0-9+.-]+")).filter { it.isNotBlank() }
        tokens.firstOrNull { token -> socPlatforms.any { entry -> entry.first.any { it == token } } }
            ?.let { return it }
        // 2) 厂商型号格式 token: [字母1-6位][数字3-5位][可选后缀] (sm8650/mt6989/exynos2400/t760)
        tokens.firstOrNull { it.matches(Regex("[a-z]{1,6}\\d{3,5}[a-z0-9-]*")) }
            ?.let { return it }
        // 3) 纯代号 (pineapple/kona/zuma/tensor ...)
        tokens.firstOrNull { it.length >= 4 && it.all { c -> c.isLetter() } }
            ?.let { return it }
        return null
    }

    /** 由 SoC 型号 token 推断厂商 (SM* -> 高通，MT* -> 联发科 ...) */
    internal fun inferVendorFromModel(model: String): String? {
        val lower = model.lowercase()
        val token = extractSocToken(lower) ?: lower
        return when {
            token.startsWith("sm") || lower.contains("snapdragon") || lower.contains("adreno") || lower.contains("qcom") -> "Qualcomm 高通"
            token.startsWith("mt") || lower.contains("dimensity") || lower.contains("天玑") -> "MediaTek 联发科"
            lower.contains("tensor") -> "Google 谷歌"
            lower.contains("exynos") || lower.contains("xclipse") -> "Samsung 三星"
            lower.contains("kirin") || lower.contains("麒麟") || lower.contains("maleoon") -> "HiSilicon 海思"
            lower.contains("unisoc") || lower.contains("虎贲") || lower.contains("spreadtrum") -> "UNISOC 展锐"
            token.startsWith("rk") || lower.contains("rockchip") -> "Rockchip 瑞芯微"
            else -> null
        }
    }

    /** 平台规格档案查询：先精确/长键包含匹配，后营销名别名匹配 */
    private fun lookupPlatform(raw: String): PlatformSoc? {
        val lower = raw.lowercase().trim()
        if (lower.isEmpty()) return null
        // 精确 token 匹配 (防 "sun" 类短键误伤)
        socPlatforms.firstOrNull { entry -> entry.first.any { it == lower } }
            ?.let { return it.second }
        // 长键包含匹配 (键长 >= 5，避免短码误匹配)
        socPlatforms.firstOrNull { entry -> entry.first.any { key -> key.length >= 5 && lower.contains(key) } }
            ?.let { return it.second }
        // 营销名别名 (原始值直接给营销名的场景)
        marketingAliases.firstOrNull { entry -> entry.first.any { lower.contains(it) } }
            ?.let { return it.second }
        return null
    }

    /** 未命中档案时将原始 token 格式化为可读型号 (SM8650 -> SM8650，保留原值) */
    private fun prettyModelToken(raw: String): String =
        extractSocToken(raw)?.uppercase() ?: raw.trim()
}
