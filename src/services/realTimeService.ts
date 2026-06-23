import type { RTCSession, RTCMessage, RTCStats, VideoCallState } from '../types/rtc';

// ICE 服务器配置
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

// 从环境变量读取 TURN 服务器配置
function getTurnServers(): RTCIceServer[] {
  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL;
  const turnUsername = import.meta.env.VITE_TURN_SERVER_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_SERVER_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    return [{
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    }];
  }
  return [];
}

// 信令服务器 URL 从环境变量读取
function getSignalingUrl(): string {
  return import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:8080/signaling';
}

// localStorage 键前缀
const STORAGE_PREFIX = 'rtc_';

class RealTimeService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingSocket: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

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
    codec: 'unknown',
  };

  private sessionListeners: Array<(session: RTCSession) => void> = [];
  private stateListeners: Array<(state: VideoCallState) => void> = [];
  private iceCandidatesQueue: RTCIceCandidateInit[] = [];

  // ─── 初始化 ────────────────────────────────────────────────

  async initialize(): Promise<void> {
    this.loadPersistedSessions();
    console.log('[RealTimeService] Initialized');
  }

  // ─── 连接 ──────────────────────────────────────────────────

  async connect(): Promise<{ success: boolean; error?: string }> {
    try {
      // 创建 RTCPeerConnection
      const iceServers = [...ICE_SERVERS, ...getTurnServers()];
      this.peerConnection = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10,
      });

      this.setupPeerConnectionListeners();

      // 连接信令服务器
      await this.connectSignalingServer();

      this.stats.connected = true;
      this.notifyStateChange(this.callState);

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[RealTimeService] Connect failed:', message);
      this.callState = 'error';
      this.notifyStateChange('error');
      return { success: false, error: message };
    }
  }

  // ─── 断开连接 ──────────────────────────────────────────────

  async disconnect(): Promise<void> {
    // 关闭 DataChannel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // 关闭 PeerConnection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 停止本地媒体流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;

    // 关闭信令连接
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    this.stats = {
      connected: false,
      signalLatency: 0,
      audioBitrate: 0,
      videoBitrate: 0,
      packetLoss: 0,
      codec: 'unknown',
    };

    this.callState = 'idle';
    this.currentSession = null;
    this.iceCandidatesQueue = [];
    this.notifyStateChange('idle');
  }

  // ─── 创建会话 ──────────────────────────────────────────────

  async createSession(
    targetId: string,
    type: 'audio' | 'video' = 'video'
  ): Promise<RTCSession> {
    if (!this.peerConnection) {
      await this.connect();
    }

    const session: RTCSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      initiator: 'local',
      targetId,
      type,
      status: 'connecting',
      startTime: new Date().toISOString(),
      endTime: undefined,
      duration: 0,
      maxDuration: type === 'audio' ? 3600 : 1800,
      media: {
        audio: true,
        video: type === 'video',
      },
      participants: ['local', targetId],
      stats: {
        signalLatency: 0,
        audioBitrate: 0,
        videoBitrate: 0,
        packetLoss: 0,
      },
    };

    this.sessions.unshift(session);
    this.currentSession = session;
    this.callState = 'connecting';
    this.notifyStateChange('connecting');
    this.notifySessionChange(session);

    try {
      // 获取本地媒体流
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: session.media.audio,
        video: session.media.video
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          : false,
      });

      // 将本地流轨道添加到 PeerConnection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // 创建 DataChannel 用于消息传输
      this.dataChannel = this.peerConnection!.createDataChannel('messaging', {
        ordered: true,
      });
      this.setupDataChannelListeners(this.dataChannel);

      // 创建 SDP Offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await this.peerConnection!.setLocalDescription(offer);

      // 通过信令服务器发送 Offer
      this.sendSignalingMessage({
        type: 'offer',
        sessionId: session.id,
        targetId,
        sdp: offer.sdp,
      });

      this.persistSession(session);
    } catch (error) {
      console.error('[RealTimeService] Create session failed:', error);
      session.status = 'failed';
      this.callState = 'error';
      this.notifyStateChange('error');
      this.notifySessionChange(session);
    }

    return session;
  }

  // ─── 处理远端 Offer（应答方）──────────────────────────────

  async handleOffer(offer: RTCSessionDescriptionInit, sessionId: string, remoteId: string): Promise<void> {
    if (!this.peerConnection) {
      await this.connect();
    }

    const session: RTCSession = {
      id: sessionId,
      initiator: remoteId,
      targetId: 'local',
      type: offer.type === 'offer' ? 'video' : 'audio',
      status: 'connecting',
      startTime: new Date().toISOString(),
      endTime: undefined,
      duration: 0,
      maxDuration: 1800,
      media: { audio: true, video: true },
      participants: [remoteId, 'local'],
      stats: {
        signalLatency: 0,
        audioBitrate: 0,
        videoBitrate: 0,
        packetLoss: 0,
      },
    };

    this.sessions.unshift(session);
    this.currentSession = session;
    this.callState = 'connecting';
    this.notifyStateChange('connecting');
    this.notifySessionChange(session);

    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

      // 处理缓存的 ICE 候选
      for (const candidate of this.iceCandidatesQueue) {
        await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.iceCandidatesQueue = [];

      // 获取本地媒体流
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      // 创建 SDP Answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // 通过信令服务器发送 Answer
      this.sendSignalingMessage({
        type: 'answer',
        sessionId,
        targetId: remoteId,
        sdp: answer.sdp,
      });

      this.persistSession(session);
    } catch (error) {
      console.error('[RealTimeService] Handle offer failed:', error);
      session.status = 'failed';
      this.callState = 'error';
      this.notifyStateChange('error');
      this.notifySessionChange(session);
    }
  }

  // ─── 结束会话 ──────────────────────────────────────────────

  async endSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.status = 'ended';
    session.endTime = new Date().toISOString();
    session.duration = Math.floor(
      (new Date().getTime() - new Date(session.startTime).getTime()) / 1000
    );

    // 通知远端
    this.sendSignalingMessage({
      type: 'end-session',
      sessionId,
      targetId: session.targetId,
    });

    // 关闭 DataChannel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // 关闭 PeerConnection 并重新创建以备下次使用
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.callState = 'idle';
    this.currentSession = null;
    this.notifyStateChange('idle');
    this.notifySessionChange(session);
    this.persistSession(session);

    return true;
  }

  // ─── 拒绝会话 ──────────────────────────────────────────────

  async rejectSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.status = 'rejected';
    session.endTime = new Date().toISOString();

    this.sendSignalingMessage({
      type: 'reject-session',
      sessionId,
      targetId: session.initiator !== 'local' ? session.initiator : session.targetId,
    });

    if (this.currentSession?.id === sessionId) {
      this.callState = 'idle';
      this.currentSession = null;
      this.notifyStateChange('idle');
    }

    this.persistSession(session);
    return true;
  }

  // ─── 获取统计信息 ──────────────────────────────────────────

  async getStats(): Promise<RTCStats> {
    if (!this.peerConnection || this.callState !== 'connected') {
      return { ...this.stats };
    }

    try {
      const rawStats = await this.peerConnection.getStats();
      let audioBitrate = 0;
      let videoBitrate = 0;
      let packetLoss = 0;
      let codec = 'unknown';
      let rtt = 0;

      rawStats.forEach((report) => {
        if (report.type === 'outbound-rtp' && report.kind === 'audio') {
          audioBitrate = report.bitrateMean ?? (report.bytesSent ? report.bytesSent / 8 : 0);
        }
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          videoBitrate = report.bitrateMean ?? (report.bytesSent ? report.bytesSent / 8 : 0);
        }
        if (report.type === 'inbound-rtp') {
          packetLoss = report.packetsLost ?? 0;
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
        }
        if (report.type === 'codec') {
          const mimeType = report.mimeType ?? '';
          if (mimeType.includes('video')) {
            codec = mimeType.replace('video/', '');
          }
        }
      });

      this.stats = {
        connected: true,
        signalLatency: Math.round(rtt),
        audioBitrate: Math.round(audioBitrate / 1000),
        videoBitrate: Math.round(videoBitrate / 1000),
        packetLoss: Number(packetLoss),
        codec,
      };
    } catch (error) {
      console.warn('[RealTimeService] Get stats failed:', error);
    }

    return { ...this.stats };
  }

  // ─── 发送消息 ──────────────────────────────────────────────

  async sendMessage(
    sessionId: string,
    type: RTCMessage['type'],
    content: string
  ): Promise<RTCMessage> {
    const message: RTCMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId,
      type,
      content,
      timestamp: new Date().toISOString(),
      sender: 'local',
    };

    // 通过 DataChannel 发送
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    } else {
      // 降级：通过信令服务器发送
      this.sendSignalingMessage({
        type: 'data-channel-message',
        sessionId,
        message,
      });
    }

    this.messages.push(message);
    return message;
  }

  // ─── 查询方法 ──────────────────────────────────────────────

  async getMessages(sessionId: string): Promise<RTCMessage[]> {
    return this.messages.filter(m => m.sessionId === sessionId);
  }

  async getSessions(limit: number = 10): Promise<RTCSession[]> {
    return [...this.sessions].slice(0, limit);
  }

  async getCurrentSession(): Promise<RTCSession | null> {
    return this.currentSession;
  }

  async getCallState(): Promise<VideoCallState> {
    return this.callState;
  }

  // ─── 媒体控制 ──────────────────────────────────────────────

  async muteAudio(mute: boolean): Promise<void> {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !mute;
      });
    }
    if (this.currentSession) {
      this.currentSession.media.audio = !mute;
    }
  }

  async muteVideo(mute: boolean): Promise<void> {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !mute;
      });
    }
    if (this.currentSession) {
      this.currentSession.media.video = !mute;
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentFacing = videoTrack.getSettings().facingMode;
    const newFacing = currentFacing === 'user' ? 'environment' : 'user';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
      });

      const newTrack = newStream.getVideoTracks()[0];
      const sender = this.peerConnection
        ?.getSenders()
        .find(s => s.track === videoTrack);

      if (sender && newTrack) {
        await sender.replaceTrack(newTrack);
      }

      videoTrack.stop();
      // 更新本地流引用
      const oldTracks = this.localStream.getVideoTracks();
      oldTracks.forEach(t => this.localStream!.removeTrack(t));
      this.localStream.addTrack(newTrack);

      if (this.currentSession) {
        this.currentSession.media.video = true;
      }
    } catch (error) {
      console.error('[RealTimeService] Switch camera failed:', error);
    }
  }

  // ─── 事件监听 ──────────────────────────────────────────────

  onSessionChange(listener: (session: RTCSession) => void): () => void {
    this.sessionListeners.push(listener);
    return () => {
      const index = this.sessionListeners.indexOf(listener);
      if (index > -1) {
        this.sessionListeners.splice(index, 1);
      }
    };
  }

  onStateChange(listener: (state: VideoCallState) => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      const index = this.stateListeners.indexOf(listener);
      if (index > -1) {
        this.stateListeners.splice(index, 1);
      }
    };
  }

  // ─── 获取远端流 ────────────────────────────────────────────

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // ─── 私有方法 ──────────────────────────────────────────────

  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    // ICE 候选收集
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          sessionId: this.currentSession?.id ?? '',
          targetId: this.currentSession?.targetId ?? '',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // 远端流接收
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      event.streams[0]?.getTracks().forEach(track => {
        this.remoteStream!.addTrack(track);
      });
    };

    // 连接状态监控
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      switch (state) {
        case 'connected':
          if (this.currentSession) {
            this.currentSession.status = 'connected';
            this.callState = 'connected';
            this.notifyStateChange('connected');
            this.notifySessionChange(this.currentSession);
            this.persistSession(this.currentSession);
          }
          break;
        case 'disconnected':
          this.callState = 'disconnected';
          this.notifyStateChange('disconnected');
          break;
        case 'failed':
          if (this.currentSession) {
            this.currentSession.status = 'failed';
          }
          this.callState = 'error';
          this.notifyStateChange('error');
          break;
        case 'closed':
          this.callState = 'idle';
          this.notifyStateChange('idle');
          break;
      }
    };

    // ICE 连接状态监控
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection?.iceConnectionState;
      if (iceState === 'failed' || iceState === 'disconnected') {
        // 尝试 ICE 重启
        if (iceState === 'failed' && this.currentSession) {
          this.peerConnection?.restartIce();
        }
      }
    };

    // 接收 DataChannel（应答方）
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelListeners(this.dataChannel);
    };
  }

  private setupDataChannelListeners(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('[RealTimeService] DataChannel opened');
    };

    channel.onclose = () => {
      console.log('[RealTimeService] DataChannel closed');
    };

    channel.onmessage = (event) => {
      try {
        const message: RTCMessage = JSON.parse(event.data);
        message.sender = 'remote';
        this.messages.push(message);
      } catch {
        // 非 JSON 消息，忽略
      }
    };

    channel.onerror = (error) => {
      console.error('[RealTimeService] DataChannel error:', error);
    };
  }

  // ─── 信令服务器 ────────────────────────────────────────────

  private connectSignalingServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = getSignalingUrl();

      try {
        this.signalingSocket = new WebSocket(url);
      } catch (error) {
        console.warn('[RealTimeService] WebSocket creation failed, signaling unavailable:', error);
        resolve();
        return;
      }

      this.signalingSocket.onopen = () => {
        console.log('[RealTimeService] Connected to signaling server');
        resolve();
      };

      this.signalingSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleSignalingMessage(data);
        } catch (error) {
          console.warn('[RealTimeService] Failed to parse signaling message:', error);
        }
      };

      this.signalingSocket.onerror = (error) => {
        console.error('[RealTimeService] Signaling server error:', error);
        reject(new Error('Signaling server connection failed'));
      };

      this.signalingSocket.onclose = () => {
        console.log('[RealTimeService] Signaling server disconnected');
        // 自动重连逻辑
        setTimeout(() => {
          if (this.stats.connected && !this.signalingSocket) {
            this.connectSignalingServer().catch(() => {});
          }
        }, 5000);
      };

      // 连接超时
      setTimeout(() => {
        if (this.signalingSocket?.readyState !== WebSocket.OPEN) {
          resolve(); // 不阻塞，允许无信令运行
        }
      }, 3000);
    });
  }

  private sendSignalingMessage(message: Record<string, unknown>): void {
    if (this.signalingSocket?.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify(message));
    }
  }

  private async handleSignalingMessage(data: Record<string, unknown>): Promise<void> {
    const { type } = data;

    switch (type) {
      case 'offer': {
        const offer: RTCSessionDescriptionInit = {
          type: 'offer',
          sdp: data.sdp as string,
        };
        await this.handleOffer(offer, data.sessionId as string, data.fromId as string);
        break;
      }

      case 'answer': {
        if (this.peerConnection && this.currentSession) {
          const answer = new RTCSessionDescription({
            type: 'answer',
            sdp: data.sdp as string,
          });
          await this.peerConnection.setRemoteDescription(answer);

          // 处理缓存的 ICE 候选
          for (const candidate of this.iceCandidatesQueue) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
          this.iceCandidatesQueue = [];
        }
        break;
      }

      case 'ice-candidate': {
        const candidate = data.candidate as RTCIceCandidateInit;
        if (this.peerConnection?.remoteDescription) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          this.iceCandidatesQueue.push(candidate);
        }
        break;
      }

      case 'end-session': {
        const sessionId = data.sessionId as string;
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
          session.status = 'ended';
          session.endTime = new Date().toISOString();
          if (this.currentSession?.id === sessionId) {
            this.callState = 'idle';
            this.currentSession = null;
            this.notifyStateChange('idle');
          }
          this.notifySessionChange(session);
          this.persistSession(session);
        }
        break;
      }

      case 'reject-session': {
        const sessionId = data.sessionId as string;
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
          session.status = 'rejected';
          session.endTime = new Date().toISOString();
          if (this.currentSession?.id === sessionId) {
            this.callState = 'idle';
            this.currentSession = null;
            this.notifyStateChange('idle');
          }
          this.notifySessionChange(session);
          this.persistSession(session);
        }
        break;
      }

      case 'data-channel-message': {
        const message = data.message as RTCMessage;
        message.sender = 'remote';
        this.messages.push(message);
        break;
      }
    }
  }

  // ─── 持久化 ────────────────────────────────────────────────

  private persistSession(session: RTCSession): void {
    try {
      const key = `${STORAGE_PREFIX}session_${session.id}`;
      localStorage.setItem(key, JSON.stringify(session));
      // 更新会话列表索引
      const indexKey = `${STORAGE_PREFIX}session_ids`;
      const existing = localStorage.getItem(indexKey);
      const ids: string[] = existing ? JSON.parse(existing) : [];
      if (!ids.includes(session.id)) {
        ids.unshift(session.id);
        localStorage.setItem(indexKey, JSON.stringify(ids.slice(0, 50)));
      }
    } catch (error) {
      console.warn('[RealTimeService] Failed to persist session:', error);
    }
  }

  private loadPersistedSessions(): void {
    try {
      const indexKey = `${STORAGE_PREFIX}session_ids`;
      const idsJson = localStorage.getItem(indexKey);
      if (!idsJson) return;

      const ids: string[] = JSON.parse(idsJson);
      const loadedSessions: RTCSession[] = [];

      for (const id of ids) {
        const sessionJson = localStorage.getItem(`${STORAGE_PREFIX}session_${id}`);
        if (sessionJson) {
          loadedSessions.push(JSON.parse(sessionJson));
        }
      }

      this.sessions = loadedSessions;
    } catch (error) {
      console.warn('[RealTimeService] Failed to load persisted sessions:', error);
    }
  }

  // ─── 通知 ──────────────────────────────────────────────────

  private notifySessionChange(session: RTCSession): void {
    this.sessionListeners.forEach(listener => listener(session));
  }

  private notifyStateChange(state: VideoCallState): void {
    this.stateListeners.forEach(listener => listener(state));
  }
}

export const realTimeService = new RealTimeService();
