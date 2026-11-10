package com.battery.master.model

import com.battery.master.data.BatteryState

/**
 * 业务类别名：映射到 com.battery.master.data.BatteryState
 * 由 BatteryScreen 经 viewModel.batteryInfo 消费，贯穿 UI 数据链路
 */
typealias BatteryInfo = BatteryState
