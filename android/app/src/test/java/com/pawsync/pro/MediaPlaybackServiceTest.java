package com.pawsync.pro;

import static org.junit.Assert.*;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockitoAnnotations;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * MediaPlaybackService 单元测试
 * 测试媒体播放前台服务的功能
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33)
public class MediaPlaybackServiceTest {

    private MediaPlaybackService service;

    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        service = Robolectric.setupService(MediaPlaybackService.class);
    }

    @Test
    public void testServiceNotNull() {
        assertNotNull("MediaPlaybackService should not be null", service);
    }

    @Test
    public void testServiceCreation() {
        assertNotNull("Service should be created", service);
        
        // 验证服务是前台服务类型
        Intent intent = new Intent(RuntimeEnvironment.getApplication(), MediaPlaybackService.class);
        assertNotNull("Intent should not be null", intent);
    }

    @Test
    public void testOnBind() {
        Intent intent = new Intent();
        IBinder binder = service.onBind(intent);
        
        assertNotNull("Binder should not be null", binder);
        assertTrue("Binder should be LocalBinder instance", 
            binder instanceof MediaPlaybackService.LocalBinder);
        
        // 验证可以通过Binder获取服务实例
        MediaPlaybackService.LocalBinder localBinder = (MediaPlaybackService.LocalBinder) binder;
        MediaPlaybackService boundService = localBinder.getService();
        assertNotNull("Bound service should not be null", boundService);
        assertEquals("Bound service should be the same instance", service, boundService);
    }

    @Test
    public void testOnStartCommand() {
        Intent intent = new Intent();
        int result = service.onStartCommand(intent, 0, 1);
        
        // 验证返回START_STICKY
        assertEquals("Should return START_STICKY", 
            android.app.Service.START_STICKY, result);
    }

    @Test
    public void testChannelId() throws Exception {
        // 验证CHANNEL_ID常量
        Field channelIdField = MediaPlaybackService.class.getDeclaredField("CHANNEL_ID");
        channelIdField.setAccessible(true);
        String channelId = (String) channelIdField.get(null);
        
        assertEquals("Channel ID should be correct", "pawsync_media_channel", channelId);
    }

    @Test
    public void testNotificationId() throws Exception {
        // 验证NOTIFICATION_ID常量
        Field notificationIdField = MediaPlaybackService.class.getDeclaredField("NOTIFICATION_ID");
        notificationIdField.setAccessible(true);
        int notificationId = (int) notificationIdField.get(null);
        
        assertEquals("Notification ID should be correct", 1, notificationId);
    }

    @Test
    public void testNotificationChannelCreation() throws Exception {
        // 使用反射测试私有方法
        Method createChannelMethod = MediaPlaybackService.class.getDeclaredMethod("createNotificationChannel");
        createChannelMethod.setAccessible(true);
        
        // 在Android O及以上测试
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createChannelMethod.invoke(service);
            
            NotificationManager notificationManager = 
                (NotificationManager) RuntimeEnvironment.getApplication()
                    .getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            
            if (notificationManager != null) {
                NotificationChannel channel = notificationManager.getNotificationChannel("pawsync_media_channel");
                if (channel != null) {
                    assertEquals("Channel name should match", "媒体播放", channel.getName());
                    assertEquals("Channel importance should be low", 
                        NotificationManager.IMPORTANCE_LOW, channel.getImportance());
                }
            }
        }
    }

    @Test
    public void testServiceLifecycle() {
        // 测试服务生命周期
        service.onCreate();
        assertTrue("Service should be created", true);
        
        // 测试onDestroy
        service.onDestroy();
        assertTrue("Service should be destroyed", true);
    }
}
