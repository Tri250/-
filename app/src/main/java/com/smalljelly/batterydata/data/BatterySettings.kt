package com.smalljelly.batterydata.data

import android.content.Context

/**
 * 用户手动设置（SharedPreferences 持久化）。
 */
class BatterySettings(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /** 手动指定的设计容量，未设置时返回 null。 */
    fun manualDesignCapacityMah(): Float? =
        prefs.getFloat(KEY_MANUAL_DESIGN_MAH, 0f).takeIf { it > 0f }

    /** 设置 / 清除（传 null 恢复自动识别）。 */
    fun setManualDesignCapacityMah(mah: Float?) {
        prefs.edit().apply {
            if (mah == null) {
                remove(KEY_MANUAL_DESIGN_MAH)
            } else {
                putFloat(KEY_MANUAL_DESIGN_MAH, mah)
            }
        }.apply()
    }

    /** 顶栏模糊自检：不过滤、不淡出，直接贴内容副本（排查"看不见模糊"用） */
    fun topBlurSelfTest(): Boolean = prefs.getBoolean(KEY_TOP_BLUR_SELF_TEST, false)

    fun setTopBlurSelfTest(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_TOP_BLUR_SELF_TEST, enabled).apply()
    }

    /** 更新源：auto / github / gitee，默认自动（两个源都查） */
    fun updateSource(): String = prefs.getString(KEY_UPDATE_SOURCE, "auto") ?: "auto"

    fun setUpdateSource(value: String) {
        prefs.edit().putString(KEY_UPDATE_SOURCE, value).apply()
    }

    /** NexioUI 材质档：soft / liquid / frosted / none，默认柔和 */
    fun materialLevel(): String = prefs.getString(KEY_MATERIAL_LEVEL, "soft") ?: "soft"

    fun setMaterialLevel(value: String) {
        prefs.edit().putString(KEY_MATERIAL_LEVEL, value).apply()
    }

    /** 超级岛 / 流体云：充电时在顶部岛（小米 HyperOS）或流体云胶囊（OPPO ColorOS 16+）显示电量/功率，默认开启（不支持的设备自动 no-op） */
    fun islandEnabled(): Boolean = prefs.getBoolean(KEY_ISLAND_ENABLED, true)

    fun setIslandEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_ISLAND_ENABLED, enabled).apply()
    }

    private companion object {
        const val PREFS_NAME = "battery_settings"
        const val KEY_MANUAL_DESIGN_MAH = "manual_design_capacity_mah"
        const val KEY_TOP_BLUR_SELF_TEST = "top_blur_self_test"
        const val KEY_UPDATE_SOURCE = "update_source"
        const val KEY_MATERIAL_LEVEL = "material_level"
        const val KEY_ISLAND_ENABLED = "island_enabled"
    }
}
