import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pawsync.pro',
  appName: 'PawSync Pro',
  webDir: 'dist',
  android: {
    minSdkVersion: 24,
    targetSdkVersion: 35,
    compileSdkVersion: 35,
    allowMixedContent: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF"
    }
  }
};

export default config;
