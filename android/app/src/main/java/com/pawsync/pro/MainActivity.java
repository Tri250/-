package com.pawsync.pro;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
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

    // Activity Result Launchers
    private ActivityResultLauncher<Intent> photoPickerLauncher;
    private ActivityResultLauncher<Uri> cameraLauncher;

    // Deep link callback
    private String pendingDeepLink;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        mainHandler = new Handler(Looper.getMainLooper());

        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            splashScreenView.remove();
        });
        splashScreen.setKeepOnScreenCondition(() -> false);

        // 注册 Activity Result Launchers（必须在 super.onCreate 之前）
        registerActivityResultLaunchers();

        super.onCreate(savedInstanceState);

        optimizeWindowRendering();
        setupRenderProcessGoneHandler();

        // 处理启动 Intent（深度链接）
        handleIntent(getIntent());
    }

    private void registerActivityResultLaunchers() {
        // Photo Picker launcher — 结果由 Capacitor Bridge 的 onActivityResult 统一处理
        photoPickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                // 不在此处重复调用 onActivityResult，避免双重处理
                // Capacitor Bridge 会通过 super.onActivityResult 自动接收
            }
        );

        // Camera launcher
        cameraLauncher = registerForActivityResult(
            new ActivityResultContracts.TakePicture(),
            success -> {
                // 结果由 Capacitor Bridge 的 onActivityResult 统一处理
            }
        );
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        // 转发权限结果给 Capacitor Bridge
        Bridge bridge = getBridge();
        if (bridge != null) {
            bridge.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // 转发结果给 Capacitor Bridge
        Bridge bridge = getBridge();
        if (bridge != null) {
            bridge.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);

        // 通知 Capacitor Bridge 新 Intent
        Bridge bridge = getBridge();
        if (bridge != null) {
            bridge.onNewIntent(intent);
        }
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        // 通知 WebView 深色模式变化等配置更改
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();

            int nightMode = newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK;
            if (nightMode == Configuration.UI_MODE_NIGHT_YES) {
                // 深色模式 - WebView 会根据媒体查询自动适配
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android 10+ WebView 自动处理 prefers-color-scheme
                }
            }
        }
    }

    // ==================== 深度链接处理 ====================

    private void handleIntent(Intent intent) {
        if (intent == null) {
            return;
        }

        String action = intent.getAction();
        Uri data = intent.getData();

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String deepLinkUrl = data.toString();

            // 处理自定义 scheme: com.pawsync.pro://
            if (data.getScheme() != null && data.getScheme().equals("com.pawsync.pro")) {
                notifyDeepLink(deepLinkUrl);
                return;
            }

            // 处理 https://pawsync.com App Links
            if (data.getScheme() != null && data.getScheme().equals("https")
                && data.getHost() != null
                && (data.getHost().equals("pawsync.com") || data.getHost().equals("www.pawsync.com"))) {
                notifyDeepLink(deepLinkUrl);
                return;
            }
        }
    }

    private void notifyDeepLink(String url) {
        Bridge bridge = getBridge();
        if (bridge != null) {
            // 通过 JS 接口通知前端
            bridge.evalJs("window.dispatchEvent(new CustomEvent('deepLink', { detail: { url: '" + url + "' } }))", null);
        } else {
            // Bridge 尚未就绪，缓存深度链接
            pendingDeepLink = url;
        }
    }

    // ==================== 图片选择方法 ====================

    public void launchPhotoPicker(Intent intent) {
        if (photoPickerLauncher != null) {
            photoPickerLauncher.launch(intent);
        }
    }

    public void launchCamera(Uri imageUri) {
        if (cameraLauncher != null) {
            cameraLauncher.launch(imageUri);
        }
    }

    private int getPhotoPickerRequestCode() {
        return 1001;
    }

    private int getCameraRequestCode() {
        return 1002;
    }

    // ==================== WebView 崩溃恢复 ====================

    private void setupRenderProcessGoneHandler() {
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            webView.setWebViewClient(new RenderProcessGoneWebViewClient());
        }
    }

    private class RenderProcessGoneWebViewClient extends WebViewClient {
        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            handleRenderProcessGone(detail);
            return true;
        }
    }

    private void handleRenderProcessGone(RenderProcessGoneDetail detail) {
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

            // 修复内存泄漏：移除所有 views 和 callbacks
            if (oldWebView.getParent() instanceof ViewGroup) {
                ((ViewGroup) oldWebView.getParent()).removeAllViews();
            }
            oldWebView.setWebViewClient(null);
            oldWebView.setWebChromeClient(null);
            oldWebView.stopLoading();
            oldWebView.destroy();
        }

        // 通过 Bridge 的 loadUrl 方法重新加载，确保 Bridge 内部状态正确绑定
        if (currentUrl != null && !currentUrl.isEmpty()) {
            // 使用 Bridge 的 WebView 加载方法，确保 Capacitor 插件正确绑定
            bridge.loadUrl(currentUrl);
        } else {
            bridge.loadUrl("file:///android_asset/public/index.html");
        }
    }

    // ==================== 窗口渲染优化 ====================

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

        // 如果有缓存的深度链接，现在发送
        if (pendingDeepLink != null) {
            String link = pendingDeepLink;
            pendingDeepLink = null;
            notifyDeepLink(link);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Android 16 后台限制严格：暂停 WebView 渲染以节省资源
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().onPause();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // 恢复 WebView 渲染
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().onResume();
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

            settings.setLoadsImagesAutomatically(true);
            settings.setBlockNetworkImage(false);

            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            settings.setJavaScriptEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
        }
    }

    @Override
    protected void onDestroy() {
        // 清理 WebView 防止内存泄漏
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            webView.stopLoading();
            webView.setWebViewClient(null);
            webView.setWebChromeClient(null);
            if (webView.getParent() instanceof ViewGroup) {
                ((ViewGroup) webView.getParent()).removeAllViews();
            }
        }

        if (mainHandler != null) {
            mainHandler.removeCallbacksAndMessages(null);
        }

        super.onDestroy();
    }
}
