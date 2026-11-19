package com.battery.master.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.R
import com.battery.master.data.BatteryState
import com.battery.master.service.VoltageStressWearModel
import com.battery.master.service.WearSnapshot
import com.battery.master.ui.theme.DesignTokens
import com.battery.master.ui.theme.MintIcons
import com.battery.master.ui.theme.entranceReveal
import com.battery.master.ui.theme.glassSurface
import com.battery.master.viewmodel.BatteryViewModel
import kotlin.math.abs

/**
 * 「薄荷能量」充电管理页 (Tab 2)
 *
 * 信息架构 (对齐 UI_REDESIGN_SPEC v2)：
 * 1. 实时功率卡：带符号大数字 (充电 +W / 放电 −W) + 电流/电压读数 + 充满进度条；
 * 2. 近期功率走势：VM 单源遥测历史迷你曲线 (真实采样，非虚构)；
 * 3. 充满判定卡 (指标 12 三态)；
 * 4. 充电建议 (按功率分级话术)。
 */
@Composable
fun ChargingScreen(
    state: BatteryState,
    viewModel: BatteryViewModel
) {
    val telemetryHistory by viewModel.telemetryHistory.collectAsState()
    // 链路审计修复 (v2.2.0)：满充卡倒计时从 VM 单源收集——旧实现硬编码 0L，
    // 一键模拟完全充满后 15s 保持期倒计时不显示、按钮不进入禁用态 (可重复触发)
    val simulationRemainingSec by viewModel.simulationRemainingSec.collectAsState()
    // v2.2.1 电压应力磨损模型 (Choi 2002)：积分快照 UI 单源
    val wearSnapshot by viewModel.wearSnapshot.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { PowerHeroCard(state = state) }
        item { PowerTrendCard(history = telemetryHistory) }
        item {
            FullChargeConditionCard(
                state = state,
                simulationRemainingSec = simulationRemainingSec,
                onTriggerTest = viewModel::triggerFullChargeSimulation,
                onClearRecords = viewModel::clearFullChargeRecords
            )
        }
        item { VoltageStressCard(state = state, wear = wearSnapshot) }
        item { ChargingTipsCard(state = state) }
        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/** 实时功率卡：带符号大数字 + 读数芯片 + 充满进度 */
@Composable
private fun PowerHeroCard(state: BatteryState) {
    val charging = state.status.label == "充电中"
    val readable = state.currentMa != null
    val powerText = if (readable && state.voltageMeasured) {
        formatPowerWatts(state.powerWatts)
    } else {
        "— W"
    }
    val accent = when {
        !readable || !state.voltageMeasured -> DesignTokens.TextTertiary
        charging -> DesignTokens.BrandPrimary
        else -> DesignTokens.InfoSky
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .entranceReveal(1)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = MintIcons.Bolt,
                contentDescription = null,
                tint = DesignTokens.BrandPrimary,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = stringResource(R.string.charging_power_title),
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (charging) {
                stringResource(R.string.charging_power_charging)
            } else {
                stringResource(R.string.charging_power_discharging)
            },
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextSecondary
        )
        Spacer(modifier = Modifier.height(6.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                text = powerText,
                fontSize = DesignTokens.Font2xl,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = accent,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        // 读数芯片：电流 / 电压 (不可读诚实显示 —)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PowerChip(
                label = "电流",
                value = state.currentMa?.let { formatCurrentMa(it) } ?: "— mA",
                accent = if ((state.currentMa ?: 0) >= 0) DesignTokens.BrandPrimary else DesignTokens.InfoSky
            )
            PowerChip(
                label = "电压",
                value = if (state.voltageMeasured) {
                    String.format(java.util.Locale.US, "%.2f", state.voltageMv / 1000f) + " V"
                } else {
                    "— V"
                },
                accent = DesignTokens.AccentCyan
            )
            PowerChip(
                label = "状态",
                value = state.status.label,
                accent = DesignTokens.statusColor(state.status.label)
            )
        }
        Spacer(modifier = Modifier.height(14.dp))
        // 充满进度条
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = stringResource(R.string.charging_progress_title),
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextSecondary
            )
            Text(
                text = if (state.percentage >= 100) {
                    stringResource(R.string.charging_progress_full)
                } else {
                    stringResource(R.string.charging_progress_to_full, remainingPercentToFull(state))
                },
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                color = DesignTokens.TextPrimary
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(10.dp)
                .background(DesignTokens.BgInset, RoundedCornerShape(DesignTokens.RadiusPill))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(state.percentage / 100f)
                    .fillMaxHeight()
                    .background(
                        brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                            listOf(DesignTokens.BrandPrimary, DesignTokens.BrandPrimaryLight)
                        ),
                        shape = RoundedCornerShape(DesignTokens.RadiusPill)
                    )
            )
        }
    }
}

@Composable
private fun PowerChip(label: String, value: String, accent: Color) {
    Surface(
        shape = RoundedCornerShape(DesignTokens.RadiusChip),
        color = DesignTokens.BgSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = value,
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                color = accent
            )
        }
    }
}

/** 近期功率走势：VM 遥测历史迷你曲线 (0 轴 + 充电/放电双色) */
@Composable
private fun PowerTrendCard(history: List<BatteryState>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .padding(14.dp)
    ) {
        Text(
            text = stringResource(R.string.charging_history_title, history.size),
            fontSize = DesignTokens.Font2xs,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp,
            color = DesignTokens.TextPrimary
        )
        Spacer(modifier = Modifier.height(10.dp))
        if (history.isEmpty()) {
            Text(
                text = stringResource(R.string.charging_history_empty),
                fontSize = DesignTokens.Font2xs,
                lineHeight = DesignTokens.Line2xs,
                color = DesignTokens.TextTertiary
            )
        } else {
            PowerSparkline(
                points = history.map { it.powerWatts },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(72.dp)
            )
        }
    }
}

