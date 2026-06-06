package com.pawsync.pro;

import static org.junit.Assert.*;

import android.content.Context;
import android.content.pm.PackageManager;
import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.getcapacitor.Bridge;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * MainActivity Instrumented Test
 * 在主活动上执行的集成测试
 */
@RunWith(AndroidJUnit4.class)
public class MainActivityInstrumentedTest {

    private Context appContext;

    @Before
    public void setUp() {
        appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
    }

    @Test
    public void useAppContext() {
        // 验证包名正确
        assertEquals("com.pawsync.pro", appContext.getPackageName());
    }

    @Test
    public void testAppName() {
        // 验证应用名称
        String appName = appContext.getString(R.string.app_name);
        assertEquals("爪爪连心", appName);
    }

    @Test
    public void testPackageNameResource() {
        // 验证包名资源
        String packageName = appContext.getString(R.string.package_name);
        assertEquals("com.pawsync.pro", packageName);
    }

    @Test
    public void testMainActivityExists() {
        // 验证MainActivity存在
        try {
            Class<?> mainActivityClass = Class.forName("com.pawsync.pro.MainActivity");
            assertNotNull("MainActivity class should exist", mainActivityClass);
        } catch (ClassNotFoundException e) {
            fail("MainActivity class should exist");
        }
    }

    @Test
    public void testPushNotificationServiceExists() {
        // 验证PushNotificationService存在
        try {
            Class<?> serviceClass = Class.forName("com.pawsync.pro.PushNotificationService");
            assertNotNull("PushNotificationService class should exist", serviceClass);
        } catch (ClassNotFoundException e) {
            fail("PushNotificationService class should exist");
        }
    }

    @Test
    public void testMediaPlaybackServiceExists() {
        // 验证MediaPlaybackService存在
        try {
            Class<?> serviceClass = Class.forName("com.pawsync.pro.MediaPlaybackService");
            assertNotNull("MediaPlaybackService class should exist", serviceClass);
        } catch (ClassNotFoundException e) {
            fail("MediaPlaybackService class should exist");
        }
    }

    @Test
    public void testPermissionsDeclared() {
        // 验证关键权限已声明
        PackageManager pm = appContext.getPackageManager();
        String packageName = appContext.getPackageName();

        // 检查INTERNET权限
        int internetPermission = pm.checkPermission(
            android.Manifest.permission.INTERNET, packageName);
        assertEquals("INTERNET permission should be granted",
            PackageManager.PERMISSION_GRANTED, internetPermission);

        // 检查CAMERA权限声明
        try {
            pm.getPermissionInfo(android.Manifest.permission.CAMERA, 0);
            assertTrue("CAMERA permission should be declared", true);
        } catch (PackageManager.NameNotFoundException e) {
            fail("CAMERA permission should be declared");
        }

        // 检查RECORD_AUDIO权限声明
        try {
            pm.getPermissionInfo(android.Manifest.permission.RECORD_AUDIO, 0);
            assertTrue("RECORD_AUDIO permission should be declared", true);
        } catch (PackageManager.NameNotFoundException e) {
            fail("RECORD_AUDIO permission should be declared");
        }
    }

    @Test
    public void testActivityLaunch() {
        // 测试Activity启动
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> {
                assertNotNull("Activity should be launched", activity);
                assertFalse("Activity should not be finishing", activity.isFinishing());
            });
        }
    }
}
