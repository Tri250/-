package com.battery.master.viewmodel

import android.app.Application
import android.content.Intent
import android.content.IntentFilter
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

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
