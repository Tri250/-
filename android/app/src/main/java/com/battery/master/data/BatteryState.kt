package com.battery.master.data

/**
 * 电池全部 12 项充放电指标数据模型 + 硬件信息汇总
 */
data class BatteryState(
    // 1、电池健康度 (百分比，例如 94.5%)
    val healthPercentage: Float = 100.0f,

    // 2、剩余电量 (mAh，例如 3800 mAh)
    val remainingCapacityMah: Int = 0,

    // 3、电池当前容量 (电池衰减后的容量 mAh，例如 4700 mAh)
    val currentCapacityMah: Int = 5000,

    // 4、电池设计容量 (电池出厂容量 mAh，例如 5000 mAh)
    val designCapacityMah: Int = 5000,

    // 5、电量：当前电池电量的百分比 (0 - 100)
    val percentage: Int = 0,

    // 6、电池状态：充电中、放电中、已充满、未充电
    val status: BatteryStatus = BatteryStatus.NOT_CHARGING,

    // 7、电池温度：摄氏度 (例如 32.5°C)
    val temperatureCelsius: Float = 0.0f,

    // 8、电池健康：良好、过热、损坏、超压、未知
    val healthQuality: BatteryHealthQuality = BatteryHealthQuality.GOOD,

    // 9、电压：毫伏 mV (例如 4150 mV)
    val voltageMv: Int = 0,

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
