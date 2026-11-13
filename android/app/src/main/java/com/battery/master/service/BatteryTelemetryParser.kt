package com.battery.master.service

import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict
import kotlin.math.abs

/**
 * 原始电池遥测快照 (未施加指标 12 充满锁定)
 *
 * 由 [BatteryTelemetryParser] 从 ACTION_BATTERY_CHANGED Intent + BatteryManager 提取，
 * 轮询通道 (BatteryHardwareReader) 与广播通道 (BatteryReceiver) 共用同一解析实现，
 * 从结构上保证双通道 12 项指标语义完全一致 (消除两套并行解析的逻辑漂移风险)。
 */
internal data class RawBatteryTelemetry(
    val percentage: Int,
    val status: BatteryStatus,
    /** v1.2.6 P2 审计修复：充电态单源判定 (status ∈ {CHARGING, FULL} 或 EXTRA_PLUGGED > 0)。
     *  双通道 (Receiver/Reader) 的指标 12 锁定统一消费本字段，杜绝两处重复推导的口径漂移 */
    val isCharging: Boolean,
    val temperatureCelsius: Float,
    val healthQuality: BatteryHealthQuality,
    val voltageMv: Int,
    /** v2.0.0-alpha.7：电压是否实测 (EXTRA_VOLTAGE 或 sysfs voltage_now 双通道任一命中)。
     *  false = 双通道均不可得，voltageMv 仅为中性默认 4000，UI 不得当作真实读数展示，
     *  且不得参与 V×I 功率推导 (伪造电压 × 真实电流 = 虚构功率) */
    val voltageMeasured: Boolean = false,
    /** v1.2.3 P0 审计修复：null = 设备不支持 CURRENT_NOW / 读数不可用 */
    val currentMa: Int?,
    val cycleCount: Int,
    val designCapacityMah: Int,
    /** v2.0.0-alpha.1：0 = 电量计节点全链路不可读 (旧 0.92 估算已移除，是多少就是多少) */
    val currentCapacityMah: Int,
    /** v2.0.0-alpha.1：当前容量是否实测 (探测链命中 charge_full) */
    val hasMeasuredCapacity: Boolean,
    val remainingCapacityMah: Int,
    val healthPercentage: Float,
    /** 指标 02 剩余电量口径 (v1.2.4 P2 审计)：库仑计实测 vs 百分比×容量估算 */
    val remainingCapacitySource: CapacitySource = CapacitySource.ESTIMATED,
    /** 瞬时功率 (W)；null = 电流不可读，禁止虚构 0W。
     *  v1.2.4 P2 审计修复：随符号携带方向——充电 +W / 放电 −W (旧实现 abs 丢失方向) */
    val powerWatts: Float?,
    val isFullChargeConditionMet: Boolean,
    /** v1.2.3 P0 审计修复：充满判定三态，替代单一布尔 (不可读 ≠ 未满足) */
    val fullChargeVerdict: FullChargeVerdict = FullChargeVerdict.NOT_YET,
    /** v2.0.0-alpha.4：库仑计原始读数 (μAh，0=不可读)——回归通道喂样输入 */
    val chargeCounterUah: Long = 0,
    /** v2.0.0-alpha.4：库仑计回归通道状态标注 (Reader 融合时填入，透传 UI) */
    val capacityRegressionInfo: String = "",
    /** v1.2.3 健康度真实性审计：容量来源等级，透传至 UI 标注，区分实测与降级估算 */
    val currentCapacitySource: CapacitySource = CapacitySource.ESTIMATED,
    val designCapacitySource: CapacitySource = CapacitySource.FALLBACK
) {
    /**
     * 合成为展示态 BatteryState：
     * 指标 12 锁定容量/时间戳/来源由调用方经 BatteryHardwareReader 单一数据源注入，
     * 仅当判定为 FULLY_CHARGED 时状态强制归一为 FULL (与 Web 端口径一致)——
     * v1.2.3 P0 审计修复：旧实现按单一布尔强制 FULL，不支持 CURRENT_NOW 的机型
     * 在 100% 时电流被归一化为 0，即使正在放电状态也被改成"已充满"。
     */
    fun toBatteryState(
        fullChargeCapacityMah: Int?,
        lastFullChargeTimestamp: Long?,
        fullChargeSource: FullChargeSource = FullChargeSource.NONE
    ): BatteryState {
        val hardware = HardwareInfoResolver.resolve(temperatureCelsius, cycleCount, powerWatts ?: 0f)
        // v2.0.0-alpha.1：遥测分析 Tab 采集链路卡——探测链命中节点 + 引擎滑窗状态
        val engineSnapshot = BatteryHealthEngine.snapshot()
        // v2.0.0-alpha 批次B：循环寿命预测——仅健康度两项容量均实测时输出，
        // 估算健康度不参与外推，避免估算值被放大成"精确的剩余循环数"。
        // v2.0.0-alpha.1：healthMeasured 与 hasMeasuredCapacity 单源对齐 (旧实现
        // 另写 currentCapacitySource==SYSFS 判定，两处口径存在漂移风险)
        val healthMeasured = hasMeasuredCapacity &&
            // v2.0.0-alpha.6：库仑计单点估算 (±电量格舍入误差) 不参与循环寿命外推，
            // 避免估算值被放大成"精确的剩余循环数"
            currentCapacitySource != CapacitySource.INSTANT_COULOMB &&
            designCapacitySource in BatteryTelemetryParser.MEASURED_DESIGN_SOURCES
        val healthForecastText = BatteryHealthEngine.forecastText(
            healthPercentage,
            cycleCount,
            healthMeasured
        )
        return BatteryState(
            healthPercentage = healthPercentage,
            remainingCapacityMah = remainingCapacityMah,
            remainingCapacitySource = remainingCapacitySource,
            currentCapacityMah = currentCapacityMah,
            hasMeasuredCapacity = hasMeasuredCapacity,
            designCapacityMah = designCapacityMah,
            currentCapacitySource = currentCapacitySource,
            capacityRegressionInfo = capacityRegressionInfo,
            designCapacitySource = designCapacitySource,
            percentage = percentage,
            status = if (isFullChargeConditionMet) BatteryStatus.FULL else status,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            voltageMeasured = voltageMeasured,
            cycleCount = cycleCount,
            currentMa = currentMa,
            fullChargeCapacityMah = fullChargeCapacityMah,
            lastFullChargeTimestamp = lastFullChargeTimestamp,
            isFullChargeConditionMet = isFullChargeConditionMet,
            fullChargeVerdict = fullChargeVerdict,
            fullChargeSource = fullChargeSource,
            powerWatts = powerWatts ?: 0f,
            socModel = hardware.socModel,
            socVendor = hardware.socVendor,
            socProcess = hardware.socProcess,
            socCpu = hardware.socCpu,
            socGpu = hardware.socGpu,
            pmicModel = hardware.pmicModel,
            batteryChemistry = hardware.batteryChemistry,
            fastChargeProtocol = hardware.fastChargeProtocol,
            internalResistanceMohm = hardware.internalResistanceMohm,
            internalResistanceLabel = hardware.internalResistanceLabel,
            healthForecastText = healthForecastText,
            gaugeNodePath = BatterySysfs.gaugeNodeLabel(),
            engineSampleCount = engineSnapshot.sampleCount,
            engineConfidenceLabel = engineSnapshot.confidence.name,
            halVersion = hardware.halVersion,
            cellStructure = hardware.cellStructure,
            thermalThrottlingState = hardware.thermalThrottlingState
        )
    }
}

