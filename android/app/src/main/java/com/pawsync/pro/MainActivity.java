package com.pawsync.pro;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.graphics.Color;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "PawSyncMain";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 安装启动画面（必须在super.onCreate之前）
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // 设置启动画面退出条件
        splashScreen.setKeepOnScreenCondition(() -> {
            // WebView 未加载完成前保持启动画面
            return getBridge() == null || getBridge().getWebView() == null;
        });

        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            splashScreenView.remove();
        });

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

        // 性能优化设置
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
