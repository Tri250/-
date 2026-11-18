package com.battery.master.ui.derived

import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * 续航测算方向 (与 BatteryStatus 语义对齐，但独立于 UI)
 */
enum class RuntimeDirection {
    /** 放电中：按当前耗电电流线性外推剩余可用时长 */
    DISCHARGE,

    /** 充电中：按当前充电电流线性外推距充满时长 */
    CHARGE,

    /** 浮充/待机：电流在死区内，无有效外推基准 */
    IDLE,

    /** 电流不可读：诚实不测算 */
    UNREADABLE
}

/**
 * 续航测算结果 (纯数据，UI 只消费)
 *
 * @param hours 预计小时数 (DISCHARGE=剩余可用 / CHARGE=距充满)；<=0 表示无有效测算
 * @param formatted 人类可读时长 ("9h10m" / "48m")
 * @param direction 测算方向
 * @param basisLabel 测算依据口径 (库仑计实测 / 百分比估算)
 */
data class RuntimeEstimate(
    val hours: Float,
    val formatted: String,
    val direction: RuntimeDirection,
    val basisLabel: String
)

/**
 * 续航/充满时长测算 (纯函数，零 Android 依赖，可单测)
 *
 * 口径 (与数据诚实性红线一致)：
 * - 电流不可读 (currentMa == null) → UNREADABLE，不虚构时长；
 * - 剩余电荷基准优先库仑计实测 (remainingCapacityMah + COULOMB_COUNTER 口径)，
 *   否则回退 百分比 × 当前容量 (ESTIMATED 口径，明确标注)；
 * - 当前容量不可得 (0) 时不外推充电时长；
 * - |I| < 50 mA 视为浮充/待机死区，线性外推会产出夸张时长，诚实不测算。
 */
object RuntimeScore {

    /** 浮充/待机死区阈值 (mA)：低于该值的线性外推不具参考意义 */
    const val IDLE_CURRENT_MA = 50

    fun estimate(state: BatteryState): RuntimeEstimate {
        val currentMa = state.currentMa
            ?: return RuntimeEstimate(
                hours = 0f,
                formatted = "",
                direction = RuntimeDirection.UNREADABLE,
                basisLabel = ""
            )

        if (abs(currentMa) < IDLE_CURRENT_MA) {
            return RuntimeEstimate(0f, "", RuntimeDirection.IDLE, "")
        }

        // 剩余电荷基准：库仑计实测优先，其次百分比 × 当前容量估算
        val coulombMeasured = state.remainingCapacitySource ==
            com.battery.master.data.CapacitySource.COULOMB_COUNTER && state.remainingCapacityMah > 0
        val remainingMah: Int
        val basisLabel: String
        if (coulombMeasured) {
            remainingMah = state.remainingCapacityMah
            basisLabel = BASIS_COULOMB
        } else if (state.currentCapacityMah > 0) {
            remainingMah = (state.currentCapacityMah * state.percentage / 100f).roundToInt()
            basisLabel = BASIS_ESTIMATED
        } else {
            return RuntimeEstimate(0f, "", RuntimeDirection.UNREADABLE, "")
        }

        val hours: Float
        val direction: RuntimeDirection
        if (currentMa < 0) {
            // 放电：剩余电荷 ÷ 耗电速度
            hours = remainingMah / abs(currentMa).toFloat()
            direction = RuntimeDirection.DISCHARGE
        } else {
            // 充电：距充满电荷 ÷ 充电速度 (当前容量不可得时不外推)
            if (state.currentCapacityMah <= 0) {
                return RuntimeEstimate(0f, "", RuntimeDirection.UNREADABLE, "")
            }
            val toFull = (state.currentCapacityMah - remainingMah).coerceAtLeast(0)
            hours = toFull / currentMa.toFloat()
            direction = RuntimeDirection.CHARGE
        }

        if (hours <= 0f) {
            return RuntimeEstimate(0f, "", direction, basisLabel)
        }
        return RuntimeEstimate(hours, formatDuration(hours), direction, basisLabel)
    }

    /**
     * 时长格式化：>= 24h → "Nd Mh"；>= 1h → "Xh Ym"；否则 "Nm"
     * (分钟按四舍五入进位，0 分钟显示 "<1m")
     */
    fun formatDuration(hours: Float): String {
        if (hours <= 0f) return "<1m"
        val totalMinutes = (hours * 60f).roundToInt()
        if (totalMinutes <= 0) return "<1m"
        val days = totalMinutes / (60 * 24)
        val h = (totalMinutes % (60 * 24)) / 60
        val m = totalMinutes % 60
        return when {
            days > 0 -> "${days}d${h}h"
            h > 0 -> "${h}h${m}m"
            else -> "${m}m"
        }
    }

    /** 是否充电态 (与 BatteryStatus.CHARGING 同义，供 UI 分支) */
    fun isCharging(state: BatteryState): Boolean = state.status == BatteryStatus.CHARGING

    const val BASIS_COULOMB = "BASIS_COULOMB"
    const val BASIS_ESTIMATED = "BASIS_ESTIMATED"
}
