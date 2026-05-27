import type { RTCSession, RTCMessage, RTCStats, VideoCallState } from '../types/rtc';

const MOCK_DELAY = 500;

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

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockMessages: RTCMessage[] = [
      {
        id: 'msg-1',
        sessionId: 'session-1',
        type: 'system',
        content: '通话已建立',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        sender: 'system'
      },
      {
        id: 'msg-2',
        sessionId: 'session-1',
        type: 'audio',
        content: 'audio-stream-start',
        timestamp: new Date(Date.now() - 295000).toISOString(),
        sender: 'local'
      },
      {
        id: 'msg-3',
        sessionId: 'session-1',
        type: 'video',
        content: 'video-stream-start',
        timestamp: new Date(Date.now() - 290000).toISOString(),
        sender: 'remote'
      }
    ];
    this.messages = mockMessages;
  }

  async initialize(): Promise<void> {
    await this.simulateDelay(MOCK_DELAY);
    console.log('Real-time communication service initialized');
  }

  async connect(): Promise<{ success: boolean; error?: string }> {
    await this.simulateDelay(MOCK_DELAY);
    
    this.stats.connected = true;
    this.stats.signalLatency = 50 + Math.floor(Math.random() * 100);
    
    return {
      success: true
    };
  }

  async disconnect(): Promise<void> {
    await this.simulateDelay(200);
    this.stats.connected = false;
    this.callState = 'idle';
    this.currentSession = null;
  }

  async getStats(): Promise<RTCStats> {
    await this.simulateDelay(100);
    
    if (this.callState === 'connected') {
      this.stats.audioBitrate = 48 + Math.floor(Math.random() * 32);
      this.stats.videoBitrate = 500 + Math.floor(Math.random() * 1000);
      this.stats.packetLoss = Math.random() * 2;
      this.stats.codec = 'VP9';
    }
    
    return { ...this.stats };
  }

  async createSession(
    targetId: string,
    type: 'audio' | 'video' = 'video'
  ): Promise<RTCSession> {
    await this.simulateDelay(MOCK_DELAY);

    const session: RTCSession = {
      id: `session-${Date.now()}`,
      initiator: 'local',
      targetId,
      type,
      status: 'connecting',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      maxDuration: type === 'audio' ? 3600 : 1800,
      media: {
        audio: true,
        video: type === 'video'
      },
      participants: ['local', targetId],
      stats: {
        signalLatency: 40 + Math.floor(Math.random() * 60),
        audioBitrate: 0,
        videoBitrate: 0,
        packetLoss: 0
      }
    };

    this.sessions.unshift(session);
    this.currentSession = session;
    this.callState = 'connecting';

    this.notifyStateChange('connecting');
    this.notifySessionChange(session);

    setTimeout(async () => {
      if (session.status === 'connecting') {
        session.status = 'connected';
        session.stats.signalLatency = 30 + Math.floor(Math.random() * 40);
        this.callState = 'connected';
        
        this.notifyStateChange('connected');
        this.notifySessionChange(session);
      }
    }, 2000 + Math.random() * 2000);

    return session;
  }

  async endSession(sessionId: string): Promise<boolean> {
    await this.simulateDelay(MOCK_DELAY);

    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.status = 'ended';
    session.endTime = new Date().toISOString();
    session.duration = Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / 1000);

    this.callState = 'idle';
    this.currentSession = null;

    this.notifyStateChange('idle');
    this.notifySessionChange(session);

    return true;
  }

  async rejectSession(sessionId: string): Promise<boolean> {
    await this.simulateDelay(200);

    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.status = 'rejected';
    session.endTime = new Date().toISOString();

    if (this.currentSession?.id === sessionId) {
      this.callState = 'idle';
      this.currentSession = null;
      this.notifyStateChange('idle');
    }

    return true;
  }

  async sendMessage(
    sessionId: string,
    type: RTCMessage['type'],
    content: string
  ): Promise<RTCMessage> {
    await this.simulateDelay(100);

    const message: RTCMessage = {
      id: `msg-${Date.now()}`,
      sessionId,
      type,
      content,
      timestamp: new Date().toISOString(),
      sender: 'local'
    };

    this.messages.push(message);

    return message;
  }

  async getMessages(sessionId: string): Promise<RTCMessage[]> {
    await this.simulateDelay(100);
    return this.messages.filter(m => m.sessionId === sessionId);
  }

  async getSessions(limit: number = 10): Promise<RTCSession[]> {
    await this.simulateDelay(200);
    return [...this.sessions].slice(0, limit);
  }

  async getCurrentSession(): Promise<RTCSession | null> {
    return this.currentSession;
  }

  async getCallState(): Promise<VideoCallState> {
    return this.callState;
  }

  async muteAudio(mute: boolean): Promise<void> {
    await this.simulateDelay(100);
    if (this.currentSession) {
      this.currentSession.media.audio = !mute;
    }
  }

  async muteVideo(mute: boolean): Promise<void> {
    await this.simulateDelay(100);
    if (this.currentSession) {
      this.currentSession.media.video = !mute;
    }
  }

  async switchCamera(): Promise<void> {
    await this.simulateDelay(200);
    console.log('Camera switched');
  }

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

  private notifySessionChange(session: RTCSession) {
    this.sessionListeners.forEach(listener => listener(session));
  }

  private notifyStateChange(state: VideoCallState) {
    this.stateListeners.forEach(listener => listener(state));
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const realTimeService = new RealTimeService();