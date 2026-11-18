package com.battery.master.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.R
import com.battery.master.data.BatteryState
import com.battery.master.data.CapacitySource
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.ui.theme.DesignTokens
import com.battery.master.ui.theme.MintIcons
import com.battery.master.ui.theme.entranceReveal
import com.battery.master.ui.theme.glassSurface
import com.battery.master.viewmodel.BatteryViewModel
import java.util.Locale

/**
 * 「薄荷能量」总览页 (Tab 0)
 *
 * 信息架构 (对齐 UI_REDESIGN_SPEC v2)：
 * 1. 实验室模拟警示横幅 (模拟态常驻，诚实口径)；
 * 2. Hero 电池卡 (薄荷圆环 + 状态标签 + 剩余电量 + 功率读数条)；
 * 3. 健康结论卡 (质量分级 + 容量对比；百分比不在此重复，避免与指标 01 双读数)；
 * 4. 12 项充放电核心指标分组列表 (MetricRow)；
 * 5. 充满判定卡 (指标 12)；
 * 6. 硬件信息汇总栏 (SoC/PMIC/电芯档案 + 容量校准入口)；
 * 7. 隐私信任行 (零权限声明)。
 */
@Composable
fun OverviewScreen(
    state: BatteryState,
    viewModel: BatteryViewModel,
    simulationRemainingSec: Long,
    onCalibrateDesignCapacity: () -> Unit
) {
    // v1.2.3 P1 审计修复：实验室模拟态跨 Tab 常驻提示 (明示模拟值，非真实状态)
    val labOverride by viewModel.labOverride.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (labOverride != null) {
            item {
                LabSimulationBanner(onExit = viewModel::exitLabMode)
            }
        }

        // Hero：核心读数 (文本格式受审计测试锁定，勿改口径)
        item { CyberHeroBatteryCard(state = state) }

        // 健康结论：分级结论先行，数值详情见指标 01
        item { HealthConclusionCard(state = state) }

        // 12 项指标分组
        item {
            Text(
                text = stringResource(R.string.metrics_section_title),
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary,
                modifier = Modifier.padding(top = 6.dp)
            )
        }
        item { MetricGroupCard(title = "电量与容量", metrics = buildChargeMetrics(state)) }
        item { MetricGroupCard(title = "状态与环境", metrics = buildStatusMetrics(state)) }

        // 指标 12 充满判定
        item {
            FullChargeConditionCard(
                state = state,
                simulationRemainingSec = simulationRemainingSec,
                onTriggerTest = viewModel::triggerFullChargeSimulation,
                onClearRecords = viewModel::clearFullChargeRecords
            )
        }

        // 硬件档案 + 校准入口
        item {
            HardwareSummaryCard(state = state, onCalibrateDesignCapacity = onCalibrateDesignCapacity)
        }

        // 隐私信任行
        item { PrivacyTrustRow() }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/** 指标行数据 (纯展示模型) */
private data class MetricRowData(
    val number: String,
    val title: String,
    val value: String,
    val unit: String,
    val sub: String,
    val accent: Color
)

/** 指标分组卡：组标题 + 行列表 (纵向扫读符合移动端阅读动线) */
@Composable
private fun MetricGroupCard(title: String, metrics: List<MetricRowData>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .padding(14.dp)
    ) {
        Text(
            text = title,
            fontSize = DesignTokens.Font2xs,
            fontWeight = FontWeight.Black,
            letterSpacing = 2.sp,
            color = DesignTokens.TextTertiary
        )
        Spacer(modifier = Modifier.height(4.dp))
        metrics.forEach { metric -> MintMetricRow(metric) }
    }
}

/** 薄荷指标行：序号 + 标题 + 大数值 + 单位 + 来源副文案 */
@Composable
private fun MintMetricRow(metric: MetricRowData) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = metric.number,
            fontSize = DesignTokens.Font2xs,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            color = DesignTokens.TextDisabled,
            modifier = Modifier.width(22.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = metric.title,
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextSecondary
            )
            if (metric.sub.isNotEmpty()) {
                Text(
                    text = metric.sub,
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                text = metric.value,
                fontSize = DesignTokens.FontXl,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextPrimary
            )
            if (metric.unit.isNotEmpty()) {
                Spacer(modifier = Modifier.width(3.dp))
                Text(
                    text = metric.unit,
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = metric.accent,
                    modifier = Modifier.padding(bottom = 3.dp)
                )
            }
        }
    }
}

