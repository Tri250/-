package com.pawsync.pro;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.graphics.Color;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 安装启动画面（必须在super.onCreate之前）
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // 设置启动画面退出条件
        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            // 启动画面退出动画
            splashScreenView.remove();
        });

        // 保持启动画面直到WebView加载完成
        splashScreen.setKeepOnScreenCondition(() -> false);

        super.onCreate(savedInstanceState);

        // 优化窗口渲染
        optimizeWindowRendering();
    }

    private void optimizeWindowRendering() {
        // 启用硬件加速
        getWindow().setFlags(
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // 设置状态栏颜色
        getWindow().setStatusBarColor(Color.parseColor("#EA580C"));
        getWindow().setNavigationBarColor(Color.parseColor("#F8FAFC"));
    }

    @Override
    public void onStart() {
        super.onStart();
        // 预加载WebView（可选优化）
        preloadWebView();
    }

    private void preloadWebView() {
        // WebView预加载优化
        try {
            WebView webView = new WebView(this);
            webView.destroy();
        } catch (Exception e) {
            // 忽略预加载错误
        }
    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        super.onWindowVisibilityChanged(visibility);
        if (visibility == View.VISIBLE) {
            // 窗口可见时的优化
            optimizeWebView();
        }
    }

    private void optimizeWebView() {
        // 获取Capacitor的WebView并优化
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();

            // 启用硬件加速渲染
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

            // 性能优化设置
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            settings.setEnableSmoothTransition(true);
            settings.setLoadsImagesAutomatically(true);
            settings.setBlockNetworkImage(false);

            // 缓存优化
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // JavaScript优化
            settings.setJavaScriptEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
        }
    }
}
