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
            ?.let { it / 10f }
        val health = intent?.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)
            ?: BatteryManager.BATTERY_HEALTH_UNKNOWN
        val technology = intent?.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY) ?: "—"

        val rawCurrent = batteryManager.getLongProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
            .takeIf { it != Long.MIN_VALUE && it != 0L && abs(it) < 30_000_000L }
            ?.let { it / 1000f }

        val currentMa = rawCurrent?.let { normalizeCurrent(it, status) }

        val counterUah = batteryManager.getLongProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
            .takeIf { it != Long.MIN_VALUE && it > 0L }

        // 系统的充电剩余时间（秒）。只有充电中才有意义；不支持时返回 Long.MIN_VALUE，
        // 部分厂商会给出离谱值，超过 24 小时按不可信处理，交给线性外推兜底
        val chargeTimeRemainingSec = if (status == BatteryManager.BATTERY_STATUS_CHARGING) {
            batteryManager.getLongProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_TIME_REMAINING)
                .takeIf { it != Long.MIN_VALUE && it in 1L..86_400L }
                ?.let { ((it + 59L) / 60L).toInt() }
        } else {
            null
        }

        val cycleFromIntent = intent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, -1)?.takeIf { it >= 0 }
        val raw = sysfs.read()

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
            voltageMv = voltageMv,
            currentMa = currentMa,
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