/** 健康结论卡：先给结论再看数值 (百分比不重复展示，避免与指标 01 双读数) */
@Composable
private fun HealthConclusionCard(state: BatteryState) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .entranceReveal(2)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.overview_conclusion_title),
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary
            )
            Surface(
                shape = RoundedCornerShape(DesignTokens.RadiusPill),
                color = DesignTokens.BrandChip
            ) {
                Text(
                    text = state.healthQuality.label,
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.healthQualityColor(state.healthQuality.label),
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (state.hasMeasuredCapacity) {
                stringResource(
                    R.string.overview_conclusion_measured,
                    state.currentCapacityMah,
                    state.designCapacityMah
                )
            } else {
                stringResource(R.string.overview_conclusion_unmeasured)
            },
            fontSize = DesignTokens.FontXs,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            color = if (state.hasMeasuredCapacity) DesignTokens.TextPrimary else DesignTokens.TextTertiary
        )
        state.healthForecastText?.let { forecast ->
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = forecast,
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextGood
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = stringResource(R.string.overview_conclusion_forecast_hint),
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextTertiary
        )
    }
}

/** 隐私信任行：零权限 + 数据本地化 (安装即可见的信任状) */
@Composable
private fun PrivacyTrustRow() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BrandSurface, RoundedCornerShape(DesignTokens.RadiusChip))
            .padding(horizontal = 12.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = MintIcons.Shield,
            contentDescription = null,
            tint = DesignTokens.BrandPrimary,
            modifier = Modifier.size(14.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = stringResource(R.string.overview_privacy_trust),
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextSecondary
        )
    }
}

// ============================================================
// 12 项指标组装 (口径与 BatteryState 字段注释、审计测试断言严格一致)
// ============================================================

