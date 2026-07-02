package com.pawsync.pro;

import android.app.Activity;
import android.app.Application;
import android.content.ComponentCallbacks2;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;
import android.os.StrictMode;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;

import java.io.File;

public class PawSyncApplication extends Application {

    private static final String TAG = "PawSyncApp";
    private static PawSyncApplication instance;
    private static final long MIN_CLEAR_INTERVAL_MS = 30000;
    private long lastCacheClearTime = 0;

    // 前后台状态管理
    private int activityCount = 0;
    private boolean isForeground = false;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        // Debug 模式下启用 StrictMode
        configureStrictMode();

        // WebView 多进程安全
        initWebViewDataDirectory();

        // 网络安全配置初始化
        configureWebViewSecurity();

        // 内存优化
        configureMemoryOptimization();

        // 注册 Activity 生命周期回调
        registerActivityLifecycleCallbacks(lifecycleCallbacks);
    }

    // ==================== StrictMode 配置 ====================

    private void configureStrictMode() {
        if (!BuildConfig.DEBUG) {
            return;
        }

        StrictMode.setThreadPolicy(new StrictMode.ThreadPolicy.Builder()
            .detectAll()
            .penaltyLog()
            .build());

        StrictMode.setVmPolicy(new StrictMode.VmPolicy.Builder()
            .detectAll()
            .penaltyLog()
            .build());
    }

    // ==================== WebView 数据目录后缀 ====================

    private void initWebViewDataDirectory() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                // 使用进程 ID 作为后缀，确保多进程安全
                String suffix = "pawsync_webview_" + android.os.Process.myPid();
                WebView.setDataDirectorySuffix(suffix);
            } catch (Exception e) {
                Log.w(TAG, "Failed to set WebView data directory suffix", e);
            }
        }
    }

    // ==================== 网络安全配置 ====================

    private void configureWebViewSecurity() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WebView.startSafeBrowsing(this, value -> {
                    Log.d(TAG, "Safe browsing initialized: " + value);
                });
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to configure WebView security", e);
        }
    }

    public static void configureWebViewSettings(WebSettings settings) {
        if (settings == null) {
            return;
        }

        try {
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                settings.setSafeBrowsingEnabled(true);
            }

            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        } catch (Exception e) {
            Log.w(TAG, "Failed to configure WebView settings", e);
        }
    }

    // ==================== 内存优化 ====================

    private void configureMemoryOptimization() {
        Thread.currentThread().setPriority(Thread.NORM_PRIORITY);

        if (isLowMemoryDevice()) {
            System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "2");
        }
    }

    private boolean isLowMemoryDevice() {
        android.app.ActivityManager am = (android.app.ActivityManager)
            getSystemService(Context.ACTIVITY_SERVICE);
        return am != null && am.isLowRamDevice();
    }

    // ==================== Activity 生命周期回调 ====================

    private final Application.ActivityLifecycleCallbacks lifecycleCallbacks =
        new Application.ActivityLifecycleCallbacks() {

        @Override
        public void onActivityCreated(Activity activity, android.os.Bundle savedInstanceState) {
            // activityCount 仅在 onActivityStarted/onActivityStopped 中维护，
            // 避免创建/销毁周期导致计数错误
        }

        @Override
        public void onActivityStarted(Activity activity) {
            activityCount++;
            if (!isForeground && activityCount > 0) {
                isForeground = true;
                onAppForeground();
            }
        }

        @Override
        public void onActivityResumed(Activity activity) {
            // 不需要处理
        }

        @Override
        public void onActivityPaused(Activity activity) {
            // 不需要处理
        }

        @Override
        public void onActivityStopped(Activity activity) {
            activityCount--;
            if (isForeground && activityCount <= 0) {
                activityCount = 0;
                isForeground = false;
                onAppBackground();
            }
        }

        @Override
        public void onActivitySaveInstanceState(Activity activity, android.os.Bundle outState) {
            // 不需要处理
        }

        @Override
        public void onActivityDestroyed(Activity activity) {
            // 不需要处理
        }
    };

    private void onAppForeground() {
        Log.d(TAG, "App entered foreground");
    }

    private void onAppBackground() {
        Log.d(TAG, "App entered background");

        // Android 16 兼容：后台时清理敏感数据缓存
        if (Build.VERSION.SDK_INT >= 36) {
            clearWebViewCacheOnBackground();
        }
    }

    private void clearWebViewCacheOnBackground() {
        try {
            // 仅清理 WebView 私有目录，避免删除整个应用缓存
            File webviewCache = getDir("webview", MODE_PRIVATE);
            if (webviewCache != null) {
                deleteDir(webviewCache);
            }
            clearWebViewCache();
        } catch (Exception e) {
            Log.w(TAG, "Failed to clear WebView cache on background", e);
        }
    }

    // ==================== 内存压力回调 ====================

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        Log.w(TAG, "onLowMemory triggered");
        clearCacheIfNeeded(true);
        clearWebViewCache();
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);

        switch (level) {
            case ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW:
                clearCacheIfNeeded(false);
                break;
            case ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL:
                clearCacheIfNeeded(true);
                clearWebViewCache();
                break;
            case ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN:
                clearCacheIfNeeded(false);
                break;
            case ComponentCallbacks2.TRIM_MEMORY_MODERATE:
                clearCacheIfNeeded(false);
                break;
            case ComponentCallbacks2.TRIM_MEMORY_COMPLETE:
                clearCacheIfNeeded(true);
                clearWebViewCache();
                break;
            default:
                // 其他级别按需轻量清理
                clearCacheIfNeeded(false);
                break;
        }
    }

    // ==================== 缓存清理 ====================

    private void clearCacheIfNeeded(boolean force) {
        long now = System.currentTimeMillis();
        if (!force && now - lastCacheClearTime < MIN_CLEAR_INTERVAL_MS) {
            return;
        }
        lastCacheClearTime = now;

        try {
            // 仅清理外部缓存与 WebView 相关缓存，避免删除整个内部缓存目录导致运行中异常
            if (getExternalCacheDir() != null) {
                deleteDir(getExternalCacheDir());
            }
            clearWebViewCache();
        } catch (Exception e) {
            Log.w(TAG, "Failed to clear cache", e);
        }
    }

    /**
     * 修复内存泄漏：不再创建新 WebView 来清理缓存
     * 使用 WebView 的静态方法或直接删除缓存文件
     */
    private void clearWebViewCache() {
        try {
            // 方法1：使用应用上下文直接删除 WebView 缓存目录
            File webviewCacheDir = getDir("webview", MODE_PRIVATE);
            if (webviewCacheDir != null && webviewCacheDir.exists()) {
                File cacheSubDir = new File(webviewCacheDir, "Cache");
                if (cacheSubDir.exists()) {
                    deleteDir(cacheSubDir);
                }
            }

            // 方法2：清理应用缓存目录中的 WebView 相关文件
            File appCache = getCacheDir();
            if (appCache != null && appCache.exists()) {
                File[] files = appCache.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (file.getName().contains("webview") || file.getName().contains("WebView")) {
                            deleteDir(file);
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to clear WebView cache", e);
        }
    }

    private boolean deleteDir(File dir) {
        if (dir != null && dir.isDirectory()) {
            String[] children = dir.list();
            if (children != null) {
                for (String child : children) {
                    boolean success = deleteDir(new File(dir, child));
                    if (!success) {
                        return false;
                    }
                }
            }
            return dir.delete();
        } else {
            return dir != null && dir.isFile() && dir.delete();
        }
    }

    // ==================== 公共方法 ====================

    public static PawSyncApplication getInstance() {
        return instance;
    }

    /**
     * 供其他组件使用：判断应用是否在前台
     */
    public boolean isForeground() {
        return isForeground;
    }

    /**
     * 供其他组件使用：获取当前 Activity 计数
     */
    public int getActivityCount() {
        return activityCount;
    }
}
