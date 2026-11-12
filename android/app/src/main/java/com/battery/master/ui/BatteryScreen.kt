package com.battery.master.ui

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import com.battery.master.ui.theme.DesignTokens
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.BuildConfig
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.model.BatteryInfo
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BatteryScreen(
    viewModel: BatteryViewModel
) {
    // 经 BatteryInfo (BatteryState 业务别名) 消费 ViewModel 兼容别名 batteryInfo
    val state: BatteryInfo by viewModel.batteryInfo.collectAsState()

    // 指标 04 设计容量校准对话框开关 (激活 ViewModel.setDesignCapacity)
    var showDesignCapacityDialog by remember { mutableStateOf(false) }

    // 一键模拟充满保持期剩余秒数 (0 = 无模拟，UI 倒计时反馈)
    val simulationRemainingSec by viewModel.simulationRemainingSec.collectAsState()

    // 顶层双 Tab：状态总览 / 硬件实验室 (对齐 Web 端 AndroidNavBar 信息架构)
    var selectedTab by remember { mutableStateOf(0) }
    val tabTitles = listOf("状态总览", "硬件实验室")

    Scaffold(
        containerColor = DesignTokens.BgDeep, // Deep Cyber AMOLED Black
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .background(DesignTokens.BrandPrimary, RoundedCornerShape(DesignTokens.RadiusChip))
                        )
                        Column {
                            Text(
                                text = "电池大师",
                                fontSize = DesignTokens.FontXl,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 2.sp,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "Android 15 电池 AIDL 硬件抽象层 · 原生硬件遥测",
                                fontSize = DesignTokens.Font2xs,
                                color = DesignTokens.AccentCyanDark,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DesignTokens.BgSurface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // 顶部 Tab 导航条
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = DesignTokens.BgSurface,
                contentColor = DesignTokens.BrandPrimary,
                divider = {}
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        modifier = Modifier.height(44.dp)
                    ) {
                        Text(
                            text = title,
                            fontSize = DesignTokens.FontXs,
                            fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                            fontFamily = FontFamily.Monospace,
                            color = if (selectedTab == index) DesignTokens.BrandPrimary else DesignTokens.TextTertiary
                        )
                    }
                }
            }

            // Tab 切换转场动画：淡入淡出 + 轻微缩放（与 Web animate-tab-in 对齐）
            Crossfade(
                targetState = selectedTab,
                animationSpec = tween(durationMillis = DesignTokens.DurationSlow),
                label = "tab-crossfade"
            ) { tab ->
            if (tab == 0) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. 顶部华丽核心环形仪表盘 (5. 电量百分比, 6. 电池状态, 2. 剩余电量, 11. 瞬时电流)
            item {
                CyberHeroBatteryCard(state)
            }

            // 2. 硬件信息汇总栏 (Hardware Information Summary Bar)
            item {
                HardwareSummaryCard(state, onCalibrateDesignCapacity = { showDesignCapacityDialog = true })
            }

            // 3. 特性 12 充满判定卡片 (100% 且 0-25 mA)
            item {
                FullChargeConditionCard(
                    state,
                    simulationRemainingSec = simulationRemainingSec,
                    onTriggerTest = { viewModel.triggerFullChargeSimulation() }
                )
            }

            // 4. 12 项充放电指标卡片网格列表
            item {
                Text(
                    text = "12 项充放电核心指标详情",
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.FontXs,
                    letterSpacing = 1.sp,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
                )
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "01",
                        title = "电池健康度",
                        value = "${String.format(Locale.US, "%.1f", state.healthPercentage)}%",
                        sub = "出厂设计保持率",
                        accentColor = DesignTokens.BrandPrimary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "02",
                        title = "剩余电量",
                        value = "${state.remainingCapacityMah}",
                        unit = "mAh",
                        sub = "当前可用电荷量",
                        accentColor = DesignTokens.AccentCyanDark
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "03",
                        title = "电池当前容量",
                        value = "${state.currentCapacityMah}",
                        unit = "mAh",
                        sub = "衰减后最大可用",
                        accentColor = DesignTokens.FeaturePurple
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "04",
                        title = "电池设计容量",
                        value = "${state.designCapacityMah}",
                        unit = "mAh",
                        sub = "出厂铭牌标称",
                        accentColor = DesignTokens.InfoSky
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "05",
                        title = "电量百分比",
                        value = "${state.percentage}",
                        unit = "%",
                        sub = "系统广播 EXTRA_LEVEL/SCALE",
                        accentColor = DesignTokens.BrandPrimary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "06",
                        title = "电池状态",
                        value = state.status.label,
                        sub = "Battery Status",
                        accentColor = DesignTokens.InfoSky
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "07",
                        title = "电池温度",
                        value = "${state.temperatureCelsius}",
                        unit = "°C",
                        // 温度评估口径与 Web 端三段制完全对齐 (>45 严重 / 38-45 偏热 / ≤0 过冷 / 其余正常)
                        sub = when {
                            state.temperatureCelsius > 45 -> "严重发热 (>45°C)"
                            state.temperatureCelsius >= 38 -> "偏热预警 (38-45°C)"
                            state.temperatureCelsius <= 0 -> "过冷保护 (≤0°C)"
                            else -> "温度正常"
                        },
                        accentColor = when {
                            state.temperatureCelsius > 45 || state.temperatureCelsius <= 0 -> DesignTokens.DangerRose
                            state.temperatureCelsius >= 38 -> DesignTokens.WarningAmber
                            else -> DesignTokens.BrandPrimary
                        }
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "08",
                        title = "电池健康状况",
                        value = state.healthQuality.label,
                        sub = "Android BatteryManager",
                        accentColor = DesignTokens.BrandPrimary
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "09",
                        title = "电芯电压",
                        value = "${state.voltageMv}",
                        unit = "mV",
                        sub = "电势差 ${(state.voltageMv / 1000f)} V",
                        accentColor = DesignTokens.InfoSky
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "10",
                        title = "充放电循环",
                        value = if (state.cycleCount > 0) "${state.cycleCount}" else "—",
                        unit = if (state.cycleCount > 0) "次" else "",
                        sub = if (state.cycleCount > 0) "Cycle Count" else "系统未上报循环数据",
                        accentColor = DesignTokens.AccentTeal
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "11",
                        title = "瞬时电流",
                        // 指标 11：经 BatteryState.currentNowMa 别名读取 (激活别名，与 currentMa 同源)
                        value = "${if (state.currentNowMa > 0) "+${state.currentNowMa}" else state.currentNowMa}",
                        unit = "mA",
                        sub = "功率 ${String.format("%.2f", state.powerWatts)} W",
                        accentColor = if (state.currentNowMa > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "12",
                        title = "完全充满容量",
                        value = if (state.fullChargeCapacityMah != null) "${state.fullChargeCapacityMah}" else "—",
                        unit = if (state.fullChargeCapacityMah != null) "mAh" else "",
                        sub = if (state.isFullChargeConditionMet) "已满足 100% & 0-25 mA" else "详见上方充满判定卡",
                        accentColor = DesignTokens.BrandPrimaryLight
                    )
                }
            }

            // 5. 关于 APP 功能说明 (版本号经 BuildConfig 单源注入)
            item {
                AboutAppCard()
            }

            item {
                Spacer(modifier = Modifier.height(28.dp))
            }
        }
            } else {
                // 硬件实验室 Tab：场景模拟 / 滑杆调参 / 健康枚举 / 提示音
                HardwareLabScreen(viewModel = viewModel, state = state)
            }
            }
        }

        // 指标 04 设计容量校准对话框 (激活 ViewModel.setDesignCapacity)
        if (showDesignCapacityDialog) {
            var capacityInput by remember { mutableStateOf(state.designCapacityMah.toString()) }
            var inputError by remember { mutableStateOf<String?>(null) }

            // 校验并提交：空值/0/超范围均给出可见错误反馈，不再静默失败
            val submitCalibration: () -> Unit = {
                val parsed = capacityInput.toIntOrNull()
                inputError = when {
                    capacityInput.isBlank() -> "请输入容量数值"
                    parsed == null || parsed <= 0 -> "容量必须为大于 0 的整数"
                    parsed < BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH ->
                        "容量不能小于 ${BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH} mAh"
                    parsed > BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH ->
                        "容量超出合理范围 (最大 ${BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH} mAh)"
                    else -> null
                }
                if (inputError == null && parsed != null) {
                    viewModel.setDesignCapacity(parsed)
                    showDesignCapacityDialog = false
                }
            }

            AlertDialog(
                onDismissRequest = { showDesignCapacityDialog = false },
                title = { Text("校准设计容量 (指标 04)") },
                text = {
                    OutlinedTextField(
                        value = capacityInput,
                        onValueChange = { input ->
                            capacityInput = input.filter { it.isDigit() }.take(5)
                            inputError = null
                        },
                        label = { Text("出厂设计容量 (mAh)") },
                        singleLine = true,
                        isError = inputError != null,
                        supportingText = {
                            inputError?.let { err ->
                                Text(err, fontSize = DesignTokens.Font2xs, color = DesignTokens.TextError)
                            }
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = { submitCalibration() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = DesignTokens.TextPrimary,
                            focusedBorderColor = DesignTokens.AccentCyanDark,
                            unfocusedBorderColor = DesignTokens.BorderStrong,
                            focusedLabelColor = DesignTokens.AccentCyanDark,
                            unfocusedLabelColor = DesignTokens.TextTertiary,
                            errorBorderColor = DesignTokens.TextError,
                            errorLabelColor = DesignTokens.TextError
                        )
                    )
                },
                confirmButton = {
                    TextButton(onClick = submitCalibration) {
                        Text("确定", color = DesignTokens.BrandPrimaryLight)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDesignCapacityDialog = false }) {
                        Text("取消", color = DesignTokens.TextSecondary)
                    }
                },
                containerColor = DesignTokens.BgElevated,
                titleContentColor = Color.White
            )
        }
    }
}

