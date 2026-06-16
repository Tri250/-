import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawsync.pro',
  appName: '爪爪连心❤️',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // WebView 背景色与 Web 端一致
    backgroundColor: '#f8fafc'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      // 启动画面背景色与 Web 主题橙色一致
      backgroundColor: '#f97316',
      // 暗色模式启动画面
      launchAutoHide: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      fadeOutDuration: 300
    },
    StatusBar: {
      // 浅色状态栏：白色图标 + 橙色背景
      style: 'LIGHT',
      backgroundColor: '#f97316',
      overlaysWebView: false
    },
    NavigationBar: {
      backgroundColor: '#f97316',
      style: 'LIGHT',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      style: 'LIGHT'
    },
    Haptics: {
      selectionStartDuration: 10,
      selectionChangedDuration: 10
    },
    App: {
      launchUrl: ''
    },
    BackgroundTask: {
      enabled: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#f97316',
      requestPermissionsOnLaunch: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Share: {
      dialogTitle: '分享爪爪连心❤️'
    },

    // ============================================
    // Capacitor Camera 插件配置
    // ============================================
    Camera: {
      // 权限说明文案（Android 13+ 运行时权限）
      permissions: {
        camera: '用于拍摄宠物照片进行健康分析和表情识别',
        microphone: '用于录制宠物声音进行情绪翻译分析'
      }
    }
  }
};

export default config;