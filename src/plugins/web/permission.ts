import type { PawSyncPermissionPlugin } from '../index';

export const PawSyncPermissionWeb: PawSyncPermissionPlugin = {
  async checkPermission(options) {
    try {
      const result = await navigator.permissions.query({ name: options.permission as PermissionName });
      return { granted: result.state === 'granted' };
    } catch {
      return { granted: false };
    }
  },

  async requestPermission(options) {
    try {
      if (options.permission === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } else if (options.permission === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      }
    } catch {
    }
    return { granted: false };
  },

  async requestPermissions(options) {
    const results: Record<string, boolean> = {};
    for (const permission of options.permissions) {
      const result = await this.requestPermission({ permission });
      results[permission] = result.granted;
    }
    return { results };
  },

  async checkAllPermissions() {
    return {
      results: {
        camera: false,
        microphone: false,
        notifications: false,
        storage: true,
      },
    };
  },

  async shouldShowRequestPermissionRationale() {
    return { shouldShow: false };
  },
};