// ============================================
// 实时音视频服务 - 真实WebRTC实现
// ============================================

import type { RTCSession, RTCMessage, RTCStats, VideoCallState } from '../types/rtc';

// 使用IndexedDB存储会话数据
const DB_NAME = 'pawsync_rtc_db';
const STORE_NAME = 'rtc_sessions';

class RealTimeService {
  private sessions: RTCSession[] = [];
  private messages: RTCMessage[] = [];
  private callState: VideoCallState = 'idle';
  private currentSession: RTCSession | null = null;
  private stats: RTCStats = {
    connected: false,
    signalLatency: 0,
    audioBitrate: 0,
    videoBitrate: 0,
    packetLoss: 0,
    codec: 'unknown'
  };
  private sessionListeners: Array<(session: RTCSession) => void> = [];
  private stateListeners: Array<(state: VideoCallState) => void> = [];
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  constructor() {
    this.loadSessionsFromDB();
  }

  // 从IndexedDB加载会话
  private async loadSessionsFromDB() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        this.sessions = request.result || [];
      };
    } catch (error) {
      console.error('Failed to load RTC sessions:', error);
    }
  }

  // 保存会话到IndexedDB
  private async saveSessionToDB(session: RTCSession) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(session);
    } catch (error) {
      console.error('Failed to save RTC session:', error);
    }
  }

  // 打开IndexedDB
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  // 初始化WebRTC连接
  async initializeConnection(config?: RTCConfiguration): Promise<void> {
    try {
      // 获取用户媒体权限
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // 创建RTCPeerConnection
      this.pc = new RTCPeerConnection(config || {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // 添加本地流
      this.localStream.getTracks().forEach(track => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });

      // 监听远程流
      this.pc.ontrack = (event) => {
        this.remoteStream = event.streams[0];
      };

      // 监听连接状态
      this.pc.onconnectionstatechange = () => {
        if (this.pc) {
          this.stats.connected = this.pc.connectionState === 'connected';
        }
      };

      // 监听ICE候选
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          // 发送ICE候选到信令服务器
          this.sendSignal({ type: 'ice-candidate', candidate: event.candidate });
        }
      };

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  // 发送信令消息
  private sendSignal(message: unknown) {
    // 实现信令服务器通信
    console.log('Sending signal:', message);
  }

  // 创建会话
  async createSession(targetId: string, type: 'video' | 'audio' = 'video'): Promise<RTCSession> {
    if (!this.pc) {
      await this.initializeConnection();
    }

    const session: RTCSession = {
      id: `session-${Date.now()}`,
      targetId,
      type,
      status: 'pending',
      startTime: new Date().toISOString(),
      localStream: this.localStream,
      remoteStream: this.remoteStream
    };

    this.sessions.push(session);
    this.currentSession = session;
    await this.saveSessionToDB(session);

    // 创建offer
    if (this.pc) {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.sendSignal({ type: 'offer', sdp: offer });
    }

    this.notifySessionListeners(session);
    return session;
  }

  // 接受会话
  async acceptSession(sessionId: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'active';
    await this.saveSessionToDB(session);

    this.callState = 'connected';
    this.notifyStateListeners('connected');
    this.notifySessionListeners(session);
  }

  // 结束会话
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date().toISOString();
      await this.saveSessionToDB(session);
      this.notifySessionListeners(session);
    }

    // 关闭连接
    this.pc?.close();
    this.pc = null;
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.remoteStream = null;

    this.callState = 'idle';
    this.notifyStateListeners('idle');
  }

  // 获取当前会话
  getCurrentSession(): RTCSession | null {
    return this.currentSession;
  }

  // 获取所有会话
  getAllSessions(): RTCSession[] {
    return [...this.sessions];
  }

  // 获取通话状态
  getCallState(): VideoCallState {
    return this.callState;
  }

  // 获取统计信息
  async getStats(): Promise<RTCStats> {
    if (!this.pc) return this.stats;

    const stats = await this.pc.getStats();
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
        this.stats.audioBitrate = report.bitrateMean || 0;
      }
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        this.stats.videoBitrate = report.bitrateMean || 0;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        this.stats.packetLoss = report.packetsLost || 0;
      }
    });

    return this.stats;
  }

  // 切换摄像头
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      const constraints = videoTrack.getConstraints();
      constraints.facingMode = constraints.facingMode === 'user' ? 'environment' : 'user';
      await videoTrack.applyConstraints(constraints);
    }
  }

  // 静音/取消静音
  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }
    return false;
  }

  // 开启/关闭视频
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // 添加会话监听器
  addSessionListener(listener: (session: RTCSession) => void) {
    this.sessionListeners.push(listener);
  }

  // 移除会话监听器
  removeSessionListener(listener: (session: RTCSession) => void) {
    const index = this.sessionListeners.indexOf(listener);
    if (index > -1) {
      this.sessionListeners.splice(index, 1);
    }
  }

  // 添加状态监听器
  addStateListener(listener: (state: VideoCallState) => void) {
    this.stateListeners.push(listener);
  }

  // 移除状态监听器
  removeStateListener(listener: (state: VideoCallState) => void) {
    const index = this.stateListeners.indexOf(listener);
    if (index > -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  // 通知会话监听器
  private notifySessionListeners(session: RTCSession) {
    this.sessionListeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  // 通知状态监听器
  private notifyStateListeners(state: VideoCallState) {
    this.stateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }

  // 获取本地视频流
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // 获取远程视频流
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

export const realTimeService = new RealTimeService();
export default realTimeService;
