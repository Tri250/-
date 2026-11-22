package com.smalljelly.batterydata.island

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.graphics.drawable.IconCompat
import com.smalljelly.batterydata.MainActivity
import com.smalljelly.batterydata.R
import com.smalljelly.batterydata.data.BatterySample
import com.smalljelly.batterydata.data.ChargeRecorder
import com.smalljelly.batterydata.data.RecorderState
import com.smalljelly.batterydata.shizuku.ShizukuManager
import java.util.concurrent.atomic.AtomicLong
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject

/**
 * 充电岛适配调度器：
 * - 小米超级岛（HyperOS 焦点通知），移植自 NexioSchedule 的 IslandNotificationHelper，
 *   把课程倒计时换成电池充电状态：充电中在屏幕顶部岛里显示电量 / 功率，展开看温度与预计充满时间。
 *   岛通知走 XMSF 通道，系统默认掐其网络 → 借 Shizuku 临时放行（见 [ShizukuManager]）。
 *   不支持岛的设备（persist.sys.feature.island=false）不走这条。
 * - OPPO 流体云（ColorOS 16+ Live Alerts）：见 [FluidCloudHelper]，按标准
 *   Android 16 实时更新通知渲染成胶囊，无需 Shizuku。
 * - 都不可用时回退谷歌原生实况通知（Live Update）。
 *
 * 每次电池采样由 [ChargeRecorder.onSample] 驱动进入 [onSample]，按机型能力择路。
 */
object BatteryIslandHelper {
    private const val TAG = "BatteryIslandHelper"
    private const val CHANNEL_ID = "battery_charge_island"
    private const val LIVE_CHANNEL_ID = "battery_charge_live"
    private const val BUSINESS_TAG = "battery_charge"
    const val ISLAND_NOTIFICATION_ID = 2001
    // 超级岛不可用时的谷歌原生实况通知（Live Update）兜底 ID
    const val LIVE_NOTIFICATION_ID = 2002

    private val sequenceCounter = AtomicLong(System.currentTimeMillis() / 1000)
    private val scope = CoroutineScope(Dispatchers.IO)
    // 串行化 disable→notify→enable，避免并发把 XMSF 网络状态搞乱
    private val bypassMutex = Mutex()
    // 岛是否已在显示：只有首次弹出大岛（enableFloat=true），后续刷新静默更新缩略态，
    // 与 NexioSchedule 一致——否则每次采样都弹大岛会很吵。
    private var islandShowing = false
    // 普通通知去重 + 节流：内容没变不重发；电量变化立即更新，功率抖动限频 20s，
    // 避免每次采样（前台页面 1 秒 / 记录服务 10 秒）都 notify() 导致通知不断刷新。
    private var lastFallbackKey: String? = null
    private var lastFallbackAt = 0L
    private var lastFallbackLevel = -1
    // 岛更新节流：首次必发；之后内容没变不重发，电量没变则限频 30s——
    // 避免高频采样时反复重发岛通知并 toggle XMSF 网络。
    private var lastIslandKey: String? = null
    private var lastIslandAt = 0L
    private var lastIslandLevel = -1

    fun init(context: Context) {
        ShizukuManager.init(context)
    }

    /** 设备是否支持超级岛（小米 HyperOS 特性开关）。 */
    fun isIslandSupported(context: Context): Boolean = try {
        val clazz = Class.forName("android.os.SystemProperties")
        val method = clazz.getMethod(
            "getBoolean",
            String::class.java,
            Boolean::class.javaPrimitiveType,
        )
        method.invoke(null, "persist.sys.feature.island", false) as Boolean
    } catch (e: Exception) {
        false
    }

    fun isShizukuAvailable(): Boolean =
        ShizukuManager.isShizukuRunning() && ShizukuManager.checkSelfPermission()

    fun requestShizukuPermission(callback: (Boolean) -> Unit) {
        ShizukuManager.requestPermission(callback)
    }

    private fun ensureChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "充电超级岛",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "充电时在小米超级岛显示电量与功率"
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    /**
     * 充电状态通知由采样链每次采样驱动：
     * - 充电中：小米岛支持且开启 → 发岛；OPPO 流体云支持且开启 → 发流体云胶囊；
     *   都不可用且不在记录中 → 回退谷歌原生实况通知（Live Update）。
     * - 非充电：收起岛、流体云与兜底通知。
     * 记录中（[RecorderState.Recording]）已有 ChargeRecordService 的实况通知(1001)，
     * 兜底不重复发；岛 / 流体云则与记录通知并存（岛看电量/功率，记录通知带「结束并保存」）。
     */
    fun onSample(context: Context, sample: BatterySample, enabled: Boolean) {
        if (!sample.isCharging) {
            cancel(context)
            return
        }
        val recording = ChargeRecorder.state.value is RecorderState.Recording
        when {
            isIslandSupported(context) && enabled -> sendOrUpdate(context, sample)

            FluidCloudHelper.isSupported() && enabled -> FluidCloudHelper.onSample(context, sample)

            !recording -> {
                Log.d(TAG, "island/fluid unavailable → Google live fallback")
                sendGoogleLiveFallback(context, sample)
            }
        }
    }

