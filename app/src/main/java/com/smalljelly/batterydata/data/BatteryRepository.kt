package com.smalljelly.batterydata.data

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.isActive
import kotlin.math.abs

/**
 * 电池数据源：以 1 秒为间隔轮询系统 BatteryManager + sysfs，向上层输出 [BatterySample]。
 */
class BatteryRepository(private val context: Context) {

    private val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
    private val sysfs = SysfsBatteryReader()
    private val settings = BatterySettings(context)

    /** BatteryManager.BATTERY_PROPERTY_CHARGE_TIME_REMAINING 的常量值，反射取；新 SDK 才公开该符号 */
    private val chargeTimeRemainingProperty: Int? by lazy {
        runCatching {
            BatteryManager::class.java.getField("BATTERY_PROPERTY_CHARGE_TIME_REMAINING").getInt(null)
        }.getOrNull()
    }

    fun snapshot(): BatterySample = readSample(allowRemote = false)

    fun stream(intervalMs: Long = 1_000L): Flow<BatterySample> = flow {
        while (currentCoroutineContext().isActive) {
            emit(readSample(allowRemote = true))
            delay(intervalMs)
        }
    }.flowOn(Dispatchers.IO)

    @Suppress("DEPRECATION")
    private fun readSample(allowRemote: Boolean): BatterySample {
        val intent: Intent? = runCatching {
            context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        }.getOrNull()

        val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val percent = when {
            level >= 0 && scale > 0 -> (level * 100f / scale).toInt()
            else -> batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        }.coerceIn(0, 100)

        // 未取整的电量（78.4 而不是 78）：反推满电容量时用它，
        // 否则整数电量每跨 1%，反推值跳 ±1.3%，健康度跟着抖
        val rawLevelPercent = if (level >= 0 && scale > 0) (level * 100f / scale).coerceIn(0f, 100f) else null

        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_UNKNOWN)
            ?: BatteryManager.BATTERY_STATUS_UNKNOWN
        val plugged = intent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0
        val voltageMv = intent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0) ?: 0
        val temperature = intent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE)
            ?.takeIf { it != Int.MIN_VALUE }
            // 0.1°C 原始值；超出电池物理可行范围（-20..80°C）的多为 ROM 哨兵/脏数据，拒收
            ?.takeIf { it in -200..800 }
            ?.let { it / 10f }
        val health = intent?.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)
            ?: BatteryManager.BATTERY_HEALTH_UNKNOWN
        val technology = intent?.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY) ?: "—"

        val rawCurrent = batteryManager.getLongProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
            .takeIf { it != Long.MIN_VALUE && it != 0L && abs(it) < 30_000_000L }
            ?.let { it / 1000f }

        val counterUah = batteryManager.getLongProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
            .takeIf { it != Long.MIN_VALUE && it > 0L }

        // 系统的充电剩余时间（秒）。只有充电中才有意义；不支持时返回 Long.MIN_VALUE，
        // 部分厂商会给出离谱值，超过 24 小时按不可信处理，交给线性外推兜底。
        // 常量用反射取：它是较新 SDK 才公开的符号，部分编译环境的 android.jar 里没有；
        // 反射失败（老系统/老编译环境）时直接走线性外推，行为与不支持该属性的机型一致
        val chargeTimeProp = chargeTimeRemainingProperty
        val chargeTimeRemainingSec = if (status == BatteryManager.BATTERY_STATUS_CHARGING && chargeTimeProp != null) {
            batteryManager.getLongProperty(chargeTimeProp)
                .takeIf { it != Long.MIN_VALUE && it in 1L..86_400L }
                ?.let { ((it + 59L) / 60L).toInt() }
        } else {
            null
        }

        val cycleFromIntent = intent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, -1)?.takeIf { it >= 0 }
        val raw = sysfs.read()
        // BatteryManager 层拿不到电流/电压的机型（不少国产 ROM 把 CURRENT_NOW 关成 0，
        // 部分机型 ACTION_BATTERY_CHANGED 不带电压），退到 sysfs 节点即时读
        val instant = if (rawCurrent == null || voltageMv <= 0) sysfs.readInstant() else null to null
        val resolvedCurrentMa = rawCurrent ?: instant.first?.let { normalizeCurrent(it, status) }
        val resolvedVoltageMv = if (voltageMv > 0) voltageMv else instant.second?.toInt() ?: 0

        // 优先级：手动设置 > sysfs 节点 > 机型库
        val manualDesign = settings.manualDesignCapacityMah()
        val resolvedDesign: Pair<Float, String>? = when {
            manualDesign != null -> manualDesign to "手动"
            raw.designCapacityMah != null -> raw.designCapacityMah to "系统节点"
            else -> DesignCapacityResolver.resolve(context, allowRemote)
        }

        return BatterySample(
            level = percent,
            status = status,
            plugged = plugged,
            voltageMv = resolvedVoltageMv,
            currentMa = resolvedCurrentMa,
            temperatureC = temperature,
            healthCode = health,
            technology = technology,
            chargeCounterMah = counterUah?.let { it / 1000f },
            cycleCount = cycleFromIntent ?: raw.cycleCount,
            fullChargeMah = raw.fullChargeMah,
            designCapacityMah = resolvedDesign?.first,
            designSource = resolvedDesign?.second,
            rawLevelPercent = rawLevelPercent,
            chargeTimeRemainingMin = chargeTimeRemainingSec,
            updatedAt = System.currentTimeMillis(),
        )
    }

    /**
     * 不同厂商对电流符号的定义相反，这里统一成“充电为正、放电为负”。
     */
    private fun normalizeCurrent(currentMa: Float, status: Int): Float = when (status) {
        BatteryManager.BATTERY_STATUS_CHARGING,
        BatteryManager.BATTERY_STATUS_FULL,
        -> abs(currentMa)

        BatteryManager.BATTERY_STATUS_DISCHARGING -> -abs(currentMa)

        else -> currentMa
    }
}