/**
 * 华丽酷炫核心电池 HUD 卡片
 */
@Composable
fun CyberHeroBatteryCard(state: BatteryState) {
    val isCharging = state.status == BatteryStatus.CHARGING
    val isLow = state.percentage <= 15 && !isCharging

    // 氛围动画：充电/低电量时 Hero 卡片呼吸光晕（与 Web 双层呼吸光晕对齐）
    val infiniteTransition = rememberInfiniteTransition(label = "hero-ambient")
    val ambientAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "ambient-alpha"
    )

    // 电量百分比缓动过渡（消除读数跳动，与 Web duration-hero 一致）
    val animatedPercentage by animateIntAsState(
        targetValue = state.percentage,
        animationSpec = tween(durationMillis = DesignTokens.DurationHero),
        label = "hero-percentage"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            // 玻璃拟态：半透明垂直渐变底（Compose 无真模糊，以层叠透明 + 细描边模拟玻璃切面）
            .drawBehind {
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            DesignTokens.BgGlass,
                            DesignTokens.BgElevated.copy(alpha = 0.94f)
                        )
                    )
                )
            }
            .border(1.dp, DesignTokens.BorderStrong, RoundedCornerShape(DesignTokens.RadiusHero)),
        shape = RoundedCornerShape(DesignTokens.RadiusHero),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            // 呼吸氛围光晕（充电 emerald / 低电量 rose）
            if (isCharging || isLow) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    (if (isCharging) DesignTokens.BrandPrimary else DesignTokens.DangerRose)
                                        .copy(alpha = 0.13f * ambientAlpha),
                                    Color.Transparent
                                )
                            )
                        )
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 玻璃顶部切面高光线（1px 渐变亮线）
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    Color.White.copy(alpha = 0.18f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Status Tag
                Surface(
                    shape = RoundedCornerShape(DesignTokens.RadiusPill),
                    color = DesignTokens.Border,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.BorderStrong)
                ) {
                    Text(
                        text = state.status.label,
                        fontSize = DesignTokens.Font2xs,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = when (state.status) {
                            BatteryStatus.CHARGING -> DesignTokens.BrandPrimaryLight
                            BatteryStatus.FULL -> DesignTokens.FullTeal
                            else -> DesignTokens.InfoSky
                        },
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // 5. 电量百分比 (Huge Futuristic typography, 缓动过渡)
                Text(
                    text = "${animatedPercentage}%",
                    fontSize = DesignTokens.FontHero,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )

            // 2. 剩余电量 (mAh)
            Text(
                text = "剩余电量: ${state.remainingCapacityMah} / ${state.currentCapacityMah} mAh",
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Medium,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextSecondary
            )

            Spacer(modifier = Modifier.height(8.dp))

            // 11. 瞬时电流与功率 (指标 11 经 BatteryState.currentNowMa 别名读取，与 currentMa 同源；
            //    功率直接消费 State.powerWatts，统一数据源)
            val currentMa = state.currentNowMa
            val powerW = state.powerWatts
            Surface(
                shape = RoundedCornerShape(DesignTokens.RadiusChip),
                color = DesignTokens.BgInset,
                border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
            ) {
                Text(
                    text = "${if (currentMa > 0) "+$currentMa" else currentMa} mA · ${String.format("%.2f", powerW)} W · ${(state.voltageMv / 1000f)} V",
                    fontSize = DesignTokens.FontXs,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.InfoSky,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                )
            }
            }
        }
    }
}

