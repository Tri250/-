package com.battery.master.model

/**
 * 电池核心状态数据模型 (包含要求的 12 项充放电指标 + 底层硬件信息汇总)
 */
data class BatteryInfo(
    // 1. 电池健康度 (%)
    val healthPercentage: Float = 100f,

    // 2. 剩余电量 (mAh)
    val remainingCapacityMah: Int = 0,

    // 3. 电池当前容量 (衰减后的容量, mAh)
    val currentCapacityMah: Int = 5000,

    // 4. 电池设计容量 (出厂容量, mAh)
    val designCapacityMah: Int = 5000,

    // 5. 电量：当前电池电量的百分比 (0 - 100%)
    val percentage: Int = 0,

    // 6. 电池状态 (充电中、放电中、已充满、未充电)
    val status: BatteryStatusEnum = BatteryStatusEnum.DISCHARGING,

    // 7. 电池温度：当前电池温度 (摄氏度 ℃)
    val temperatureCelsius: Float = 25.0f,

    // 8. 电池健康：电池当前的健康状况 (良好、过热、损坏、超压、未知)
    val healthQuality: BatteryHealthQualityEnum = BatteryHealthQualityEnum.GOOD,

    // 9. 电压：当前电池电压 (毫伏 mV)
    val voltageMv: Int = 4000,

    // 10. 循环计数：电池充放电的次数
    val cycleCount: Int = 0,

    // 11. 电流：当前电池的瞬时电流 (毫安 mA，充电为正，放电为负)
    val currentNowMa: Int = 0,

    // 12. 完全充满时的容量：估算的电池完全充满时的容量 (mAh)
    // 仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满
    val fullChargeCapacityMah: Int? = null,

    // 是否符合充满判定标准
    val isFullChargeConditionMet: Boolean = false,

    // 瞬时功率 (瓦特 W = V * I)
    val powerWatts: Float = 0.0f,

    // ===== 硬件信息汇总字段 =====
    val socModel: String = "Qualcomm Snapdragon 8 Gen 3",
    val pmicModel: String = "Qualcomm PM8550B Dual-Phase",
    val batteryChemistry: String = "硅碳负极 4.5V 高能量密度锂电芯",
    val fastChargeProtocol: String = "UFCS 融合快充 / PD 3.0 PPS",
    val internalResistanceMohm: Float = 14.8f,
    val halVersion: String = "Android 15 Battery AIDL 2.0",
    val cellStructure: String = "高阻抗低发热单电芯堆叠封装",
    val thermalThrottlingState: String = "正常供电 (无节流)"
)

enum class BatteryStatusEnum(val label: String) {
    CHARGING("充电中"),
    DISCHARGING("放电中"),
    FULL("已充满"),
    NOT_CHARGING("未充电")
}

enum class BatteryHealthQualityEnum(val label: String) {
    GOOD("良好"),
    OVERHEAT("过热"),
    DEAD("损坏"),
    OVER_VOLTAGE("超压"),
    UNKNOWN("未知")
}
