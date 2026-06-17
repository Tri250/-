package com.pawsync.pro;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

/**
 * PawSync 应用主类
 * 纯原生 Android 实现
 */
public class PawSyncApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        
        // 创建通知渠道
        createNotificationChannels();
    }

    /**
     * 创建通知渠道（Android 8.0+）
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            
            // 健康告警渠道
            NotificationChannel healthAlertChannel = new NotificationChannel(
                "health_alert",
                "健康告警",
                NotificationManager.IMPORTANCE_HIGH
            );
            healthAlertChannel.setDescription("宠物健康状态告警通知");
            healthAlertChannel.enableLights(true);
            healthAlertChannel.setLightColor(getColor(R.color.health_alert));
            manager.createNotificationChannel(healthAlertChannel);
            
            // 智能提醒渠道
            NotificationChannel reminderChannel = new NotificationChannel(
                "smart_reminder",
                "智能提醒",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            reminderChannel.setDescription("喂食、运动等日常提醒");
            manager.createNotificationChannel(reminderChannel);
            
            // 情感分析渠道
            NotificationChannel emotionChannel = new NotificationChannel(
                "emotion_analysis",
                "情感分析",
                NotificationManager.IMPORTANCE_LOW
            );
            emotionChannel.setDescription("宠物情感状态分析通知");
            manager.createNotificationChannel(emotionChannel);
            
            // 通用通知渠道
            NotificationChannel generalChannel = new NotificationChannel(
                "general",
                "通用通知",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            generalChannel.setDescription("应用通用通知");
            manager.createNotificationChannel(generalChannel);
        }
    }
}