import type { PawSyncFileStoragePlugin } from '../index';

export const PawSyncFileStorageWeb: PawSyncFileStoragePlugin = {
  async checkStoragePermission() {
    return { granted: true };
  },

  async requestStoragePermission() {
    return { granted: true };
  },

  async saveFile(options) {
    try {
      const blob = new Blob([new Uint8Array(options.data)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      return { success: true, filePath: url };
    } catch {
      return { success: false };
    }
  },

  async saveImage(options) {
    try {
      const blob = new Blob([new Uint8Array(options.data)], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      return { success: true, filePath: url };
    } catch {
      return { success: false };
    }
  },

  async readFile() {
    return { data: [] };
  },

  async deleteFile() {
    return { success: true };
  },

  async listFiles() {
    return { files: [] };
  },

  async getStorageUsage() {
    return { used: 0 };
  },
};