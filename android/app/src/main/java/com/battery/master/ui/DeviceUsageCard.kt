package com.battery.master.ui

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.battery.master.R
import com.battery.master.data.DeviceUsageSnapshot
import com.battery.master.service.UsageDurationFormatter
import com.battery.master.ui.theme.DesignTokens

/**
 * 设备使用时长卡片 (真实数据，0 权限，v2.1.0 新增)：
 * 主行 = 跨重启累计使用时长 (应用存活期真实累计，天/小时大字)；
 * 副行 = 本次开机时长 + 系统开机次数 (BOOT_COUNT，ROM 不提供时显示"系统未提供")；
 * 重启角标 = 本次进程存活期内检测到重启且累计已保留；
 * 口径副文案明示"含息屏待机 / 应用未运行时间不计"，不虚构出厂首开时间。
 */
@Composable
fun DeviceUsageCard(usage: DeviceUsageSnapshot) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusPanel)),
        shape = RoundedCornerShape(DesignTokens.RadiusPanel),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = stringResource(R.string.usage_card_title),
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.FontXs,
                    color = Color.White
                )
                Text(
                    text = stringResource(R.string.usage_source_label),
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 主行：跨重启累计使用时长 (1Hz 刷新，1 分钟粒度进位)
            Text(
                text = UsageDurationFormatter.formatUsageDuration(usage.cumulativeMs),
                fontSize = DesignTokens.Font2xl,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.BrandPrimaryLight
            )
            Text(
                text = stringResource(R.string.usage_total_label),
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextTertiary
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = stringResource(R.string.usage_uptime_label),
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary
                    )
                    Text(
                        text = UsageDurationFormatter.formatUsageDuration(usage.uptimeMs),
                        fontSize = DesignTokens.FontXs,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = stringResource(R.string.usage_boot_count_label),
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary
                    )
                    Text(
                        text = UsageDurationFormatter.formatBootCount(usage.bootCount),
                        fontSize = DesignTokens.FontXs,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White
                    )
                }
            }

            if (usage.rebootDetected) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.usage_reboot_detected),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextAmberStrong
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.usage_caveat),
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextTertiary
            )
        }
    }
}
