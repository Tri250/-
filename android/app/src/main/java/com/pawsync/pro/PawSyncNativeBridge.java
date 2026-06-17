package com.pawsync.pro;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.fragment.app.FragmentActivity;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * PawSyncNativeBridge — WebView ↔ Android 原生功能桥接
 *
 * 将所有 Android 原生能力通过 JavaScriptInterface 暴露给 WebView
 * 替换 Web 端降级方案，提供真正的原生体验
 */
public class PawSyncNativeBridge {
    private static final String TAG = "PawSyncBridge";

    private final Activity activity;
    private final WebView webView;
    private final BiometricAuthHelper biometricHelper;
    private final NotificationChannelHelper notificationHelper;

    private BatteryReceiver batteryReceiver;
    private ConnectivityReceiver connectivityReceiver;

    public PawSyncNativeBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.biometricHelper = new BiometricAuthHelper((FragmentActivity) activity);
        this.notificationHelper = new NotificationChannelHelper(activity);
    }

    /**
     * 注册所有原生桥接
     */
    public void register() {
        webView.addJavascriptInterface(this, "PawSyncNative");
        registerReceivers();
        Log.i(TAG, "Native bridge registered");
    }

    /**
     * 注销所有接收器
     */
    public void unregister() {
        unregisterReceivers();
    }

    // ============================================================
    // 生物识别
    // ============================================================

    @JavascriptInterface
    public String getBiometricStatus() {
        try {
            JSONObject result = new JSONObject();
            result.put("available", biometricHelper.isAvailable());
            result.put("message", biometricHelper.getAvailabilityMessage());
            result.put("status", biometricHelper.canAuthenticate());
            return result.toString();
        } catch (JSONException e) {
            return "{\"available\":false,\"message\":\"error\"}";
        }
    }

    @JavascriptInterface
    public void authenticateBiometric(String title, String subtitle) {
        // 参数验证
        if (title == null || title.isEmpty()) {
            title = "身份验证";
        }
        if (subtitle == null || subtitle.isEmpty()) {
            subtitle = "请验证您的身份";
        }
        // 限制参数长度防止滥用
        final String safeTitle = title.length() > 50 ? title.substring(0, 50) : title;
        final String safeSubtitle = subtitle.length() > 100 ? subtitle.substring(0, 100) : subtitle;
        
        activity.runOnUiThread(() -> {
            biometricHelper.authenticate(safeTitle, safeSubtitle,
                new BiometricAuthHelper.BiometricAuthCallback() {
                    @Override
                    public void onSuccess() {
                        callJS("window.dispatchEvent(new CustomEvent('biometricSuccess'))");
                    }

                    @Override
                    public void onError(int code, String message) {
                        callJS("window.dispatchEvent(new CustomEvent('biometricError', { detail: '" + message + "' }))");
                    }

                    @Override
                    public void onFailed() {
                        callJS("window.dispatchEvent(new CustomEvent('biometricFailed'))");
                    }
                });
        });
    }

    // ============================================================
    // 网络状态
    // ============================================================

    @JavascriptInterface
    public String getNetworkStatus() {
        try {
            JSONObject result = new JSONObject();
            ConnectivityManager cm = (ConnectivityManager)
                activity.getSystemService(Context.CONNECTIVITY_SERVICE);

            if (cm == null) {
                result.put("connected", false);
                result.put("type", "none");
                return result.toString();
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network network = cm.getActiveNetwork();
                if (network == null) {
                    result.put("connected", false);
                    result.put("type", "none");
                    return result.toString();
                }
                NetworkCapabilities caps = cm.getNetworkCapabilities(network);
                if (caps != null) {
                    result.put("connected", true);
                    result.put("metered", !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED));
                    if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        result.put("type", "wifi");
                    } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                        result.put("type", "cellular");
                    } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                        result.put("type", "ethernet");
                    } else {
                        result.put("type", "other");
                    }
                }
            } else {
                NetworkInfo info = cm.getActiveNetworkInfo();
                result.put("connected", info != null && info.isConnected());
                result.put("type", info != null ? info.getTypeName().toLowerCase() : "none");
            }
            return result.toString();
        } catch (JSONException e) {
            return "{\"connected\":false,\"type\":\"error\"}";
        }
    }

    // ============================================================
    // 电量状态
    // ============================================================

    @JavascriptInterface
    public String getBatteryStatus() {
        try {
            JSONObject result = new JSONObject();
            IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryIntent = activity.registerReceiver(null, filter);

            if (batteryIntent != null) {
                int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                int status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);

                float batteryPct = level * 100f / scale;
                result.put("level", Math.round(batteryPct));
                result.put("charging",
                    status == BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == BatteryManager.BATTERY_STATUS_FULL);
                result.put("lowPower", batteryPct < 15);
            }
            return result.toString();
        } catch (JSONException e) {
            return "{\"level\":-1,\"charging\":false}";
        }
    }

    // ============================================================
    // 设备信息
    // ============================================================

    @JavascriptInterface
    public String getDeviceInfo() {
        try {
            JSONObject result = new JSONObject();
            result.put("platform", "android");
            result.put("version", Build.VERSION.RELEASE);
            result.put("sdk", Build.VERSION.SDK_INT);
            result.put("manufacturer", Build.MANUFACTURER);
            result.put("model", Build.MODEL);
            result.put("brand", Build.BRAND);
            result.put("isLowRam", isLowRamDevice());
            result.put("language", java.util.Locale.getDefault().getLanguage());
            result.put("timezone", java.util.TimeZone.getDefault().getID());
            return result.toString();
        } catch (JSONException e) {
            return "{\"platform\":\"android\"}";
        }
    }

    // ============================================================
    // 应用信息
    // ============================================================

    @JavascriptInterface
    public String getAppInfo() {
        try {
            JSONObject result = new JSONObject();
            result.put("versionName", BuildConfig.VERSION_NAME);
            result.put("versionCode", BuildConfig.VERSION_CODE);
            result.put("packageName", activity.getPackageName());
            result.put("debug", BuildConfig.DEBUG);
            return result.toString();
        } catch (JSONException e) {
            return "{\"versionName\":\"unknown\"}";
        }
    }

    // ============================================================
    // 触觉反馈
    // ============================================================

    @JavascriptInterface
    public void hapticFeedback(String type) {
        if (webView != null) {
            switch (type) {
                case "light":
                    webView.performHapticFeedback(
                        android.view.HapticFeedbackConstants.KEYBOARD_TAP);
                    break;
                case "medium":
                    webView.performHapticFeedback(
                        android.view.HapticFeedbackConstants.LONG_PRESS);
                    break;
                case "heavy":
                    webView.performHapticFeedback(
                        android.view.HapticFeedbackConstants.CONTEXT_CLICK);
                    break;
                default:
                    webView.performHapticFeedback(
                        android.view.HapticFeedbackConstants.VIRTUAL_KEY);
                    break;
            }
        }
    }

    // ============================================================
    // 状态栏控制
    // ============================================================

    @JavascriptInterface
    public void setStatusBarColor(String color) {
        // 参数验证：只允许有效的颜色格式
        if (color == null || color.isEmpty()) {
            return;
        }
        // 验证颜色格式（#RRGGBB 或 #AARRGGBB）
        if (!color.matches("^#[0-9A-Fa-f]{6,8}$")) {
            Log.w(TAG, "Invalid status bar color format: " + color);
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                int c = android.graphics.Color.parseColor(color);
                activity.getWindow().setStatusBarColor(c);
            } catch (Exception e) {
                Log.w(TAG, "Invalid status bar color: " + color);
            }
        });
    }

    @JavascriptInterface
    public void setNavigationBarColor(String color) {
        // 参数验证：只允许有效的颜色格式
        if (color == null || color.isEmpty()) {
            return;
        }
        // 验证颜色格式（#RRGGBB 或 #AARRGGBB）
        if (!color.matches("^#[0-9A-Fa-f]{6,8}$")) {
            Log.w(TAG, "Invalid nav bar color format: " + color);
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                int c = android.graphics.Color.parseColor(color);
                activity.getWindow().setNavigationBarColor(c);
            } catch (Exception e) {
                Log.w(TAG, "Invalid nav bar color: " + color);
            }
        });
    }

    // ============================================================
    // 屏幕亮度
    // ============================================================

    @JavascriptInterface
    public void setScreenBrightness(float brightness) {
        // 参数验证：亮度范围 0.01 - 1.0
        if (brightness < 0.01f || brightness > 1.0f) {
            Log.w(TAG, "Invalid brightness value: " + brightness);
            return;
        }
        activity.runOnUiThread(() -> {
            android.view.Window window = activity.getWindow();
            android.view.WindowManager.LayoutParams lp = window.getAttributes();
            lp.screenBrightness = brightness;
            window.setAttributes(lp);
        });
    }

    @JavascriptInterface
    public float getScreenBrightness() {
        android.view.Window window = activity.getWindow();
        return window.getAttributes().screenBrightness;
    }

    // ============================================================
    // 保持屏幕常亮
    // ============================================================

    @JavascriptInterface
    public void keepScreenOn(boolean keepOn) {
        activity.runOnUiThread(() -> {
            if (keepOn) {
                activity.getWindow().addFlags(
                    android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                activity.getWindow().clearFlags(
                    android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
    }

    // ============================================================
    // 返回键
    // ============================================================

    @JavascriptInterface
    public void onBackPressed() {
        activity.runOnUiThread(activity::onBackPressed);
    }

    // ============================================================
    // 内部方法
    // ============================================================

    private void callJS(String js) {
        if (webView != null) {
            // 安全检查：只允许特定的事件调用
            if (js == null || !js.startsWith("window.dispatchEvent")) {
                Log.w(TAG, "Blocked potentially unsafe JS call");
                return;
            }
            // 移除可能的危险字符
            String sanitizedJs = js.replace("<", "&lt;")
                                    .replace(">", "&gt;")
                                    .replace("'", "\\'");
            webView.post(() -> webView.evaluateJavascript(sanitizedJs, null));
        }
    }

    private boolean isLowRamDevice() {
        android.app.ActivityManager am = (android.app.ActivityManager)
            activity.getSystemService(Context.ACTIVITY_SERVICE);
        return am != null && am.isLowRamDevice();
    }

    private void registerReceivers() {
        // 电池状态接收器
        batteryReceiver = new BatteryReceiver();
        IntentFilter batteryFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        batteryFilter.addAction(Intent.ACTION_BATTERY_LOW);
        batteryFilter.addAction(Intent.ACTION_POWER_CONNECTED);
        batteryFilter.addAction(Intent.ACTION_POWER_DISCONNECTED);
        // Android 13+ 需要指定导出状态
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(batteryReceiver, batteryFilter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            activity.registerReceiver(batteryReceiver, batteryFilter);
        }

        // 网络状态接收器
        connectivityReceiver = new ConnectivityReceiver();
        IntentFilter networkFilter = new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(connectivityReceiver, networkFilter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            activity.registerReceiver(connectivityReceiver, networkFilter);
        }
    }

    private void unregisterReceivers() {
        try {
            if (batteryReceiver != null) {
                activity.unregisterReceiver(batteryReceiver);
                batteryReceiver = null;
            }
            if (connectivityReceiver != null) {
                activity.unregisterReceiver(connectivityReceiver);
                connectivityReceiver = null;
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to unregister receivers", e);
        }
    }

    /**
     * 电池状态变化广播接收器
     */
    private class BatteryReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action == null) return;

            switch (action) {
                case Intent.ACTION_BATTERY_LOW:
                    callJS("window.dispatchEvent(new CustomEvent('batteryLow'))");
                    break;
                case Intent.ACTION_POWER_CONNECTED:
                    callJS("window.dispatchEvent(new CustomEvent('powerConnected'))");
                    break;
                case Intent.ACTION_POWER_DISCONNECTED:
                    callJS("window.dispatchEvent(new CustomEvent('powerDisconnected'))");
                    break;
                case Intent.ACTION_BATTERY_CHANGED:
                    callJS("window.dispatchEvent(new CustomEvent('batteryChanged'))");
                    break;
            }
        }
    }

    /**
     * 网络状态变化广播接收器
     */
    private class ConnectivityReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String status = getNetworkStatus();
            callJS("window.dispatchEvent(new CustomEvent('networkChanged', { detail: " + status + " }))");
        }
    }
}