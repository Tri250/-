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
import android.graphics.Color;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "PawSyncMain";

    private PawSyncNativeBridge nativeBridge;

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
     * 初始化原生桥接（在 WebView 就绪后调用）
     */
    private void initNativeBridge() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            nativeBridge = new PawSyncNativeBridge(this, webView);
            nativeBridge.register();
            Log.i(TAG, "Native bridge initialized");
        }
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
    public void onResume() {
        super.onResume();

        // 应用回到前台时重新检查主题
        applyThemeMode();

        // 恢复 WebView 状态
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onResume();
        }
    }

    @Override
    public void onPause() {
        super.onPause();

        // 暂停 WebView 以节省资源
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onPause();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // 应用进入后台时，通知 WebView
        if (nativeBridge != null && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('appBackground'))", null);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // 注销原生桥接
        if (nativeBridge != null) {
            nativeBridge.unregister();
            nativeBridge = null;
        }
    }

    @Override
    public void onBackPressed() {
        // 先让 WebView 处理返回键（支持 Web 端路由导航）
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            if (webView.canGoBack()) {
                webView.goBack();
                return;
            }
            // 通知 Web 端有返回键事件
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('androidBackPressed'))", null);
        }
        // 如果 Web 端没有处理，则退出 Activity
        super.onBackPressed();
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

        // 初始化原生桥接（首次 WebView 就绪时）
        if (nativeBridge == null) {
            initNativeBridge();
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