/**
 * 硬件信息汇总栏 (Hardware Information Summary Bar)
 */
@Composable
fun HardwareSummaryCard(state: BatteryState, onCalibrateDesignCapacity: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusPanel)),
        shape = RoundedCornerShape(DesignTokens.RadiusPanel),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "底层硬件信息与电源子系统",
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontFamily = FontFamily.Monospace
                )
                Surface(
                    shape = RoundedCornerShape(DesignTokens.RadiusChip),
                    color = DesignTokens.BgElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.AccentCyanDark)
                ) {
                    Text(
                        text = state.thermalThrottlingState,
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.AccentCyanDark,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ===== SoC 主控架构区块 (型号/厂商/制程/CPU/GPU 五字段，检测链见 SoCHardwareProfile) =====
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "SoC 主控", value = state.socModel)
                HardwareItem(modifier = Modifier.weight(1f), label = "SoC 厂商", value = state.socVendor)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "制程工艺", value = state.socProcess)
                HardwareItem(modifier = Modifier.weight(1f), label = "GPU 渲染", value = state.socGpu)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // CPU 架构文案较长，允许两行展示 (核心配置分级完整可读)
            HardwareItem(
                modifier = Modifier.fillMaxWidth(),
                label = "CPU 架构",
                value = state.socCpu,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(10.dp))

            // ===== 电源子系统区块 =====
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电源管理 IC", value = state.pmicModel)
                HardwareItem(modifier = Modifier.weight(1f), label = "快充协议", value = state.fastChargeProtocol)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电芯内阻", value = "${state.internalResistanceMohm} mΩ")
                HardwareItem(modifier = Modifier.weight(1f), label = "化学材料体系", value = state.batteryChemistry)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电芯结构", value = state.cellStructure)
                HardwareItem(modifier = Modifier.weight(1f), label = "AIDL 规范", value = state.halVersion)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 指标 04 用户校准入口 (激活 ViewModel.setDesignCapacity，与 Web 端自定义容量对等)
            OutlinedButton(
                onClick = onCalibrateDesignCapacity,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = DesignTokens.AccentCyanDark)
            ) {
                Text(
                    text = "校准设计容量 (当前 ${state.designCapacityMah} mAh)",
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

@Composable
fun HardwareItem(modifier: Modifier = Modifier, label: String, value: String, maxLines: Int = 1) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(DesignTokens.RadiusChip),
        color = DesignTokens.BgInset,
        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(text = label, fontSize = DesignTokens.Font2xs, color = DesignTokens.TextTertiary)
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextPrimary,
                maxLines = maxLines
            )
        }
    }
}

