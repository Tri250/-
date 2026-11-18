package com.battery.master.ui

import android.app.DownloadManager
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.battery.master.BuildConfig
import com.battery.master.R
import com.battery.master.data.AppUpdateInfo
import com.battery.master.data.AppUpdateState
import com.battery.master.ui.theme.DesignTokens
import com.battery.master.ui.theme.GlassTokens
import com.battery.master.ui.theme.entranceReveal
import com.battery.master.ui.theme.glassSurface
import com.battery.master.ui.theme.pressGlassScale

/**
 * 应用更新卡片 (应用内热更新，v2.1.0-beta.2 新增；v2.1.0-beta.3 增强)：
 * 直查 GitHub Releases 版本元数据 → 系统下载器下载 APK (卡内实时进度条) → 完成态安装引导。
 * 冷启动自动检查 (24h 节流) + 开关直连。玻璃切面质感 (GlassKit) + 按压反馈；
 * 网络请求全在 VM IO 线程，UI 只消费状态机。
 */
@Composable
fun AppUpdateCard(
    state: AppUpdateState,
    downloadProgress: Int? = null,
    autoCheckEnabled: Boolean = true,
    onCheckUpdate: () -> Unit,
    onDownload: (info: AppUpdateInfo) -> Unit,
    onToggleAutoCheck: (Boolean) -> Unit = {}
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .entranceReveal(7)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.update_card_title),
                fontWeight = FontWeight.Bold,
                fontSize = DesignTokens.FontXs,
                color = DesignTokens.TextPrimary
            )
            Text(
                text = stringResource(R.string.update_source_label),
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.BrandPrimaryLight
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = stringResource(R.string.update_current_label) +
                " v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
            fontSize = DesignTokens.Font2xs,
            fontFamily = FontFamily.Monospace,
            color = DesignTokens.TextSecondary
        )

        Spacer(modifier = Modifier.height(10.dp))

        when (state) {
            is AppUpdateState.Available -> {
                Text(
                    text = stringResource(R.string.update_new_version_found) +
                        " v${state.info.latestVersion}" +
                        if (state.info.isPrerelease) " · pre-release" else "",
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight
                )
                state.info.releaseNotes?.let { notes ->
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = notes,
                        fontSize = DesignTokens.Font2xs,
                        fontFamily = FontFamily.Monospace,
                        color = DesignTokens.TextTertiary,
                        maxLines = 6
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                GlassActionButton(
                    label = stringResource(R.string.update_download_button),
                    accent = DesignTokens.BrandPrimaryLight,
                    enabled = state.info.apkUrl != null
                ) {
                    onDownload(state.info)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = stringResource(R.string.update_unknown_source_hint),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextAmberStrong
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.update_unknown_source_button),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight,
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        try {
                            context.startActivity(
                                Intent(
                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse("package:${BuildConfig.APPLICATION_ID}")
                                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            )
                        } catch (e: Throwable) {
                            // 个别 ROM 不支持该 Settings 页面，静默忽略
                        }
                    }
                )
            }
            is AppUpdateState.Checking -> {
                Text(
                    text = stringResource(R.string.update_checking),
                    fontSize = DesignTokens.FontXs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextSecondary
                )
            }
            is AppUpdateState.UpToDate -> {
                Text(
                    text = stringResource(R.string.update_state_uptodate),
                    fontSize = DesignTokens.FontXs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight
                )
            }
            is AppUpdateState.DownloadQueued -> {
                Text(
                    text = stringResource(R.string.update_download_queued),
                    fontSize = DesignTokens.FontXs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight
                )
                if (downloadProgress != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { downloadProgress / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = DesignTokens.BrandPrimaryLight,
                        trackColor = GlassTokens.EdgeLight
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = stringResource(R.string.update_download_percent, downloadProgress),
                        fontSize = DesignTokens.Font2xs,
                        fontFamily = FontFamily.Monospace,
                        color = DesignTokens.TextSecondary
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.update_open_downloads),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight,
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        try {
                            context.startActivity(
                                Intent(DownloadManager.ACTION_VIEW_DOWNLOADS)
                                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            )
                        } catch (e: Throwable) {
                        }
                    }
                )
            }
            is AppUpdateState.DownloadCompleted -> {
                Text(
                    text = stringResource(R.string.update_download_completed),
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.update_install_guide),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextAmberStrong
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = stringResource(R.string.update_open_downloads),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight,
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        try {
                            context.startActivity(
                                Intent(DownloadManager.ACTION_VIEW_DOWNLOADS)
                                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            )
                        } catch (e: Throwable) {
                        }
                    }
                )
            }
            is AppUpdateState.Error -> {
                Text(
                    text = stringResource(R.string.update_state_error),
                    fontSize = DesignTokens.FontXs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextAmberStrong
                )
            }
            is AppUpdateState.Idle -> {
                Text(
                    text = stringResource(R.string.update_idle_hint),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        GlassActionButton(
            label = if (state is AppUpdateState.Checking) {
                stringResource(R.string.update_checking)
            } else {
                stringResource(R.string.update_check_button)
            },
            accent = DesignTokens.BrandPrimary,
            enabled = state !is AppUpdateState.Checking,
            onClick = onCheckUpdate
        )

        Spacer(modifier = Modifier.height(8.dp))

        // v2.1.0-beta.3：冷启动自动检查开关 (24h 节流，用户可关)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.update_auto_check_switch),
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextSecondary
            )
            Switch(
                checked = autoCheckEnabled,
                onCheckedChange = onToggleAutoCheck,
                colors = SwitchDefaults.colors(
                    checkedTrackColor = DesignTokens.BrandPrimaryLight,
                    uncheckedTrackColor = GlassTokens.EdgeLight
                )
            )
        }

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = stringResource(R.string.update_network_note),
            fontSize = DesignTokens.Font2xs,
            fontFamily = FontFamily.Monospace,
            color = DesignTokens.TextTertiary
        )
    }
}

/** 玻璃按压按钮：glassSurface 切面 + pressGlassScale 按压手感 (iOS 挤压反馈)。 */
@Composable
private fun GlassActionButton(
    label: String,
    accent: Color,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface(cornerRadius = DesignTokens.RadiusCard, borderColor = accent)
            .pressGlassScale(interactionSource)
            .clip(RoundedCornerShape(DesignTokens.RadiusCard))
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = enabled
            ) { onClick() }
            .padding(vertical = 12.dp, horizontal = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = DesignTokens.FontXs,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = if (enabled) accent else GlassTokens.EdgeLight
        )
    }
}