/**
 * 双通道共享的电池遥测解析器 (指标 12「完全充满容量」自检修复核心)
 *
 * 自检发现并修复的问题：
 * 1. 电量百分比未归一化：部分定制 ROM 上报 level > scale 时 percentage > 100，
 *    导致 `percentage == 100` 永远不成立、指标 12 充满判定永久失效 → 强制 coerceIn(0, 100)；
 * 2. charge_full 单位/异常值无校验：个别内核以 mAh 上报或上报异常小值，
 *    /1000 后得到 0~5 mAh 的非法容量会被锁定并持久化 → 增加合理区间校验，非法即回退估算值；
 * 3. 轮询与广播两套并行解析 (~100 行重复) 存在语义漂移风险 → 收敛为本对象单一实现。
 */
internal object BatteryTelemetryParser {

    /** 指标 12 充满判定：电量必须为 100% */
    const val FULL_CHARGE_PERCENTAGE = 100

    /** 指标 12 充满判定：浮充截止电流区间 0~25 mA (含边界) */
    const val FULL_CHARGE_TRICKLE_MIN_MA = 0
    const val FULL_CHARGE_TRICKLE_MAX_MA = 25

    /**
     * 电池当前容量合理区间 (mAh)：区间外视为 sysfs 单位异常/脏数据，回退估算值
     *
     * v1.2.3 P1 审计修复：上限 20000 → 25000——真实存在 23800 mAh 三防大电池机
     * (项目既有测试 LabHardwareAuditTest 已按合法输入覆盖)，旧上限使这类设备的
     * charge_full/charge_full_design 被判脏数据、静默降级 5000 mAh 兜底，
     * 指标 01/02/03 全链路失真。25000 仍远超任何量产手机电芯容量上限。
     */
    const val MIN_PLAUSIBLE_CAPACITY_MAH = 500
    const val MAX_PLAUSIBLE_CAPACITY_MAH = 25_000

