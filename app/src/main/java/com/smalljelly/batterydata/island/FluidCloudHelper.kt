package com.smalljelly.batterydata.island

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.graphics.drawable.IconCompat
import com.smalljelly.batterydata.MainActivity
import com.smalljelly.batterydata.R
import com.smalljelly.batterydata.data.BatterySample
import java.util.Locale

/**
 * OPPO 流体云适配（ColorOS / OxygenOS / realmeUI）。
 *
 * ColorOS 16（Android 16 / API 36）起，OPPO 把 Android 16 的 Live Updates
 * （promoted ongoing notification，实时更新通知）接进了自家流体云：应用按**标准 API**
 * 发一条请求提升的实时通知（`POST_PROMOTED_NOTIFICATIONS` + `ProgressStyle` +
 * `setRequestPromotedOngoing`），系统就会把它渲染成状态栏流体云胶囊，展开可见进度条
 * 与文字。这条链路对三方 APK 完全公开 —— 无需 OPPO 开发者账号、无需泛在服务 UPK
 * 卡片包、无需 Shizuku（ColorOS 不像小米 XMSF 那样掐通知通道的网络）。
 *
 * ColorOS 15 及更早版本没有这条管线，第三方 APK 只能以普通常驻通知呈现，
 * 流体云区不会出胶囊 —— 所以 [isSupported] 只在 OPPO 家机型 + API 36+ 上为 true，
 * 更老的 ColorOS 由 [BatteryIslandHelper] 走谷歌实况通知兜底。
 *
 * 节流口径与小米岛 / 兜底通知一致：内容没变不重发；电量没变时功率抖动限频 20 秒。
 */
object FluidCloudHelper {
    private const val TAG = "FluidCloudHelper"
    private const val CHANNEL_ID = "battery_charge_fluid"

    /** 流体云通知 ID（与小米岛 2001 / 谷歌兜底 2002 互斥，见 BatteryIslandHelper） */
    private const val NOTIFICATION_ID = 2003

    /** Live Updates 需要 Android 16（API 36）；ColorOS 16 基于 Android 16 */
    private const val LIVE_UPDATES_API = 36

    // 节流状态：与 BatteryIslandHelper 的兜底通知同一套字段口径
    private var lastKey: String? = null
    private var lastAt = 0L
    private var lastLevel = -1

    private val OPPO_BRANDS = setOf("oppo", "oneplus", "realme", "oplus")

    /** OPPO 家族机型（ColorOS / OxygenOS / realmeUI）。 */
    fun isOppoFamily(): Boolean {
        val brand = Build.BRAND?.lowercase().orEmpty().trim()
        val manufacturer = Build.MANUFACTURER?.lowercase().orEmpty().trim()
        return brand in OPPO_BRANDS || manufacturer in OPPO_BRANDS
    }

    /** 是否支持流体云胶囊：OPPO 家机型且 ColorOS 16（Android 16）以上。 */
    fun isSupported(): Boolean = isOppoFamily() && Build.VERSION.SDK_INT >= LIVE_UPDATES_API

    /** 充电采样驱动：节流后发一条请求提升的实时通知（ColorOS 16 上即流体云胶囊）。 */
    fun onSample(context: Context, sample: BatterySample) {
        val now = System.currentTimeMillis()
        val key = "${sample.level}-${sample.powerW?.toInt()}"
        val levelChanged = sample.level != lastLevel
        // 内容没变 → 不重发；功率抖动（电量没变）→ 距上次不足 20s 不重发
        if (key == lastKey) return
        if (!levelChanged && now - lastAt < 20_000) return
        lastKey = key
        lastAt = now
        lastLevel = sample.level

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        ensureChannel(context)

        val open = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val level = sample.level.coerceIn(0, 100)
        val powerText = sample.powerW?.let { String.format(Locale.US, "%.1fW", it) } ?: "充电中"

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_charge)
            .setContentTitle("充电中 $level%")
            .setContentText(powerText)
            .setContentIntent(open)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

        if (Build.VERSION.SDK_INT >= LIVE_UPDATES_API) {
            // 系统提升成实时更新（流体云胶囊）的条件：ongoing、有 contentTitle、
            // 没有 RemoteViews、渠道不是 IMPORTANCE_MIN、清单里声明了
            // POST_PROMOTED_NOTIFICATIONS，并且显式请求提升。
            builder
                .setStyle(
                    NotificationCompat.ProgressStyle()
                        // 进度就是电量百分比，总刻度 100
                        .setProgress(level)
                        .setProgressSegments(listOf(NotificationCompat.ProgressStyle.Segment(100)))
                        .setProgressTrackerIcon(
                            IconCompat.createWithResource(context, R.drawable.ic_stat_charge),
                        )
                        // 让系统按进度决定配色；胶囊配色跟着电量走
                        .setStyledByProgress(true),
                )
                // 胶囊里直接显示充电功率（电量状态栏本身就有）
                .setShortCriticalText(powerText)

            // 用户可能在系统设置里关掉本应用的实时更新：关了就照常发普通常驻通知
            val canPromote = runCatching { manager.canPostPromotedNotifications() }
                .getOrDefault(true)
            if (canPromote) builder.setRequestPromotedOngoing(true)
        }

        runCatching { manager.notify(NOTIFICATION_ID, builder.build()) }
            .onFailure { Log.e(TAG, "notify fluid cloud failed", it) }
    }

    /** 停止充电 / 关掉开关：撤通知并复位节流状态。 */
    fun cancel(context: Context) {
        lastKey = null
        lastLevel = -1
        lastAt = 0L
        runCatching {
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .cancel(NOTIFICATION_ID)
        }
    }

    private fun ensureChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "充电流体云", NotificationManager.IMPORTANCE_LOW).apply {
                description = "充电时的流体云胶囊 / 实时更新通知（OPPO ColorOS）"
                setShowBadge(false)
            },
        )
    }
}
