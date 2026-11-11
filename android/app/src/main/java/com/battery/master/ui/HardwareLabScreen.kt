package com.battery.master.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.viewmodel.BatteryViewModel
import com.battery.master.viewmodel.LabScenario

/**
 * 硬件实验室 (与 Web 端 HardwareSimulationLab 对齐)：
 * 4 个一键场景 + 6 个滑杆 + 电池状态/健康枚举 + 提示音开关，
 * 模拟数据仅作用于展示层，退出后无缝恢复真实硬件遥测
 */
@Composable
fun HardwareLabScreen(viewModel: BatteryViewModel, state: BatteryState) {
    val lab by viewModel.labOverride.collectAsState()
    val soundEnabled by viewModel.labSoundEnabled.collectAsState()

    // 滑杆取值：模拟中读覆盖层，否则读真实遥测 (拖动时 VM 会自动进入模拟模式)
    val labActive = lab != null
    val pct = lab?.percentage ?: state.percentage
    val currentMa = lab?.currentMa ?: state.currentMa
    val voltageMv = lab?.voltageMv ?: state.voltageMv
    val temperature = lab?.temperatureCelsius ?: state.temperatureCelsius
    val cycleCount = lab?.cycleCount ?: state.cycleCount
    val status = lab?.status ?: state.status
    val health = lab?.healthQuality ?: state.healthQuality

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // ===== 模式状态与控制 =====
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        if (labActive) Color(0xFF10B981) else Color(0xFF1E293B),
                        RoundedCornerShape(20.dp)
                    ),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "硬件实验室与模拟调试",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = if (labActive) "模拟数据生效中 · 真实遥测已冻结" else "真实遥测 · 交互后自动进入模拟模式",
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                color = if (labActive) Color(0xFF34D399) else Color(0xFF64748B)
                            )
                        }
                        // 提示音开关
                        OutlinedButton(
                            onClick = { viewModel.toggleLabSound() },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = if (soundEnabled) Color(0xFF34D399) else Color(0xFF64748B)
                            ),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (soundEnabled) "提示音 开" else "提示音 关",
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // 退出模拟：恢复真实遥测
                    Button(
                        onClick = { viewModel.exitLabMode() },
                        enabled = labActive,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF7C2D12),
                            disabledContainerColor = Color(0xFF1E293B),
                            disabledContentColor = Color(0xFF475569)
                        )
                    ) {
                        Text(
                            text = "恢复真实硬件遥测",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // ===== 一键工作场景 =====
        item {
            Text(
                text = "一键工作场景模拟",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8),
                fontFamily = FontFamily.Monospace
            )
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.FULL_CHARGE,
                    color = Color(0xFF10B981),
                    onClick = { viewModel.applyLabScenario(LabScenario.FULL_CHARGE) }
                )
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.FLASH_CHARGE,
                    color = Color(0xFF38BDF8),
                    onClick = { viewModel.applyLabScenario(LabScenario.FLASH_CHARGE) }
                )
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.GAMING_DISCHARGE,
                    color = Color(0xFFA855F7),
                    onClick = { viewModel.applyLabScenario(LabScenario.GAMING_DISCHARGE) }
                )
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.OVERHEAT_ALERT,
                    color = Color(0xFFF43F5E),
                    onClick = { viewModel.applyLabScenario(LabScenario.OVERHEAT_ALERT) }
                )
            }
        }

        // ===== 交互滑杆区 =====
        item {
            Text(
                text = "逐项参数调节 (6 组滑杆)",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8),
                fontFamily = FontFamily.Monospace
            )
        }

        item {
            LabCard {
                LabSlider(
                    label = "05. 电量百分比",
                    valueText = "$pct%",
                    value = pct.toFloat(),
                    valueRange = 0f..100f,
                    accent = Color(0xFF10B981),
                    onValueChange = { viewModel.updateLabPercentage(it.toInt()) }
                )
                LabSlider(
                    label = "11. 瞬时电流",
                    valueText = "${if (currentMa > 0) "+$currentMa" else currentMa} mA",
                    value = currentMa.toFloat(),
                    valueRange = -2000f..6000f,
                    accent = Color(0xFF34D399),
                    onValueChange = { viewModel.updateLabCurrent(it.toInt()) }
                )
                LabSlider(
                    label = "09. 电芯电压",
                    valueText = "$voltageMv mV",
                    value = voltageMv.toFloat(),
                    valueRange = 3500f..4600f,
                    accent = Color(0xFF38BDF8),
                    onValueChange = { viewModel.updateLabVoltage(it.toInt()) }
                )
                LabSlider(
                    label = "07. 传感器温度",
                    valueText = "$temperature °C",
                    value = temperature,
                    valueRange = 0f..55f,
                    accent = Color(0xFFF59E0B),
                    onValueChange = { viewModel.updateLabTemperature(it) }
                )
                LabSlider(
                    label = "10. 循环计数",
                    valueText = "$cycleCount 次",
                    value = cycleCount.toFloat(),
                    valueRange = 0f..1200f,
                    accent = Color(0xFF14B8A6),
                    onValueChange = { viewModel.updateLabCycleCount(it.toInt()) }
                )
                LabSlider(
                    label = "04. 出厂设计容量 (真实生效)",
                    valueText = "${state.designCapacityMah} mAh",
                    value = state.designCapacityMah.toFloat(),
                    valueRange = 1000f..15000f,
                    accent = Color(0xFFA855F7),
                    onValueChange = { viewModel.updateLabDesignCapacity(it.toInt()) }
                )
            }
        }

        // ===== 电池状态枚举 =====
        item {
            LabCard {
                Text(
                    text = "06. 电池状态强制切换",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("充电中", status == BatteryStatus.CHARGING, Color(0xFF10B981)) {
                        viewModel.updateLabStatus(BatteryStatus.CHARGING)
                    }
                    StatusChip("放电中", status == BatteryStatus.DISCHARGING, Color(0xFF38BDF8)) {
                        viewModel.updateLabStatus(BatteryStatus.DISCHARGING)
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("已充满", status == BatteryStatus.FULL, Color(0xFF2DD4BF)) {
                        viewModel.updateLabStatus(BatteryStatus.FULL)
                    }
                    StatusChip("未充电", status == BatteryStatus.NOT_CHARGING, Color(0xFF64748B)) {
                        viewModel.updateLabStatus(BatteryStatus.NOT_CHARGING)
                    }
                }
            }
        }

        // ===== 健康枚举 =====
        item {
            LabCard {
                Text(
                    text = "08. 硬件健康状态选择",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("良好", health == BatteryHealthQuality.GOOD, Color(0xFF10B981)) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.GOOD)
                    }
                    StatusChip("过热", health == BatteryHealthQuality.OVERHEAT, Color(0xFFF59E0B)) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVERHEAT)
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("损坏", health == BatteryHealthQuality.DEAD, Color(0xFFF43F5E)) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.DEAD)
                    }
                    StatusChip("超压", health == BatteryHealthQuality.OVER_VOLTAGE, Color(0xFFA855F7)) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVER_VOLTAGE)
                    }
                    StatusChip("未知", health == BatteryHealthQuality.UNKNOWN, Color(0xFF64748B)) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.UNKNOWN)
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/** 一键场景按钮 */
@Composable
private fun LabScenarioButton(
    modifier: Modifier = Modifier,
    scenario: LabScenario,
    color: Color,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A)),
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 12.dp)
    ) {
        Column(horizontalAlignment = Alignment.Start) {
            Text(
                text = scenario.label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = color,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = scenario.desc,
                fontSize = 9.sp,
                color = Color(0xFF64748B),
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

/** 实验室区块容器 */
@Composable
private fun LabCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16))
    ) {
        Column(modifier = Modifier.padding(14.dp), content = content)
    }
}

/** 带标签的滑杆行 */
@Composable
private fun LabSlider(
    label: String,
    valueText: String,
    value: Float,
    valueRange: ClosedFloatingPointRange<Float>,
    accent: Color,
    onValueChange: (Float) -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, fontSize = 11.sp, color = Color(0xFF94A3B8))
            Text(
                text = valueText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = Color.White
            )
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            colors = SliderDefaults.colors(
                thumbColor = accent,
                activeTrackColor = accent,
                inactiveTrackColor = Color(0xFF1E293B)
            )
        )
    }
}

/** 枚举选择胶囊 */
@Composable
private fun StatusChip(label: String, selected: Boolean, accent: Color, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(50),
        color = if (selected) Color(0xFF0F172A) else Color.Transparent,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (selected) accent else Color(0xFF334155)
        ),
        onClick = onClick
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            color = if (selected) accent else Color(0xFF64748B),
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
