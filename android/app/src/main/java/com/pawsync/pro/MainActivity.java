package com.pawsync.pro;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.widget.Toast;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final int MAX_CRASH_COUNT = 3;
    private static final long CRASH_WINDOW_MS = 60000;
    private static final long CRASH_RECOVERY_DELAY_MS = 500;

    private final List<Long> crashTimestamps = new ArrayList<>();
    private Handler mainHandler;
    private boolean isRecovering = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        mainHandler = new Handler(Looper.getMainLooper());

        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            splashScreenView.remove();
        });

        splashScreen.setKeepOnScreenCondition(() -> false);

        super.onCreate(savedInstanceState);

        optimizeWindowRendering();
        setupRenderProcessGoneHandler();
    }

    private void setupRenderProcessGoneHandler() {
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            webView.setWebViewClient(new RenderProcessGoneWebViewClient());
        }
    }

    private class RenderProcessGoneWebViewClient extends WebViewClient {
        @Override
        public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
            handleRenderProcessGone(detail);
            return true;
        }
    }

    private void handleRenderProcessGone(android.webkit.RenderProcessGoneDetail detail) {
        long now = System.currentTimeMillis();
        crashTimestamps.add(now);

        while (!crashTimestamps.isEmpty() && now - crashTimestamps.get(0) > CRASH_WINDOW_MS) {
            crashTimestamps.remove(0);
        }

        int crashCount = crashTimestamps.size();

        if (crashCount >= MAX_CRASH_COUNT) {
            showCrashWarning(crashCount);
            reloadWebViewDelayed(2000);
        } else {
            reloadWebViewDelayed(CRASH_RECOVERY_DELAY_MS);
        }
    }

    private void showCrashWarning(int crashCount) {
        runOnUiThread(() -> {
            String message = String.format("页面渲染出现问题（%d次），正在尝试恢复...", crashCount);
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        });
    }

    private void reloadWebViewDelayed(long delayMs) {
        if (isRecovering) {
            return;
        }
        isRecovering = true;

        mainHandler.postDelayed(() -> {
            try {
                Bridge bridge = getBridge();
                if (bridge != null) {
                    WebView oldWebView = bridge.getWebView();
                    if (oldWebView != null) {
                        oldWebView.stopLoading();
                        oldWebView.destroy();
                    }

                    recreateBridgeWebView();
                }
            } catch (Exception e) {
                try {
                    recreate();
                } catch (Exception ex) {
                    // 忽略
                }
            } finally {
                isRecovering = false;
            }
        }, delayMs);
    }

    private void recreateBridgeWebView() {
        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }

        String currentUrl = null;
        WebView oldWebView = bridge.getWebView();
        if (oldWebView != null) {
            currentUrl = oldWebView.getUrl();
        }

        WebView newWebView = new WebView(this);
        setupWebViewSettings(newWebView);
        newWebView.setWebViewClient(new RenderProcessGoneWebViewClient());

        if (currentUrl != null && !currentUrl.isEmpty()) {
            newWebView.loadUrl(currentUrl);
        }
    }

    private void setupWebViewSettings(WebView webView) {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setBlockNetworkImage(false);
        settings.setEnableSmoothTransition(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    }

    private void optimizeWindowRendering() {
        getWindow().setFlags(
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        getWindow().setStatusBarColor(Color.parseColor("#EA580C"));
        getWindow().setNavigationBarColor(Color.parseColor("#F8FAFC"));
    }

    @Override
    public void onStart() {
        super.onStart();
        preloadWebView();
    }

    private void preloadWebView() {
        try {
            WebView webView = new WebView(this);
            webView.destroy();
        } catch (Exception e) {
            // 忽略预加载错误
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            optimizeWebView();
        }
    }

    private void optimizeWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();

            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

            settings.setEnableSmoothTransition(true);
            settings.setLoadsImagesAutomatically(true);
            settings.setBlockNetworkImage(false);

            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            settings.setJavaScriptEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
        }
    }
}
