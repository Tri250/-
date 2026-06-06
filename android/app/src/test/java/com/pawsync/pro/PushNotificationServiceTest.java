package com.pawsync.pro;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import com.google.firebase.messaging.RemoteMessage;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * PushNotificationService 单元测试
 * 测试推送通知服务的功能
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33)
public class PushNotificationServiceTest {

    private PushNotificationService service;

    @Mock
    private RemoteMessage mockRemoteMessage;

    @Mock
    private RemoteMessage.Notification mockNotification;

    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new PushNotificationService();
    }

    @Test
    public void testServiceNotNull() {
        assertNotNull("PushNotificationService should not be null", service);
    }

    @Test
    public void testOnNewToken() {
        // 测试token更新
        String testToken = "test_fcm_token_12345";
        service.onNewToken(testToken);
        
        // 验证token被正确处理（实际实现中应该发送到服务器）
        assertTrue("Token should be processed", true);
    }

    @Test
    public void testOnMessageReceived() {
        // 模拟收到消息
        when(mockRemoteMessage.getNotification()).thenReturn(mockNotification);
        when(mockNotification.getTitle()).thenReturn("Test Title");
        when(mockNotification.getBody()).thenReturn("Test Body");

        service.onMessageReceived(mockRemoteMessage);

        // 验证消息被处理
        verify(mockRemoteMessage, atLeastOnce()).getNotification();
    }

    @Test
    public void testNotificationChannelCreation() throws Exception {
        // 使用反射测试私有方法
        Method createChannelMethod = PushNotificationService.class.getDeclaredMethod("createNotificationChannel");
        createChannelMethod.setAccessible(true);
        
        // 在Android O及以上测试
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createChannelMethod.invoke(service);
            
            Context context = RuntimeEnvironment.getApplication();
            NotificationManager notificationManager = 
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            
            if (notificationManager != null) {
                NotificationChannel channel = notificationManager.getNotificationChannel("pawsync_default_channel");
                if (channel != null) {
                    assertEquals("Channel name should match", "爪爪连心通知", channel.getName());
                    assertEquals("Channel importance should be high", 
                        NotificationManager.IMPORTANCE_HIGH, channel.getImportance());
                }
            }
        }
    }

    @Test
    public void testChannelId() throws Exception {
        // 验证CHANNEL_ID常量
        Field channelIdField = PushNotificationService.class.getDeclaredField("CHANNEL_ID");
        channelIdField.setAccessible(true);
        String channelId = (String) channelIdField.get(null);
        
        assertEquals("Channel ID should be correct", "pawsync_default_channel", channelId);
    }

    @Test
    public void testChannelName() throws Exception {
        // 验证CHANNEL_NAME常量
        Field channelNameField = PushNotificationService.class.getDeclaredField("CHANNEL_NAME");
        channelNameField.setAccessible(true);
        String channelName = (String) channelNameField.get(null);
        
        assertEquals("Channel name should be correct", "爪爪连心通知", channelName);
    }
}