    /** 指标 07 温度物理合理区间 (℃)：覆盖极寒存储到极端温升，区间外视为传感器故障 */
    const val MIN_PLAUSIBLE_TEMPERATURE_C = -40f
    const val MAX_PLAUSIBLE_TEMPERATURE_C = 120f

    /**
     * 指标 07 温度分级阈值单源 (v1.2.4 P2 审计修复)：
     * 温度卡 (BatteryScreen) 与温控节流态 (HardwareInfoResolver) 统一消费本常量对。
     * 旧实现两套阈值互相打架：38.0~38.5℃ 卡片"偏热预警"而节流标签"正常供电"，
     * 44~45℃ 节流标签"过热急停"而卡片仅"偏热预警"——同屏自相矛盾。
     */
    const val TEMP_WARM_THRESHOLD_C = 38f
    const val TEMP_OVERHEAT_THRESHOLD_C = 45f

    /** 指标 09 电压物理合理区间 (mV)：覆盖单电芯 3.0~4.5V 与双电芯串联整包 6~9V 加余量 */
    const val MIN_PLAUSIBLE_VOLTAGE_MV = 2_000
    const val MAX_PLAUSIBLE_VOLTAGE_MV = 12_000

    /** 指标 09 电压不可信时的中性默认值 (mV)：与 EXTRA 缺失口径一致 */
    const val DEFAULT_VOLTAGE_MV = 4_000

    /**
     * v2.0.0-alpha.7 指标 09 电压状态分级阈值单源 (mV)：
     * UI 09 卡片/Hero 统一消费，杜绝双处阈值口径漂移 (同 TEMP_WARM_THRESHOLD_C 先例)。
     * 窗口按单电芯锂电物理特性划定：3.4V 过放保护区 / 3.6V 标称下限 /
     * 4.2V 标称满充上限 / 4.4V 商用快充满充上限；>5.0V 视为多电芯串联整包电压
     */
    const val VOLTAGE_PROTECT_MV = 3_400
    const val VOLTAGE_LOW_WARN_MV = 3_600
    const val VOLTAGE_NOMINAL_FULL_MV = 4_200
    const val VOLTAGE_NEAR_FULL_MV = 4_400
    const val VOLTAGE_MULTI_CELL_MV = 5_000

