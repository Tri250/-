import type { PawSyncCameraPlugin } from '../index';

export const PawSyncCameraWeb: PawSyncCameraPlugin = {
  async checkCameraPermission() {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return { granted: result.state === 'granted' };
    } catch {
      return { granted: false };
    }
  },

  async requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch {
      return { granted: false };
    }
  },

  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput').map(d => d.deviceId);
      return { cameras: cameras.length > 0 ? cameras : ['0', '1'] };
    } catch {
      return { cameras: ['0', '1'] };
    }
  },

  async openCamera() {
    return;
  },

  async closeCamera() {
    return;
  },

  async startPreview() {
    return;
  },

  async stopPreview() {
    return;
  },

  async takePhoto() {
    return { filePath: '' };
  },
};