package com.pawsync.pro;

import android.app.Application;
import android.content.Context;
import android.os.Build;

public class PawSyncApplication extends Application {

    private static PawSyncApplication instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        // 初始化WebView数据目录（Android 9+）
        initWebViewDataDirectory();

        // 内存优化配置
        configureMemoryOptimization();
    }

    private void initWebViewDataDirectory() {
        // Android 9+ 需要设置WebView数据目录
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                // 使用Android内置API设置WebView数据目录后缀
                android.webkit.WebView.setDataDirectorySuffix("pawsync_webview");
            } catch (Exception e) {
                // 忽略配置错误
            }
        }
    }

    private void configureMemoryOptimization() {
        // 内存优化：设置线程优先级
        Thread.currentThread().setPriority(Thread.NORM_PRIORITY);

        // 低内存设备优化
        if (isLowMemoryDevice()) {
            System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "2");
        }
    }

    private boolean isLowMemoryDevice() {
        android.app.ActivityManager am = (android.app.ActivityManager)
            getSystemService(Context.ACTIVITY_SERVICE);
        return am != null && am.isLowRamDevice();
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        // 低内存时清理缓存
        clearCache();
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        // 根据内存压力级别清理资源
        switch (level) {
            case TRIM_MEMORY_RUNNING_LOW:
            case TRIM_MEMORY_RUNNING_CRITICAL:
                // 运行时内存紧张，清理非关键资源
                clearCache();
                break;
            case TRIM_MEMORY_UI_HIDDEN:
                // UI隐藏，可以释放更多资源
                clearCache();
                System.gc();
                break;
            case TRIM_MEMORY_MODERATE:
            case TRIM_MEMORY_COMPLETE:
                // 内存严重不足，积极清理
                clearCache();
                System.gc();
                break;
        }
    }

    private void clearCache() {
        try {
            // 清理应用缓存
            getCacheDir().deleteOnExit();
            if (getExternalCacheDir() != null) {
                getExternalCacheDir().deleteOnExit();
            }
        } catch (Exception e) {
            // 忽略清理错误
        }
    }

    public static PawSyncApplication getInstance() {
        return instance;
    }
}
