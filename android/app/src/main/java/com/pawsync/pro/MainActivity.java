package com.pawsync.pro;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 安装 SplashScreen
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
        
        // 配置 WebView 设置
        configureWebView();
        
        // 注册插件（如果需要手动注册）
        registerPlugins();
    }

    /**
     * 配置 WebView 设置以优化性能
     */
    private void configureWebView() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // 启用 JavaScript
            settings.setJavaScriptEnabled(true);
            
            // 启用 DOM storage
            settings.setDomStorageEnabled(true);
            
            // 启用数据库
            settings.setDatabaseEnabled(true);
            
            // 启用缓存
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // 支持缩放
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            
            // 启用媒体播放需要用户手势
            settings.setMediaPlaybackRequiresUserGesture(false);
            
            // 允许文件访问
            settings.setAllowFileAccess(true);
            
            // 允许内容访问
            settings.setAllowContentAccess(true);
            
            // 混合内容模式
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            
            // 设置用户代理
            String userAgent = settings.getUserAgentString();
            settings.setUserAgentString(userAgent + " PawSync/1.0.0 Android");
        }
    }

    /**
     * 注册 Capacitor 插件
     */
    private void registerPlugins() {
        // 插件通过 capacitor.settings.gradle 自动注册
        // 这里可以添加额外的手动注册逻辑
    }

    @Override
    protected void onResume() {
        super.onResume();
        // 恢复时的处理
    }

    @Override
    protected void onPause() {
        super.onPause();
        // 暂停时的处理
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // 销毁时的清理
    }
}
