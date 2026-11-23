package com.smalljelly.batterydata.ui.components

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.haooz.nexioui.card.Card
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.theme.NexioTheme

/**
 * 时长预估卡片，位于大电池与实时数据之间。
 * 现在只在充电时出现，显示剩余充电时长（放电时的可亮屏时长与大电池下的「预计可用」重复，已去掉）。
 * note 用来说明这个数字是按什么算的（充电功率），避免和系统「预计可用时长」混淆。
 */
@Composable
fun DurationCard(
    label: String,
    value: String?,
    modifier: Modifier = Modifier,
    note: String? = null,
) {
    val colors = NexioTheme.colorScheme
    Card(
        modifier = modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        NexioText(
            text = label,
            fontSize = 13.sp,
            color = colors.onSurfaceVariantSummary,
        )
        Spacer(Modifier.height(6.dp))
        NexioText(
            text = value ?: "—",
            fontSize = 22.sp,
            lineHeight = 24.sp,
            fontWeight = FontWeight.Medium,
            color = colors.onSurfaceContainer,
        )
        if (note != null) {
            Spacer(Modifier.height(6.dp))
            NexioText(
                text = note,
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
        }
    }
}
