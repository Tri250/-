package com.battery.master.service

import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource

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
    val temperatureCelsius: Float,
    val healthQuality: BatteryHealthQuality,
    val voltageMv: Int,
    val currentMa: Int,
    val cycleCount: Int,
    val designCapacityMah: Int,
    val currentCapacityMah: Int,
    val remainingCapacityMah: Int,
    val healthPercentage: Float,
    val powerWatts: Float,
    val isFullChargeConditionMet: Boolean,
    /** v1.2.3 健康度真实性审计：容量来源等级，透传至 UI 标注，区分实测与降级估算 */
    val currentCapacitySource: CapacitySource = CapacitySource.ESTIMATED,
    val designCapacitySource: CapacitySource = CapacitySource.FALLBACK
) {
    /**
     * 合成为展示态 BatteryState：
     * 指标 12 锁定容量/时间戳由调用方经 BatteryHardwareReader 单一数据源注入，
     * 满足充满判定时状态强制归一为 FULL (与 Web 端口径一致)。
     */
    fun toBatteryState(
        fullChargeCapacityMah: Int?,
        lastFullChargeTimestamp: Long?
    ): BatteryState {
        val hardware = HardwareInfoResolver.resolve(temperatureCelsius, cycleCount, powerWatts)
        return BatteryState(
            healthPercentage = healthPercentage,
            remainingCapacityMah = remainingCapacityMah,
            currentCapacityMah = currentCapacityMah,
            designCapacityMah = designCapacityMah,
            currentCapacitySource = currentCapacitySource,
            designCapacitySource = designCapacitySource,
            percentage = percentage,
            status = if (isFullChargeConditionMet) BatteryStatus.FULL else status,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            cycleCount = cycleCount,
            currentMa = currentMa,
            fullChargeCapacityMah = fullChargeCapacityMah,
            lastFullChargeTimestamp = lastFullChargeTimestamp,
            isFullChargeConditionMet = isFullChargeConditionMet,
            powerWatts = powerWatts,
            socModel = hardware.socModel,
            socVendor = hardware.socVendor,
            socProcess = hardware.socProcess,
            socCpu = hardware.socCpu,
            socGpu = hardware.socGpu,
            pmicModel = hardware.pmicModel,
            batteryChemistry = hardware.batteryChemistry,
            fastChargeProtocol = hardware.fastChargeProtocol,
            internalResistanceMohm = hardware.internalResistanceMohm,
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

    /** 电池当前容量合理区间 (mAh)：区间外视为 sysfs 单位异常/脏数据，回退估算值 */
    const val MIN_PLAUSIBLE_CAPACITY_MAH = 500
    const val MAX_PLAUSIBLE_CAPACITY_MAH = 20_000

    /** 指标 07 温度物理合理区间 (℃)：覆盖极寒存储到极端温升，区间外视为传感器故障 */
    const val MIN_PLAUSIBLE_TEMPERATURE_C = -40f
    const val MAX_PLAUSIBLE_TEMPERATURE_C = 120f

    /** 指标 09 电压物理合理区间 (mV)：覆盖单电芯 3.0~4.5V 与双电芯串联整包 6~9V 加余量 */
    const val MIN_PLAUSIBLE_VOLTAGE_MV = 2_000
    const val MAX_PLAUSIBLE_VOLTAGE_MV = 12_000

    /** 指标 09 电压不可信时的中性默认值 (mV)：与 EXTRA 缺失口径一致 */
    const val DEFAULT_VOLTAGE_MV = 4_000

    /** 指标 10 循环计数合理上限 (次)：真实电芯寿命约 2000 次，留 5 倍余量 */
    const val MAX_PLAUSIBLE_CYCLE_COUNT = 10_000

    /** 指标 11 瞬时电流合理区间 (mA)：±20A 已超任何手机物理上限 */
    const val MAX_PLAUSIBLE_CURRENT_MA = 20_000

    /**
     * 指标 12 共享判定谓词：仅当电量 100% 且瞬时电流处于 0~25 mA 浮充截止区间时为 true。
     * 双通道与 UI 卡片统一消费此谓词语义，不在各处重算。
     */
    fun isFullChargeCriteriaMet(percentage: Int, currentMa: Int): Boolean =
        percentage == FULL_CHARGE_PERCENTAGE && currentMa in FULL_CHARGE_TRICKLE_MIN_MA..FULL_CHARGE_TRICKLE_MAX_MA

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
        val rawVoltageMv = intent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1) ?: -1
        val voltageMv = if (rawVoltageMv in MIN_PLAUSIBLE_VOLTAGE_MV..MAX_PLAUSIBLE_VOLTAGE_MV) {
            rawVoltageMv
        } else {
            DEFAULT_VOLTAGE_MV
        }

        // 11. 瞬时电流：CURRENT_NOW 规范返回微安 (μA)，部分旧内核返回毫安 (mA)，归一化为 mA
        val currentMicroAmp = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW) ?: 0
        val currentMa = BatterySysfs.normalizeCurrentToMilliAmps(currentMicroAmp)

        // 10. 循环计数：Android 14+ 原生 API 与 Linux sysfs 双重支持
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ 原生 API
            cycleCount = intent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, 0) ?: 0
        }
        if (cycleCount <= 0) {
            cycleCount = BatterySysfs.readInt("/sys/class/power_supply/battery/cycle_count") ?: 0
        }
        // v1.2.3 审计加固：循环计数合理区间收敛——内核占位/脏数据 (如 65535) 会同时
        // 污染指标 10 展示与内阻老化模型 (HardwareInfoResolver)，负值一律归一为 0
        cycleCount = cycleCount.coerceIn(0, MAX_PLAUSIBLE_CYCLE_COUNT)

        // 3. 电池当前容量 (衰减后容量 mAh)
        // sysfs charge_full 经 readCapacityMah 双单位归一化 (规范 μAh，兼容 mAh 上报内核)
        // 与合理区间校验；不可读/脏数据一律回退设计容量估算值 (0.92 降级假设)，
        // 避免非法容量流入指标 12 锁定与持久化。
        // v1.2.3 健康度真实性审计：区分实测与估算来源，UI 显式标注，
        // 杜绝"精确的 92.0% 健康度"实为 0.92 虚构估算值的情况
        val sysfsCurrentCapacity = BatterySysfs.readCapacityMah("/sys/class/power_supply/battery/charge_full")
        val currentCapacitySource =
            if (sysfsCurrentCapacity != null) CapacitySource.SYSFS else CapacitySource.ESTIMATED
        val currentCapacityMah = sysfsCurrentCapacity
            ?: (effectiveDesignCapacity * 0.92f).toInt()

        // 2. 剩余电量 (mAh)
        // 不变式：剩余电量恒 ≤ 当前可用容量，与 Web 端 (百分比 × 当前容量) 口径一致，
        // 避免库仑计读数抖动导致指标 2 大于指标 3。
        // v1.2.3 审计修复：四舍五入替代浮点截断 (toInt)，与 Web 端 Math.round 口径一致，
        // 消除 1mAh 级精度漂移 (如 4600 mAh × 53% 旧实现折算 2437 而非 2438)
        val chargeCounterUah = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER) ?: 0
        val remainingCapacityMah = if (chargeCounterUah > 0 && chargeCounterUah != Int.MIN_VALUE) {
            Math.round(chargeCounterUah / 1000f).coerceAtMost(currentCapacityMah)
        } else {
            Math.round(currentCapacityMah * (percentage / 100f))
        }

        // 1. 电池健康度 (%)：当前容量 / 设计容量，钳制 0~100 防 NaN 外溢
        val healthPercentage =
            ((currentCapacityMah.toFloat() / effectiveDesignCapacity) * 100f).coerceIn(0f, 100f)

        // 12. 完全充满判定：100% 且电流 0~25 mA (共享谓词，双通道一致)
        val isFullChargeConditionMet = isFullChargeCriteriaMet(percentage, currentMa)

        // 瞬时功率 (W = V × I)
        val powerWatts = (voltageMv.toFloat() * kotlin.math.abs(currentMa)) / 1_000_000f

        return RawBatteryTelemetry(
            percentage = percentage,
            status = status,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            currentMa = currentMa,
            cycleCount = cycleCount,
            designCapacityMah = effectiveDesignCapacity,
            currentCapacityMah = currentCapacityMah,
            remainingCapacityMah = remainingCapacityMah,
            healthPercentage = healthPercentage,
            powerWatts = powerWatts,
            isFullChargeConditionMet = isFullChargeConditionMet,
            currentCapacitySource = currentCapacitySource,
            designCapacitySource = designCapacitySource
        )
    }
}
