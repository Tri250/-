import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawsync.pro',
  appName: '爪爪连心❤️',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 开发环境可配置本地服务器
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f8fafc',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f8fafc',
      overlaysWebView: false
    },
    NavigationBar: {
      backgroundColor: '#f8fafc',
      style: 'LIGHT',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      style: 'dark',
      styleOnFullScreen: 'dark'
    },
    Haptics: {
      selectionStartDuration: 10,
      selectionChangedDuration: 10
    },
    App: {
      launchUrl: '',
      logLevel: 'ERROR'
    },
    BackgroundTask: {
      enabled: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#f97316',
      requestPermissionsOnLaunch: true,
      // 新增通知渠道配置
      channels: [
        {
          id: 'health',
          name: '健康提醒',
          description: '宠物健康相关通知',
          importance: 4,
          visibility: 1,
          vibration: true,
          sound: 'health_alert.wav'
        },
        {
          id: 'reminder',
          name: '日程提醒',
          description: '喂食、用药等日程提醒',
          importance: 4,
          visibility: 1,
          vibration: true
        },
        {
          id: 'monitor',
          name: '监控警报',
          description: '实时监控异常警报',
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: 'alert.wav'
        },
        {
          id: 'geofence',
          name: '地理围栏',
          description: '我回来了智能提醒',
          importance: 3,
          visibility: 1,
          vibration: true
        }
      ]
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      fcm: true,
      android: {
        senderId: 'YOUR_SENDER_ID'
      }
    },
    Share: {
      dialogTitle: '分享爪爪连心'
    },
    Camera: {
      promptLabelHeader: '使用相机',
      promptLabelCancel: '取消',
      promptLabelPhoto: '从相册选择',
      promptLabelPicture: '拍照'
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  },
  // 新增：iOS 配置
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true
  }
};

export default config;