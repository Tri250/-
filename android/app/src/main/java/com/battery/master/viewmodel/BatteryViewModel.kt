package com.battery.master.viewmodel

import android.app.Application
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.media.ToneGenerator
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryStatus
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.abs

/**
 * 硬件实验室一键模拟场景 (与 Web 端 HardwareSimulationLab 对齐)
 */
enum class LabScenario(val label: String, val desc: String) {
    FULL_CHARGE("充满校准", "100% 且电流 16 mA"),
    FLASH_CHARGE("极速闪充", "+4800 mA / 45%"),
    GAMING_DISCHARGE("高负载游戏放电", "-1150 mA / 发热升高"),
    OVERHEAT_ALERT("电池过热警报", "49.2°C / 异常中断")
}

/**
 * 实验室模拟覆盖层：非空时 UI 展示模拟数据，真实遥测轮询被冻结；
 * 全部字段可在滑杆/枚举中独立调节，退出后无缝恢复真实硬件遥测
 */
data class LabOverride(
    val percentage: Int,
    val currentMa: Int,
    val voltageMv: Int,
    val temperatureCelsius: Float,
    val status: BatteryStatus,
    val healthQuality: BatteryHealthQuality,
    val cycleCount: Int
)

class BatteryViewModel(application: Application) : AndroidViewModel(application) {

    private val reader = BatteryHardwareReader(application.applicationContext)

    private val _batteryState = MutableStateFlow(reader.readBatteryTelemetry())
    val batteryState: StateFlow<BatteryState> = _batteryState.asStateFlow()

    // 兼容别名
    val batteryInfo: StateFlow<BatteryState> get() = batteryState

    // 事件通道：监听系统 ACTION_BATTERY_CHANGED 广播 (与 1 秒轮询互补，共享 Reader 配置)
    private val batteryReceiver = BatteryReceiver(reader) { fresh -> publish(fresh) }

    // 一键模拟充满后的保持期 (毫秒)：期间不覆盖模拟数据，15 秒后恢复真实遥测
    private var simulationHoldUntilMs = 0L

    // 模拟保持期剩余秒数 (供 UI 显示倒计时反馈，0 表示无模拟)
    private val _simulationRemainingSec = MutableStateFlow(0L)
    val simulationRemainingSec: StateFlow<Long> = _simulationRemainingSec.asStateFlow()

    // 广播注册状态标记：仅成功注册后才允许注销，防止 onCleared 重复注销崩溃
    private var isReceiverRegistered = false

    init {
        // 注册容错：部分定制 ROM 可能拒绝动态注册，失败时退化为纯轮询通道，保证 UI 不崩溃
        try {
            ContextCompat.registerReceiver(
                application,
                batteryReceiver,
                IntentFilter(Intent.ACTION_BATTERY_CHANGED),
                ContextCompat.RECEIVER_NOT_EXPORTED
            )
            isReceiverRegistered = true
        } catch (e: Exception) {
            isReceiverRegistered = false
        }
        startTelemetryPolling()
        startSimulationCountdown()
    }

    /**
     * 模拟保持期倒计时：每 250ms 刷新剩余秒数，让用户明确感知
     * "模拟数据生效中、N 秒后恢复真实遥测"，避免误以为界面卡死
     */
    private fun startSimulationCountdown() {
        viewModelScope.launch {
            while (isActive) {
                val remainingMs = simulationHoldUntilMs - System.currentTimeMillis()
                _simulationRemainingSec.value = if (remainingMs > 0) (remainingMs + 999) / 1000 else 0L
                delay(250)
            }
        }
    }

    override fun onCleared() {
        if (isReceiverRegistered) {
            try {
                getApplication<Application>().unregisterReceiver(batteryReceiver)
            } catch (e: IllegalArgumentException) {
                // 防御：系统已代为注销时忽略，避免清理阶段崩溃
            }
            isReceiverRegistered = false
        }
        super.onCleared()
    }

