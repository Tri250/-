package com.pawsync.pro;

import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.graphics.Color;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.OnApplyWindowInsetsListener;
import androidx.appcompat.app.AppCompatDelegate;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "PawSyncMain";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 安装启动画面（必须在 super.onCreate 之前）
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // 启动画面退出条件：WebView 加载完成后才退出
        splashScreen.setKeepOnScreenCondition(() -> {
            return getBridge() == null || getBridge().getWebView() == null;
        });

        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            splashScreenView.remove();
        });

        super.onCreate(savedInstanceState);

        // 启用边到边显示（Android 15+ 默认行为）
        enableEdgeToEdge();

        // 根据当前主题模式设置状态栏
        applyThemeMode();

        // 优化窗口渲染
        optimizeWindowRendering();
    }

    /**
     * 启用边到边（Edge-to-Edge）显示
     * 让 WebView 内容延伸到状态栏和导航栏下方
     */
    private void enableEdgeToEdge() {
        Window window = getWindow();

        // 设置内容延伸到系统栏
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // 设置导航栏透明
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            window.setNavigationBarColor(Color.TRANSPARENT);
            window.setStatusBarColor(Color.TRANSPARENT);
        }

        // 设置系统栏图标颜色
        WindowInsetsController controller = window.getInsetsController();
        if (controller != null) {
            // 浅色背景：深色图标
            int currentNightMode = getResources().getConfiguration().uiMode
                & Configuration.UI_MODE_NIGHT_MASK;
            boolean isDark = currentNightMode == Configuration.UI_MODE_NIGHT_YES;

            if (isDark) {
                controller.setSystemBarsAppearance(0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            } else {
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            }
        }
    }

    /**
     * 根据当前主题模式应用颜色
     */
    private void applyThemeMode() {
        int currentNightMode = getResources().getConfiguration().uiMode
            & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDark = currentNightMode == Configuration.UI_MODE_NIGHT_YES;

        // 通知 WebView 当前主题模式
        applyThemeToWebView(isDark);
    }

    /**
     * 通过 JavaScript 接口将主题信息传递给 WebView
     */
    private void applyThemeToWebView(boolean isDark) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            String theme = isDark ? "dark" : "light";
            webView.evaluateJavascript(
                "document.documentElement.classList." + (isDark ? "add" : "remove") + "('dark');" +
                "window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: '" + theme + "' } }));",
                null
            );
        }
    }

    private void optimizeWindowRendering() {
        Window window = getWindow();

        // 硬件加速（默认已启用，显式确保）
        window.setFlags(
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // 设置窗口背景为透明（边到边模式）
        window.setBackgroundDrawable(null);
    }

    @Override
    protected void onResume() {
        super.onResume();

        // 应用回到前台时重新检查主题
        applyThemeMode();

        // 恢复 WebView 状态
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();

        // 暂停 WebView 以节省资源
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onPause();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        // 主题切换时更新系统栏
        int currentNightMode = newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDark = currentNightMode == Configuration.UI_MODE_NIGHT_YES;

        WindowInsetsController controller = getWindow().getInsetsController();
        if (controller != null) {
            if (isDark) {
                controller.setSystemBarsAppearance(0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            } else {
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            }
        }

        applyThemeToWebView(isDark);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            optimizeWebView();
        }
    }

    private void optimizeWebView() {
        if (getBridge() == null) {
            Log.w(TAG, "Bridge not yet initialized, skipping WebView optimization");
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            Log.w(TAG, "WebView not yet available, skipping optimization");
            return;
        }

        // 启用硬件加速渲染
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings settings = webView.getSettings();

        // 核心性能优化
        settings.setLoadsImagesAutomatically(true);
        settings.setBlockNetworkImage(false);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        // Android 缓存优化
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        // 文本缩放优化
        settings.setTextZoom(100);

        // 混合内容安全
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }

        // 视口适配
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // 允许文件访问（用于 WebView 内图片上传）
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // 设置用户代理
        String userAgent = settings.getUserAgentString();
        if (userAgent != null && !userAgent.contains("PawSync")) {
            settings.setUserAgentString(userAgent + " PawSync/1.0.0");
        }
    }
}