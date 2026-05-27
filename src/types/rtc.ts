export type VideoCallState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface RTCSession {
  id: string;
  initiator: string;
  targetId: string;
  type: 'audio' | 'video';
  status: 'connecting' | 'connected' | 'ended' | 'rejected' | 'failed';
  startTime: string;
  endTime?: string;
  duration: number;
  maxDuration: number;
  media: {
    audio: boolean;
    video: boolean;
  };
  participants: string[];
  stats: {
    signalLatency: number;
    audioBitrate: number;
    videoBitrate: number;
    packetLoss: number;
  };
}

export interface RTCMessage {
  id: string;
  sessionId: string;
  type: 'system' | 'audio' | 'video' | 'data' | 'control';
  content: string;
  timestamp: string;
  sender: string;
}

export interface RTCStats {
  connected: boolean;
  signalLatency: number;
  audioBitrate: number;
  videoBitrate: number;
  packetLoss: number;
  codec: string;
}