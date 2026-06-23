package com.pawsync.pro;

import android.app.Application;
import android.content.Context;
import android.os.Build;
import android.webkit.WebSettings;
import android.webkit.WebView;

import java.io.File;

public class PawSyncApplication extends Application {

    private static PawSyncApplication instance;
    private static final long MIN_CLEAR_INTERVAL_MS = 30000;
    private long lastCacheClearTime = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        initWebViewDataDirectory();
        configureWebViewSecurity();
        configureMemoryOptimization();
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

    private void configureWebViewSecurity() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WebView.startSafeBrowsing(this, value -> {
                    // 安全浏览初始化回调
                });
            }
        } catch (Exception e) {
            // 忽略安全浏览配置错误
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
            // 忽略配置错误
        }
    }

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

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        clearCacheIfNeeded(true);
        clearWebViewCache();
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);

        switch (level) {
            case TRIM_MEMORY_RUNNING_LOW:
                clearCacheIfNeeded(false);
                break;
            case TRIM_MEMORY_RUNNING_CRITICAL:
                clearCacheIfNeeded(true);
                clearWebViewCache();
                break;
            case TRIM_MEMORY_UI_HIDDEN:
                clearCacheIfNeeded(false);
                break;
            case TRIM_MEMORY_MODERATE:
                clearCacheIfNeeded(false);
                break;
            case TRIM_MEMORY_COMPLETE:
                clearCacheIfNeeded(true);
                clearWebViewCache();
                break;
        }
    }

    private void clearCacheIfNeeded(boolean force) {
        long now = System.currentTimeMillis();
        if (!force && now - lastCacheClearTime < MIN_CLEAR_INTERVAL_MS) {
            return;
        }
        lastCacheClearTime = now;

        try {
            deleteDir(getCacheDir());
            if (getExternalCacheDir() != null) {
                deleteDir(getExternalCacheDir());
            }
        } catch (Exception e) {
            // 忽略清理错误
        }
    }

    private void clearWebViewCache() {
        try {
            WebView webView = new WebView(this);
            webView.clearCache(true);
            webView.destroy();
        } catch (Exception e) {
            // 忽略WebView缓存清理错误
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

    public static PawSyncApplication getInstance() {
        return instance;
    }
}
