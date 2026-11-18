package com.battery.master.ui

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.BuildConfig
import com.battery.master.CrashLogHandler
import com.battery.master.R
import com.battery.master.data.BatteryState
import com.battery.master.ui.theme.DesignTokens
import com.battery.master.ui.theme.LocalMintThemeMode
import com.battery.master.ui.theme.MintIcons
import com.battery.master.ui.theme.MintThemeMode
import com.battery.master.ui.theme.MintThemeStore
import com.battery.master.ui.theme.glassSurface
import com.battery.master.viewmodel.BatteryViewModel
import kotlinx.coroutines.launch

/**
 * 「薄荷能量」「我的」页 (顶栏入口，非 Tab)
 *
 * 收编内容 (对齐 UI_REDESIGN_SPEC v2 · 零商业化红线)：
 * 1. 个性化：主题模式 (跟随系统/薄荷浅色/夜航深色) + 实验室提示音；
 * 2. 数据与校准：设计容量校准 / 清除充满锁定记录 / 清空遥测历史；
 * 3. 应用更新 (GitHub Releases 应用内热更新)；
 * 4. 关于 APP (版本徽章 + 隐私声明 + 开源许可，无任何商业化入口)。
 */
@Composable
fun SettingsScreen(
    viewModel: BatteryViewModel,
    state: BatteryState,
    onBack: () -> Unit,
    onCalibrateDesignCapacity: () -> Unit
) {
    val context = LocalContext.current
    val holder = LocalMintThemeMode.current
    val labSoundEnabled by viewModel.labSoundEnabled.collectAsState()
    var showClearTelemetryConfirm by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // ============ 个性化 ============
        item {
            SettingsGroupTitle(stringResource(R.string.settings_group_personalize))
        }
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassSurface()
                    .padding(14.dp)
            ) {
                Text(
                    text = stringResource(R.string.settings_theme),
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ThemeOptionChip(
                        label = stringResource(R.string.settings_theme_system),
                        selected = holder.current == MintThemeMode.SYSTEM,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            holder.current = MintThemeMode.SYSTEM
                            MintThemeStore.save(context, MintThemeMode.SYSTEM)
                        }
                    )
                    ThemeOptionChip(
                        label = stringResource(R.string.settings_theme_light),
                        selected = holder.current == MintThemeMode.LIGHT,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            holder.current = MintThemeMode.LIGHT
                            MintThemeStore.save(context, MintThemeMode.LIGHT)
                        }
                    )
                    ThemeOptionChip(
                        label = stringResource(R.string.settings_theme_dark),
                        selected = holder.current == MintThemeMode.DARK,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            holder.current = MintThemeMode.DARK
                            MintThemeStore.save(context, MintThemeMode.DARK)
                        }
                    )
                }
                Spacer(modifier = Modifier.height(14.dp))
                SettingsSwitchRow(
                    icon = MintIcons.Bell,
                    title = stringResource(R.string.settings_lab_sound),
                    subtitle = stringResource(R.string.settings_lab_sound_desc),
                    checked = labSoundEnabled,
                    onCheckedChange = { viewModel.toggleLabSound() }
                )
            }
        }

        // ============ 数据与校准 ============
        item {
            SettingsGroupTitle(stringResource(R.string.settings_group_data))
        }
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .glassSurface()
                    .padding(vertical = 4.dp)
            ) {
                SettingsNavRow(
                    icon = MintIcons.Device,
                    title = stringResource(R.string.settings_design_capacity),
                    subtitle = stringResource(
                        R.string.settings_design_capacity_value,
                        state.designCapacityMah,
                        state.designCapacitySource.label
                    ),
                    onClick = onCalibrateDesignCapacity
                )
                SettingsNavRow(
                    icon = MintIcons.Trash,
                    title = stringResource(R.string.settings_clear_full_charge),
                    subtitle = stringResource(R.string.settings_clear_full_charge_desc),
                    onClick = { viewModel.clearFullChargeRecords() }
                )
                SettingsNavRow(
                    icon = MintIcons.Chart,
                    title = stringResource(R.string.settings_clear_telemetry),
                    subtitle = null,
                    onClick = { showClearTelemetryConfirm = true }
                )
            }
        }

        // ============ 应用更新 ============
        item {
            AppUpdateCard(
                state = viewModel.appUpdateState.collectAsState().value,
                downloadProgress = viewModel.downloadProgress.collectAsState().value,
                autoCheckEnabled = viewModel.autoUpdateCheckEnabled.collectAsState().value,
                onCheckUpdate = viewModel::checkForAppUpdate,
                onDownload = viewModel::downloadUpdateApk,
                onToggleAutoCheck = viewModel::setAutoUpdateCheckEnabled
            )
        }

        // ============ 关于 ============
        item {
            SettingsGroupTitle(stringResource(R.string.settings_group_about))
        }
        item {
            AboutAppCard()
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }

    if (showClearTelemetryConfirm) {
        AlertDialog(
            onDismissRequest = { showClearTelemetryConfirm = false },
            title = {
                Text(
                    text = stringResource(R.string.clear_history_dialog_title),
                    fontWeight = FontWeight.Black,
                    color = DesignTokens.TextPrimary
                )
            },
            text = {
                Text(
                    text = stringResource(R.string.settings_clear_telemetry),
                    color = DesignTokens.TextSecondary
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.clearTelemetryHistory()
                    showClearTelemetryConfirm = false
                }) {
                    Text(
                        text = stringResource(R.string.action_clear),
                        color = DesignTokens.TextDanger,
                        fontWeight = FontWeight.Black
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearTelemetryConfirm = false }) {
                    Text(
                        text = stringResource(R.string.action_cancel),
                        color = DesignTokens.TextSecondary
                    )
                }
            },
            containerColor = DesignTokens.BgSurface
        )
    }
}

