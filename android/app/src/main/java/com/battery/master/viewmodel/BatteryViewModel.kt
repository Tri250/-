package com.battery.master.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.battery.master.model.BatteryInfo
import com.battery.master.service.BatteryHardwareReader
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class BatteryViewModel(application: Application) : AndroidViewModel(application) {

    private val reader = BatteryHardwareReader(application.applicationContext)

    private val _batteryInfo = MutableStateFlow(reader.readBatteryTelemetry())
    val batteryInfo: StateFlow<BatteryInfo> = _batteryInfo.asStateFlow()

    init {
        startTelemetryPolling()
    }

    private fun startTelemetryPolling() {
        viewModelScope.launch {
            while (isActive) {
                _batteryInfo.value = reader.readBatteryTelemetry()
                delay(1000) // 1 秒刷新频率
            }
        }
    }

    fun setDesignCapacity(capacityMah: Int) {
        reader.designCapacityMah = capacityMah
        _batteryInfo.value = reader.readBatteryTelemetry()
    }
}