    /**
     * v2.0.0-alpha.7 指标 09 电压状态分级标签 (单源)。
     * @param measured false = EXTRA_VOLTAGE 与 sysfs voltage_now 双通道均不可得，
     *        返回"双通道不可读"——中性默认 4000 mV 不得伪装成真实读数
     */
    fun voltageStateLabel(voltageMv: Int, measured: Boolean): String = when {
        !measured -> "双通道不可读"
        voltageMv < VOLTAGE_PROTECT_MV -> "低电压保护区"
        voltageMv < VOLTAGE_LOW_WARN_MV -> "电压偏低"
        voltageMv <= VOLTAGE_NOMINAL_FULL_MV -> "正常工作区间"
        voltageMv <= VOLTAGE_NEAR_FULL_MV -> "接近满充"
        voltageMv <= VOLTAGE_MULTI_CELL_MV -> "电压异常偏高"
        else -> "多电芯串联整包"
    }

    /** 指标 10 循环计数合理上限 (次)：真实电芯寿命约 2000 次，留 5 倍余量 */
    const val MAX_PLAUSIBLE_CYCLE_COUNT = 10_000

    /** 指标 11 瞬时电流合理区间 (mA)：±20A 已超任何手机物理上限 */
    const val MAX_PLAUSIBLE_CURRENT_MA = 20_000

    /**
     * v2.0.0-alpha 批次B：设计容量"实测来源"集合 (循环寿命预测前提)。
     * 用户校准值视为用户自己的出厂规格参与外推；0.92 估算与 5000 兜底不参与
     */
    val MEASURED_DESIGN_SOURCES = setOf(
        CapacitySource.SYSFS,
        CapacitySource.POWER_PROFILE,
        CapacitySource.CALIBRATED
    )

    /**
     * 指标 12 充满判定谓词 (量纲口径)：电量 100% 且 |瞬时电流| ≤ 25 mA 浮充截止区间。
     *
     * v1.2.3 P0 审计修复：
     * 1. currentMa 可空——null (设备不支持 CURRENT_NOW) 一律返回 false，
     *    旧实现把不可读归一化为 0 mA 导致判定恒真；
     * 2. 取绝对值判定——AOSP 未规定 current_now 符号方向，大量高通/三星内核
     *    充电时上报负值，旧实现硬要求 [0, 25] 使这类机型判定永不成立。
     *
     * 注：真实通道应使用 [evaluateFullCharge] 三态判定 (附加充电态校验与
     * UNKNOWN 语义)；本函数保留给实验室覆盖层与量纲口径断言使用。
     */
    fun isFullChargeCriteriaMet(percentage: Int, currentMa: Int?): Boolean =
        percentage == FULL_CHARGE_PERCENTAGE && currentMa != null &&
            abs(currentMa) in FULL_CHARGE_TRICKLE_MIN_MA..FULL_CHARGE_TRICKLE_MAX_MA

    /**
     * 指标 12 充满判定三态 (真实通道专用，双通道与 UI 卡片统一消费)
     *
     * - 电量非 100% → NOT_YET；
     * - 电流不可读 (null) → CURRENT_UNAVAILABLE (不得谎报充满，不得锁定写盘)；
     * - 未处于充电/满电状态 → NOT_YET (即使 100% 且电流近零：防拔线后误判)；
     * - 充电态且 |电流| ≤ 25 mA → FULLY_CHARGED。
     */
    fun evaluateFullCharge(percentage: Int, currentMa: Int?, isCharging: Boolean): FullChargeVerdict =
        when {
            percentage != FULL_CHARGE_PERCENTAGE -> FullChargeVerdict.NOT_YET
            currentMa == null -> FullChargeVerdict.CURRENT_UNAVAILABLE
            !isCharging -> FullChargeVerdict.NOT_YET
            abs(currentMa) in FULL_CHARGE_TRICKLE_MIN_MA..FULL_CHARGE_TRICKLE_MAX_MA ->
                FullChargeVerdict.FULLY_CHARGED
            else -> FullChargeVerdict.NOT_YET
        }

