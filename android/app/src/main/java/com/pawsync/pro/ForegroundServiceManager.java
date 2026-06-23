package com.pawsync.pro;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.pawsync.pro.MainActivity;

public class ForegroundServiceManager {

    private static final String TAG = "FgServiceManager";

    // 服务类型常量
    public static final String SERVICE_TYPE_CAMERA = "CAMERA";
    public static final String SERVICE_TYPE_MICROPHONE = "MICROPHONE";
    public static final String SERVICE_TYPE_MEDIA_PLAYBACK = "MEDIA_PLAYBACK";
    public static final String SERVICE_TYPE_LOCATION = "LOCATION";

    // 通知渠道
    private static final String CHANNEL_CAMERA = "pawsync_camera_service";
    private static final String CHANNEL_MICROPHONE = "pawsync_microphone_service";
    private static final String CHANNEL_MEDIA = "pawsync_media_service";
    private static final String CHANNEL_LOCATION = "pawsync_location_service";

    private static final String GROUP_KEY = "pawsync_foreground_services";

    private final Context context;
    private NotificationManager notificationManager;
    private boolean isRunning = false;
    private int currentNotificationId = 0;
    private String currentServiceType;

    public ForegroundServiceManager(Context context) {
        this.context = context.getApplicationContext();
        this.notificationManager = (NotificationManager)
            context.getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannels();
    }

    // ==================== 通知渠道管理 ====================

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel cameraChannel = new NotificationChannel(
                CHANNEL_CAMERA,
                "相机服务",
                NotificationManager.IMPORTANCE_LOW
            );
            cameraChannel.setDescription("使用相机时的前台服务通知");
            cameraChannel.setShowBadge(false);
            cameraChannel.setGroup(GROUP_KEY);

            NotificationChannel micChannel = new NotificationChannel(
                CHANNEL_MICROPHONE,
                "麦克风服务",
                NotificationManager.IMPORTANCE_LOW
            );
            micChannel.setDescription("使用麦克风时的前台服务通知");
            micChannel.setShowBadge(false);
            micChannel.setGroup(GROUP_KEY);

            NotificationChannel mediaChannel = new NotificationChannel(
                CHANNEL_MEDIA,
                "媒体播放服务",
                NotificationManager.IMPORTANCE_LOW
            );
            mediaChannel.setDescription("媒体播放时的前台服务通知");
            mediaChannel.setShowBadge(false);
            mediaChannel.setGroup(GROUP_KEY);

            NotificationChannel locationChannel = new NotificationChannel(
                CHANNEL_LOCATION,
                "位置服务",
                NotificationManager.IMPORTANCE_LOW
            );
            locationChannel.setDescription("使用位置服务时的前台服务通知");
            locationChannel.setShowBadge(false);
            locationChannel.setGroup(GROUP_KEY);

