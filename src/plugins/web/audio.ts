import type { PawSyncAudioPlugin } from '../index';

export const PawSyncAudioWeb: PawSyncAudioPlugin = {
  async checkMicrophonePermission() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return { granted: result.state === 'granted' };
    } catch {
      return { granted: false };
    }
  },

  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch {
      return { granted: false };
    }
  },

  async startRecording() {
    return;
  },

  async stopRecording() {
    return { filePath: '' };
  },

  async getAudioLevel() {
    return { level: Math.floor(Math.random() * 100) };
  },

  async analyzeAudio(options) {
    const emotions = ['happy', 'curious', 'anxious', 'calm', 'excited', 'safe'] as const;
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    return {
      scores: {
        happy: Math.random() * 100,
        curious: Math.random() * 100,
        anxious: Math.random() * 100,
        angry: Math.random() * 100,
        needs: Math.random() * 100,
        calm: Math.random() * 100,
        excited: Math.random() * 100,
        safe: Math.random() * 100,
      },
      primaryEmotion: randomEmotion,
      confidence: 60 + Math.random() * 35,
      intensity: 40 + Math.random() * 50,
      translation: '分析完成',
      pitch: 300 + Math.random() * 1000,
      categoryIndex: Math.floor(Math.random() * 8) + 3,
    };
  },
};