/** 功率迷你曲线：零轴上下分色 (充电=品牌绿 / 放电=天蓝) */
@Composable
private fun PowerSparkline(points: List<Float>, modifier: Modifier = Modifier) {
    val chargeColor = DesignTokens.BrandPrimary
    val dischargeColor = DesignTokens.InfoSky
    val zeroLineColor = DesignTokens.BorderStrong
    Canvas(modifier = modifier) {
        if (points.isEmpty()) return@Canvas
        val maxAbs = points.maxOf { abs(it) }.coerceAtLeast(0.1f)
        val midY = size.height / 2f
        val stepX = size.width / (points.size - 1).coerceAtLeast(1)
        // 零轴
        drawLine(
            color = zeroLineColor,
            start = Offset(0f, midY),
            end = Offset(size.width, midY),
            strokeWidth = 1f
        )
        val path = Path()
        points.forEachIndexed { index, value ->
            val x = index * stepX
            val y = midY - (value / maxAbs) * (midY - 4f)
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(path = path, color = chargeColor, style = Stroke(width = 2f))
        // 末端点
        val last = points.last()
        val lastY = midY - (last / maxAbs) * (midY - 4f)
        drawCircle(
            color = if (last >= 0) chargeColor else dischargeColor,
            radius = 4f,
            center = Offset((points.size - 1) * stepX, lastY)
        )
    }
}

/** 充电建议：按功率/状态分级话术 (无恐吓式营销) */
@Composable
private fun ChargingTipsCard(state: BatteryState) {
    val tip = when {
        state.status.label != "充电中" -> stringResource(R.string.charging_tip_discharge)
        abs(state.powerWatts) >= 15f -> stringResource(R.string.charging_tip_fast)
        state.powerWatts in 0.5f..15f -> stringResource(R.string.charging_tip_normal)
        else -> stringResource(R.string.charging_tip_slow)
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = MintIcons.Info,
                contentDescription = null,
                tint = DesignTokens.InfoSky,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = stringResource(R.string.charging_tips_title),
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = tip,
            fontSize = DesignTokens.Font2xs,
            lineHeight = DesignTokens.Line2xs,
            color = DesignTokens.TextSecondary
        )
    }
}

/**
 * 电压应力磨损模型卡 (v2.2.1，Choi 2002 + Asakura 2003 方法学全量实施)：
 * 当前电压相对磨损速率 + 充电时间积分的累计磨损 + 高压暴露统计。
 * 全部输出为 [模型预测]，非实测值——每项均带来源标注；
 * 电压不可测 / 无积分数据时诚实降级，不虚构数值
 */
@Composable
private fun VoltageStressCard(state: BatteryState, wear: WearSnapshot) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .entranceReveal(4)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = MintIcons.Flask,
                contentDescription = null,
                tint = DesignTokens.AccentCyan,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = stringResource(R.string.wear_model_title),
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        // 当前电压相对磨损速率 (4.2V=×1.00 基准)：电压不可测显示 "—"
        val currentRate = wear.lastRate
        WearMetricRow(
            label = stringResource(R.string.wear_model_rate_label),
            value = if (state.voltageMeasured && currentRate != null) {
                VoltageStressWearModel.rateLabel(currentRate)
            } else {
                stringResource(R.string.wear_model_voltage_unreadable)
            }
        )
        // 累计等效磨损循环：无积分数据诚实标注
        WearMetricRow(
            label = stringResource(R.string.wear_model_accumulated),
            value = if (wear.sampleCount > 0) {
                String.format(java.util.Locale.US, "%.2f", wear.accumulatedWearCycles)
            } else {
                stringResource(R.string.wear_model_no_data)
            }
        )
        // 高压暴露 (>3.92V 拐点以上累计时长)
        WearMetricRow(
            label = stringResource(R.string.wear_model_high_stress),
            value = if (wear.sampleCount > 0) {
                val minutes = wear.highStressMs / 60_000.0
                if (minutes >= 1.0) {
                    String.format(java.util.Locale.US, "%.1f min", minutes)
                } else {
                    String.format(java.util.Locale.US, "%d s", wear.highStressMs / 1000)
                }
            } else {
                stringResource(R.string.wear_model_no_data)
            }
        )
        // 积分样本间隔数 (透明度：用户可知模型吃了多少数据)
        WearMetricRow(
            label = stringResource(R.string.wear_model_samples),
            value = wear.sampleCount.toString()
        )
        Spacer(modifier = Modifier.height(10.dp))
        // 方法学说明 (全部可溯源，UI 明示模型口径)
        val notes = listOf(
            stringResource(R.string.wear_model_note1),
            stringResource(R.string.wear_model_note2),
            stringResource(R.string.wear_model_note3),
            stringResource(R.string.wear_model_note4)
        )
        notes.forEachIndexed { index, note ->
            Text(
                text = note,
                fontSize = DesignTokens.Font2xs,
                lineHeight = DesignTokens.Line2xs,
                color = DesignTokens.TextTertiary,
                modifier = Modifier.padding(bottom = 3.dp)
            )
            if (index == 0) {
                Spacer(modifier = Modifier.height(2.dp))
            }
        }
    }
}

@Composable
private fun WearMetricRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextSecondary
        )
        Text(
            text = value,
            fontSize = DesignTokens.Font2xs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = DesignTokens.TextPrimary
        )
    }
}