            notificationManager.createNotificationChannel(cameraChannel);
            notificationManager.createNotificationChannel(micChannel);
            notificationManager.createNotificationChannel(mediaChannel);
            notificationManager.createNotificationChannel(locationChannel);
        }
    }

    // ==================== 前台服务操作 ====================

    /**
     * 启动前台服务并返回 Notification
     * 调用者需要在 Service.startForeground() 中使用此 Notification
     * @param serviceType 服务类型：CAMERA, MICROPHONE, MEDIA_PLAYBACK, LOCATION
     * @param notificationId 通知 ID
     * @param title 通知标题
     * @param content 通知内容
     */
    public Notification startForeground(String serviceType, int notificationId,
                                        String title, String content) {
        return startForeground(serviceType, notificationId, title, content, null);
    }

    /**
     * 启动前台服务并返回 Notification（带 Service 引用，Android 16 适配）
     * @param service 当前 Service 实例（用于 Android 16+ 调用 startForeground）
     */
    public Notification startForeground(String serviceType, int notificationId,
                                        String title, String content, Service service) {
        currentServiceType = serviceType;
        currentNotificationId = notificationId;

        // Android 14+ 前台服务类型声明检查
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            validateForegroundServiceType(serviceType);
        }

        Notification notification = buildNotification(serviceType, notificationId, title, content);

        // Android 16+ 需要传入 foregroundServiceType 参数
        if (service != null) {
            int typeFlags = getForegroundServiceTypeValue(serviceType);
            if (Build.VERSION.SDK_INT >= 36 && typeFlags != 0) {
                service.startForeground(notificationId, notification, typeFlags);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE && typeFlags != 0) {
                service.startForeground(notificationId, notification, typeFlags);
            } else {
                service.startForeground(notificationId, notification);
            }
        }

        isRunning = true;
        return notification;
    }

    /**
     * 停止前台服务
     */
    public void stopForeground(Service service) {
        if (service != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                service.stopForeground(Service.STOP_FOREGROUND_REMOVE);
            } else {
                service.stopForeground(true);
            }
        }
        isRunning = false;
        currentServiceType = null;
        currentNotificationId = 0;
    }

    /**
     * 更新通知内容
     * @param title 新标题
     * @param content 新内容
     */
    public void updateNotification(String title, String content) {
        if (!isRunning || currentNotificationId == 0) {
            return;
        }

        Notification notification = buildNotification(
            currentServiceType, currentNotificationId, title, content);
        notificationManager.notify(currentNotificationId, notification);
    }

    // ==================== 通知构建 ====================

    private Notification buildNotification(String serviceType, int notificationId,
                                           String title, String content) {
        String channelId = getChannelIdForType(serviceType);
        int icon = getIconForType(serviceType);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, notificationId, launchIntent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(icon)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setGroup(GROUP_KEY)
            .setGroupSummary(false);

        // Android 16 兼容：确保通知可被用户看到
        if (Build.VERSION.SDK_INT >= 31) {
            builder.setForegroundServiceBehavior(
                NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);
        }

        return builder.build();
    }

    // ==================== 服务类型映射 ====================

    private String getChannelIdForType(String serviceType) {
        if (serviceType == null) {
            return CHANNEL_MEDIA;
        }
        switch (serviceType) {
            case SERVICE_TYPE_CAMERA:
                return CHANNEL_CAMERA;
            case SERVICE_TYPE_MICROPHONE:
                return CHANNEL_MICROPHONE;
            case SERVICE_TYPE_MEDIA_PLAYBACK:
                return CHANNEL_MEDIA;
            case SERVICE_TYPE_LOCATION:
                return CHANNEL_LOCATION;
            default:
                return CHANNEL_MEDIA;
        }
    }

    private int getIconForType(String serviceType) {
        // 使用应用图标作为通知图标
        return android.R.drawable.ic_media_play;
    }

    /**
     * 获取 Android 14+ Service.foregroundServiceType 常量值
     */
    public static int getForegroundServiceTypeValue(String serviceType) {
        if (serviceType == null) {
            return 0;
        }
        switch (serviceType) {
            case SERVICE_TYPE_CAMERA:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    return ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
                }
                return 0;
            case SERVICE_TYPE_MICROPHONE:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    return ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                }
                return 0;
            case SERVICE_TYPE_MEDIA_PLAYBACK:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    return ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
                }
                return 0;
            case SERVICE_TYPE_LOCATION:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    return ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION;
                }
                return 0;
            default:
                return 0;
        }
    }

    /**
     * Android 14+ 前台服务类型声明检查
     */
    private void validateForegroundServiceType(String serviceType) {
        // Android 14+ 需要在 Manifest 中声明对应的前台服务类型权限
        // 此方法仅做日志提醒
        String requiredPermission = getRequiredPermissionForType(serviceType);
        if (requiredPermission != null) {
            Log.d(TAG, "Service type " + serviceType + " requires permission: " + requiredPermission);
        }
    }

    private String getRequiredPermissionForType(String serviceType) {
        if (serviceType == null) {
            return null;
        }
        switch (serviceType) {
            case SERVICE_TYPE_CAMERA:
                return "android.permission.FOREGROUND_SERVICE_CAMERA";
            case SERVICE_TYPE_MICROPHONE:
                return "android.permission.FOREGROUND_SERVICE_MICROPHONE";
            case SERVICE_TYPE_MEDIA_PLAYBACK:
                return "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK";
            case SERVICE_TYPE_LOCATION:
                return "android.permission.FOREGROUND_SERVICE_LOCATION";
            default:
                return null;
        }
    }

    // ==================== 状态查询 ====================

    public boolean isRunning() {
        return isRunning;
    }

    public String getCurrentServiceType() {
        return currentServiceType;
    }

    public int getCurrentNotificationId() {
        return currentNotificationId;
    }
}