    /**
     * 统一发布遥测数据：
     * 1. 模拟保持期内不覆盖 (一键充满演示可持续观察 15 秒)；
     * 2. 若新数据未满足充满条件、但上一轮已锁定充满容量，
     *    则保留指标 12 的锁定容量与时间戳不丢失
     */
    private fun publish(fresh: BatteryState) {
        if (System.currentTimeMillis() < simulationHoldUntilMs) return
        // 硬件实验室模拟中：冻结真实遥测覆盖，保持滑杆/场景设定值稳定展示
        if (_labOverride.value != null) return

        val current = _batteryState.value
        _batteryState.value =
            if (!fresh.isFullChargeConditionMet &&
                current.isFullChargeConditionMet &&
                current.fullChargeCapacityMah != null
            ) {
                fresh.copy(
                    fullChargeCapacityMah = current.fullChargeCapacityMah,
                    lastFullChargeTimestamp = current.lastFullChargeTimestamp
                )
            } else {
                fresh
            }
    }

    private fun startTelemetryPolling() {
        viewModelScope.launch {
            while (isActive) {
                // 持续读取真实硬件 (1 秒刷新频率)
                publish(reader.readBatteryTelemetry())
                delay(1000)
            }
        }
    }

    fun setDesignCapacity(capacityMah: Int) {
        reader.designCapacityMah = capacityMah
        simulationHoldUntilMs = 0L // 手动改配置立即恢复真实遥测
        publish(reader.readBatteryTelemetry())
    }

    // ==================== 硬件实验室 (与 Web 端 HardwareSimulationLab 对齐) ====================

    // 实验室模拟覆盖层：null = 真实遥测；非空 = 模拟数据生效
    private val _labOverride = MutableStateFlow<LabOverride?>(null)
    val labOverride: StateFlow<LabOverride?> = _labOverride.asStateFlow()

    // 实验室提示音开关 (ToneGenerator 系统提示音，无需额外权限)
    private val _labSoundEnabled = MutableStateFlow(true)
    val labSoundEnabled: StateFlow<Boolean> = _labSoundEnabled.asStateFlow()

    private var labToneGenerator: ToneGenerator? = null

