package com.smalljelly.batterydata.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smalljelly.batterydata.data.BatterySample
import com.haooz.nexioui.card.Card
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.theme.NexioTheme
import java.util.Locale
import kotlin.math.abs

/**
 * 实时电压 / 电流 / 功率 / 温度。
 */
@Composable
fun RealtimeStatsCard(
    sample: BatterySample,
    modifier: Modifier = Modifier,
) {
    val colors = NexioTheme.colorScheme
    val current = sample.currentMa

    Card(
        modifier = modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            NexioText(
                text = "实时数据",
                style = NexioTheme.textStyles.title3,
                color = colors.onSurfaceContainer,
            )
            LiveBadge(text = "每秒刷新")
        }

        Spacer(Modifier.height(16.dp))

        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            StatCell(
                label = "电压",
                // 3 位小数：mV 级变化每秒可见，2 位会掩盖 10mV 内的波动
                value = String.format(Locale.US, "%.3f", sample.voltageMv / 1000f),
                unit = "V",
                caption = if (sample.voltageEstimated) "估算值" else null,
            )
            StatCell(
                label = "电流",
                value = current?.let { String.format(Locale.US, "%.3f", abs(it) / 1000f) } ?: "—",
                unit = "A",
                caption = current?.let {
                    (if (it > 0) "充电" else "放电") + if (sample.currentEstimated) " · 估算" else ""
                },
            )
        }

        Spacer(Modifier.height(18.dp))

        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            StatCell(
                label = "功率",
                value = sample.powerW?.let { String.format(Locale.US, "%.3f", abs(it)) } ?: "—",
                unit = "W",
            )
            StatCell(
                label = "温度",
                value = sample.temperatureC?.let { String.format(Locale.US, "%.1f", it) } ?: "—",
                unit = "°C",
            )
        }
    }
}

@Composable
private fun RowScope.StatCell(
    label: String,
    value: String,
    unit: String,
    valueColor: androidx.compose.ui.graphics.Color = NexioTheme.colorScheme.onSurfaceContainer,
    caption: String? = null,
) {
    val secondary = NexioTheme.colorScheme.onSurfaceVariantSummary
    Column(modifier = Modifier.weight(1f)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            NexioText(text = label, fontSize = 13.sp, color = secondary)
            if (caption != null) {
                NexioText(
                    text = "($caption)",
                    fontSize = 11.sp,
                    color = secondary.copy(alpha = 0.7f),
                )
            }
        }
        Spacer(Modifier.height(5.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            NexioText(
                text = value,
                fontSize = 25.sp,
                lineHeight = 27.sp,
                fontWeight = FontWeight.Medium,
                color = valueColor,
            )
            NexioText(
                text = unit,
                fontSize = 12.sp,
                color = secondary,
                modifier = Modifier.padding(start = 3.dp, bottom = 3.dp),
            )
        }
    }
}
