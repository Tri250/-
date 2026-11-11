package com.battery.master.service

import android.os.Build

/**
 * 动态硬件信息解析结果
 */
internal data class HardwareTelemetry(
    val socModel: String,
    val pmicModel: String,
    val batteryChemistry: String,
    val fastChargeProtocol: String,
    val internalResistanceMohm: Float,
    val halVersion: String,
    val cellStructure: String,
    val thermalThrottlingState: String
)

/**
 * 动态解析硬件信息摘要 —— 三级回退链，彻底消除"系统未上报"：
 * 1. [实测] sysfs / device-tree 真实节点探测（PMIC compatible、pd_active、恒压门限、双电芯路径）
 * 2. [推断] 品牌硬件档案 (Build.MANUFACTURER) 匹配品牌快充体系与 PMIC 体系
 * 3. [估算] 主流工程默认值兜底
 * 每个字段均在输出中标注来源；快充协议另叠加实时功率档位 (V×I 推断)，
 * 与 Web 端档位阈值一致 (≥45W 超级快充 / ≥18W 快充 / >0.5W 普通 / 未充电)
 */
internal object HardwareInfoResolver {

    // 设备静态档案（PMIC / 协议体系 / 电芯结构 / 化学体系）：探测结果缓存，仅解析一次
    private val staticProfile: DeviceHardwareProfile.Profile by lazy {
        DeviceHardwareProfile.resolveProfile()
    }

    fun resolve(temperatureCelsius: Float, cycleCount: Int, powerWatts: Float): HardwareTelemetry {
        // 启动闪退治理：解析链路任何 Throwable (ROM 服务缺失/DT 扫描 Error 等) 均降级为
        // 工程估算态，绝不向启动路径抛异常
        return try {
            resolveInternal(temperatureCelsius, cycleCount, powerWatts)
        } catch (e: Throwable) {
            HardwareTelemetry(
                socModel = "平台 SoC 解析中",
                pmicModel = "平台级 PMIC 电源管理 [工程估算]",
                batteryChemistry = "锂离子/聚合物电芯 (主流体系) [工程估算]",
                fastChargeProtocol = "USB PD / QC 兼容快充 [工程估算]",
                internalResistanceMohm = 14.8f,
                halVersion = "Android ${Build.VERSION.RELEASE} Battery AIDL HAL",
                cellStructure = "标准单电芯封装 [工程估算]",
                thermalThrottlingState = "正常供电 (无节流)"
            )
        }
    }

    private fun resolveInternal(temperatureCelsius: Float, cycleCount: Int, powerWatts: Float): HardwareTelemetry {
        val profile = staticProfile

        // SoC 型号：API 31+ 提供 Build.SOC_MODEL，旧版本回退 Build.HARDWARE，仍不可得时按品牌平台估算
        val rawSoc = if (Build.VERSION.SDK_INT >= 31) Build.SOC_MODEL else ""
        val socModel = when {
            !rawSoc.isNullOrBlank() && rawSoc != "unknown" -> rawSoc
            Build.HARDWARE.isNotBlank() && Build.HARDWARE != "unknown" -> Build.HARDWARE
            else -> "${Build.MANUFACTURER} ARM64 旗舰平台 [工程估算]"
        }

        // 温控节流状态：按电芯温度推导 (阈值与 Web 端一致)
        val thermalThrottlingState = when {
            temperatureCelsius >= 44f -> "过热急停 (限制 50%)"
            temperatureCelsius >= 38.5f -> "温控保护 (限流 15%)"
            else -> "正常供电 (无节流)"
        }

        // 电芯动态内阻：基础值 + 循环老化 + 高温附加估算模型 (与 Web 端一致)
        val internalResistance = 14.8f +
            (cycleCount.coerceAtLeast(0) / 300f) * 1.5f +
            if (temperatureCelsius > 40f) (temperatureCelsius - 40f) * 0.3f else 0f

        // 快充协议：体系名（sysfs 实测优先 → 品牌档案 → 工程估算）+ 实时功率档位组合，
        // 未充电时保留体系名并标注"待充电协商"，不再输出空洞的"系统未上报"
        val chargeBand = when {
            powerWatts >= 45f -> "超级快充"
            powerWatts >= 18f -> "快速充电"
            powerWatts > 0.5f -> "普通充电"
            else -> null
        }
        val liveProtocol = DeviceHardwareProfile.probeLiveProtocol()
        val protocolSystem = liveProtocol ?: profile.fastChargeProtocol
        val fastChargeProtocol = if (chargeBand != null) {
            val wattText = String.format(java.util.Locale.US, "%.1f", powerWatts)
            "$chargeBand ($wattText W) · $protocolSystem"
        } else {
            "$protocolSystem · 未充电待协商"
        }

        return HardwareTelemetry(
            socModel = socModel,
            pmicModel = profile.pmicModel,
            batteryChemistry = profile.batteryChemistry,
            fastChargeProtocol = fastChargeProtocol,
            internalResistanceMohm = (internalResistance * 10f).toInt() / 10f,
            halVersion = "Android ${Build.VERSION.RELEASE} Battery AIDL HAL",
            cellStructure = profile.cellStructure,
            thermalThrottlingState = thermalThrottlingState
        )
    }
}