    /** 实验室提示音：ToneGenerator 懒创建 + 防御性释放，失败静默 (部分 ROM 限制) */
    private fun playLabTone(tone: Int) {
        if (!_labSoundEnabled.value) return
        try {
            if (labToneGenerator == null) {
                labToneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 70)
            }
            labToneGenerator?.startTone(tone, 150)
        } catch (e: Exception) {
            labToneGenerator?.release()
            labToneGenerator = null
        }
    }

    /** 进入实验室模拟：以当前真实遥测为基准创建覆盖层 */
    fun enterLabMode() {
        if (_labOverride.value != null) return
        val cur = _batteryState.value
        _labOverride.value = LabOverride(
            percentage = cur.percentage,
            currentMa = cur.currentMa,
            voltageMv = cur.voltageMv,
            temperatureCelsius = cur.temperatureCelsius,
            status = cur.status,
            healthQuality = cur.healthQuality,
            cycleCount = cur.cycleCount
        )
        playLabTone(ToneGenerator.TONE_PROP_ACK)
        publishLab()
    }

    /** 退出实验室模拟：清除覆盖层并立即恢复真实遥测 */
    fun exitLabMode() {
        _labOverride.value = null
        publish(reader.readBatteryTelemetry())
    }

    fun toggleLabSound() {
        _labSoundEnabled.value = !_labSoundEnabled.value
        if (_labSoundEnabled.value) playLabTone(ToneGenerator.TONE_PROP_BEEP)
    }

    /** 一键场景：自动进入实验室模式并应用预设参数 (与 Web 端四场景一致) */
    fun applyLabScenario(scenario: LabScenario) {
        val base = _labOverride.value ?: run {
            val cur = _batteryState.value
            LabOverride(
                cur.percentage, cur.currentMa, cur.voltageMv, cur.temperatureCelsius,
                cur.status, cur.healthQuality, cur.cycleCount
            )
        }
        _labOverride.value = when (scenario) {
            LabScenario.FULL_CHARGE -> base.copy(
                percentage = 100, currentMa = 16, voltageMv = 4410,
                status = BatteryStatus.CHARGING, healthQuality = BatteryHealthQuality.GOOD
            )
            LabScenario.FLASH_CHARGE -> base.copy(
                percentage = 45, currentMa = 4800, voltageMv = 4250,
                temperatureCelsius = 38.5f, status = BatteryStatus.CHARGING,
                healthQuality = BatteryHealthQuality.GOOD
            )
            LabScenario.GAMING_DISCHARGE -> base.copy(
                currentMa = -1150, voltageMv = 3820, temperatureCelsius = 39.8f,
                status = BatteryStatus.DISCHARGING, healthQuality = BatteryHealthQuality.GOOD
            )
            LabScenario.OVERHEAT_ALERT -> base.copy(
                temperatureCelsius = 49.2f, healthQuality = BatteryHealthQuality.OVERHEAT,
                status = BatteryStatus.NOT_CHARGING
            )
        }
        playLabTone(ToneGenerator.TONE_PROP_BEEP)
        publishLab()
    }

    // ---- 滑杆逐项调节：无覆盖层时自动以真实遥测为基准进入实验室 ----

    private fun mutateLab(transform: (LabOverride) -> LabOverride) {
        _labOverride.update { current ->
            transform(current ?: run {
                val cur = _batteryState.value
                LabOverride(
                    cur.percentage, cur.currentMa, cur.voltageMv, cur.temperatureCelsius,
                    cur.status, cur.healthQuality, cur.cycleCount
                )
            })
        }
        publishLab()
    }

    fun updateLabPercentage(v: Int) = mutateLab { it.copy(percentage = v.coerceIn(0, 100)) }
    fun updateLabCurrent(v: Int) = mutateLab { it.copy(currentMa = v.coerceIn(-2000, 6000)) }
    fun updateLabVoltage(v: Int) = mutateLab { it.copy(voltageMv = v.coerceIn(3500, 4600)) }
    fun updateLabTemperature(v: Float) = mutateLab { it.copy(temperatureCelsius = v.coerceIn(0f, 55f)) }
    fun updateLabCycleCount(v: Int) = mutateLab { it.copy(cycleCount = v.coerceIn(0, 1200)) }
    fun updateLabStatus(v: BatteryStatus) = mutateLab { it.copy(status = v) }
    fun updateLabHealthQuality(v: BatteryHealthQuality) = mutateLab {
        val t = if (v == BatteryHealthQuality.OVERHEAT) 49.2f else it.temperatureCelsius
        it.copy(healthQuality = v, temperatureCelsius = t)
    }

    /** 设计容量滑杆：直接作用于 Reader 配置 (真实生效，与总览页校准入口同源) */
    fun updateLabDesignCapacity(v: Int) {
        setDesignCapacity(v.coerceIn(1000, 15000))
    }

    /**
     * 将实验室覆盖层合成为展示态 BatteryState：
     * 剩余电量/功率/充满判定按模拟值实时重算；容量与锁定指标 12 保持真实值不丢失
     */
    private fun publishLab() {
        val lab = _labOverride.value ?: return
        val base = _batteryState.value
        val isFullMet = lab.percentage == 100 && lab.currentMa in 0..25
        val effectiveStatus = if (isFullMet) BatteryStatus.FULL else lab.status
        val remaining = (base.currentCapacityMah * (lab.percentage / 100f)).toInt()
        _batteryState.value = base.copy(
            percentage = lab.percentage,
            currentMa = lab.currentMa,
            voltageMv = lab.voltageMv,
            temperatureCelsius = lab.temperatureCelsius,
            status = effectiveStatus,
            healthQuality = lab.healthQuality,
            cycleCount = lab.cycleCount,
            remainingCapacityMah = remaining.coerceAtMost(base.currentCapacityMah),
            powerWatts = (abs(lab.voltageMv * lab.currentMa)) / 1_000_000f,
            isFullChargeConditionMet = isFullMet,
            fullChargeCapacityMah = if (isFullMet) (base.fullChargeCapacityMah ?: base.currentCapacityMah)
            else base.fullChargeCapacityMah
        )
    }

    /**
     * 一键模拟完全充满判定条件 (电量 100% 且瞬时电流 0~25mA)
     * 模拟结果同时持久化，保持期结束后锁定容量依然可回显 (指标 12)
     */
    fun triggerFullChargeSimulation() {
        val current = _batteryState.value
        val timestamp = System.currentTimeMillis()
        simulationHoldUntilMs = timestamp + 15_000
        reader.persistFullChargeCapacity(current.currentCapacityMah, timestamp)
        _batteryState.value = current.copy(
            percentage = 100,
            currentMa = 16,
            status = BatteryStatus.FULL,
            isFullChargeConditionMet = true,
            fullChargeCapacityMah = current.currentCapacityMah,
            lastFullChargeTimestamp = timestamp
        )
    }
}
