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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Intent
import com.battery.master.BuildConfig
import com.battery.master.CrashLogHandler
import com.battery.master.R
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatterySession
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict
import com.battery.master.model.BatteryInfo
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.viewmodel.BatteryViewModel
import kotlinx.coroutines.launch
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
    val tabTitles = listOf(
        stringResource(R.string.tab_overview),
        stringResource(R.string.tab_telemetry),
        stringResource(R.string.tab_health),
        stringResource(R.string.tab_lab)
    )

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
                                text = stringResource(R.string.app_name),
                                fontSize = DesignTokens.FontXl,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 2.sp,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                // 外壳层审计修复：副标题按真实运行 API 动态渲染。
                                // 旧实现硬编码 "Android 15"，在 minSdk 26~34 设备上宣称失实
                                text = stringResource(R.string.topbar_subtitle, android.os.Build.VERSION.SDK_INT),
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
                    text = stringResource(R.string.metrics_section_title),
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
                        title = stringResource(R.string.metric_title_health),
                        // v2.0.0-alpha.1 用户口径修正：健康度是多少就是多少——
                        // 电量计节点不可读时显示"无法测算"，不再按 0.92 出厂保持率虚构
                        value = if (state.hasMeasuredCapacity)
                            "${String.format(Locale.US, "%.1f", state.healthPercentage)}%" else "—",
                        // 标注容量来源——"sysfs 实测"为真实硬件状态，
                        // "不可测算"为无电量计节点时的诚实空态，不得虚构。
                        // v2.0.0-alpha.6：回归采样中 (n>0 未收敛) 显示采样进度
                        // 而非死空态——用户可预期健康度将在覆盖 ≥30% 后真实显示
                        sub = when {
                            state.hasMeasuredCapacity -> stringResource(R.string.metric_sub_health_measured, state.currentCapacitySource.label)
                            state.capacityRegressionInfo.isNotEmpty() ->
                                stringResource(R.string.metric_sub_health_regression, state.capacityRegressionInfo)
                            else -> stringResource(R.string.metric_sub_health_unmeasurable, state.currentCapacitySource.label)
                        },
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.BrandPrimary else DesignTokens.TextTertiary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "02",
                        title = stringResource(R.string.metric_title_remaining),
                        // v2.0.0-alpha.5 自检修复：库仑计实测读数不再被容量空态隐藏——
                        // 容量不可测但 CHARGE_COUNTER 可读时，剩余电荷仍是系统库仑计
                        // 真实测量，旧实现统一显示 "—" 丢弃实测值，且 Hero 行同口径矛盾
                        value = if (state.hasMeasuredCapacity ||
                            state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER)
                            "${state.remainingCapacityMah}" else "—",
                        unit = if (state.hasMeasuredCapacity ||
                            state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER) "mAh" else "",
                        // v1.2.4 P2 审计修复：双口径来源显式标注——"库仑计实测"
                        // (CHARGE_COUNTER) 与"百分比×容量估算"量纲基准不同，
                        // 机型间不可比、运行中切换会跳变，旧实现无任何口径标注
                        sub = when {
                            state.hasMeasuredCapacity ->
                                stringResource(R.string.metric_sub_remaining_measured, state.remainingCapacitySource.label)
                            state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER ->
                                stringResource(R.string.metric_sub_remaining_coulomb)
                            else -> stringResource(R.string.metric_sub_remaining_unmeasurable)
                        },
                        accentColor = if (state.hasMeasuredCapacity ||
                            state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER)
                            DesignTokens.AccentCyanDark else DesignTokens.TextTertiary
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "03",
                        title = stringResource(R.string.metric_title_current_capacity),
                        // v2.0.0-alpha.1：容量不可测显示 "—" (0 为非法哨兵，不再虚构估算值)
                        value = if (state.hasMeasuredCapacity) "${state.currentCapacityMah}" else "—",
                        unit = if (state.hasMeasuredCapacity) "mAh" else "",
                        sub = if (state.hasMeasuredCapacity) stringResource(R.string.metric_sub_current_capacity, state.currentCapacitySource.label)
                              else stringResource(R.string.metric_sub_health_unmeasurable, state.currentCapacitySource.label),
                        accentColor = if (state.hasMeasuredCapacity) DesignTokens.FeaturePurple else DesignTokens.TextTertiary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "04",
                        title = stringResource(R.string.metric_title_design_capacity),
                        value = "${state.designCapacityMah}",
                        unit = "mAh",
                        sub = stringResource(R.string.metric_sub_design_capacity, state.designCapacitySource.label),
                        accentColor = DesignTokens.InfoSky
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "05",
                        title = stringResource(R.string.metric_title_percentage),
                        value = "${state.percentage}",
                        unit = "%",
                        sub = stringResource(R.string.metric_sub_percentage),
                        accentColor = DesignTokens.BrandPrimary
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "06",
                        title = stringResource(R.string.metric_title_status),
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
                        title = stringResource(R.string.metric_title_temperature),
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
                                stringResource(R.string.temp_state_overheat, BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt())
                            state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                                stringResource(
                                    R.string.temp_state_warm,
                                    BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt(),
                                    BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()
                                )
                            state.temperatureCelsius <= 0 -> stringResource(R.string.temp_state_cold)
                            else -> stringResource(R.string.temp_state_normal)
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
                        title = stringResource(R.string.metric_title_health_condition),
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
                        title = stringResource(R.string.metric_title_voltage),
                        // v2.0.0-alpha.7 指标 09 诚实口径：双通道均不可得时显示 "—"
                        // 而非伪装成读数的中性默认 4000 mV
                        value = if (state.voltageMeasured) "${state.voltageMv}" else "—",
                        unit = if (state.voltageMeasured) "mV" else "",
                        sub = if (state.voltageMeasured)
                            stringResource(
                                R.string.voltage_sub_measured,
                                String.format(Locale.US, "%.2f", state.voltageMv / 1000f),
                                BatteryTelemetryParser.voltageStateLabel(state.voltageMv, state.voltageMeasured)
                            )
                        else
                            stringResource(R.string.voltage_sub_unmeasured),
                        accentColor = DesignTokens.InfoSky
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "10",
                        title = stringResource(R.string.metric_title_cycles),
                        value = if (state.cycleCount > 0) "${state.cycleCount}" else "—",
                        unit = if (state.cycleCount > 0) stringResource(R.string.unit_times) else "",
                        // v2.0.0-alpha 批次B：健康度实测时展示循环寿命预测 (模型外推)，
                        // 估算健康度不预测——保持 "Cycle Count" 原口径
                        sub = state.healthForecastText
                            ?: if (state.cycleCount > 0) "Cycle Count" else stringResource(R.string.cycles_sub_no_data),
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
                        title = stringResource(R.string.metric_title_current),
                        // 指标 11：经 BatteryState.currentNowMa 别名读取 (激活别名，与 currentMa 同源)
                        // v1.2.3 P0 审计修复：currentMa 可空——设备不支持 CURRENT_NOW
                        // 时显示 "—"，旧实现归一化为 0 会虚构 "0 mA / 0.00 W" 读数
                        value = currentNow?.let { if (it > 0) "+$it" else "$it" } ?: "—",
                        unit = if (currentNow != null) "mA" else "",
                        // v1.2.4 P2 审计修复：功率随符号携带方向 (充电 +W / 放电 −W)，
                        // 旧实现解析层 abs 后充放同显正功率，方向丢失
                        sub = stringResource(R.string.metric_power_prefix, when {
                            currentNow == null -> "— W"
                            currentNow > 0 -> "+${String.format(Locale.US, "%.2f", powerW)} W"
                            currentNow < 0 -> "-${String.format(Locale.US, "%.2f", abs(powerW))} W"
                            else -> String.format(Locale.US, "%.2f", powerW) + " W"
                        }),
                        accentColor = if ((currentNow ?: 0) > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
                    )
                    CyberMetricCardItem(
                        modifier = Modifier.weight(1f),
                        number = "12",
                        title = stringResource(R.string.metric_title_full_charge_capacity),
                        value = if (state.fullChargeCapacityMah != null) "${state.fullChargeCapacityMah}" else "—",
                        unit = if (state.fullChargeCapacityMah != null) "mAh" else "",
                        sub = if (state.isFullChargeConditionMet) stringResource(R.string.full_charge_sub_met)
                        else stringResource(R.string.full_charge_sub_unmet),
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
                // v2.0.0-alpha.3：历史经 StateFlow collect (VM 发布源头积累)
                // v2.0.0-beta.1 P0 GA 修复：+ 充放电会话统计 / 历史清空 / CSV 导出
                val telemetryHistory by viewModel.telemetryHistory.collectAsState()
                val chargeSessions by viewModel.chargeSessions.collectAsState()
                val context = LocalContext.current
                val shareScope = rememberCoroutineScope()
                TelemetryAnalysisScreen(
                    state,
                    telemetryHistory,
                    sessions = chargeSessions,
                    onExportSamples = {
                        shareScope.launch {
                            viewModel.exportSamplesCsv()?.let { intent ->
                                runCatching {
                                    context.startActivity(Intent.createChooser(intent, null))
                                }
                            }
                        }
                    },
                    onExportSessions = {
                        shareScope.launch {
                            viewModel.exportSessionsCsv()?.let { intent ->
                                runCatching {
                                    context.startActivity(Intent.createChooser(intent, null))
                                }
                            }
                        }
                    },
                    onClearHistory = { viewModel.clearTelemetryHistory() }
                )
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
            // (错误文案在组合期求值——stringResource 仅可在 @Composable 上下文调用)
            val errCapacityBlank = stringResource(R.string.calibrate_error_blank)
            val errCapacityNotPositive = stringResource(R.string.calibrate_error_not_positive)
            val errCapacityBelowMin = stringResource(
                R.string.calibrate_error_below_min, BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH
            )
            val errCapacityAboveMax = stringResource(
                R.string.calibrate_error_above_max, BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH
            )
            val submitCalibration: () -> Unit = {
                val parsed = capacityInput.toIntOrNull()
                inputError = when {
                    capacityInput.isBlank() -> errCapacityBlank
                    parsed == null || parsed <= 0 -> errCapacityNotPositive
                    parsed < BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH -> errCapacityBelowMin
                    parsed > BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH -> errCapacityAboveMax
                    else -> null
                }
                if (inputError == null && parsed != null) {
                    viewModel.setDesignCapacity(parsed)
                    showDesignCapacityDialog = false
                }
            }

            AlertDialog(
                onDismissRequest = { showDesignCapacityDialog = false },
                title = { Text(stringResource(R.string.calibrate_dialog_title)) },
                text = {
                    OutlinedTextField(
                        value = capacityInput,
                        onValueChange = { input ->
                            capacityInput = input.filter { it.isDigit() }.take(5)
                            inputError = null
                        },
                        label = { Text(stringResource(R.string.calibrate_field_label)) },
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
                        Text(stringResource(R.string.action_confirm), color = DesignTokens.BrandPrimaryLight)
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
                            Text(stringResource(R.string.action_restore_auto_detect), color = DesignTokens.TextSecondary)
                        }
                    }
                    TextButton(onClick = { showDesignCapacityDialog = false }) {
                        Text(stringResource(R.string.action_cancel), color = DesignTokens.TextSecondary)
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
            // v2.0.0-alpha.5 自检修复：三分支口径与指标 02 卡片完全一致——
            // 旧实现无条件渲染 "X / Y mAh"，容量不可测机型显示 "2400 / 0 mAh"
            // 矛盾读数 (库仑计实测值被塞进分母为 0 的槽位)
            Text(
                text = when {
                    state.hasMeasuredCapacity ->
                        stringResource(R.string.hero_remaining_measured, state.remainingCapacityMah, state.currentCapacityMah)
                    state.remainingCapacitySource == CapacitySource.COULOMB_COUNTER ->
                        stringResource(R.string.hero_remaining_coulomb, state.remainingCapacityMah)
                    else -> stringResource(R.string.hero_remaining_unmeasured)
                },
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
                        // v2.0.0-alpha.7：电压未实测时功率不可推导 (V×I 造假)，显示 "— W"
                        append(if (currentMa != null && state.voltageMeasured) "${if (powerW > 0) "+" else ""}${String.format(Locale.US, "%.2f", powerW)} W" else "— W")
                        append(" · ")
                        // v2.0.0-alpha.7：电压未实测时 Hero 不展示伪装读数 (默认 4000 mV)
                        append(if (state.voltageMeasured) "${String.format(Locale.US, "%.2f", state.voltageMv / 1000f)} V" else "— V")
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
                    text = stringResource(R.string.hardware_summary_title),
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
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_soc), value = state.socModel)
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_soc_vendor), value = state.socVendor)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_process), value = state.socProcess)
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_gpu), value = state.socGpu)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // CPU 架构文案较长，允许两行展示 (核心配置分级完整可读)
            HardwareItem(
                modifier = Modifier.fillMaxWidth(),
                label = stringResource(R.string.hw_label_cpu),
                value = state.socCpu,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(10.dp))

            // ===== 电源子系统区块 =====
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_pmic), value = state.pmicModel)
                // 快充协议实际值形如 "超级快充 (45.0 W) · 澎湃秒充 [品牌档案]"，
                // 半宽 chip 内单行必然截断，允许两行完整展示 (与 CPU 架构行同策略)
                HardwareItem(
                    modifier = Modifier.weight(1f),
                    label = stringResource(R.string.hw_label_fast_charge),
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
                    label = stringResource(R.string.hw_label_internal_resistance),
                    value = "${String.format(Locale.US, "%.1f", state.internalResistanceMohm)} mΩ ${state.internalResistanceLabel}",
                    maxLines = 2
                )
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_chemistry), value = state.batteryChemistry)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_cell_structure), value = state.cellStructure)
                HardwareItem(modifier = Modifier.weight(1f), label = stringResource(R.string.hw_label_system_interface), value = state.halVersion)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 指标 04 用户校准入口 (激活 ViewModel.setDesignCapacity，与 Web 端自定义容量对等)
            OutlinedButton(
                onClick = onCalibrateDesignCapacity,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = DesignTokens.AccentCyanDark)
            ) {
                Text(
                    text = stringResource(R.string.calibrate_button, state.designCapacityMah),
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
                    text = stringResource(R.string.lab_banner_title),
                    fontSize = DesignTokens.Font2xs,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextAmberStrong
                )
                Text(
                    text = stringResource(R.string.lab_banner_desc),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            TextButton(onClick = onExit) {
                Text(
                    text = stringResource(R.string.lab_banner_restore),
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
                    // v2.0.0-alpha.5 自检修复：标题口径更正为"(实测)"——锁定守卫
                    // (容量 ≤0 拒绝锁定 + 0 哨兵语义) 已保证真实锁定值仅来自
                    // sysfs/库仑计回归实测容量，旧"(估算)"标题与实测口径不符；
                    // 模拟演示值由"来源: 模拟" chip 显式区分
                    text = stringResource(R.string.full_charge_card_title),
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.FontXs,
                    color = Color.White
                )
                Text(
                    text = when (verdict) {
                        FullChargeVerdict.FULLY_CHARGED -> stringResource(R.string.full_charge_verdict_met)
                        FullChargeVerdict.CURRENT_UNAVAILABLE -> stringResource(R.string.full_charge_verdict_unreadable)
                        FullChargeVerdict.NOT_YET -> stringResource(R.string.full_charge_verdict_waiting)
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
                        stringResource(R.string.full_charge_capacity_pending)
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
                            text = stringResource(R.string.chip_history_lock),
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
                            text = stringResource(R.string.chip_source_simulated),
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
                    text = stringResource(R.string.full_charge_unsupported_note),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace,
                    color = DesignTokens.TextTertiary
                )
            }

            // 上次充满锁定时间 (激活 lastFullChargeTimestamp：持久化值跨重启回显)
            state.lastFullChargeTimestamp?.let { timestamp ->
                Text(
                    text = stringResource(
                        R.string.full_charge_last_lock,
                        SimpleDateFormat(
                            "yyyy-MM-dd HH:mm:ss",
                            Locale.getDefault()
                        ).format(Date(timestamp))
                    ),
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
                        stringResource(R.string.full_charge_simulating, simulationRemainingSec)
                    } else {
                        stringResource(R.string.full_charge_simulate_btn)
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
                        text = stringResource(R.string.full_charge_clear_records),
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
                    text = stringResource(R.string.about_title),
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
                text = stringResource(R.string.about_tagline),
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

            // v2.0.0-beta.1 P1 GA 修复：应用内隐私卡 (商店合规要求 + 用户透明度)。
            // 完整政策见仓库 PRIVACY.md，此处为安装即可见的摘要版
            Text(
                text = stringResource(R.string.about_privacy_title),
                fontSize = DesignTokens.FontXs,
                fontWeight = FontWeight.Bold,
                color = Color.White,
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
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
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
                    text = if (crashCount > 0) stringResource(R.string.about_crash_count, crashCount)
                    else stringResource(R.string.about_crash_none),
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextTertiary,
                    fontFamily = FontFamily.Monospace
                )
            }

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
            Text(
                text = stringResource(R.string.about_platforms),
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
fun TelemetryAnalysisScreen(
    state: BatteryState,
    history: List<BatteryState>,
    sessions: List<BatterySession> = emptyList(),
    onExportSamples: () -> Unit = {},
    onExportSessions: () -> Unit = {},
    onClearHistory: () -> Unit = {}
) {
    // v2.0.0-alpha.3 真实现：曲线历史由 BatteryViewModel.telemetryHistory 在发布
    // 源头积累 (1Hz 轮询 + 广播双通道、400ms 同拍节流、120 点滑窗)——跨 Tab 切换
    // 不丢失，实验室冻结/模拟保持期期间仍记录真实硬件读数。UI 层只消费不持有
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = stringResource(R.string.telemetry_title),
                fontWeight = FontWeight.Bold,
                fontSize = DesignTokens.FontXs,
                letterSpacing = 1.sp,
                color = DesignTokens.TextPrimary,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(top = 4.dp)
            )
            Text(
                text = stringResource(R.string.telemetry_subtitle),
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
                    title = stringResource(R.string.power_card_title),
                    value = when {
                        currentNow == null -> "—"
                        powerW >= 0f -> "+${String.format(Locale.US, "%.2f", powerW)}"
                        else -> "-${String.format(Locale.US, "%.2f", abs(powerW))}"
                    },
                    unit = if (currentNow != null) "W" else "",
                    sub = when {
                        currentNow == null -> stringResource(R.string.power_sub_unreadable)
                        currentNow > 0 -> stringResource(R.string.power_sub_charging)
                        currentNow < 0 -> stringResource(R.string.power_sub_discharging)
                        else -> stringResource(R.string.power_sub_float_cutoff)
                    },
                    accentColor = if ((currentNow ?: 0) > 0) DesignTokens.BrandPrimary else DesignTokens.AccentCyanDark
                )
                CyberMetricCardItem(
                    modifier = Modifier.weight(1f),
                    number = "T",
                    title = stringResource(R.string.temp_assessment_title),
                    value = String.format(Locale.US, "%.1f", state.temperatureCelsius),
                    unit = "°C",
                    sub = when {
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
                            stringResource(R.string.temp_state_overheat, BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt())
                        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
                            stringResource(
                                R.string.temp_state_warm,
                                BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt(),
                                BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()
                            )
                        state.temperatureCelsius <= 0 -> stringResource(R.string.temp_state_cold)
                        else -> stringResource(R.string.temp_state_normal)
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

        // v2.0.0-beta.1 P0 GA 修复：充放电会话统计 + 历史持久化操作
        // (会话跨进程重启持久恢复；CSV 导出经 FileProvider 分享；支持一键清空)
        item {
            SessionHistoryCard(
                sessions = sessions,
                hasSamples = history.isNotEmpty(),
                onExportSamples = onExportSamples,
                onExportSessions = onExportSessions,
                onClearHistory = onClearHistory
            )
        }

        item { Spacer(modifier = Modifier.height(28.dp)) }
    }
}

/**
 * v2.0.0-beta.1 P0 GA 修复：充放电会话统计卡 + 历史数据管理
 *
 * - 会话列表 (倒序展示最近 5 条)：类型/起止电量/Δ电量/时长/均值电流，
 *   跨进程重启从会话 JSONL 持久恢复；
 * - 样本/会话 CSV 导出 (FileProvider 分享)；一键清空全部历史。
 */
@Composable
fun SessionHistoryCard(
    sessions: List<BatterySession>,
    hasSamples: Boolean,
    onExportSamples: () -> Unit,
    onExportSessions: () -> Unit,
    onClearHistory: () -> Unit
) {
    var confirmClear by remember { mutableStateOf(false) }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DesignTokens.BgSurface, RoundedCornerShape(DesignTokens.RadiusCard))
            .border(1.dp, DesignTokens.Border, RoundedCornerShape(DesignTokens.RadiusCard))
            .padding(14.dp)
    ) {
        Text(
            text = stringResource(R.string.session_card_title),
            fontSize = DesignTokens.FontXs,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = stringResource(R.string.session_card_subtitle),
            fontSize = DesignTokens.Font2xs,
            color = DesignTokens.TextTertiary,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.height(10.dp))

        if (sessions.isEmpty()) {
            Text(
                text = stringResource(R.string.session_empty_hint),
                fontSize = DesignTokens.Font2xs,
                color = DesignTokens.TextTertiary,
                fontFamily = FontFamily.Monospace
            )
        } else {
            sessions.takeLast(5).reversed().forEach { s ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = s.type.label,
                        fontSize = DesignTokens.Font2xs,
                        color = if (s.type == BatterySession.SessionType.CHARGE) DesignTokens.BrandPrimary else DesignTokens.InfoSky,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "${s.startPercentage}% → ${s.endPercentage}% (${if (s.deltaPercentage >= 0) "+" else ""}${s.deltaPercentage}%)",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextPrimary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = formatSessionDuration(s.durationMs),
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = s.averageCurrentMa?.let { "${if (it >= 0) "+" else ""}$it mA" } ?: "—",
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        HorizontalDivider(color = DesignTokens.Border, thickness = 1.dp)
        Spacer(modifier = Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onExportSamples,
                enabled = hasSamples,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = DesignTokens.BgElevated,
                    contentColor = DesignTokens.BrandPrimary
                )
            ) {
                Text(
                    text = stringResource(R.string.export_curve_csv),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace
                )
            }
            Button(
                onClick = onExportSessions,
                enabled = sessions.isNotEmpty(),
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = DesignTokens.BgElevated,
                    contentColor = DesignTokens.BrandPrimary
                )
            ) {
                Text(
                    text = stringResource(R.string.export_session_csv),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace
                )
            }
            OutlinedButton(
                onClick = { confirmClear = true },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = DesignTokens.DangerRose)
            ) {
                Text(
                    text = stringResource(R.string.action_clear),
                    fontSize = DesignTokens.Font2xs,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            title = {
                Text(
                    text = stringResource(R.string.clear_history_dialog_title),
                    fontSize = DesignTokens.FontSm,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = stringResource(R.string.clear_history_dialog_body),
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary,
                    lineHeight = DesignTokens.FontXs
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    onClearHistory()
                    confirmClear = false
                }) {
                    Text(
                        text = stringResource(R.string.action_clear),
                        color = DesignTokens.DangerRose,
                        fontSize = DesignTokens.Font2xs
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmClear = false }) {
                    Text(
                        text = stringResource(R.string.action_cancel),
                        color = DesignTokens.TextSecondary,
                        fontSize = DesignTokens.Font2xs
                    )
                }
            },
            containerColor = DesignTokens.BgSurface
        )
    }
}

/** 会话时长格式化：<1min → "N s"；否则 "Xh Ym" / "Ym" */
internal fun formatSessionDuration(durationMs: Long): String {
    val totalSec = durationMs / 1000
    val h = totalSec / 3600
    val m = (totalSec % 3600) / 60
    val s = totalSec % 60
    return when {
        h > 0 -> "${h}h${m}m"
        m > 0 -> "${m}m${s}s"
        else -> "${s}s"
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
            text = stringResource(R.string.chart_title, history.size),
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
            listOf(
                stringResource(R.string.legend_voltage) to DesignTokens.InfoSky,
                stringResource(R.string.legend_current) to DesignTokens.BrandPrimary,
                stringResource(R.string.legend_temperature) to DesignTokens.WarningAmber
            )
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
            text = stringResource(R.string.source_card_title),
            fontSize = DesignTokens.FontXs,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.height(10.dp))
        val currentNow = state.currentNowMa
        val rows = listOf(
            stringResource(R.string.source_label_gauge_node) to state.gaugeNodePath,
            stringResource(R.string.source_label_current_source) to state.currentCapacitySource.label,
            // v2.0.0-alpha.5 自检修复：空标注不再是单一"未启用"——sysfs 实测优先时
            // 回归通道仍在持续积累样本作备用，旧文案"未启用 (无有效库仑计样本)"失实
            stringResource(R.string.source_label_full_regression) to state.capacityRegressionInfo.ifEmpty {
                if (state.hasMeasuredCapacity) stringResource(R.string.source_regression_backup)
                else stringResource(R.string.source_regression_disabled)
            },
            stringResource(R.string.source_label_coulomb_charge) to state.remainingCapacitySource.label,
            stringResource(R.string.source_label_current_now) to if (currentNow != null)
                stringResource(R.string.source_current_now_ok, if (currentNow > 0) "+$currentNow" else "$currentNow")
            else stringResource(R.string.source_current_now_unreadable),
            stringResource(R.string.source_label_engine_window) to
                stringResource(R.string.source_engine_window, state.engineSampleCount, state.engineConfidenceLabel),
            stringResource(R.string.source_label_channel) to stringResource(R.string.source_channel_value)
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
                    text = stringResource(R.string.health_profile_title),
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
                        text = if (state.capacityRegressionInfo.isEmpty())
                            stringResource(R.string.health_formula_base, state.currentCapacitySource.label, state.designCapacitySource.label)
                        else
                            stringResource(
                                R.string.health_formula_regression,
                                state.currentCapacitySource.label,
                                state.capacityRegressionInfo,
                                state.designCapacitySource.label
                            ),
                        fontSize = DesignTokens.Font2xs,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                } else {
                    Text(
                        text = stringResource(R.string.health_unmeasurable_big),
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Black,
                        color = DesignTokens.TextTertiary,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = stringResource(R.string.health_unmeasurable_note, state.gaugeNodePath),
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
                    title = stringResource(R.string.hw_label_internal_resistance),
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
                    title = stringResource(R.string.metric_title_cycles),
                    value = if (state.cycleCount > 0) "${state.cycleCount}" else "—",
                    unit = if (state.cycleCount > 0) stringResource(R.string.unit_times) else "",
                    sub = state.healthForecastText
                        ?: if (state.cycleCount > 0) "Cycle Count" else stringResource(R.string.cycles_sub_no_data),
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
                    text = stringResource(R.string.health_calibration_title),
                    fontSize = DesignTokens.FontXs,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.health_calibration_body_cv),
                    fontSize = DesignTokens.Font2xs,
                    color = DesignTokens.TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = stringResource(R.string.health_calibration_body_cutoff),
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
            stringResource(R.string.advice_overheat) to DesignTokens.DangerRose
        state.healthQuality == BatteryHealthQuality.DEAD ->
            stringResource(R.string.advice_dead) to DesignTokens.DangerRose
        state.healthQuality == BatteryHealthQuality.OVER_VOLTAGE ->
            stringResource(R.string.advice_over_voltage) to DesignTokens.DangerRose
        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C ->
            stringResource(R.string.advice_high_temp, BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()) to DesignTokens.DangerRose
        state.temperatureCelsius >= BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C ->
            stringResource(
                R.string.advice_warm_temp,
                BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C.toInt(),
                BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C.toInt()
            ) to DesignTokens.WarningAmber
        state.cycleCount >= 800 ->
            stringResource(R.string.advice_cycle_worn, state.cycleCount) to DesignTokens.WarningAmber
        state.hasMeasuredCapacity && state.healthPercentage in 1f..79.9f ->
            stringResource(R.string.advice_low_health, String.format(Locale.US, "%.1f", state.healthPercentage)) to DesignTokens.WarningAmber
        !state.hasMeasuredCapacity ->
            stringResource(R.string.advice_unmeasurable) to DesignTokens.TextTertiary
        else ->
            stringResource(R.string.advice_normal) to DesignTokens.BrandPrimary
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
                text = stringResource(R.string.health_advice_title),
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
