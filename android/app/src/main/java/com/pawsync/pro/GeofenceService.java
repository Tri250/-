package com.pawsync.pro;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationServices;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 地理围栏服务插件
 * 支持进/出围栏事件检测和本地通知
 */
@CapacitorPlugin(
    name = "GeofenceService",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        ),
        @Permission(
            alias = "backgroundLocation",
            strings = {
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
            }
        )
    }
)
public class GeofenceService extends Plugin {

    private static final String TAG = "GeofenceService";
    private static final String CHANNEL_ID = "geofence";
    private static final int NOTIFICATION_ID = 1001;

    // 地理围栏客户端
    private GeofencingClient geofencingClient;
    
    // 存储所有围栏的回调
    private final Map<String, PluginCall> enterCallbacks = new HashMap<>();
    private final Map<String, PluginCall> exitCallbacks = new HashMap<>();
    
    // 存储所有围栏ID
    private final List<String> geofenceIds = new ArrayList<>();

    @Override
    public void load() {
        super.load();
        geofencingClient = LocationServices.getGeofencingClient(getContext());
        Log.d(TAG, "地理围栏服务已加载");
    }

    /**
     * 设置地理围栏
     * @param call Capacitor 插件调用
     *             latitude: 纬度
     *             longitude: 经度
     *             radius: 半径（米）
     */
    @PluginMethod
    public void setupGeofence(PluginCall call) {
        // 检查权限
        if (!hasLocationPermission()) {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }

        Double latitude = call.getDouble("latitude");
        Double longitude = call.getDouble("longitude");
        Double radius = call.getDouble("radius");
        String id = call.getString("id", UUID.randomUUID().toString());

        // 参数验证
        if (latitude == null || longitude == null || radius == null) {
            call.reject("缺少必要参数：latitude, longitude, radius");
            return;
        }

        try {
            // 创建地理围栏
            Geofence geofence = new Geofence.Builder()
                .setRequestId(id)
                .setCircularRegion(latitude, longitude, radius.floatValue())
                .setExpirationDuration(Geofence.NEVER_EXPIRE)
                .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER | Geofence.GEOFENCE_TRANSITION_EXIT)
                .build();

            // 创建围栏请求
            GeofencingRequest request = new GeofencingRequest.Builder()
                .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
                .addGeofence(geofence)
                .build();

            // 创建 PendingIntent
            PendingIntent pendingIntent = getGeofencePendingIntent(id);

            // 添加围栏
            if (ActivityCompat.checkSelfPermission(getContext(), 
                Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                
                geofencingClient.addGeofences(request, pendingIntent)
                    .addOnSuccessListener(aVoid -> {
                        geofenceIds.add(id);
                        JSObject result = new JSObject();
                        result.put("id", id);
                        result.put("success", true);
                        result.put("message", "地理围栏设置成功");
                        call.resolve(result);
                        Log.d(TAG, "地理围栏设置成功: " + id);
                    })
                    .addOnFailureListener(e -> {
                        call.reject("地理围栏设置失败: " + e.getMessage());
                        Log.e(TAG, "地理围栏设置失败", e);
                    });
            } else {
                call.reject("缺少位置权限");
            }
        } catch (Exception e) {
            call.reject("创建地理围栏异常: " + e.getMessage());
            Log.e(TAG, "创建地理围栏异常", e);
        }
    }

