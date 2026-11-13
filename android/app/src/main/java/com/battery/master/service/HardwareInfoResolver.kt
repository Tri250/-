package com.battery.master.service

import android.os.Build

/**
 * 动态硬件信息解析结果
 */
internal data class HardwareTelemetry(
    val socModel: String,
    val socVendor: String,
    val socProcess: String,
    val socCpu: String,
    val socGpu: String,
    val pmicModel: String,
    val batteryChemistry: String,
    val fastChargeProtocol: String,
    val internalResistanceMohm: Float,
    /** v2.0.0-alpha 批次B：内阻来源标注 (运行时测算·置信度 / 工程估算) */
    val internalResistanceLabel: String,
    val halVersion: String,
    val cellStructure: String,
    val thermalThrottlingState: String
)

/**
 * 动态解析硬件信息摘要 —— 三级回退链，彻底消除"系统未上报"：
 * 1. [实测] sysfs / device-tree 真实节点探测（SoC 型号、PMIC compatible、pd_active、恒压门限、双电芯路径）
 * 2. [推断] 品牌硬件档案 (Build.MANUFACTURER) 匹配品牌快充体系与 PMIC 体系
 * 3. [估算] 主流工程默认值兜底
 * 每个字段均在输出中标注来源；快充协议另叠加实时功率档位 (V×I 推断)，
 * 与 Web 端档位阈值一致 (≥45W 超级快充 / ≥18W 快充 / >0.5W 普通 / 未充电)
 */
internal object HardwareInfoResolver {

    // 设备静态档案（SoC / PMIC / 协议体系 / 电芯结构 / 化学体系）：探测结果缓存，仅解析一次
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
                socVendor = "主流旗舰 SoC 厂商 [工程估算]",
                socProcess = "主流旗舰制程 (以厂方规格为准) [工程估算]",
                socCpu = "8 核 64 位大小核架构 [工程估算]",
                socGpu = "平台集成旗舰 GPU [工程估算]",
                pmicModel = "平台级 PMIC 电源管理 [工程估算]",
                batteryChemistry = "锂离子/聚合物电芯 (主流体系) [工程估算]",
                fastChargeProtocol = "USB PD / QC 兼容快充 [工程估算]",
                internalResistanceMohm = 14.8f,
                internalResistanceLabel = "[工程估算]",
                halVersion = "Android ${Build.VERSION.RELEASE} BatteryManager API",
                cellStructure = "标准单电芯封装 [工程估算]",
                thermalThrottlingState = "正常供电 (无节流)"
            )
        }
    }

    private fun resolveInternal(temperatureCelsius: Float, cycleCount: Int, powerWatts: Float): HardwareTelemetry {
        val profile = staticProfile

        // SoC 主控五字段：型号 / 厂商 / 制程 / CPU / GPU (SoCHardwareProfile 全量检测链)
        val soc = SoCHardwareProfile.resolveSoc()

        // 温控节流状态：按电芯温度推导。
        // v1.2.4 P2 审计修复：1) 阈值与温度卡统一单源 (BatteryTelemetryParser 常量)——
        // 旧实现 44/38.5℃ 与温度卡 45/38℃ 打架 (38~38.5℃ 卡片"偏热"而标签"正常"、
        // 44~45℃ 标签"急停"而卡片仅"偏热"，同屏自相矛盾)；2) 移除臆造的
        // "限制 50%"/"限流 15%" 百分比——系统无任何 API 上报节流比例，虚构精度
        // 冒充实测；标注 [工程估算] 与 SoC 字段既有来源标注模式一致
        val thermalThrottlingState = when {
            temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
                "过热急停 [工程估算]"
            temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                "温控限流 [工程估算]"
            else -> "正常供电 (无节流)"
        }

        // 电芯内阻 (v2.0.0-alpha 批次B)：健康引擎 ΔV/ΔI 滑窗回归实测优先，
        // 无有效测算样本 (样本不足/跨度不足/回归越界) 时回退工程估算模型。
        // 工程估算公式 (与 Web 端一致)：基础值 + 循环老化 + 高温附加
        val resistanceSnapshot = BatteryHealthEngine.snapshot()
        val (internalResistance, internalResistanceLabel) = if (resistanceSnapshot.resistanceMohm != null) {
            val measured = (resistanceSnapshot.resistanceMohm * 10f).toInt() / 10f
            measured to resistanceSnapshot.sourceLabel
        } else {
            val estimate = 14.8f +
                (cycleCount.coerceAtLeast(0) / 300f) * 1.5f +
                if (temperatureCelsius > 40f) (temperatureCelsius - 40f) * 0.3f else 0f
            ((estimate * 10f).toInt() / 10f) to "[工程估算]"
        }

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
            socModel = soc.model,
            socVendor = soc.vendor,
            socProcess = soc.process,
            socCpu = soc.cpu,
            socGpu = soc.gpu,
            pmicModel = profile.pmicModel,
            batteryChemistry = profile.batteryChemistry,
            fastChargeProtocol = fastChargeProtocol,
            internalResistanceMohm = internalResistance,
            internalResistanceLabel = internalResistanceLabel,
            halVersion = "Android ${Build.VERSION.RELEASE} Battery AIDL HAL",
            cellStructure = profile.cellStructure,
            thermalThrottlingState = thermalThrottlingState
        )
    }
}