    /**
     * 从 ACTION_BATTERY_CHANGED Intent + BatteryManager 提取原始遥测。
     *
     * @param intent 粘性广播/实时广播 Intent，允许为 null (查询失败时全字段走安全默认)
     * @param batteryManager 系统服务，允许为 null (定制 ROM 缺失 BATTERY_SERVICE)
     * @param designCapacityMah 指标 04 设计容量 (Reader 单一数据源，双通道共享)
     * @param designCapacitySource 指标 04 设计容量来源 (Reader 三级回退链命中等级)
     */
    fun parse(
        intent: Intent?,
        batteryManager: BatteryManager?,
        designCapacityMah: Int,
        designCapacitySource: CapacitySource = CapacitySource.FALLBACK
    ): RawBatteryTelemetry {
        val effectiveDesignCapacity =
            if (designCapacityMah > 0) designCapacityMah else BatteryHardwareReader.FALLBACK_DESIGN_CAPACITY

        // 5. 电量百分比 (0-100)
        val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val percentage = if (level >= 0 && scale > 0) {
            // 修复：部分 ROM 上报 level > scale (如 101/100)，不归一化会使 100% 判定永久失效
            (level * 100 / scale).coerceIn(0, 100)
        } else {
            // 部分设备无 BATTERY_PROPERTY_CAPACITY 时返回 Int.MIN_VALUE，需防护
            val capacityProp = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                ?: Int.MIN_VALUE
            if (capacityProp in 0..100) capacityProp else 0
        }

        // 6. 电池状态 (充电中、放电中、已充满、未充电)
        val statusInt = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val status = when (statusInt) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.NOT_CHARGING
        }

