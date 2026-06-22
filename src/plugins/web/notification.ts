import type { PawSyncNotificationPlugin } from '../index';

export const PawSyncNotificationWeb: PawSyncNotificationPlugin = {
  async createNotificationChannel() {
    return;
  },

  async showNotification(options) {
    if ('Notification' in window) {
      try {
        await Notification.requestPermission();
        new Notification(options.title, { body: options.body });
      } catch {
      }
    }
  },

  async cancelNotification() {
    return;
  },

  async cancelAllNotifications() {
    return;
  },

  async checkPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted' };
    }
    return { granted: false };
  },

  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted' };
    }
    return { granted: false };
  },
};