package com.battery.master.ui

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.battery.master.BuildConfig
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict
import com.battery.master.model.BatteryInfo
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BatteryScreen(
    viewModel: BatteryViewModel
) {
    // 经 BatteryInfo (BatteryState 业务别名) 消费 ViewModel 兼容别名 batteryInfo
    val state: BatteryInfo by viewModel.batteryInfo.collectAsState()

    // 指标 04 设计容量校准对话框开关 (激活 ViewModel.setDesignCapacity)。
    // 外壳层审计修复：rememberSaveable 保证旋转/折叠屏/字体变更等配置变更重建后
    // 对话框不丢失，用户输入上下文不被打断
    var showDesignCapacityDialog by rememberSaveable { mutableStateOf(false) }

    // 一键模拟充满保持期剩余秒数 (0 = 无模拟，UI 倒计时反馈)
    val simulationRemainingSec by viewModel.simulationRemainingSec.collectAsState()

    // v1.2.3 P1 审计修复：硬件实验室模拟态跨 Tab 可见——旧实现总览页完全不读
    // labOverride，用户切回总览后看到的是模拟数据却零提示，会把实验室模拟值
    // 当作真实电池状态阅读。现采集覆盖层状态，顶部显示警示横幅
    val labOverride by viewModel.labOverride.collectAsState()

    // 顶层双 Tab：状态总览 / 硬件实验室 (对齐 Web 端 AndroidNavBar 信息架构)。
    // 外壳层审计修复：rememberSaveable 保证配置变更重建后停留在当前 Tab，
    // 用户在硬件实验室的调试上下文不丢失
    var selectedTab by rememberSaveable { mutableStateOf(0) }
    // v2.0.0-alpha.1：对齐 Web 端 4 Tab 信息架构——总览 / 遥测分析 / 健康档案 / 硬件实验室
    // (Web 端的"原生源码/工程总览"属 Web 演示页说明性内容，不适用于 Android 端，不搬移)
    val tabTitles = listOf("状态总览", "遥测分析", "健康档案", "硬件实验室")

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
                                // 外壳层审计修复：副标题按真实运行 API 动态渲染。
                                // 旧实现硬编码 "Android 15"，在 minSdk 26~34 设备上宣称失实
                                text = "API ${android.os.Build.VERSION.SDK_INT} 电池管理服务 · 原生硬件遥测",
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
                        // 外壳层审计修复：heightIn(min) 替代固定 height，
                        // 系统字体缩放至最大档时 Tab 文本不再被裁剪 (无障碍)
                        modifier = Modifier.heightIn(min = 44.dp)
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

            // 1. 硬件实验室模拟态警示横幅 (P1 审计修复：跨 Tab 泄漏可视化)
            if (labOverride != null) {
                item {
                    LabSimulationBanner(onExit = { viewModel.exitLabMode() })
                }
            }

            // 2. 硬件信息汇总栏 (Hardware Information Summary Bar)
            item {
                HardwareSummaryCard(state, onCalibrateDesignCapacity = { showDesignCapacityDialog = true })
            }

            // 3. 特性 12 充满判定卡片 (100% 且充电态 |电流| ≤ 25 mA)
            item {
                FullChargeConditionCard(
                    state,
                    simulationRemainingSec = simulationRemainingSec,
                    onTriggerTest = { viewModel.triggerFullChargeSimulation() },
                    onClearRecords = { viewModel.clearFullChargeRecords() }
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
                        // v2.0.0-alpha.1 用户口径修正：健康度是多少就是多少——
                        // 电量计节点不可读时显示"无法测算"，不再按 0.92 出厂保持率虚构
                        value = if (state.hasMeasuredCapacity)
                            "${String.format(Locale.US, "%.1f", state.healthPercentage)}%" else "—",
                        // 标注容量来源——"sysfs 实测"为真实硬件状态，
                        // "不可测算"为无电量计节点时的诚实空态，不得虚构
                        sub = if (state.hasMeasuredCapacity) "实测健康度 [${state.currentCapacitySource.label}]"
                              else "无法测算 [${state.currentCapacitySource.label}]",
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.BrandPrimary else DesignTokens.TextTertiary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "02",
                        title = "剩余电量",
                        // v2.0.0-alpha.1：剩余电量口径基准=当前可用容量，容量不可测时同显 "—"
                        value = if (state.hasMeasuredCapacity) "${state.remainingCapacityMah}" else "—",
                        unit = if (state.hasMeasuredCapacity) "mAh" else "",
                        // v1.2.4 P2 审计修复：双口径来源显式标注——"库仑计实测"
                        // (CHARGE_COUNTER) 与"百分比×容量估算"量纲基准不同，
                        // 机型间不可比、运行中切换会跳变，旧实现无任何口径标注
                        sub = if (state.hasMeasuredCapacity) "当前可用电荷量 [${state.remainingCapacitySource.label}]"
                              else "无法测算 [容量未实测]",
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.AccentCyanDark else DesignTokens.TextTertiary
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "03",
                        title = "电池当前容量",
                        // v2.0.0-alpha.1：容量不可测显示 "—" (0 为非法哨兵，不再虚构估算值)
                        value = if (state.hasMeasuredCapacity) "${state.currentCapacityMah}" else "—",
                        unit = if (state.hasMeasuredCapacity) "mAh" else "",
                        sub = if (state.hasMeasuredCapacity) "衰减后最大可用 [${state.currentCapacitySource.label}]"
                              else "无法测算 [${state.currentCapacitySource.label}]",
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.FeaturePurple else DesignTokens.TextTertiary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "04",
                        title = "电池设计容量",
                        value = "${state.designCapacityMah}",
                        unit = "mAh",
                        sub = "出厂铭牌标称 [${state.designCapacitySource.label}]",
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
                        // v1.2.3 审计修复：温度主值经 Locale.US 锚定——德语等逗号
                        // 小数点 Locale 下 Float.toString 渲染 "32,6°C"，与全屏
                        // 数值口径割裂；精度 0.1°C 与解析器一致
                        value = String.format(Locale.US, "%.1f", state.temperatureCelsius),
                        unit = "°C",
                        // v1.2.4 P2 审计修复：温度分级阈值与温控节流态单源 (解析器常量)，
                        // 旧实现 >45/≥38 与节流态 ≥44/≥38.5 打架 (44~45℃ 标签"过热急停"
                        // 而卡片仅"偏热预警"、38~38.5℃ 反之，同屏自相矛盾)
                        sub = when {
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
                                "严重发热 (≥${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                                "偏热预警 (${BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt()}-${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                            state.temperatureCelsius <= 0 -> "过冷保护 (≤0°C)"
                            else -> "温度正常"
                        },
                        accentColor = when {
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ||
                                state.temperatureCelsius <= 0 -> DesignTokens.DangerRose
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                                DesignTokens.WarningAmber
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
                        sub = "电势差 ${String.format(Locale.US, "%.2f", state.voltageMv / 1000f)} V",
                        accentColor = DesignTokens.InfoSky
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "10",
                        title = "充放电循环",
                        value = if (state.cycleCount > 0) "${state.cycleCount}" else "—",
                        unit = if (state.cycleCount > 0) "次" else "",
                        // v2.0.0-alpha 批次B：健康度实测时展示循环寿命预测 (模型外推)，
                        // 估算健康度不预测——保持 "Cycle Count" 原口径
                        sub = state.healthForecastText
                            ?: if (state.cycleCount > 0) "Cycle Count" else "系统未上报循环数据",
                        accentColor = DesignTokens.AccentTeal
                    )
                }
            }

            item {
                // 局部变量：currentNowMa 为自定义 getter 属性不可智能转换，
                // 绑定局部值后 when 分支可安全比较与空安全分支
                val currentNow = state.currentNowMa
                val powerW = state.powerWatts
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "11",
                        title = "瞬时电流",
                        // 指标 11：经 BatteryState.currentNowMa 别名读取 (激活别名，与 currentMa 同源)
                        // v1.2.3 P0 审计修复：currentMa 可空——设备不支持 CURRENT_NOW
                        // 时显示 "—"，旧实现归一化为 0 会虚构 "0 mA / 0.00 W" 读数
                        value = currentNow?.let { if (it > 0) "+$it" else "$it" } ?: "—",
                        unit = if (currentNow != null) "mA" else "",
                        // v1.2.4 P2 审计修复：功率随符号携带方向 (充电 +W / 放电 −W)，
                        // 旧实现解析层 abs 后充放同显正功率，方向丢失
                        sub = "功率 " + when {
                            currentNow == null -> "— W"
                            currentNow > 0 -> "+${String.format(Locale.US, "%.2f", powerW)} W"
                            currentNow < 0 -> "-${String.format(Locale.US, "%.2f", abs(powerW))} W"
                            else -> String.format(Locale.US, "%.2f", powerW) + " W"
                        },
                        accentColor = if ((currentNow ?: 0) > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
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
            } else if (tab == 1) {
                // v2.0.0-alpha.1：遥测分析 Tab (对齐 Web 端 TELEMETRY 视图)——
                // 实时硬件遥测曲线 + 功率/温度评估 + 采集链路状态
                TelemetryAnalysisScreen(state)
            } else if (tab == 2) {
                // v2.0.0-alpha.1：健康档案 Tab (对齐 Web 端 HEALTH 视图)——
                // 健康度实测大数字 + 内阻/寿命预测 + 诊断建议 + 充满判定卡
                HealthProfileScreen(
                    state = state,
                    simulationRemainingSec = simulationRemainingSec,
                    onTriggerTest = { viewModel.triggerFullChargeSimulation() },
                    onClearRecords = { viewModel.clearFullChargeRecords() }
                )
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
                    // v1.2.3 P1 审计修复：校准值持久化后需提供撤销入口——
                    // 恢复系统自动探测 (PowerProfile/sysfs 三级回退链)
                    if (state.designCapacitySource == CapacitySource.CALIBRATED) {
                        TextButton(onClick = {
                            viewModel.clearDesignCapacityCalibration()
                            showDesignCapacityDialog = false
                        }) {
                            Text("恢复自动探测", color = DesignTokens.TextSecondary)
                        }
                    }
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
            // v1.2.3 P0 审计修复：currentMa 可空——设备不支持 CURRENT_NOW 时显示
            // "— mA · — W"，旧实现归一化为 0 会显示 "0 mA · 0.00 W" 的虚构读数
            val currentMa = state.currentNowMa
            val powerW = state.powerWatts
            Surface(
                shape = RoundedCornerShape(DesignTokens.RadiusChip),
                color = DesignTokens.BgInset,
                border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.Border)
            ) {
                Text(
                    text = buildString {
                        append(if (currentMa != null) "${if (currentMa > 0) "+$currentMa" else currentMa} mA" else "— mA")
                        append(" · ")
                        // v1.2.4 P2 审计修复：功率随符号携带方向 (充电 +W / 放电 −W，
                        // 负值由 String.format 自然输出 "-")，不再 abs 抹平方向
                        append(if (currentMa != null) "${if (powerW > 0) "+" else ""}${String.format(Locale.US, "%.2f", powerW)} W" else "— W")
                        append(" · ")
                        append("${String.format(Locale.US, "%.2f", state.voltageMv / 1000f)} V")
                    },
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
                // 快充协议实际值形如 "超级快充 (45.0 W) · 澎湃秒充 [品牌档案]"，
                // 半宽 chip 内单行必然截断，允许两行完整展示 (与 CPU 架构行同策略)
                HardwareItem(
                    modifier = Modifier.weight(1f),
                    label = "快充协议",
                    value = state.fastChargeProtocol,
                    maxLines = 2
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // v1.2.4 P2 审计修复 + v2.0.0-alpha 批次B：内阻来源随引擎置信度显式标注——
                // ΔV/ΔI 滑窗回归实测显示 "[运行时测算·高置信 n=48]"，
                // 样本不足时仍回退估算模型并标注 "[工程估算]"
                HardwareItem(
                    modifier = Modifier.weight(1f),
                    label = "电芯内阻",
                    value = "${String.format(Locale.US, "%.1f", state.internalResistanceMohm)} mΩ ${state.internalResistanceLabel}",
                    maxLines = 2
                )
                HardwareItem(modifier = Modifier.weight(1f), label = "化学材料体系", value = state.batteryChemistry)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = "电芯结构", value = state.cellStructure)
                HardwareItem(modifier = Modifier.weight(1f), label = "系统接口", value = state.halVersion)
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
            // v1.2.4 P2 审计修复：补 overflow = Ellipsis——旧实现默认 Clip 且
            // 无省略号，"快充协议"等长值 (如 "超级快充 (45.0 W) · 澎湃秒充 [品牌档案]")
            // 在半宽 chip 内被静默硬裁切，用户无从得知内容被截断
            Text(
                text = value,
                fontSize = DesignTokens.Font2xs,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = DesignTokens.TextPrimary,
                maxLines = maxLines,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * v1.2.3 P1 审计修复：硬件实验室模拟态警示横幅
 *
 * 旧实现 labOverride 只能靠实验室 Tab 内的"恢复真实硬件遥测"按钮清除，
 * 切 Tab 不退出模拟且总览页零提示——用户会把模拟数据当真实电池状态阅读。
 * 本横幅在模拟生效期间常驻总览页顶部，明示数据性质并提供一键恢复出口。
 */
@Composable
private fun LabSimulationBanner(onExit: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(DesignTokens.RadiusChip),
        color = DesignTokens.BgElevated,
        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.TextAmberStrong)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "硬件实验室模拟数据生效中",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextAmberStrong
                )
                Text(
                    text = "当前总览页数值为实验室模拟值，非真实电池状态",
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            TextButton(onClick = onExit) {
                Text(
                    text = "恢复真实",
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.BrandPrimaryLight
                )
            }
        }
    }
}

/**
 * 特性 12 充满判定卡片
 *
 * v1.2.3 P0 审计修复：
 * 1. 三态判定展示——电流不可读 (设备不支持 CURRENT_NOW) 时明确提示"无法判定"，
 *    不再谎报"已达充满判定"；未在充电态时提示未在充电；
 * 2. 来源标注——锁定值为"一键模拟完全充满"演示值时显式标注"模拟"，与真实
 *    锁定 (REAL) 区分，杜绝演示值冒充实测跨重启存在；
 * 3. 清除入口——用户可一键清除全部锁定记录 (真实 + 模拟)。
 */
@Composable
fun FullChargeConditionCard(
    state: BatteryState,
    simulationRemainingSec: Long,
    onTriggerTest: () -> Unit,
    onClearRecords: () -> Unit
) {
    // 直接消费 State 判定字段 (双通道单一数据源，不本地重算)
    val isFullMet = state.isFullChargeConditionMet
    val verdict = state.fullChargeVerdict
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
                    text = when (verdict) {
                        FullChargeVerdict.FULLY_CHARGED -> "已达充满判定 (100% & |I|≤25 mA)"
                        FullChargeVerdict.CURRENT_UNAVAILABLE -> "电流不可读 · 无法判定"
                        FullChargeVerdict.NOT_YET -> "等待条件满足"
                    },
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = when (verdict) {
                        FullChargeVerdict.FULLY_CHARGED -> DesignTokens.BrandPrimaryLight
                        FullChargeVerdict.CURRENT_UNAVAILABLE -> DesignTokens.TextAmberStrong
                        FullChargeVerdict.NOT_YET -> DesignTokens.TextAmberStrong
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (state.fullChargeCapacityMah != null) {
                        "${state.fullChargeCapacityMah} mAh"
                    } else {
                        "— 未完全充满暂不显示 (需100%且充电态|电流|≤25mA) —"
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
                // v1.2.3 P0 审计修复：演示值显式标注"模拟"，杜绝一键模拟按钮的
                // 演示容量冒充实测锁定跨重启存在
                if (state.fullChargeCapacityMah != null && state.fullChargeSource == FullChargeSource.SIMULATED) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(DesignTokens.RadiusChip),
                        color = DesignTokens.BgElevated,
                        border = androidx.compose.foundation.BorderStroke(1.dp, DesignTokens.BrandPrimaryDark)
                    ) {
                        Text(
                            text = "来源: 模拟",
                            fontSize = DesignTokens.Font2xs,
                            fontFamily = FontFamily.Monospace,
                            color = DesignTokens.BrandPrimaryLight,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            // v1.2.3 P0 审计修复：电流不可读时显式说明设备能力边界，引导用户
            // 以系统充满状态为准，不再把估算值当作实测锁定值
            if (verdict == FullChargeVerdict.CURRENT_UNAVAILABLE) {
                Text(
                    text = "本设备不支持电流上报 (CURRENT_NOW)，无法执行 0-25 mA 浮充判定；" +
                        "已保留上次有效锁定值，不作新锁定。",
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
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

            // v1.2.3 P0 审计修复：清除锁定记录入口 (真实 + 模拟演示值)
            if (state.fullChargeCapacityMah != null) {
                Spacer(modifier = Modifier.height(6.dp))
                TextButton(
                    onClick = onClearRecords,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "清除锁定记录",
                        fontSize = DesignTokens.Font2xs,
                        fontFamily = FontFamily.Monospace,
                        color = DesignTokens.TextSecondary
                    )
                }
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
        "权限声明：不申请任何运行时或危险权限，安装即可使用全部功能（合并清单仅含系统框架自动注入的签名级内部权限，不涉及隐私）"
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

/**
 * v2.0.0-alpha.1：遥测分析 Tab (对齐 Web 端 TELEMETRY 视图，Android 独有真实数据)
 *
 * - 实时硬件遥测曲线 (Compose Canvas 自绘，零三方依赖)：电压/电流/温度 1Hz 滑窗 120 秒；
 * - 功率与温度评估卡 (38/45℃ 分级单源解析器常量)；
 * - 采集链路状态卡：电量计探测链命中节点 / 库仑计 / CURRENT_NOW / 内阻引擎滑窗——
 *   这是 Android 端真机才能提供的真实采集通道透视，Web 模拟端无法实现。
 */
@Composable
fun TelemetryAnalysisScreen(state: BatteryState) {
    // 滑动窗口：1Hz 遥测追加上限 120 点 (~2 分钟)；remember 存活于本 Tab 作用域，
    // 切 Tab (Crossfade 保留状态) 不清空，进程重建则重新积累
    val history = remember { mutableStateListOf<BatteryState>() }
    LaunchedEffect(state) {
        history.add(state)
        while (history.size > 120) history.removeAt(0)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "高频硬件遥测分析",
                fontWeight = FontWeight.Bold,
                fontSize = DesignTokens.FontXs,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(top = 4.dp)
            )
            Text(
                text = "实时捕获充放电电流 (mA)、电芯端电压 (mV) 与热敏传感器温度曲线",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        // 实时遥测曲线 (Compose Canvas 自绘)
        item {
            TelemetryChartPanel(history)
        }

        // 功率与温度评估 (与 Web 端 Summary Cards 对齐，复用 12 指标卡样式)
        item {
            val currentNow = state.currentNowMa
            val powerW = state.powerWatts
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "P",
                    title = "充放电功率",
                    value = when {
                        currentNow == null -> "—"
                        powerW >= 0f -> "+${String.format(Locale.US, "%.2f", powerW)}"
                        else -> "-${String.format(Locale.US, "%.2f", abs(powerW))}"
                    },
                    unit = if (currentNow != null) "W" else "",
                    sub = when {
                        currentNow == null -> "电流不可读，不虚构 0W"
                        currentNow > 0 -> "充电输入 P = V × I"
                        currentNow < 0 -> "放电输出 P = V × |I|"
                        else -> "浮充截止"
                    },
                    accentColor = if ((currentNow ?: 0) > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
                )
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "T",
                    title = "电池温度评估",
                    value = String.format(Locale.US, "%.1f", state.temperatureCelsius),
                    unit = "°C",
                    sub = when {
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
                            "严重发热 (≥${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                            "偏热预警 (${BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt()}-${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C)"
                        state.temperatureCelsius <= 0 -> "过冷保护 (≤0°C)"
                        else -> "温度正常"
                    },
                    accentColor = when {
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ||
                            state.temperatureCelsius <= 0 -> DesignTokens.DangerRose
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                            DesignTokens.WarningAmber
                        else -> DesignTokens.BrandPrimary
                    }
                )
            }
        }

        // 采集链路状态卡 (Android 真机独有：真实数据来源透视)
        item {
            TelemetrySourceCard(state)
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/**
 * 实时遥测曲线面板：Compose Canvas 自绘三通道折线 (电压/电流/温度)，
 * 各通道独立归一化到面板高度，横轴为最近 120 个采样点 (~2 分钟 @1Hz)。
 */
@Composable
fun TelemetryChartPanel(history: List<BatteryState>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
            .padding(14.dp)
    ) {
        Text(
            text = "实时遥测曲线 (最近 ${history.size} 个采样点)",
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextSecondary,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
        ) {
            if (history.size < 2) return@Canvas
            // 背景网格 (4 条水平参考线)
            val gridColor = DesignTokens.Border
            for (i in 1..3) {
                val y = size.height * i / 4f
                drawLine(gridColor, Offset(0f, y), Offset(size.width, y), strokeWidth = 1f)
            }
            fun drawSeries(
                pick: (BatteryState) -> Float,
                lo: Float, hi: Float, color: Color
            ) {
                if (hi - lo <= 0f) return
                val n = history.size
                val path = Path()
                history.forEachIndexed { idx, s ->
                    val x = size.width * idx / (n - 1).coerceAtLeast(1)
                    val norm = ((pick(s) - lo) / (hi - lo)).coerceIn(0f, 1f)
                    val y = size.height * (1f - norm)
                    if (idx == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                drawPath(path, color, style = Stroke(width = 4f))
            }
            // 电压 (3000~5000 mV 典型电芯窗口)、电流 (-6000~6000 mA)、温度 (0~60°C)
            drawSeries({ it.voltageMv.toFloat() }, 3000f, 5000f, DesignTokens.InfoSky)
            drawSeries({ (it.currentNowMa ?: 0).toFloat() }, -6000f, 6000f, DesignTokens.BrandPrimary)
            drawSeries({ it.temperatureCelsius }, 0f, 60f, DesignTokens.WarningAmber)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            listOf("电压 mV" to DesignTokens.InfoSky, "电流 mA" to DesignTokens.BrandPrimary, "温度 °C" to DesignTokens.WarningAmber)
                .forEach { (label, color) ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(color, RoundedCornerShape(2.dp))
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = label,
                            fontSize = DesignTokens.Font2xs,
                            color = DesignTokens.TextTertiary,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
        }
    }
}

/**
 * 采集链路状态卡：透视真实数据来源——探测链命中节点、库仑计/CURRENT_NOW 支持性、
 * 内阻引擎滑窗状态。Android 真机独有视图，Web 模拟端无法提供。
 */
@Composable
fun TelemetrySourceCard(state: BatteryState) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
            .padding(14.dp)
    ) {
        Text(
            text = "采集链路状态 (真实数据来源透视)",
            fontSize = DesignTokens.FontXs,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.height(10.dp))
        val currentNow = state.currentNowMa
        val rows = listOf(
            "电量计节点" to state.gaugeNodePath,
            "当前容量来源" to state.currentCapacitySource.label,
            "库仑计剩余电荷" to state.remainingCapacitySource.label,
            "CURRENT_NOW 瞬时电流" to if (currentNow != null) "支持 (读数 ${if (currentNow > 0) "+$currentNow" else "$currentNow"} mA)" else "不可读 (显示 —)",
            "内阻引擎滑窗" to "n=${state.engineSampleCount} · ${state.engineConfidenceLabel}",
            "采集通道" to "粘性广播 + 1Hz 轮询双通道 (单解析器)"
        )
        rows.forEach { (label, value) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = label,
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextTertiary,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = value,
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextPrimary,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * v2.0.0-alpha.1：健康档案 Tab (对齐 Web 端 HEALTH 视图)
 *
 * - 健康度实测大数字 (是多少就是多少——容量不可测显式"无法测算")；
 * - 内阻实测与循环寿命预测 (v2.0.0-alpha 批次B 引擎输出)；
 * - 健康诊断建议 (对齐 Web BatteryHealthAdvice 分级文案)；
 * - 充满判定卡 (复用总览同款组件) + 校准规范说明。
 */
@Composable
fun HealthProfileScreen(
    state: BatteryState,
    simulationRemainingSec: Long,
    onTriggerTest: () -> Unit,
    onClearRecords: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 健康度大数字卡
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
                    .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
                    .padding(16.dp)
            ) {
                Text(
                    text = "电池健康度 (实测口径)",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextTertiary,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(6.dp))
                if (state.hasMeasuredCapacity) {
                    Text(
                        text = "${String.format(Locale.US, "%.1f", state.healthPercentage)}%",
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Black,
                        color = DesignTokens.BrandPrimary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "当前容量 / 设计容量 · [${state.currentCapacitySource.label} + ${state.designCapacitySource.label}]",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                } else {
                    Text(
                        text = "无法测算",
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Black,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "电量计节点 (${state.gaugeNodePath}) 未上报 charge_full——健康度=当前容量/设计容量，测不到就不虚构",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // 内阻实测 + 循环寿命预测
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "R",
                    title = "电芯内阻",
                    // v2.0.0-alpha.1 自检修复：与"是多少就是多少"口径对齐——仅引擎
                    // 运行时测算 (ΔV/ΔI 回归) 有结果时展示数值；无测算不展示臆造
                    // 工程估算值 (总览硬件栏保留 [工程估算] 显式标注口径)
                    value = if (state.internalResistanceLabel.startsWith("[运行时测算"))
                        String.format(Locale.US, "%.1f", state.internalResistanceMohm) else "—",
                    unit = if (state.internalResistanceLabel.startsWith("[运行时测算")) "mΩ" else "",
                    sub = state.internalResistanceLabel,
                    accentColor = DesignTokens.AccentTeal
                )
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "C",
                    title = "充放电循环",
                    value = if (state.cycleCount > 0) "${state.cycleCount}" else "—",
                    unit = if (state.cycleCount > 0) "次" else "",
                    sub = state.healthForecastText
                        ?: if (state.cycleCount > 0) "Cycle Count" else "系统未上报循环数据",
                    accentColor = DesignTokens.AccentTeal
                )
            }
        }

        // 健康诊断建议 (对齐 Web BatteryHealthAdvice 分级)
        item {
            HealthAdviceCard(state)
        }

        // 充满判定卡 (复用总览同款组件——双入口)
        item {
            FullChargeConditionCard(
                state,
                simulationRemainingSec = simulationRemainingSec,
                onTriggerTest = onTriggerTest,
                onClearRecords = onClearRecords
            )
        }

        // 校准规范说明 (对齐 Web HEALTH Tab 说明区)
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
                    .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
                    .padding(14.dp)
            ) {
                Text(
                    text = "完全充满校准规范详细说明",
                    fontSize = DesignTokens.FontXs,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "为什么电量到 100% 还不算完全充满？Android 电源管理为提升体验，通常在恒压 (CV) 阶段初期就提前把 UI 显示为 100%——此时仍有数百 mA 电流持续注入 (饱和浮充)，并非真正充满。",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "0-25 mA 截止电流门限：按锂离子电池充电终止标准，当充电电流自然衰减至 0.005C (0~25 mA) 时才达到完全饱和截止，此时测得的容量最准确，被库仑计固化为「完全充满时的容量」。",
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 18.sp
                )
            }
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/**
 * 健康诊断建议卡：按硬件健康枚举 / 实测温度 / 循环计数 / 实测健康度分级给出真实建议
 * (对齐 Web 端 BatteryHealthAdvice；全部基于实测字段，无实测数据时诚实提示)
 */
@Composable
fun HealthAdviceCard(state: BatteryState) {
    val (advice, accent) = when {
        state.healthQuality == BatteryHealthQuality.OVERHEAT ->
            "系统上报电池过热，请立即停止充电并移除热源，恢复常温后再观察" to DesignTokens.DangerRose
        state.healthQuality == BatteryHealthQuality.DEAD ->
            "系统上报电池损坏，建议前往官方售后检测更换电芯" to DesignTokens.DangerRose
        state.healthQuality == BatteryHealthQuality.OVER_VOLTAGE ->
            "系统上报电芯超压，请断开充电器并避免继续快充，尽快检修" to DesignTokens.DangerRose
        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
            "当前 ${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C 以上：高温会加速电芯老化，建议停止高负载与快充" to DesignTokens.DangerRose
        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
            "当前 ${BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt()}-${BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()}°C 偏热：建议移除保护壳、避免边充边玩" to DesignTokens.WarningAmber
        state.cycleCount >= 800 ->
            "循环已超 ${state.cycleCount} 次 (锂聚合物 80% 健康基线约 800 次)：留意续航衰减，考虑更换" to DesignTokens.WarningAmber
        state.hasMeasuredCapacity && state.healthPercentage in 1f..79.9f ->
            "实测健康度 ${String.format(Locale.US, "%.1f", state.healthPercentage)}% 低于 80% 基线：电池老化明显，建议规划更换" to DesignTokens.WarningAmber
        !state.hasMeasuredCapacity ->
            "电量计节点未上报容量数据，健康度无法测算——其余遥测 (电压/电流/温度) 均为真实读数" to DesignTokens.TextTertiary
        else ->
            "各项硬件指标均在正常区间，继续保持良好充放电习惯即可" to DesignTokens.BrandPrimary
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(accent, RoundedCornerShape(DesignTokens.RadiusChip))
        )
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(
                text = "健康诊断建议",
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = advice,
                fontSize = DesignTokens.FontXs,
                color = DesignTokens.TextPrimary,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                lineHeight = 18.sp,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}
