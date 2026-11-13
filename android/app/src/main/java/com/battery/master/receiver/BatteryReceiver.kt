package com.battery.master.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import com.battery.master.data.BatteryState
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatteryTelemetryParser

/**
 * 监听 Android 底层硬件广播 ACTION_BATTERY_CHANGED
 * 提取电压、温度、瞬时电流、健康状态并根据条件 12 判定完全充满
 * 设计容量等配置共享 BatteryHardwareReader 单一数据源，避免双通道数据不一致
 *
 * v1.2.1 自检优化：12 项指标解析统一收敛至 BatteryTelemetryParser，
 * 与轮询通道 (BatteryHardwareReader) 共用单一实现，从结构上保证
 * 双通道指标 12「完全充满容量」语义完全一致，杜绝两套并行解析的逻辑漂移。
 */
class BatteryReceiver(
    private val reader: BatteryHardwareReader,
    private val onBatteryUpdate: (BatteryState) -> Unit
) : BroadcastReceiver() {

    /**
     * 启动闪退治理：ACTION_BATTERY_CHANGED 是粘性广播，注册成功瞬间即在主线程同步回调
     * (ViewModel 构造期间)，BroadcastReceiver 未捕获异常会直接导致进程崩溃。
     * 因此整体包一层 Throwable 兜底：单次解析失败由 1 秒轮询通道自动补偿，绝不影响启动。
     */
    override fun onReceive(context: Context, intent: Intent) {
        try {
            handleBatteryChanged(context, intent)
        } catch (e: Throwable) {
            // 任何解析异常静默丢弃本次广播，轮询通道继续兜底，保证启动与运行期稳定
        }
    }

    private fun handleBatteryChanged(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BATTERY_CHANGED) return

        // 安全转换：极端场景下系统服务异常返回时静默丢弃本次广播，轮询通道继续兜底
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager ?: return

        // 12 项指标统一经共享解析器提取 (与轮询通道单一实现，语义零漂移)；
        // 设计容量来源随 Reader 单一数据源透传，双通道标注一致
        val raw = BatteryTelemetryParser.parse(
            intent,
            batteryManager,
            reader.designCapacityMah,
            reader.designCapacitySource
        )

        // 12. 完全充满时的容量：与轮询通道共享三态锁定逻辑，满足则锁定+持久化，
        // 未满足保留上次锁定值不抹除；先锁定再读时间戳保证回显值实时刷新
        // v1.2.6 P2 审计修复：充电态判定单源——直接消费解析器输出的 raw.isCharging
        // (含 EXTRA_PLUGGED 通道判定)，杜绝广播通道本地重复推导与解析口径漂移
        reader.lockFullChargeIfCriteriaMet(raw.currentCapacityMah, raw.percentage, raw.currentMa, raw.isCharging)

        // v1.2.3 P0 审计修复：真实锁定 (REAL) 与模拟演示值 (SIMULATED) 分离，
        // 双通道统一经 Reader 单一数据源解析展示值，广播通道不再冒充实测锁定
        val display = reader.resolveFullChargeDisplay()

        onBatteryUpdate(raw.toBatteryState(display.capacityMah, display.timestampMs, display.source))
    }
}