@Composable
private fun SettingsGroupTitle(title: String) {
    Text(
        text = title,
        fontSize = DesignTokens.Font2xs,
        fontWeight = FontWeight.Black,
        letterSpacing = 2.sp,
        color = DesignTokens.TextTertiary,
        modifier = Modifier.padding(top = 8.dp)
    )
}

@Composable
private fun ThemeOptionChip(
    label: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(DesignTokens.RadiusChip),
        color = if (selected) DesignTokens.BrandPrimary else DesignTokens.BgSurface,
        border = if (selected) null else androidx.compose.foundation.BorderStroke(
            1.dp,
            DesignTokens.Border
        )
    ) {
        Text(
            text = label,
            fontSize = DesignTokens.Font2xs,
            fontWeight = if (selected) FontWeight.Black else FontWeight.Bold,
            color = if (selected) Color.White else DesignTokens.TextSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
        )
    }
}

@Composable
private fun SettingsSwitchRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onCheckedChange)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = DesignTokens.TextSecondary,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = DesignTokens.FontXs,
                color = DesignTokens.TextPrimary
            )
            Text(
                text = subtitle,
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                lineHeight = DesignTokens.Line2xs,
                color = DesignTokens.TextTertiary
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = { onCheckedChange() }
        )
    }
}

@Composable
private fun SettingsNavRow(
    icon: ImageVector,
    title: String,
    subtitle: String?,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = DesignTokens.TextSecondary,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = DesignTokens.FontXs,
                color = DesignTokens.TextPrimary
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = DesignTokens.Line2xs,
                    color = DesignTokens.TextTertiary
                )
            }
        }
        Icon(
            imageVector = MintIcons.ChevronRight,
            contentDescription = null,
            tint = DesignTokens.TextDisabled,
            modifier = Modifier.size(14.dp)
        )
    }
}

