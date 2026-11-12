package com.battery.master.data

/**
 * 容量数据来源等级 (v1.2.3 健康度真实性审计新增)
 *
 * 电池健康度 = 当前容量 / 设计容量，两项容量都可能来自实测或估算。
 * 旧实现把 0.92 降级估算值与 sysfs 实测值以同等精度展示 (如无 sysfs 时显示
 * 精确的 "92.0%")，虚构精度冒充真实测量；现按硬件字段既有模式显式标注来源，
 * 保证用户可区分"真实状态"与"降级估算"。
 */
enum class CapacitySource(val label: String) {
    /** Linux sysfs charge_full / charge_full_design 实测 */
    SYSFS("sysfs 实测"),

    /** PowerProfile 反射实测 (设计容量) */
    POWER_PROFILE("PowerProfile 实测"),

    /** 用户在设置中手动校准 */
    CALIBRATED("用户校准"),

    /** sysfs 不可读时按设计容量 × 0.92 降级估算 (非真实测量) */
    ESTIMATED("0.92 降级估算"),

    /** 全链路失败时的 5000 mAh 兜底 (非真实测量) */
    FALLBACK("5000 mAh 兜底")
}

/**
 * 电池全部 12 项充放电指标数据模型 + 硬件信息汇总
 */
data class BatteryState(
    // 1、电池健康度 (百分比，例如 94.5%)
    // 默认值与 BatteryHardwareReader 安全默认态同口径 (0.92 × 设计容量)，中性自洽
    val healthPercentage: Float = 92.0f,

    // 2、剩余电量 (mAh，例如 3800 mAh)
    val remainingCapacityMah: Int = 0,

    // 3、电池当前容量 (电池衰减后的容量 mAh，例如 4700 mAh)
    val currentCapacityMah: Int = 4600,

    // 4、电池设计容量 (电池出厂容量 mAh，例如 5000 mAh)
    val designCapacityMah: Int = 5000,

    /** 指标 03 当前容量数据来源 (sysfs 实测 / 0.92 降级估算)；指标 01 健康度同源 */
    val currentCapacitySource: CapacitySource = CapacitySource.ESTIMATED,

    /** 指标 04 设计容量数据来源 (PowerProfile / sysfs / 用户校准 / 5000 mAh 兜底) */
    val designCapacitySource: CapacitySource = CapacitySource.FALLBACK,

    // 5、电量：当前电池电量的百分比 (0 - 100)
    val percentage: Int = 0,

    // 6、电池状态：充电中、放电中、已充满、未充电
    val status: BatteryStatus = BatteryStatus.NOT_CHARGING,

    // 7、电池温度：摄氏度 (例如 32.5°C)
    // 默认 25.0°C 中性室温 (与 BatteryTelemetryParser 缺失默认一致)；0.0 会被 UI 判定为"过冷"
    val temperatureCelsius: Float = 25.0f,

    // 8、电池健康：良好、过热、损坏、超压、未知
    // 默认 UNKNOWN 诚实中性 (与 Reader 降级态一致)；GOOD 属正面断言不作默认
    val healthQuality: BatteryHealthQuality = BatteryHealthQuality.UNKNOWN,

    // 9、电压：毫伏 mV (例如 4150 mV)
    // 默认 4000 中性典型值 (与 Parser 故障回退一致)；0 是故障断言值
    val voltageMv: Int = 4000,

    // 10、循环计数：电池充放电的次数
    val cycleCount: Int = 0,

    // 11、电流：瞬时电流 mA (充电流入为正，放电消耗为负)
    val currentMa: Int = 0,

    // 12、完全充满时的容量 (mAh)
    // 仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满并记录
    val fullChargeCapacityMah: Int? = null,

    // 满足 100% 且电流 0-25 mA 充满条件的判定时间戳
    val lastFullChargeTimestamp: Long? = null,

    // 功率 (W)
    val powerWatts: Float = 0.0f,

    // 是否符合充满判定标准
    val isFullChargeConditionMet: Boolean = false,

    // ===== 硬件信息汇总 =====
    // 默认值为中性估算文案 (采集层 HardwareInfoResolver 会立即以实测/档案值覆盖)；
    // 三级回退链保证运行期任何字段不再出现"系统未上报"
    val socModel: String = "平台 SoC 解析中",
    val socVendor: String = "主流旗舰 SoC 厂商 [工程估算]",
    val socProcess: String = "主流旗舰制程 (以厂方规格为准) [工程估算]",
    val socCpu: String = "8 核 64 位大小核架构 [工程估算]",
    val socGpu: String = "平台集成旗舰 GPU [工程估算]",
    val pmicModel: String = "平台级 PMIC 电源管理 [工程估算]",
    val batteryChemistry: String = "锂离子/聚合物电芯 (主流体系) [工程估算]",
    val fastChargeProtocol: String = "USB PD / QC 兼容快充 [工程估算]",
    val internalResistanceMohm: Float = 0f,
    val halVersion: String = "Android Battery AIDL HAL",
    val cellStructure: String = "标准单电芯封装 [工程估算]",
    val thermalThrottlingState: String = "正常供电 (无节流)"
) {
    // 别名兼容
    val currentNowMa: Int get() = currentMa
}

enum class BatteryStatus(val label: String) {
    CHARGING("充电中"),
    DISCHARGING("放电中"),
    FULL("已充满"),
    NOT_CHARGING("未充电")
}

enum class BatteryHealthQuality(val label: String) {
    GOOD("良好"),
    OVERHEAT("过热"),
    DEAD("损坏"),
    OVER_VOLTAGE("超压"),
    UNKNOWN("未知")
}