    /**
     * 移除地理围栏
     * @param call Capacitor 插件调用
     *             id: 围栏ID
     */
    @PluginMethod
    public void removeGeofence(PluginCall call) {
        String id = call.getString("id");

        if (id == null || id.isEmpty()) {
            call.reject("缺少围栏ID");
            return;
        }

        try {
            geofencingClient.removeGeofences(getGeofencePendingIntent(id))
                .addOnSuccessListener(aVoid -> {
                    geofenceIds.remove(id);
                    enterCallbacks.remove(id);
                    exitCallbacks.remove(id);
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "地理围栏已移除");
                    call.resolve(result);
                    Log.d(TAG, "地理围栏已移除: " + id);
                })
                .addOnFailureListener(e -> {
                    call.reject("移除地理围栏失败: " + e.getMessage());
                    Log.e(TAG, "移除地理围栏失败", e);
                });
        } catch (Exception e) {
            call.reject("移除地理围栏异常: " + e.getMessage());
            Log.e(TAG, "移除地理围栏异常", e);
        }
    }

    /**
     * 注册进入围栏回调
     * @param call Capacitor 插件调用
     *             id: 围栏ID
     *             callback: 回调函数
     */
    @PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    public void onGeofenceEnter(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("缺少围栏ID");
            return;
        }
        
        call.setKeepAlive(true);
        enterCallbacks.put(id, call);
        Log.d(TAG, "已注册进入围栏回调: " + id);
    }

    /**
     * 注册离开围栏回调
     * @param call Capacitor 插件调用
     *             id: 围栏ID
     *             callback: 回调函数
     */
    @PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    public void onGeofenceExit(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("缺少围栏ID");
            return;
        }
        
        call.setKeepAlive(true);
        exitCallbacks.put(id, call);
        Log.d(TAG, "已注册离开围栏回调: " + id);
    }

    /**
     * 获取所有围栏ID
     */
    @PluginMethod
    public void getAllGeofences(PluginCall call) {
        JSObject result = new JSObject();
        try {
            result.put("geofenceIds", geofenceIds);
            result.put("count", geofenceIds.size());
            call.resolve(result);
        } catch (JSONException e) {
            call.reject("获取围栏列表失败: " + e.getMessage());
        }
    }

    /**
     * 清除所有围栏
     */
    @PluginMethod
    public void clearAllGeofences(PluginCall call) {
        try {
            for (String id : new ArrayList<>(geofenceIds)) {
                geofencingClient.removeGeofences(getGeofencePendingIntent(id));
            }
            geofenceIds.clear();
            enterCallbacks.clear();
            exitCallbacks.clear();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "所有地理围栏已清除");
            call.resolve(result);
            Log.d(TAG, "所有地理围栏已清除");
        } catch (Exception e) {
            call.reject("清除围栏异常: " + e.getMessage());
            Log.e(TAG, "清除围栏异常", e);
        }
    }

    /**
     * 处理围栏事件（供外部调用）
     */
    public void handleGeofenceEvent(String geofenceId, int transitionType) {
        String event = transitionType == Geofence.GEOFENCE_TRANSITION_ENTER ? "enter" : "exit";
        Log.d(TAG, "围栏事件: " + geofenceId + " - " + event);

        // 发送本地通知
        sendLocalNotification(geofenceId, event);

        // 触发回调
        PluginCall callback = transitionType == Geofence.GEOFENCE_TRANSITION_ENTER 
            ? enterCallbacks.get(geofenceId) 
            : exitCallbacks.get(geofenceId);

        if (callback != null) {
            JSObject result = new JSObject();
            result.put("geofenceId", geofenceId);
            result.put("event", event);
            result.put("timestamp", System.currentTimeMillis());
            callback.resolve(result);
        }
    }

    /**
     * 发送本地通知
     */
    private void sendLocalNotification(String geofenceId, String event) {
        Context context = getContext();
        String title = event.equals("enter") ? "欢迎回家" : "离家提醒";
        String message = event.equals("enter") 
            ? "您已进入围栏区域，宠物们等您回来！" 
            : "您已离开围栏区域，记得查看宠物状态！";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_myplaces)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) 
            == PackageManager.PERMISSION_GRANTED) {
            notificationManager.notify(NOTIFICATION_ID + geofenceId.hashCode(), builder.build());
        }
    }

    /**
     * 获取地理围栏 PendingIntent
     */
    private PendingIntent getGeofencePendingIntent(String geofenceId) {
        Intent intent = new Intent(getContext(), GeofenceBroadcastReceiver.class);
        intent.putExtra("geofenceId", geofenceId);
        
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        
        return PendingIntent.getBroadcast(
            getContext(), 
            geofenceId.hashCode(), 
            intent, 
            flags
        );
    }

    /**
     * 检查位置权限
     */
    private boolean hasLocationPermission() {
        return getPermissionState("location") == PermissionState.GRANTED;
    }

    /**
     * 位置权限回调
     */
    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            // 权限已授予，重新执行设置围栏
            setupGeofence(call);
        } else {
            call.reject("位置权限被拒绝");
        }
    }
}