// ============================================================
// 关于 APP (自 BatteryScreen.kt 迁入「我的」页，薄荷换肤)
// 零商业化红线：无赞助/会员/广告/平台引流入口
// ============================================================
@Composable
fun AboutAppCard() {
    val featureLines = listOf(
        stringResource(R.string.about_feature_1),
        stringResource(R.string.about_feature_2),
        stringResource(R.string.about_feature_3),
        stringResource(R.string.about_feature_4),
        stringResource(R.string.about_feature_5),
        stringResource(R.string.about_feature_6)
    )

    // v2.0.0-beta.1 P2 GA 修复：崩溃记录导出 (轻量本地捕获，零三方 SDK)
    val crashContext = LocalContext.current
    val crashScope = rememberCoroutineScope()
    var crashCount by remember { mutableIntStateOf(-1) } // -1 = 未初始化，首帧后统计
    LaunchedEffect(Unit) {
        crashCount = CrashLogHandler.crashCount(crashContext)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassSurface()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.about_title),
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary,
                fontFamily = FontFamily.Monospace
            )
            // 版本徽章：v${VERSION_NAME} (${VERSION_CODE}) — 格式受 AppShellAuditTest 锁定
            Surface(
                shape = RoundedCornerShape(DesignTokens.RadiusChip),
                color = DesignTokens.BrandChip
            ) {
                Text(
                    text = "v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.BrandPrimaryDark,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = stringResource(R.string.about_tagline),
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextSecondary,
            fontFamily = FontFamily.Monospace,
            lineHeight = DesignTokens.Line2xs
        )

        Spacer(modifier = Modifier.height(10.dp))

        featureLines.forEach { line ->
            Row(modifier = Modifier.padding(vertical = 3.dp)) {
                Text(
                    text = "• ",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.BrandPrimary,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = line,
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextTertiary,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = DesignTokens.Line2xs
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        HorizontalDivider(color = DesignTokens.Border, thickness = 1.dp)

        Spacer(modifier = Modifier.height(10.dp))

        // 隐私与数据声明：安装即可见的摘要版，完整政策见仓库 PRIVACY.md
        Text(
            text = stringResource(R.string.about_privacy_title),
            fontSize = DesignTokens.FontXs,
            fontWeight = FontWeight.Black,
            color = DesignTokens.TextPrimary,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = stringResource(R.string.about_privacy_body),
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextTertiary,
            fontFamily = FontFamily.Monospace,
            lineHeight = DesignTokens.FontXs
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedButton(
                onClick = {
                    crashScope.launch {
                        CrashLogHandler.buildShareIntent(crashContext)?.let { intent ->
                            runCatching {
                                crashContext.startActivity(Intent.createChooser(intent, null))
                            }
                        }
                    }
                },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = DesignTokens.TextSecondary)
            ) {
                Text(
                    text = stringResource(R.string.about_export_crash_log),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace
                )
            }
            Text(
                text = if (crashCount > 0) {
                    stringResource(R.string.about_crash_count, crashCount)
                } else {
                    stringResource(R.string.about_crash_none)
                },
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 开源许可：MIT 开源发布，源码/构建/审计文档全公开 (零商业化红线的一部分)
        Text(
            text = stringResource(R.string.about_open_source_title),
            fontSize = DesignTokens.FontXs,
            fontWeight = FontWeight.Black,
            color = DesignTokens.TextPrimary,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = stringResource(R.string.about_open_source_content),
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextTertiary,
            fontFamily = FontFamily.Monospace,
            lineHeight = DesignTokens.FontXs
        )

        Spacer(modifier = Modifier.height(10.dp))

        HorizontalDivider(color = DesignTokens.Border, thickness = 1.dp)

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = stringResource(R.string.about_developer),
            fontSize = DesignTokens.Font2xs,
            fontWeight = FontWeight.Bold,
            color = DesignTokens.TextSecondary,
            fontFamily = FontFamily.Monospace
        )
    }
}
