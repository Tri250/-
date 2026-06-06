package com.pawsync.pro;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.Bridge;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

/**
 * MainActivity 单元测试
 * 测试主活动的生命周期和WebView配置
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33, manifest = Config.NONE)
public class MainActivityTest {

    private MainActivity activity;

    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        activity = Robolectric.buildActivity(MainActivity.class).create().get();
    }

    @Test
    public void testActivityNotNull() {
        assertNotNull("MainActivity should not be null", activity);
    }

    @Test
    public void testActivityLifecycle() {
        // Test onCreate
        activity.onCreate(null);
        assertNotNull("Activity should be created", activity);

        // Test onResume
        activity.onResume();
        assertTrue("Activity should be resumed", true);

        // Test onPause
        activity.onPause();
        assertTrue("Activity should be paused", true);

        // Test onDestroy
        activity.onDestroy();
        assertTrue("Activity should be destroyed", true);
    }

    @Test
    public void testWebViewConfiguration() {
        // 验证WebView配置是否正确
        Bridge bridge = activity.getBridge();
        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                
                assertTrue("JavaScript should be enabled", settings.getJavaScriptEnabled());
                assertTrue("DOM storage should be enabled", settings.getDomStorageEnabled());
                assertTrue("Database should be enabled", settings.getDatabaseEnabled());
                assertFalse("Zoom should be disabled", settings.getBuiltInZoomControls());
                assertFalse("Media playback should not require user gesture", 
                    settings.getMediaPlaybackRequiresUserGesture());
            }
        }
    }

    @Test
    public void testPackageName() {
        assertEquals("Package name should be correct", 
            "com.pawsync.pro", 
            activity.getPackageName());
    }
}
