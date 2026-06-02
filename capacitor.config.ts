import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawsync.pro',
  appName: 'PawSync Pro',
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
      showSpinner: true,
      spinnerColor: '#f97316',
      splashFullScreen: true,
      splashImmersive: true,
      autoHide: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f8fafc'
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
      iconColor: '#f97316'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      fcm: true
    }
  }
};

export default config;