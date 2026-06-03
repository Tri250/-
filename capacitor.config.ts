import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawsync.pro',
  appName: '爪爪连心❤️',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
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
      requestPermissionsOnLaunch: true
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
    }
  }
};

export default config;