package com.pawsync.pro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;

/**
 * 地理围栏广播接收器
 * 处理地理围栏过渡事件
 */
public class GeofenceBroadcastReceiver extends BroadcastReceiver {

    private static final String TAG = "GeofenceReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "收到地理围栏广播");

        GeofencingEvent geofencingEvent = GeofencingEvent.fromIntent(intent);
        
        if (geofencingEvent == null) {
            Log.e(TAG, "地理围栏事件为空");
            return;
        }

        if (geofencingEvent.hasError()) {
            Log.e(TAG, "地理围栏错误: " + geofencingEvent.getErrorCode());
            return;
        }

        // 获取过渡类型
        int geofenceTransition = geofencingEvent.getGeofenceTransition();
        
        // 检查过渡类型
        if (geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER ||
            geofenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT) {
            
            // 获取触发的围栏
            for (Geofence geofence : geofencingEvent.getTriggeringGeofences()) {
                String geofenceId = geofence.getRequestId();
                Log.d(TAG, "围栏触发: " + geofenceId + ", 类型: " + 
                    (geofenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER ? "进入" : "离开"));
                
                // 通知服务处理事件
                notifyGeofenceService(context, geofenceId, geofenceTransition);
            }
        } else {
            Log.w(TAG, "未知的过渡类型: " + geofenceTransition);
        }
    }

    /**
     * 通知地理围栏服务
     */
    private void notifyGeofenceService(Context context, String geofenceId, int transitionType) {
        // 通过 MainActivity 获取插件实例并处理事件
        // 这里使用静态方法或事件总线来通知插件
        try {
            // 发送本地广播通知
            Intent serviceIntent = new Intent("com.pawsync.pro.GEOFENCE_EVENT");
            serviceIntent.putExtra("geofenceId", geofenceId);
            serviceIntent.putExtra("transitionType", transitionType);
            serviceIntent.setPackage(context.getPackageName());
            context.sendBroadcast(serviceIntent);
        } catch (Exception e) {
            Log.e(TAG, "通知服务失败", e);
        }
    }
}