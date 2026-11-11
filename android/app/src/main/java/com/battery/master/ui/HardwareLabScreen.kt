package com.battery.master.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import com.battery.master.ui.theme.DesignTokens
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
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
                        if (labActive) DesignTokens.BrandPrimary else DesignTokens.Border,
                        RoundedCornerShape(DesignTokens.RadiusPanel)
                    ),
                shape = RoundedCornerShape(DesignTokens.RadiusPanel),
                colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
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
                                fontSize = DesignTokens.FontXs,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = if (labActive) "模拟数据生效中 · 真实遥测已冻结" else "真实遥测 · 交互后自动进入模拟模式",
                                fontSize = DesignTokens.Font2xs,
                                fontFamily = FontFamily.Monospace,
                                color = if (labActive) DesignTokens.BrandPrimaryLight else DesignTokens.TextTertiary
                            )
                        }
                        // 提示音开关
                        OutlinedButton(
                            onClick = { viewModel.toggleLabSound() },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = if (soundEnabled) DesignTokens.BrandPrimaryLight else DesignTokens.TextTertiary
                            ),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (soundEnabled) "提示音 开" else "提示音 关",
                                fontSize = DesignTokens.Font2xs,
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
                            containerColor = DesignTokens.DangerContainer,
                            disabledContainerColor = DesignTokens.Border,
                            disabledContentColor = DesignTokens.TextDisabled
                        )
                    ) {
                        Text(
                            text = "恢复真实硬件遥测",
                            fontSize = DesignTokens.FontXs,
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
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Bold,
                color = DesignTokens.TextSecondary,
                fontFamily = FontFamily.Monospace
            )
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.FULL_CHARGE,
                    color = DesignTokens.BrandPrimary,
                    onClick = { viewModel.applyLabScenario(LabScenario.FULL_CHARGE) }
                )
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.FLASH_CHARGE,
                    color = DesignTokens.InfoSky,
                    onClick = { viewModel.applyLabScenario(LabScenario.FLASH_CHARGE) }
                )
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.GAMING_DISCHARGE,
                    color = DesignTokens.FeaturePurple,
                    onClick = { viewModel.applyLabScenario(LabScenario.GAMING_DISCHARGE) }
                )
                LabScenarioButton(
                    modifier = Modifier.weight(1f),
                    scenario = LabScenario.OVERHEAT_ALERT,
                    color = DesignTokens.DangerRose,
                    onClick = { viewModel.applyLabScenario(LabScenario.OVERHEAT_ALERT) }
                )
            }
        }

        // ===== 交互滑杆区 =====
        item {
            Text(
                text = "逐项参数调节 (6 组滑杆)",
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Bold,
                color = DesignTokens.TextSecondary,
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
                    accent = DesignTokens.BrandPrimary,
                    onValueChange = { viewModel.updateLabPercentage(it.toInt()) }
                )
                LabSlider(
                    label = "11. 瞬时电流",
                    valueText = "${if (currentMa > 0) "+$currentMa" else currentMa} mA",
                    value = currentMa.toFloat(),
                    valueRange = -2000f..6000f,
                    accent = DesignTokens.BrandPrimaryLight,
                    onValueChange = { viewModel.updateLabCurrent(it.toInt()) }
                )
                LabSlider(
                    label = "09. 电芯电压",
                    valueText = "$voltageMv mV",
                    value = voltageMv.toFloat(),
                    valueRange = 3500f..4600f,
                    accent = DesignTokens.InfoSky,
                    onValueChange = { viewModel.updateLabVoltage(it.toInt()) }
                )
                LabSlider(
                    label = "07. 传感器温度",
                    valueText = "$temperature °C",
                    value = temperature,
                    valueRange = 0f..55f,
                    accent = DesignTokens.WarningAmber,
                    onValueChange = { viewModel.updateLabTemperature(it) }
                )
                LabSlider(
                    label = "10. 循环计数",
                    valueText = "$cycleCount 次",
                    value = cycleCount.toFloat(),
                    valueRange = 0f..1200f,
                    accent = DesignTokens.AccentTeal,
                    onValueChange = { viewModel.updateLabCycleCount(it.toInt()) }
                )
                LabSlider(
                    label = "04. 出厂设计容量 (真实生效)",
                    valueText = "${state.designCapacityMah} mAh",
                    value = state.designCapacityMah.toFloat(),
                    valueRange = 1000f..15000f,
                    accent = DesignTokens.FeaturePurple,
                    onValueChange = { viewModel.updateLabDesignCapacity(it.toInt()) }
                )
            }
        }

        // ===== 电池状态枚举 =====
        item {
            LabCard {
                Text(
                    text = "06. 电池状态强制切换",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("充电中", status == BatteryStatus.CHARGING, DesignTokens.BrandPrimary) {
                        viewModel.updateLabStatus(BatteryStatus.CHARGING)
                    }
                    StatusChip("放电中", status == BatteryStatus.DISCHARGING, DesignTokens.InfoSky) {
                        viewModel.updateLabStatus(BatteryStatus.DISCHARGING)
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("已充满", status == BatteryStatus.FULL, DesignTokens.FullTeal) {
                        viewModel.updateLabStatus(BatteryStatus.FULL)
                    }
                    StatusChip("未充电", status == BatteryStatus.NOT_CHARGING, DesignTokens.TextTertiary) {
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
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("良好", health == BatteryHealthQuality.GOOD, DesignTokens.BrandPrimary) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.GOOD)
                    }
                    StatusChip("过热", health == BatteryHealthQuality.OVERHEAT, DesignTokens.WarningAmber) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVERHEAT)
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusChip("损坏", health == BatteryHealthQuality.DEAD, DesignTokens.DangerRose) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.DEAD)
                    }
                    StatusChip("超压", health == BatteryHealthQuality.OVER_VOLTAGE, DesignTokens.FeaturePurple) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVER_VOLTAGE)
                    }
                    StatusChip("未知", health == BatteryHealthQuality.UNKNOWN, DesignTokens.TextTertiary) {
                        viewModel.updateLabHealthQuality(BatteryHealthQuality.UNKNOWN)
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/** 一键场景按钮：按压缩放微交互 + 主题色描边 */
@Composable
private fun LabScenarioButton(
    modifier: Modifier = Modifier,
    scenario: LabScenario,
    color: Color,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    // 微交互：按压回弹缩放（与 Web active:scale-95 对齐）
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = tween(durationMillis = DesignTokens.DurationFast),
        label = "scenario-press"
    )
    // 描边颜色随主题色渐入
    val borderColor by animateColorAsState(
        targetValue = if (pressed) color else DesignTokens.BorderStrong,
        animationSpec = tween(durationMillis = DesignTokens.DurationFast),
        label = "scenario-border"
    )
    Button(
        onClick = onClick,
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .border(1.dp, borderColor, RoundedCornerShape(DesignTokens.RadiusCard)),
        shape = RoundedCornerShape(DesignTokens.RadiusCard),
        colors = ButtonDefaults.buttonColors(containerColor = DesignTokens.BgElevated),
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 12.dp)
    ) {
        Column(horizontalAlignment = Alignment.Start) {
            Text(
                text = scenario.label,
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Bold,
                color = color,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = scenario.desc,
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

/** 实验室区块容器：玻璃拟态（半透明渐变底 + 顶部切面高光线） */
@Composable
private fun LabCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .drawBehind {
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            DesignTokens.BgGlass,
                            DesignTokens.BgSurface.copy(alpha = 0.96f)
                        )
                    )
                )
            }
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard)),
        shape = RoundedCornerShape(DesignTokens.RadiusCard),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
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
            Text(text = label, fontSize = DesignTokens.Font2xs, color = DesignTokens.TextSecondary)
            Text(
                text = valueText,
                fontSize = DesignTokens.Font2xs,
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
                inactiveTrackColor = DesignTokens.Border
            )
        )
    }
}

/** 枚举选择胶囊：选中态颜色平滑过渡（微交互 250ms） */
@Composable
private fun StatusChip(label: String, selected: Boolean, accent: Color, onClick: () -> Unit) {
    // 选中/未选中：边框、容器、文字色统一缓动过渡，消除状态切换的生硬感
    val borderColor by animateColorAsState(
        targetValue = if (selected) accent else DesignTokens.BorderStrong,
        animationSpec = tween(durationMillis = DesignTokens.DurationSmooth),
        label = "chip-border"
    )
    val containerColor by animateColorAsState(
        targetValue = if (selected) DesignTokens.BgElevated else Color.Transparent,
        animationSpec = tween(durationMillis = DesignTokens.DurationSmooth),
        label = "chip-container"
    )
    val textColor by animateColorAsState(
        targetValue = if (selected) accent else DesignTokens.TextTertiary,
        animationSpec = tween(durationMillis = DesignTokens.DurationSmooth),
        label = "chip-text"
    )
    Surface(
        shape = RoundedCornerShape(DesignTokens.RadiusPill),
        color = containerColor,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        onClick = onClick
    ) {
        Text(
            text = label,
            fontSize = DesignTokens.Font2xs,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            color = textColor,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
