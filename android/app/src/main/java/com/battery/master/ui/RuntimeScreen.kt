package com.battery.master.ui

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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.R
import com.battery.master.data.BatterySession
import com.battery.master.data.BatteryState
import com.battery.master.ui.derived.RuntimeDirection
import com.battery.master.ui.derived.RuntimeEstimate
import com.battery.master.ui.derived.RuntimeScore
import com.battery.master.ui.theme.DesignTokens
import com.battery.master.ui.theme.MintIcons
import com.battery.master.ui.theme.entranceReveal
import com.battery.master.ui.theme.glassSurface
import com.battery.master.viewmodel.BatteryViewModel
import kotlinx.coroutines.launch

/**
 * 「薄荷能量」续航分析页 (Tab 1)
 *
 * 信息架构 (对齐 UI_REDESIGN_SPEC v2)：
 * 1. 预计可用时长卡 (大数字结论 + 依据口径，瞬时电流线性外推)；
 * 2. 设备使用时长卡 (真实开机累计)；
 * 3. 高频硬件遥测分析 (电压/电流/温度三曲线 + 采集链路透视)；
 * 4. 充放电功率与温度评估 (含于遥测分析卡)；
 * 5. 会话历史 (含于遥测分析卡)。
 */
@Composable
fun RuntimeScreen(
    state: BatteryState,
    viewModel: BatteryViewModel
) {
    val telemetryHistory by viewModel.telemetryHistory.collectAsState()
    val sessions by viewModel.chargeSessions.collectAsState()
    val deviceUsage by viewModel.deviceUsage.collectAsState()

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { RuntimeEstimateCard(state = state) }
        item { DeviceUsageCard(usage = deviceUsage) }
        item {
            TelemetryAnalysisScreen(
                state = state,
                history = telemetryHistory,
                sessions = sessions,
                onExportSamples = {
                    scope.launch {
                        val intent = viewModel.exportSamplesCsv()
                        if (intent != null) {
                            context.startActivity(
                                android.content.Intent.createChooser(intent, null)
                            )
                        }
                    }
                },
                onExportSessions = {
                    scope.launch {
                        val intent = viewModel.exportSessionsCsv()
                        if (intent != null) {
                            context.startActivity(
                                android.content.Intent.createChooser(intent, null)
                            )
                        }
                    }
                },
                onClearHistory = viewModel::clearTelemetryHistory
            )
        }
        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/** 预计可用时长卡：大数字结论 + 依据口径 + 外推说明 */
@Composable
private fun RuntimeEstimateCard(state: BatteryState) {
    val estimate = RuntimeScore.estimate(state)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .entranceReveal(1)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = MintIcons.Timer,
                contentDescription = null,
                tint = DesignTokens.BrandPrimary,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = stringResource(R.string.runtime_estimate_title),
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        when (estimate.direction) {
            RuntimeDirection.UNREADABLE -> {
                Text(
                    text = stringResource(R.string.runtime_estimate_unreadable),
                    fontSize = DesignTokens.FontSm,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextTertiary
                )
            }
            RuntimeDirection.IDLE -> {
                Text(
                    text = stringResource(R.string.runtime_estimate_idle),
                    fontSize = DesignTokens.FontSm,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextTertiary
                )
            }
            RuntimeDirection.DISCHARGE -> {
                RuntimeHeadline(
                    prefix = stringResource(R.string.runtime_estimate_discharge),
                    formatted = estimate.formatted,
                    accent = DesignTokens.InfoSky
                )
                Spacer(modifier = Modifier.height(6.dp))
                RuntimeBasisLine(estimate)
            }
            RuntimeDirection.CHARGE -> {
                RuntimeHeadline(
                    prefix = stringResource(R.string.runtime_estimate_charge),
                    formatted = estimate.formatted,
                    accent = DesignTokens.BrandPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                RuntimeBasisLine(estimate)
            }
        }
        if (estimate.direction == RuntimeDirection.DISCHARGE ||
            estimate.direction == RuntimeDirection.CHARGE
        ) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.runtime_estimate_note),
                fontSize = DesignTokens.Font2xs,
                lineHeight = DesignTokens.Line2xs,
                color = DesignTokens.TextTertiary
            )
        }
    }
}

@Composable
private fun RuntimeHeadline(prefix: String, formatted: String, accent: Color) {
    Row(verticalAlignment = Alignment.Bottom) {
        Text(
            text = prefix,
            fontSize = DesignTokens.FontSm,
            fontWeight = FontWeight.Bold,
            color = DesignTokens.TextSecondary
        )
        Spacer(modifier = Modifier.width(8.dp))
        Surface(
            shape = RoundedCornerShape(DesignTokens.RadiusChip),
            color = DesignTokens.BrandChip
        ) {
            Text(
                text = formatted,
                fontSize = DesignTokens.Font2xl,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = accent,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
            )
        }
    }
}

/** 测算依据口径行 (库仑计实测 / 百分比估算，显式标注) */
@Composable
private fun RuntimeBasisLine(estimate: RuntimeEstimate) {
    val basis = when (estimate.basisLabel) {
        RuntimeScore.BASIS_COULOMB -> stringResource(R.string.runtime_basis_coulomb)
        else -> stringResource(R.string.runtime_basis_estimated)
    }
    Text(
        text = stringResource(R.string.runtime_estimate_basis, basis),
        fontSize = DesignTokens.Font2xs,
        fontFamily = FontFamily.Monospace,
        lineHeight = DesignTokens.Line2xs,
        color = DesignTokens.TextTertiary
    )
}