/**
 * 特性 12 充满判定卡片
 */
@Composable
fun FullChargeConditionCard(
    state: BatteryState,
    simulationRemainingSec: Long,
    onTriggerTest: () -> Unit
) {
    // 直接消费 State.isFullChargeConditionMet (双通道单一数据源，不本地重算)
    val isFullMet = state.isFullChargeConditionMet
    val isSimulating = simulationRemainingSec > 0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                1.dp,
                if (isFullMet) DesignTokens.BrandPrimary else DesignTokens.Border,
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
                Text(
                    text = "12. 完全充满时的容量 (估算)",
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.FontXs,
                    color = Color.White
                )
                Text(
                    text = if (isFullMet) "已达充满判定 (100% & 0-25 mA)" else "等待条件满足",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = if (isFullMet) DesignTokens.BrandPrimaryLight else DesignTokens.TextAmberStrong
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (state.fullChargeCapacityMah != null) {
                        "${state.fullChargeCapacityMah} mAh"
                    } else {
                        "— 未完全充满暂不显示 (需100%且电流0~25mA) —"
                    },
                    fontSize = DesignTokens.Font2xl,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = if (state.fullChargeCapacityMah != null) DesignTokens.BrandPrimaryLight else DesignTokens.TextTertiary
                )
                // v1.2.1 自检：锁定值为历史记录 (当前未在判定区间) 时显式标注，
                // 避免用户把历史锁定容量误读为实时充满值
                if (state.fullChargeCapacityMah != null && !isFullMet) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(DesignTokens.RadiusChip),
                        color = DesignTokens.BgElevated,
                        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
                    ) {
                        Text(
                            text = "历史锁定",
                            fontSize = DesignTokens.Font2xs,
                            fontFamily = FontFamily.Monospace,
                            color = DesignTokens.TextAmberStrong,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            // 上次充满锁定时间 (激活 lastFullChargeTimestamp：持久化值跨重启回显)
            state.lastFullChargeTimestamp?.let { timestamp ->
                Text(
                    text = "上次锁定: " + SimpleDateFormat(
                        "yyyy-MM-dd HH:mm:ss",
                        Locale.getDefault()
                    ).format(Date(timestamp)),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = onTriggerTest,
                enabled = !isSimulating,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSimulating) DesignTokens.BorderStrong else DesignTokens.BrandPrimaryDark,
                    disabledContainerColor = DesignTokens.Border,
                    disabledContentColor = DesignTokens.TextSecondary
                )
            ) {
                Text(
                    text = if (isSimulating) {
                        "模拟保持中 (${simulationRemainingSec}s) · 结束后自动恢复真实遥测"
                    } else {
                        "一键模拟完全充满 (100% + 16mA)"
                    },
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun CyberMetricCardItem(
    modifier: Modifier = Modifier,
    number: String,
    title: String,
    value: String,
    unit: String = "",
    sub: String,
    accentColor: Color
) {
    Card(
        modifier = modifier.border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard)),
        shape = RoundedCornerShape(DesignTokens.RadiusCard),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(modifier = Modifier.padding(13.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = title,
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary
                )
                Text(
                    text = number,
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = DesignTokens.TextDisabled
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = value,
                    fontSize = DesignTokens.FontXl,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )
                if (unit.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = unit,
                        fontSize = DesignTokens.Font2xs,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = accentColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(3.dp))

            Text(
                text = sub,
                fontSize = DesignTokens.Font2xs,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextTertiary,
                maxLines = 1
            )
        }
    }
}

// ============================================================
// 关于 APP 功能说明卡片
// 版本信息经 BuildConfig 单源注入 (build.gradle.kts defaultConfig)
// ============================================================
@Composable
fun AboutAppCard() {
    val featureLines = listOf(
        "12 项核心充放电指标全量实时遥测：健康度 / 剩余电量 / 当前容量 / 设计容量 / 电量百分比 / 电池状态 / 温度 / 健康状况 / 电压 / 循环计数 / 瞬时电流 / 完全充满容量",
        "完全充满判定：电量 100% 且瞬时电流回落至 0~25 mA 浮充截止区间时，自动锁定实际充满容量并跨会话保存",
        "硬件实验室：一键场景模拟（充满校准 / 极速闪充 / 高负载放电 / 过热警报）与六组滑杆调参，随时一键恢复真实硬件遥测",
        "硬件信息解析：SoC 主控五字段档案（型号 / 厂商 / 制程 / CPU / GPU）与 PMIC 型号、快充协议、电芯结构三级回退检测",
        "数据来源：系统 BatteryManager 公开接口、ACTION_BATTERY_CHANGED 粘性广播与 sysfs 真实硬件通道，全部本地计算，不上传任何数据",
        "零权限声明：不申请任何运行时或敏感权限，安装即可使用全部功能"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusPanel)),
        shape = RoundedCornerShape(DesignTokens.RadiusPanel),
        colors = CardDefaults.cardColors(containerColor = DesignTokens.BgSurface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "关于 APP",
                    fontSize = DesignTokens.FontXs,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontFamily = FontFamily.Monospace
                )
                Surface(
                    shape = RoundedCornerShape(DesignTokens.RadiusChip),
                    color = DesignTokens.BgElevated,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.BrandPrimary)
                ) {
                    Text(
                        text = "v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.BrandPrimary,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "电池大师 — 专业安卓电池充放电监测工具",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextSecondary,
                fontFamily = FontFamily.Monospace
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
                        lineHeight = DesignTokens.FontXs
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            HorizontalDivider(color = DesignTokens.Border, thickness = 1.dp)

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "开发者：某厂大牛马【带娃的小陈工】",
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                color = DesignTokens.TextSecondary,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = "抖音 / 小红书 平台",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}
