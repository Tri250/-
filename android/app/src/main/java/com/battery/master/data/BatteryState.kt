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

    /** BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER 库仑计剩余电荷实测 (指标 02) */
    COULOMB_COUNTER("库仑计实测"),

    /** PowerProfile 反射实测 (设计容量) */
    POWER_PROFILE("PowerProfile 实测"),

    /** 用户在设置中手动校准 */
    CALIBRATED("用户校准"),

    /** sysfs 全链路不可读时按设计容量估算 (非真实测量，v2.0.0-alpha.1 起不再虚构数值) */
    ESTIMATED("降级估算"),

    /**
     * v2.0.0-alpha.1 用户口径修正：电量计节点 (charge_full) 全链路不可读——
     * 不再按出厂保持率 (0.92) 虚构"当前容量/健康度"，数值显示 "—"，
     * 健康度标注"无法测算"。是多少就是多少，测不到就不展示
     */
    UNAVAILABLE("不可测算"),

    /** 全链路失败时的 5000 mAh 兜底 (非真实测量) */
    FALLBACK("5000 mAh 兜底")
}

/**
 * 电池全部 12 项充放电指标数据模型 + 硬件信息汇总
 */
data class BatteryState(
    // 1、电池健康度 (百分比，例如 94.5%)
    // v2.0.0-alpha.1：hasMeasuredCapacity=false 时为 0 (UI 显示"无法测算")——
    // 旧实现 0.92×设计容量的虚构健康度已移除，是多少就是多少
    val healthPercentage: Float = 0f,

    // 2、剩余电量 (mAh，例如 3800 mAh)
    val remainingCapacityMah: Int = 0,

    /**
     * 指标 02 剩余电量口径 (v1.2.4 P2 审计修复)：
     * COULOMB_COUNTER = 系统库仑计实测；ESTIMATED = 百分比 × 当前容量 估算。
     * 两条口径量纲基准不同 (机型间不可比、运行中切换会跳变)，UI 显式标注口径来源
     */
    val remainingCapacitySource: CapacitySource = CapacitySource.ESTIMATED,

    // 3、电池当前容量 (电池衰减后的容量 mAh，例如 4700 mAh)
    // 0 = 电量计节点不可读 (非真实测量)；合法实测区间 500~25000
    val currentCapacityMah: Int = 0,

    /**
     * v2.0.0-alpha.1：当前容量是否实测 (sysfs/bms/maxfg 探测链命中)。
     * false 时指标 01 健康度/指标 03 当前容量显示 "— 无法测算"，不虚构数值
     */
    val hasMeasuredCapacity: Boolean = false,

    // 4、电池设计容量 (电池出厂容量 mAh，例如 5000 mAh)
    val designCapacityMah: Int = 5000,

    /** 指标 03 当前容量数据来源 (sysfs 实测 / 不可测算 UNAVAILABLE)；指标 01 健康度同源 */
    val currentCapacitySource: CapacitySource = CapacitySource.UNAVAILABLE,

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
    // v1.2.3 P0 审计修复：设备不支持 BATTERY_PROPERTY_CURRENT_NOW 时系统返回
    // Int.MIN_VALUE，旧实现归一化成 0 mA 会使指标 12 充满判定 (0~25mA) 恒真。
    // 现改为可空：null = 电流不可读，UI 显示 "—"，判定走 UNKNOWN 而非 true
    val currentMa: Int? = null,

    // 12、完全充满时的容量 (mAh)
    // 仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满并记录
    val fullChargeCapacityMah: Int? = null,

    // 满足 100% 且电流 0-25 mA 充满条件的判定时间戳
    val lastFullChargeTimestamp: Long? = null,

    // 功率 (W)
    val powerWatts: Float = 0.0f,

    // 是否符合充满判定标准 (verdict == FULLY_CHARGED 的便捷布尔)
    val isFullChargeConditionMet: Boolean = false,

    /**
     * 指标 12 充满判定三态 (v1.2.3 P0 审计修复)
     *
     * 旧实现仅布尔判定，且电流不可读时归一化为 0 → 不支持 CURRENT_NOW 的机型
     * 一到 100% 就谎报"已达充满判定"并把估算值写盘。现显式区分不可读场景。
     */
    val fullChargeVerdict: FullChargeVerdict = FullChargeVerdict.NOT_YET,

    /**
     * 指标 12 锁定容量来源 (v1.2.3 P0 审计修复)
     *
     * 真实锁定 (REAL) 与"一键模拟完全充满"演示值 (SIMULATED) 分离存储，
     * 演示值不再冒充实测锁定值，UI 显式标注来源。
     */
    val fullChargeSource: FullChargeSource = FullChargeSource.NONE,

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

    /**
     * v2.0.0-alpha 批次B：内阻数据来源标注。
     * "[运行时测算·高置信 n=48]" = ΔV/ΔI 滑窗回归实测；"[工程估算]" = 回退估算模型
     */
    val internalResistanceLabel: String = "[工程估算]",

    /**
     * v2.0.0-alpha 批次B：循环寿命预测文案 (如 "预计还可循环约 480 次 [模型预测]")。
     * 仅健康度实测 (当前容量 sysfs + 设计容量非兜底) 时输出；估算健康度不做外推
     */
    val healthForecastText: String? = null,

    /**
     * v2.0.0-alpha.1：电量计探测链命中节点 (如 "bms"/"maxfg"/"battery")，
     * 遥测分析 Tab 展示真实数据来源路径；"无" = 全链路未命中
     */
    val gaugeNodePath: String = "无",

    /**
     * v2.0.0-alpha.1：内阻引擎滑窗样本数与置信度 (遥测分析 Tab 采集链路卡展示)
     */
    val engineSampleCount: Int = 0,
    val engineConfidenceLabel: String = "UNAVAILABLE",

    val halVersion: String = "Android BatteryManager API",
    val cellStructure: String = "标准单电芯封装 [工程估算]",
    val thermalThrottlingState: String = "正常供电 (无节流)"
) {
    // 别名兼容
    val currentNowMa: Int? get() = currentMa
}

/**
 * 指标 12 充满判定三态 (v1.2.3 P0 审计修复)
 *
 * - FULLY_CHARGED：电量 100% 且充电态下瞬时电流 |I| ≤ 25 mA (浮充截止区间)；
 * - NOT_YET：条件未满足 (电量不足 / 电流超区间 / 未在充电)；
 * - CURRENT_UNAVAILABLE：设备不支持 CURRENT_NOW 或读数不可用——
 *   此时不得谎报充满，也不得把估算值当作"实测完全充满容量"锁定写盘。
 */
enum class FullChargeVerdict {
    FULLY_CHARGED,
    NOT_YET,
    CURRENT_UNAVAILABLE
}

/**
 * 指标 12 锁定容量来源 (v1.2.3 P0 审计修复)
 *
 * REAL：真实硬件判定锁定 (含持久化恢复)；
 * SIMULATED："一键模拟完全充满"演示按钮写入的演示值 (独立 key 存储)；
 * NONE：无任何锁定记录。
 */
enum class FullChargeSource {
    REAL,
    SIMULATED,
    NONE
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
