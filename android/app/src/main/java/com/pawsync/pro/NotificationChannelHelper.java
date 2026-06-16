package com.pawsync.pro;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

/**
 * NotificationChannelHelper — 原生通知渠道管理
 *
 * Android 8.0+ 必须创建通知渠道才能发送通知
 * 与 Web 端通知功能完全对应
 */
public class NotificationChannelHelper {
    private static final String TAG = "PawSyncNotify";

    // 渠道 ID 常量
    public static final String CHANNEL_HEALTH_ALERTS = "pawsync_health_alerts";
    public static final String CHANNEL_REMINDERS = "pawsync_reminders";
    public static final String CHANNEL_EMOTION = "pawsync_emotion";
    public static final String CHANNEL_GENERAL = "pawsync_general";

    private final Context context;

    public NotificationChannelHelper(Context context) {
        this.context = context;
    }

    /**
     * 创建所有通知渠道
     * 在 Application.onCreate 中调用
     */
    public void createAllChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        // 健康告警渠道（高优先级）
        NotificationChannel healthChannel = new NotificationChannel(
            CHANNEL_HEALTH_ALERTS,
            "健康告警",
            NotificationManager.IMPORTANCE_HIGH
        );
        healthChannel.setDescription("宠物健康异常告警和紧急通知");
        healthChannel.enableVibration(true);
        healthChannel.setVibrationPattern(new long[]{0, 250, 250, 250});
        healthChannel.setShowBadge(true);
        manager.createNotificationChannel(healthChannel);

        // 提醒渠道（默认优先级）
        NotificationChannel reminderChannel = new NotificationChannel(
            CHANNEL_REMINDERS,
            "智能提醒",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        reminderChannel.setDescription("疫苗接种、驱虫、体检等定时提醒");
        reminderChannel.enableVibration(true);
        reminderChannel.setVibrationPattern(new long[]{0, 150, 150, 150});
        manager.createNotificationChannel(reminderChannel);

        // 情感通知渠道（低优先级）
        NotificationChannel emotionChannel = new NotificationChannel(
            CHANNEL_EMOTION,
            "情感分析",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        emotionChannel.setDescription("宠物情感状态变化通知");
        emotionChannel.enableVibration(true);
        emotionChannel.setVibrationPattern(new long[]{0, 100, 100});
        manager.createNotificationChannel(emotionChannel);

        // 通用渠道（最低优先级）
        NotificationChannel generalChannel = new NotificationChannel(
            CHANNEL_GENERAL,
            "通用通知",
            NotificationManager.IMPORTANCE_LOW
        );
        generalChannel.setDescription("应用更新、活动等通用通知");
        generalChannel.enableVibration(false);
        manager.createNotificationChannel(generalChannel);

        Log.i(TAG, "All notification channels created");
    }

    /**
     * 删除所有通知渠道
     */
    public void deleteAllChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        manager.deleteNotificationChannel(CHANNEL_HEALTH_ALERTS);
        manager.deleteNotificationChannel(CHANNEL_REMINDERS);
        manager.deleteNotificationChannel(CHANNEL_EMOTION);
        manager.deleteNotificationChannel(CHANNEL_GENERAL);
    }
}