@Composable
private fun buildChargeMetrics(state: BatteryState): List<MetricRowData> {
    val healthSub = if (state.hasMeasuredCapacity) {
        stringResource(R.string.metric_sub_health_measured, state.currentCapacitySource.label)
    } else {
        stringResource(R.string.metric_sub_health_unmeasurable, state.currentCapacitySource.label)
    }
    val remainingSub = when {
        state.hasMeasuredCapacity ->
            stringResource(R.string.metric_sub_remaining_measured, state.remainingCapacitySource.label)
        state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER ->
            stringResource(R.string.metric_sub_remaining_coulomb)
        else -> stringResource(R.string.metric_sub_remaining_unmeasurable)
    }
    val currentCapacitySub = if (state.hasMeasuredCapacity) {
        stringResource(R.string.metric_sub_current_capacity, state.currentCapacitySource.label)
    } else {
        stringResource(R.string.metric_sub_current_capacity_unmeasured)
    }
    val currentSub = when {
        state.currentMa == null -> stringResource(R.string.power_sub_unreadable)
        !state.voltageMeasured -> stringResource(R.string.metric_sub_power_underivable)
        else -> stringResource(
            R.string.metric_power_prefix,
            formatPowerWatts(state.powerWatts)
        )
    }
    return listOf(
        MetricRowData(
            number = "01",
            title = stringResource(R.string.metric_title_health),
            // 审计约束：指标 01 值为单一 Text ("92.3%")，百分号并入值文本
            value = if (state.hasMeasuredCapacity) {
                String.format(Locale.US, "%.1f%%", state.healthPercentage)
            } else "—",
            unit = "",
            sub = healthSub,
            accent = if (state.hasMeasuredCapacity) DesignTokens.BrandPrimary else DesignTokens.TextTertiary
        ),
        MetricRowData(
            number = "02",
            title = stringResource(R.string.metric_title_remaining),
            value = if (state.hasMeasuredCapacity ||
                state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER
            ) "${state.remainingCapacityMah}" else "—",
            unit = if (state.hasMeasuredCapacity ||
                state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER
            ) "mAh" else "",
            sub = remainingSub,
            accent = DesignTokens.InfoSky
        ),
        MetricRowData(
            number = "03",
            title = stringResource(R.string.metric_title_current_capacity),
            value = if (state.hasMeasuredCapacity) "${state.currentCapacityMah}" else "—",
            unit = if (state.hasMeasuredCapacity) "mAh" else "",
            sub = currentCapacitySub,
            accent = DesignTokens.AccentTeal
        ),
        MetricRowData(
            number = "04",
            title = stringResource(R.string.metric_title_design_capacity),
            value = "${state.designCapacityMah}",
            unit = "mAh",
            sub = stringResource(R.string.metric_sub_design_capacity, state.designCapacitySource.label),
            accent = DesignTokens.FeaturePurple
        ),
        MetricRowData(
            number = "05",
            title = stringResource(R.string.metric_title_percentage),
            value = "${state.percentage}",
            unit = "%",
            sub = stringResource(R.string.metric_sub_percentage),
            accent = DesignTokens.BrandPrimary
        ),
        MetricRowData(
            number = "11",
            title = stringResource(R.string.metric_title_current),
            value = state.currentMa?.let { "${if (it > 0) "+$it" else "$it"}" } ?: "—",
            unit = if (state.currentMa != null) "mA" else "",
            sub = currentSub,
            accent = if ((state.currentMa ?: 0) > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyan
        )
    )
}

@Composable
private fun buildStatusMetrics(state: BatteryState): List<MetricRowData> {
    val temp = state.temperatureCelsius
    val tempSub = when {
        temp >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
            stringResource(R.string.temp_state_overheat, BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt())
        temp >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
            stringResource(
                R.string.temp_state_warm,
                BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt(),
                BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()
            )
        temp <= 0 -> stringResource(R.string.temp_state_cold)
        else -> stringResource(R.string.temp_state_normal)
    }
    val voltageLabel = BatteryTelemetryParser.voltageStateLabel(state.voltageMv, state.voltageMeasured)
    val voltageSub = if (state.voltageMeasured) {
        stringResource(
            R.string.voltage_sub_measured,
            String.format(Locale.US, "%.2f", state.voltageMv / 1000f),
            voltageLabel
        )
    } else {
        stringResource(R.string.voltage_sub_unmeasured)
    }
    return listOf(
        MetricRowData(
            number = "06",
            title = stringResource(R.string.metric_title_status),
            value = state.status.label,
            unit = "",
            sub = stringResource(R.string.status_channel_broadcast),
            accent = DesignTokens.statusColor(state.status.label)
        ),
        MetricRowData(
            number = "07",
            title = stringResource(R.string.metric_title_temperature),
            value = String.format(Locale.US, "%.1f", temp),
            unit = "°C",
            sub = tempSub,
            accent = DesignTokens.temperatureColor(temp)
        ),
        MetricRowData(
            number = "08",
            title = stringResource(R.string.metric_title_health_condition),
            value = state.healthQuality.label,
            unit = "",
            sub = stringResource(R.string.metric_sub_health_condition),
            accent = DesignTokens.healthQualityColor(state.healthQuality.label)
        ),
        MetricRowData(
            number = "09",
            title = stringResource(R.string.metric_title_voltage),
            value = if (state.voltageMeasured) "${state.voltageMv}" else "—",
            unit = if (state.voltageMeasured) "mV" else "",
            sub = voltageSub,
            accent = DesignTokens.InfoSky
        ),
        MetricRowData(
            number = "10",
            title = stringResource(R.string.metric_title_cycles),
            value = if (state.cycleCount > 0) "${state.cycleCount}" else "—",
            unit = if (state.cycleCount > 0) stringResource(R.string.unit_times) else "",
            sub = if (state.cycleCount > 0) "Cycle Count" else stringResource(R.string.cycles_sub_no_data),
            accent = DesignTokens.FeaturePurple
        ),
        MetricRowData(
            number = "12",
            title = stringResource(R.string.metric_title_full_charge_capacity),
            value = state.fullChargeCapacityMah?.let { "$it" } ?: "—",
            unit = if (state.fullChargeCapacityMah != null) "mAh" else "",
            sub = if (state.isFullChargeConditionMet) {
                stringResource(R.string.full_charge_sub_met)
            } else {
                stringResource(R.string.full_charge_sub_unmet)
            },
            accent = DesignTokens.FullTeal
        )
    )
}

// ---- 共享格式化辅助 (Hero / 充电页复用；纯函数，无 Compose 依赖) ----

/** 功率符号格式化：充电 +W / 放电 −W (v1.2.4 P2 口径) */
internal fun formatPowerWatts(powerW: Float): String =
    "${if (powerW > 0) "+" else ""}${String.format(Locale.US, "%.2f", powerW)} W"

/** 电流符号格式化 (供充电页复用) */
internal fun formatCurrentMa(currentMa: Int): String =
    "${if (currentMa > 0) "+$currentMa" else "$currentMa"} mA"

/** 距满差额百分比 (供充电页复用) */
internal fun remainingPercentToFull(state: BatteryState): Int =
    (100 - state.percentage).coerceIn(0, 100)
