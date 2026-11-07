package com.battery.master.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
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

    init {
        startTelemetryPolling()
    }

    private fun startTelemetryPolling() {
        viewModelScope.launch {
            while (isActive) {
                // 如果当前未处于手动模拟锁定中，持续读取真实硬件
                val current = _batteryState.value
                val fresh = reader.readBatteryTelemetry()
                if (current.isFullChargeConditionMet && current.fullChargeCapacityMah != null) {
                    _batteryState.value = fresh.copy(
                        fullChargeCapacityMah = current.fullChargeCapacityMah,
                        lastFullChargeTimestamp = current.lastFullChargeTimestamp
                    )
                } else {
                    _batteryState.value = fresh
                }
                delay(1000) // 1 秒刷新频率
            }
        }
    }

    fun setDesignCapacity(capacityMah: Int) {
        reader.designCapacityMah = capacityMah
        _batteryState.value = reader.readBatteryTelemetry()
    }

    /**
     * 一键模拟完全充满判定条件 (电量 100% 且瞬时电流 0~25mA)
     */
    fun triggerFullChargeSimulation() {
        val current = _batteryState.value
        _batteryState.value = current.copy(
            percentage = 100,
            currentMa = 16,
            status = BatteryStatus.FULL,
            isFullChargeConditionMet = true,
            fullChargeCapacityMah = current.currentCapacityMah,
            lastFullChargeTimestamp = System.currentTimeMillis()
        )
    }
}
