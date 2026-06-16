package com.pawsync.pro;

import android.app.Application;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;
import android.webkit.WebView;

import androidx.appcompat.app.AppCompatDelegate;

public class PawSyncApplication extends Application {

    private static PawSyncApplication instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        // 启用暗色模式支持（跟随系统设置）
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);

        // 初始化WebView数据目录（Android 9+）
        initWebViewDataDirectory();

        // 内存优化配置
        configureMemoryOptimization();

        // 预初始化 WebView 引擎（减少首次加载延迟）
        prewarmWebView();
    }

    private void initWebViewDataDirectory() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                WebView.setDataDirectorySuffix("pawsync_webview");
            } catch (Exception e) {
                // 忽略配置错误
            }
        }
    }

    private void prewarmWebView() {
        // 在后台线程预初始化 WebView 引擎
        new Thread(() -> {
            try {
                // 触发 WebView 引擎初始化，加速首次加载
                WebView webView = new WebView(this);
                webView.destroy();
            } catch (Exception e) {
                // 忽略预热错误
            }
        }, "WebViewPrewarm").start();
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
            // 递归删除缓存目录内容
            deleteDirContents(getCacheDir());
            if (getExternalCacheDir() != null) {
                deleteDirContents(getExternalCacheDir());
            }
        } catch (Exception e) {
            // 忽略清理错误
        }
    }

    private void deleteDirContents(java.io.File dir) {
        if (dir == null || !dir.isDirectory()) return;
        java.io.File[] children = dir.listFiles();
        if (children != null) {
            for (java.io.File child : children) {
                if (child.isDirectory()) {
                    deleteDirContents(child);
                }
                child.delete();
            }
        }
    }

    public static PawSyncApplication getInstance() {
        return instance;
    }
}