    fun sendOrUpdate(context: Context, sample: BatterySample) {
        if (!isIslandSupported(context)) return
        val firstPop = !islandShowing
        val now = System.currentTimeMillis()
        val key = "${sample.level}-${sample.powerW?.toInt()}"
        if (!firstPop) {
            if (key == lastIslandKey) return
            if (sample.level == lastIslandLevel && now - lastIslandAt < 30_000) return
        }
        lastIslandKey = key
        lastIslandAt = now
        lastIslandLevel = sample.level

        ensureChannel(context)
        // 岛与谷歌兜底互斥：发岛时收掉兜底
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(LIVE_NOTIFICATION_ID)

        val contentIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            ISLAND_NOTIFICATION_ID,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val powerText = sample.powerW?.let { "${it.toInt()}W" } ?: "充电中"
        val builder = Notification.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_charge)
            .setContentTitle("充电中 ${sample.level}%")
            .setContentText(powerText)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)

        val picsBundle = Bundle().apply {
            putParcelable("miui.focus.pic_app_icon", Icon.createWithResource(context, R.drawable.ic_launcher_flat))
            putParcelable("miui.focus.pic_app_icon_dark", Icon.createWithResource(context, R.drawable.ic_launcher_flat))
            putParcelable("miui.focus.pic_small", Icon.createWithResource(context, R.drawable.ic_launcher_flat))
            putParcelable("miui.focus.pic_small_dark", Icon.createWithResource(context, R.drawable.ic_launcher_flat))
        }
        builder.addExtras(Bundle().apply { putBundle("miui.focus.pics", picsBundle) })

        val notification = builder.build()
        // 首次弹大岛，之后静默更新缩略态（firstPop 在函数开头已算好）
        islandShowing = true
        notification.extras.putString("miui.focus.param", buildIslandParams(sample, firstPop))

        scope.launch { withShizukuBypass(context, notification) }
    }

    fun cancel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(ISLAND_NOTIFICATION_ID)
        manager.cancel(LIVE_NOTIFICATION_ID)
        // 流体云与岛互斥，取消时一并收掉
        FluidCloudHelper.cancel(context)
        islandShowing = false
        lastFallbackKey = null
        lastFallbackLevel = -1
        lastFallbackAt = 0L
        lastIslandKey = null
        lastIslandLevel = -1
        lastIslandAt = 0L
    }

    /** 超级岛不可用时的兜底：谷歌原生实况通知（Android 16 Live Update，低版本退回进度条）。 */
    fun sendGoogleLiveFallback(context: Context, sample: BatterySample) {
        val now = System.currentTimeMillis()
        val key = "${sample.level}-${sample.powerW?.toInt()}"
        val levelChanged = sample.level != lastFallbackLevel
        // 内容没变 → 不重发；功率抖动（电量没变）→ 距上次不足 20s 也不重发
        if (key == lastFallbackKey) return
        if (!levelChanged && now - lastFallbackAt < 20_000) return
        lastFallbackKey = key
        lastFallbackAt = now
        lastFallbackLevel = sample.level

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        ensureLiveChannel(context)
        manager.cancel(ISLAND_NOTIFICATION_ID)

        val open = PendingIntent.getActivity(
            context,
            LIVE_NOTIFICATION_ID,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val level = sample.level.coerceIn(0, 100)
        val powerText = sample.powerW?.let { String.format(java.util.Locale.US, "%.1fW", it) } ?: "充电中"
        val builder = NotificationCompat.Builder(context, LIVE_CHANNEL_ID)
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
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

        // Android 16+（含 ColorOS 16 流体云）：与 ChargeRecordService 同一套实时更新
        // 管线 —— ProgressStyle 进度 + setRequestPromotedOngoing，兜底也能成为真·实况
        // 通知 / 流体云胶囊。老系统退回普通进度条。
        if (Build.VERSION.SDK_INT >= 36) {
            builder
                .setStyle(
                    NotificationCompat.ProgressStyle()
                        .setProgress(level)
                        .setProgressSegments(listOf(NotificationCompat.ProgressStyle.Segment(100)))
                        .setProgressTrackerIcon(
                            IconCompat.createWithResource(context, R.drawable.ic_stat_charge),
                        )
                        .setStyledByProgress(true),
                )
                .setShortCriticalText(powerText)
            val canPromote = runCatching { manager.canPostPromotedNotifications() }.getOrDefault(true)
            if (canPromote) builder.setRequestPromotedOngoing(true)
        } else {
            // 老系统没有实时更新：挂一条普通进度条
            builder.setProgress(100, level, false)
        }
        manager.notify(LIVE_NOTIFICATION_ID, builder.build())
    }

    private fun ensureLiveChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(LIVE_CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(LIVE_CHANNEL_ID, "充电实况", NotificationManager.IMPORTANCE_LOW).apply {
                description = "充电时的谷歌原生实况通知（超级岛不可用时的兜底）"
                setShowBadge(false)
            },
        )
    }

    private suspend fun withShizukuBypass(context: Context, notification: Notification) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (!isShizukuAvailable()) {
            // 没授权也发：部分机型不掐 XMSF 网络仍能弹岛
            manager.notify(ISLAND_NOTIFICATION_ID, notification)
            return
        }
        bypassMutex.withLock {
            val disabled = try {
                ShizukuManager.setXmsfNetworkingEnabled(context, false)
            } catch (e: Exception) {
                Log.e(TAG, "disable XMSF networking failed", e)
                false
            }
            if (!disabled) {
                manager.notify(ISLAND_NOTIFICATION_ID, notification)
                return@withLock
            }
            try {
                manager.notify(ISLAND_NOTIFICATION_ID, notification)
                delay(100)
            } finally {
                try {
                    ShizukuManager.setXmsfNetworkingEnabled(context, true)
                } catch (e: Exception) {
                    Log.e(TAG, "CRITICAL: restore XMSF networking failed", e)
                }
            }
        }
    }

    /** 超级岛参数 JSON：缩略态左电量右功率，展开态温度/预计充满。结构对齐官方 param_v2。 */
    private fun buildIslandParams(sample: BatterySample, firstPop: Boolean): String {
        val powerText = sample.powerW?.let { "${it.toInt()}W" } ?: "充电中"
        val tempText = sample.temperatureC?.let { String.format(java.util.Locale.US, "%.1f°C", it) } ?: ""
        val etaText = sample.etaMinutes?.let { "预计 ${it / 60} 小时 ${it % 60} 分后充满" } ?: "正在充电"

        val paramV2 = JSONObject().apply {
            put("business", BUSINESS_TAG)
            put("protocol", 1)
            // 只有首次弹大岛；后续刷新 enableFloat=false 静默更新缩略态（NexioSchedule 同款）
            put("enableFloat", firstPop)
            if (!firstPop) put("islandFirstFloat", true)
            put("updatable", true)
            put("reopen", "reopen")
            put("sequence", sequenceCounter.incrementAndGet())
            put("aodTitle", "充电中 ${sample.level}%")

            put("baseInfo", JSONObject().apply {
                put("type", 2)
                put("title", "电池充电中")
                put("content", etaText)
                put("subTitle", "")
                put("extraTitle", "")
                put("specialTitle", "")
                put("subContent", "")
                put("picFunction", "")
                put("showDivider", true)
                put("showContentDivider", false)
                put("colorTitle", "#111111")
                put("colorTitleDark", "#ffffff")
                put("colorContent", "#333333")
                put("colorContentDark", "#cccccc")
            })

            put("picInfo", JSONObject().apply {
                put("type", 1)
                put("pic", "")
            })

            put("hintInfo", JSONObject().apply {
                put("type", 2)
                put("title", powerText)
                put("content", "充电功率")
                put("timerInfo", JSONObject().apply {
                    put("timerType", 0)
                    put("timerWhen", 0)
                    put("timerTotal", 0)
                    put("timerSystemCurrent", 0)
                })
                put("subContent", "电池温度")
                put("subTitle", tempText.ifEmpty { "—" })
                put("colorContent", "#666666")
                put("colorContentDark", "#aaaaaa")
                put("colorTitle", "#222222")
                put("colorTitleDark", "#eeeeee")
                put("colorSubContent", "#666666")
                put("colorSubContentDark", "#aaaaaa")
                put("colorSubTitle", "#222222")
                put("colorSubTitleDark", "#eeeeee")
            })

            put("param_island", JSONObject().apply {
                put("islandProperty", 1)
                put("islandTimeout", 3600)
                put("bigIslandArea", JSONObject().apply {
                    put("templateNo", 2)
                    put("imageTextInfoLeft", JSONObject().apply {
                        put("type", 1)
                        put("textInfo", JSONObject().apply {
                            put("title", "${sample.level}%")
                            put("content", "")
                            put("showHighlightColor", false)
                            put("narrowFont", false)
                        })
                    })
                    put("textInfo", JSONObject().apply {
                        put("frontTitle", "")
                        put("title", powerText)
                        put("content", "")
                        put("showHighlightColor", false)
                        put("narrowFont", false)
                    })
                })
                put("smallIslandArea", JSONObject().apply {
                    put("picInfo", JSONObject().apply {
                        put("type", 1)
                        put("pic", "miui.focus.pic_small")
                        put("picDark", "miui.focus.pic_small_dark")
                    })
                })
            })
        }
        return JSONObject().apply { put("param_v2", paramV2) }.toString()
    }
}