        // 7. 电池温度：EXTRA_TEMPERATURE 为 0.1℃ 精度 (默认 25.0℃)。
        // v1.2.3 审计加固：传感器故障 ROM 会上报 -300℃/800℃ 等垃圾值，无钳制会
        // 直接污染 UI 温度评估、温控节流态 (HardwareInfoResolver) 与内阻老化模型
        val tempTenths = intent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 250) ?: 250
        val temperatureCelsius = (tempTenths / 10.0f)
            .coerceIn(MIN_PLAUSIBLE_TEMPERATURE_C, MAX_PLAUSIBLE_TEMPERATURE_C)

        // 8. 电池健康状况 (良好、过热、损坏、超压、未知)
        val healthInt = intent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1) ?: -1
        val healthQuality = when (healthInt) {
            BatteryManager.BATTERY_HEALTH_GOOD -> BatteryHealthQuality.GOOD
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> BatteryHealthQuality.OVERHEAT
            BatteryManager.BATTERY_HEALTH_DEAD -> BatteryHealthQuality.DEAD
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> BatteryHealthQuality.OVER_VOLTAGE
            else -> BatteryHealthQuality.UNKNOWN
        }

        // 9. 电压：毫伏 mV。v1.2.3 审计加固：传感器故障值 (0/负/超大) 视为不可信，
        // 回退中性默认 4000 mV (与 EXTRA 缺失口径一致)，避免 "0 mV" 荒谬展示
        // 污染功率计算与快充协议档位推断
        // v2.0.0-alpha.7 指标 09 自检修复：单通道 → 双通道 (EXTRA → sysfs voltage_now)
        // v2.0.0-alpha.8 真机自检修复 (电压无正常显示根因)：
        // 1. EXTRA_VOLTAGE 单位裁决——规范单位 mV，但部分内核以 μV 注入 Extra
        //    (4,150,000 超出 [2000,12000] 被直接拒绝 → sysfs 兜底可能同样失效 →
        //    指标 09 恒显 "—")；现 μV 值 /1000 复验，命中即按实测采用；
        // 2. sysfs 通道扩为多节点 (voltage_now/avg/batt/ocv) + 全量目录扫描 +
        //    μV/mV 双单位裁决 (见 BatterySysfs.readVoltageNowMilliVolts)；
        // 双通道均不可得时 voltageMeasured=false，UI 显示 "—" 而非伪装读数
        val rawExtraVoltage = intent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1) ?: -1
        val extraVoltageMv = when {
            rawExtraVoltage in MIN_PLAUSIBLE_VOLTAGE_MV..MAX_PLAUSIBLE_VOLTAGE_MV ->
                rawExtraVoltage
            // μV 注入 Extra 裁决：仅当原值超出 mV 上限且 /1000 落入合理区间时采用
            // (4350 mV 内核不会误伤——4350/1000=4 不在区间)
            rawExtraVoltage > MAX_PLAUSIBLE_VOLTAGE_MV &&
                rawExtraVoltage / 1000 in MIN_PLAUSIBLE_VOLTAGE_MV..MAX_PLAUSIBLE_VOLTAGE_MV ->
                rawExtraVoltage / 1000
            else -> null
        }
        val sysfsVoltageMv = BatterySysfs.readVoltageNowMilliVolts()
        val voltageMv: Int
        val voltageMeasured: Boolean
        if (extraVoltageMv != null) {
            voltageMv = extraVoltageMv
            voltageMeasured = true
        } else if (sysfsVoltageMv != null) {
            voltageMv = sysfsVoltageMv
            voltageMeasured = true
        } else {
            voltageMv = DEFAULT_VOLTAGE_MV
            voltageMeasured = false
        }

        // 11. 瞬时电流：CURRENT_NOW 规范返回微安 (μA)，部分旧内核返回毫安 (mA)，归一化为 mA
        // v1.2.3 P0 审计修复：
        // 1. 设备不支持该属性时 getIntProperty 返回 Int.MIN_VALUE，旧实现经
        //    normalizeCurrentToMilliAmps 归一化为 0 mA → 充满判定 (0~25mA) 恒真，
        //    估算值被冒充实测锁定写盘。现透传 null = 不可读；
        // 2. 符号按 EXTRA_STATUS/EXTRA_PLUGGED 校准 (充电为正、放电为负)，
        //    修复充电上报负值的平台 (高通/三星部分内核) 判定永不成立问题。
        // v2.0.0-alpha.8 真机自检修复 (瞬时电流无正常显示根因)：
        // 旧实现 BATTERY_PROPERTY_CURRENT_NOW 是唯一取值通道，sysfs current_now
        // 仅作单位裁决参照——HAL 不支持该属性的机型 (Int.MIN_VALUE) 即便 sysfs
        // 电流节点完好，指标 11 恒显 "—"。现增加 sysfs 多节点取值回退
        // (current_now/avg/bms_current/BatteryAverageCurrent，单位/符号全复用)；
        // HAL 损坏恒 0 的机型交叉校验 sysfs 真实读数，避免伪造 "0 mA"
        val rawCurrentProp = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        // v1.2.6 P2 审计修复：EXTRA_PLUGGED 默认值 -1 → 0 且判定改 plugged > 0——
        // 旧实现广播缺该 Extra 时得到 -1，非零 (!= 0) 被误判为"已接电源"，
        // 拔线/未插电场景的电流符号归一与指标 12 充满判定被污染；
        // 0 = AOSP 语义"未插入电源"，> 0 才表示接入了充电器/USB/无线充电
        val plugged = intent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0
        val isCharging = status == BatteryStatus.CHARGING || status == BatteryStatus.FULL || plugged > 0
        val currentMa = when {
            rawCurrentProp == null || rawCurrentProp == Int.MIN_VALUE ->
                BatterySysfs.readCurrentNowMilliAmps(isCharging)
            rawCurrentProp == 0 ->
                BatterySysfs.readCurrentNowMilliAmps(isCharging)?.takeIf { it != 0 } ?: 0
            else -> BatterySysfs.normalizeCurrentToMilliAmps(rawCurrentProp, isCharging)
        }

        // 10. 循环计数：Android 14+ 原生 API 与 Linux sysfs 双重支持
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ 原生 API
            cycleCount = intent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, 0) ?: 0
        }
        if (cycleCount <= 0) {
            // v2.0.0-alpha 批次A：多节点探测链 (bms/maxfg/dc 平台的循环计数不在 battery 目录)
            cycleCount = BatterySysfs.readCycleCount() ?: 0
        }
        // v1.2.3 审计加固：循环计数合理区间收敛——内核占位/脏数据 (如 65535) 会同时
        // 污染指标 10 展示与内阻老化模型 (HardwareInfoResolver)，负值一律归一为 0
        cycleCount = cycleCount.coerceIn(0, MAX_PLAUSIBLE_CYCLE_COUNT)

        // 3. 电池当前容量 (衰减后容量 mAh)
        // sysfs charge_full 经 readCapacityMah 双单位归一化 (规范 μAh，兼容 mAh 上报内核)
        // 与合理区间校验。
        // v1.2.3 健康度真实性审计：区分实测与估算来源，UI 显式标注，
        // 杜绝"精确的 92.0% 健康度"实为 0.92 虚构估算值的情况
        // v2.0.0-alpha 批次A：charge_full 改走多节点探测链
        // (bms/maxfg/dc 平台的 battery 目录无 charge_full，旧硬编码路径必然降级估算)
        // v2.0.0-alpha.1 用户口径修正：移除 0.92 出厂保持率估算——探测链全链路不可读时
        // 当前容量=0 (非法哨兵)、来源=UNAVAILABLE、健康度=0 且 hasMeasuredCapacity=false，
        // UI 显示 "— 无法测算"。是多少就是多少，测不到就不展示，不再虚构数值。
        // 附带收益：0 被锁定链路的合理区间校验拒绝，估算值冒充实测锁定的通路彻底关闭
        val sysfsCurrentCapacity = BatterySysfs.readChargeFull()
        val hasMeasuredCapacity = sysfsCurrentCapacity != null
        val currentCapacitySource =
            if (hasMeasuredCapacity) CapacitySource.SYSFS else CapacitySource.UNAVAILABLE
        val currentCapacityMah = sysfsCurrentCapacity ?: 0

        // 2. 剩余电量 (mAh)
        // 不变式：剩余电量恒 ≤ 当前可用容量，与 Web 端 (百分比 × 当前容量) 口径一致，
        // 避免库仑计读数抖动导致指标 2 大于指标 3。
        // v1.2.3 审计修复：四舍五入替代浮点截断 (toInt)，与 Web 端 Math.round 口径一致，
        // 消除 1mAh 级精度漂移 (如 4600 mAh × 53% 旧实现折算 2437 而非 2438)
        // v1.2.4 P2 审计修复：双口径来源显式标注——CHARGE_COUNTER 为系统库仑计
        // 剩余电荷实测 (COULOMB_COUNTER)，回退分支为 百分比 × 当前容量 估算 (ESTIMATED)。
        // 两条口径量纲基准不同 (机型间不可比、运行中切换会跳变)，UI 显式标注口径
        val chargeCounterUah = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER) ?: 0
        val remainingIsMeasured = chargeCounterUah > 0 && chargeCounterUah != Int.MIN_VALUE
        val remainingCapacityMah = if (remainingIsMeasured) {
            // v2.0.0-alpha.1：容量实测时钳制"剩余 ≤ 当前容量"防读数抖动；
            // 容量不可测 (0) 时库仑计读数仍是真实测量，不得被钳制归零
            val measuredMah = Math.round(chargeCounterUah / 1000f)
            if (hasMeasuredCapacity) measuredMah.coerceAtMost(currentCapacityMah) else measuredMah
        } else {
            Math.round(currentCapacityMah * (percentage / 100f))
        }
        val remainingCapacitySource =
            if (remainingIsMeasured) CapacitySource.COULOMB_COUNTER else CapacitySource.ESTIMATED

        // 1. 电池健康度 (%)：当前容量 / 设计容量，钳制 0~100 防 NaN 外溢。
        // v2.0.0-alpha.1：容量不可测 (0) 时健康度=0 且 hasMeasuredCapacity=false，
        // UI 显示"无法测算"——不再按出厂保持率虚构健康度
        val healthPercentage =
            if (hasMeasuredCapacity) {
                ((currentCapacityMah.toFloat() / effectiveDesignCapacity) * 100f).coerceIn(0f, 100f)
            } else 0f

        // 12. 完全充满判定：100% 且充电态 |电流| ≤ 25 mA (三态判定，双通道一致)
        // v1.2.3 P0 审计修复：旧实现电流不可读时归一化为 0 → 判定恒真，
        // 且未校验充电态 → 放电中到 100% 也被强制 FULL。现显式三态。
        val fullChargeVerdict = evaluateFullCharge(percentage, currentMa, isCharging)
        val isFullChargeConditionMet = fullChargeVerdict == FullChargeVerdict.FULLY_CHARGED

        // 瞬时功率 (W = V × I)：电流不可读时为 null，UI 显示 "—" 而非虚构 0W。
        // v1.2.4 P2 审计修复：移除 abs()——currentMa 已按"充电为正、放电为负"
        // 符号归一，功率随符号携带方向 (充电 +W / 放电 −W)；旧实现 abs 后
        // 放电 1150 mA 与充电 1150 mA 同显正功率，充放方向信息丢失
        // v2.0.0-alpha.7 指标 09 自检修复：电压未实测时功率同样置 null——
        // 中性默认 4000 mV × 真实电流 = 虚构功率，会污染 Hero 功率展示与
        // HardwareInfoResolver 快充档位推断 (默认值恰好可凑出"快充"瓦数)
        val powerWatts: Float? =
            if (voltageMeasured) currentMa?.let { voltageMv.toFloat() * it / 1_000_000f } else null

        // v2.0.0-alpha.1 自检修复：内阻引擎样本采集接线——旧实现全局只有
        // snapshot() 消费 (toBatteryState / HardwareInfoResolver) 而无 observe()
        // 调用，滑窗永远 n=0、内阻永远 "[工程估算]"，遥测分析 Tab 宣称的
        // "运行时测算/引擎滑窗"是死链路。现于解析出口统一喂入引擎：
        // 广播与轮询双通道同拍重复读数由引擎内部去重 (时间戳+读数签名)，
        // 浮充电流与不可读电流被引擎采样守卫拒绝，不会污染窗口
        val raw = RawBatteryTelemetry(
            percentage = percentage,
            status = status,
            isCharging = isCharging,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            voltageMeasured = voltageMeasured,
            currentMa = currentMa,
            cycleCount = cycleCount,
            designCapacityMah = effectiveDesignCapacity,
            currentCapacityMah = currentCapacityMah,
            hasMeasuredCapacity = hasMeasuredCapacity,
            remainingCapacityMah = remainingCapacityMah,
            remainingCapacitySource = remainingCapacitySource,
            healthPercentage = healthPercentage,
            powerWatts = powerWatts,
            isFullChargeConditionMet = isFullChargeConditionMet,
            fullChargeVerdict = fullChargeVerdict,
            currentCapacitySource = currentCapacitySource,
            designCapacitySource = designCapacitySource,
            chargeCounterUah = if (remainingIsMeasured) chargeCounterUah.toLong() else 0L
        )

        // 见上方接线说明：解析出口喂入内阻引擎 (去重/采样守卫均在引擎内完成)
        BatteryHealthEngine.observe(raw)
        return raw
    }
}
