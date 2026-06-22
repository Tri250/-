package com.pawsync.pro.plugins;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.pawsync.pro.MainActivity;

import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "PawSyncNotification")
public class NotificationPlugin extends Plugin {

    private static final String CHANNEL_ID = "pawsync_notifications";
    private static final String CHANNEL_NAME = "爪爪连心通知";
    private static final String CHANNEL_DESCRIPTION = "宠物健康提醒和通知";

    private NotificationManager notificationManager;
    private Map<String, Integer> notificationIds = new HashMap<>();

    @Override
    public void load() {
        notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription(CHANNEL_DESCRIPTION);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{100, 200, 100, 200});
            notificationManager.createNotificationChannel(channel);
        }
    }

    @PluginMethod
    public void showNotification(PluginCall call) {
        String title = call.getString("title", "通知");
        String body = call.getString("body", "");
        String id = call.getString("id", String.valueOf(System.currentTimeMillis()));
        String type = call.getString("type", "default");
        int priority = call.getInt("priority", 0);

        int notificationId = Math.abs(id.hashCode());
        notificationIds.put(id, notificationId);

        Intent intent = new Intent(getContext(), MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                getContext(),
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_ALL);

        switch (type) {
            case "health":
                builder.setColor(0xFF10B981);
                break;
            case "security":
                builder.setColor(0xFFEF4444);
                break;
            case "reminder":
                builder.setColor(0xFFF59E0B);
                break;
            default:
                builder.setColor(0xFFF97316);
        }

        Notification notification = builder.build();
        notificationManager.notify(notificationId, notification);

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("notificationId", id);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelNotification(PluginCall call) {
        String id = call.getString("id");
        if (id != null && notificationIds.containsKey(id)) {
            notificationManager.cancel(notificationIds.get(id));
            notificationIds.remove(id);
        }
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        notificationManager.cancelAll();
        notificationIds.clear();
        call.resolve();
    }

    @PluginMethod
    public void getPendingNotifications(PluginCall call) {
        JSObject result = new JSObject();
        result.put("count", notificationIds.size());
        result.put("ids", notificationIds.keySet().toArray());
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (notificationManager.areNotificationsEnabled()) {
                call.resolve();
            } else {
                Intent intent = new Intent("android.settings.APP_NOTIFICATION_SETTINGS");
                intent.putExtra("app_package", getContext().getPackageName());
                intent.putExtra("app_uid", getContext().getApplicationInfo().uid);
                getContext().startActivity(intent);
                call.resolve();
            }
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean enabled = notificationManager.areNotificationsEnabled();
        JSObject result = new JSObject();
        result.put("granted", enabled);
        call.resolve(result);
    }
}