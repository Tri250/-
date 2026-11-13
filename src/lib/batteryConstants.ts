/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BatteryStatus } from '../types/battery';

/**
 * 电池口径单源常量 (Web 演示端)
 *
 * 与 Android 端单一事实源 BatteryTelemetryParser 对齐：
 * android/app/src/main/java/com/battery/master/service/BatteryTelemetryParser.kt
 * 修改任一侧阈值/谓词时必须同步另一侧，避免双端口径漂移。
 */

/** 指标 07 温度分级：温控限流 (LIGHT_THROTTLE) 阈值 38.0℃，对齐 Android TEMP_WARM_THRESHOLD_C */
export const TEMP_WARM_C = 38;

/** 指标 07 温度分级：过热急停 (HEAVY_THROTTLE) 阈值 45.0℃，对齐 Android TEMP_OVERHEAT_THRESHOLD_C */
export const TEMP_OVERHEAT_C = 45;

/** 指标 12 充满判定：浮充截止电流上限 |I| ≤ 25 mA (含边界)，对齐 Android FULL_CHARGE_TRICKLE_MAX_MA */
export const FULL_CHARGE_TRICKLE_MAX_MA = 25;

/** 电池容量合理区间下限 (mAh)：区间外视为 sysfs 单位异常/脏数据，对齐 Android MIN_PLAUSIBLE_CAPACITY_MAH */
export const MIN_PLAUSIBLE_CAPACITY_MAH = 500;

/** 电池容量合理区间上限 (mAh)，对齐 Android MAX_PLAUSIBLE_CAPACITY_MAH (25000，覆盖三防大电池机) */
export const MAX_PLAUSIBLE_CAPACITY_MAH = 25000;

/**
 * 是否处于充电/满电状态：CHARGING 或 FULL 视为充电态，
 * 对齐 Android evaluateFullCharge 的 isCharging 口径 (防 100% 拔线后误判充满)
 */
export function isChargingStatus(status: BatteryStatus): boolean {
  return status === 'charging' || status === 'full';
}

/**
 * 指标 12 充满判定谓词：电量 100% 且充电态且 |瞬时电流| ≤ 25 mA 浮充截止区间。
 * 语义等价于 Android BatteryTelemetryParser.evaluateFullCharge 三态判定——
 * Web 端 current 恒有数值 (无"电流不可读"态)，取绝对值对齐 Android |currentMa| 口径。
 */
export function isFullChargeCriteriaMet(
  percentage: number,
  currentMa: number,
  isCharging: boolean
): boolean {
  return (
    percentage === 100 &&
    isCharging &&
    Math.abs(currentMa) <= FULL_CHARGE_TRICKLE_MAX_MA
  );
}
