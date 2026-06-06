import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawsync.pro',
  appName: '爪爪连心❤️',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#f8fafc',
    overrideUserAgent: 'PawSync-Android/1.0.0',
    appendUserAgent: 'PawSync/1.0.0',
    resizeOnFullScreen: true,
    useLegacyBridge: false,
    minWebViewVersion: 120
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#f8fafc',
    preferredContentMode: 'mobile'
  },
  plugins: {
    // 启动屏配置
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#f8fafc',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#f97316',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: false
    },
    // 状态栏配置
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f8fafc',
      overlaysWebView: false,
      animated: true
    },
    // 导航栏配置
    NavigationBar: {
      backgroundColor: '#f8fafc',
      style: 'LIGHT',
      overlaysWebView: false,
      animated: true
    },
    // 键盘配置
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      style: 'dark',
      styleOnFullScreen: 'dark'
    },
    // 触觉反馈配置
    Haptics: {
      selectionStartDuration: 10,
      selectionChangedDuration: 10
    },
    // 应用配置
    App: {
      launchUrl: '',
      logLevel: 'ERROR'
    },
    // 后台任务配置
    BackgroundTask: {
      enabled: true
    },
    // 本地通知配置
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#f97316',
      sound: 'default',
      vibrate: true,
      requestPermissionsOnLaunch: true,
      channelId: 'pawsync_default_channel',
      channelName: '爪爪连心通知',
      importance: 'high',
      visibility: 'public',
      ongoing: false,
      autoCancel: true,
      group: 'pawsync_group',
      groupSummary: '爪爪连心消息'
    },
    // 推送通知配置
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      fcm: true,
      android: {
        senderId: 'YOUR_SENDER_ID',
        importance: 'high',
        visibility: 'public',
        icon: 'ic_stat_icon_config_sample',
        iconColor: '#f97316',
        sound: 'default',
        vibrate: true,
        ongoing: false,
        autoCancel: true
      }
    },
    // 分享配置
    Share: {
      dialogTitle: '分享爪爪连心',
      android: {
        chooserText: '选择分享方式'
      }
    },
    // 相机配置
    Camera: {
      allowEditing: false,
      resultType: 'base64',
      saveToGallery: false,
      quality: 90,
      width: 1920,
      height: 1920,
      correctOrientation: true,
      presentationStyle: 'fullscreen'
    },
    // 存储配置
    Preferences: {
      group: 'pawsync_preferences'
    },
    // 网络配置
    Network: {
      enabled: true
    },
    // 设备配置
    Device: {
      enabled: true
    },
    // 屏幕方向配置
    ScreenOrientation: {
      enabled: true
    }
  },
  // 应用元数据
  appMetadata: {
    developer: '带娃的小陈工',
    version: '1.0.0',
    description: 'AI驱动的宠物情感翻译与健康监测应用'
  }
};

export default config;
