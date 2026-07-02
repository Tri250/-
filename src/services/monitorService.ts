import type { LiveMonitoring, SmartEvent, RecordingSession, StreamConfig, EventType, EventSeverity } from '../types/monitor';
import { databaseService, STORE_NAMES } from './databaseService';

// ==================== 运动检测配置 ====================

interface MotionDetectionConfig {
  sensitivity: number;       // 0-100，越高越灵敏
  minAreaRatio: number;      // 最小运动区域占画面比例（0-1）
  cooldownMs: number;        // 运动事件冷却时间（毫秒）
  noMotionThresholdMs: number; // 长时间静止判定阈值（毫秒）
  abnormalPatternWindow: number; // 异常行为检测窗口（帧数）
}

const DEFAULT_MOTION_CONFIG: MotionDetectionConfig = {
  sensitivity: 50,
  minAreaRatio: 0.01,
  cooldownMs: 3000,
  noMotionThresholdMs: 30000,
  abnormalPatternWindow: 30,
};

// ==================== 帧分析数据 ====================

interface FrameAnalysis {
  motionRatio: number;
  motionRegions: Array<{ x: number; y: number; width: number; height: number }>;
  timestamp: number;
}

// ==================== 监控会话状态 ====================

interface MonitoringSession {
  cameraId: string;
  config: StreamConfig;
  ws: WebSocket | null;
  videoElement: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  prevFrameData: ImageData | null;
  animationFrameId: number | null;
  motionConfig: MotionDetectionConfig;
  lastMotionEventTime: number;
  lastMotionTime: number;
  noMotionCheckInterval: ReturnType<typeof setInterval> | null;
  motionHistory: FrameAnalysis[];
  isMonitoring: boolean;
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  recordingChunks: Blob[];
  activeSessionId: string | null;
}

class MonitorService {
  private sessions: Map<string, MonitoringSession> = new Map();
  private eventCallbacks: Array<(event: SmartEvent) => void> = [];

  // ==================== 开始监控 ====================

  async startMonitoring(cameraId: string, config: StreamConfig): Promise<LiveMonitoring> {
    // 如果已有会话，先停止
    if (this.sessions.has(cameraId)) {
      await this.stopMonitoring(cameraId);
    }

    const session: MonitoringSession = {
      cameraId,
      config,
      ws: null,
      videoElement: null,
      canvas: null,
      ctx: null,
      prevFrameData: null,
      animationFrameId: null,
      motionConfig: { ...DEFAULT_MOTION_CONFIG },
      lastMotionEventTime: 0,
      lastMotionTime: Date.now(),
      noMotionCheckInterval: null,
      motionHistory: [],
      isMonitoring: false,
      isRecording: false,
      mediaRecorder: null,
      recordingChunks: [],
      activeSessionId: null,
    };

    this.sessions.set(cameraId, session);

    try {
      // 1. 通过 WebSocket 连接到摄像头流媒体代理
      await this.connectStreamProxy(session);

      // 2. 创建视频分析管道
      this.setupVideoAnalysisPipeline(session);

      // 3. 启动长时间静止检测
      this.startNoMotionCheck(session);

      session.isMonitoring = true;
    } catch (error) {
      session.isMonitoring = false;
      console.error(`启动监控失败 [${cameraId}]:`, error);
    }

    return {
      isActive: session.isMonitoring,
      streamQuality: config.quality,
      isRecording: false,
      eventDetection: {
        abnormalBehavior: config.motionDetection,
        emotionalChange: true,
        dangerApproach: true,
      },
    };
  }

  // ==================== 停止监控 ====================

  async stopMonitoring(cameraId: string): Promise<boolean> {
    const session = this.sessions.get(cameraId);
    if (!session) return false;

    // 停止正在进行的录制
    if (session.isRecording && session.activeSessionId) {
      await this.stopRecording(session.activeSessionId);
    }

    // 断开 WebSocket
    if (session.ws) {
      session.ws.close();
      session.ws = null;
    }

    // 停止视频分析
    if (session.animationFrameId !== null) {
      cancelAnimationFrame(session.animationFrameId);
      session.animationFrameId = null;
    }

    // 停止静止检测
    if (session.noMotionCheckInterval) {
      clearInterval(session.noMotionCheckInterval);
      session.noMotionCheckInterval = null;
    }

    // 清理视频元素
    if (session.videoElement) {
      session.videoElement.srcObject = null;
      session.videoElement = null;
    }

    session.canvas = null;
    session.ctx = null;
    session.prevFrameData = null;
    session.isMonitoring = false;

    this.sessions.delete(cameraId);
    return true;
  }

  // ==================== 获取监控状态 ====================

  async getMonitoringStatus(cameraId: string): Promise<LiveMonitoring> {
    const session = this.sessions.get(cameraId);

    return {
      isActive: session?.isMonitoring ?? false,
      streamQuality: session?.config.quality ?? 'auto',
      isRecording: session?.isRecording ?? false,
      eventDetection: {
        abnormalBehavior: session?.config.motionDetection ?? false,
        emotionalChange: true,
        dangerApproach: true,
      },
    };
  }

  // ==================== 开始录制 ====================

  async startRecording(cameraId: string): Promise<RecordingSession> {
    const session = this.sessions.get(cameraId);
    if (!session || !session.isMonitoring) {
      throw new Error('监控未启动，无法录制');
    }

    if (session.isRecording) {
      throw new Error('已在录制中');
    }

    const sessionId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const recordingSession: RecordingSession = {
      id: sessionId,
      cameraId,
      startTime: new Date().toISOString(),
      status: 'recording',
    };

    // 保存录制会话到 IndexedDB
    await databaseService.put(STORE_NAMES.RECORDING_SESSIONS, recordingSession);

    // 获取视频流并创建 MediaRecorder
    try {
      const stream = this.getVideoStream(session);
      if (!stream) {
        throw new Error('无法获取视频流');
      }

      const mimeType = this.getSupportedMimeType();
      const quality = this.getRecordingQuality(session.config);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: quality.bitrate,
      });

      session.recordingChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          session.recordingChunks.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        this.handleRecordingError(session, sessionId);
      };

      mediaRecorder.start(1000); // 每秒收集一次数据
      session.mediaRecorder = mediaRecorder;
      session.isRecording = true;
      session.activeSessionId = sessionId;
    } catch (error) {
      recordingSession.status = 'failed';
      await databaseService.put(STORE_NAMES.RECORDING_SESSIONS, recordingSession);
      throw error;
    }

    return recordingSession;
  }

  // ==================== 停止录制 ====================

  async stopRecording(sessionId: string): Promise<RecordingSession> {
    // 从 IndexedDB 查找录制会话
    const recordingSession = await databaseService.get<RecordingSession>(STORE_NAMES.RECORDING_SESSIONS, sessionId);
    if (!recordingSession) {
      throw new Error(`录制会话不存在: ${sessionId}`);
    }

    const session = this.sessions.get(recordingSession.cameraId);

    if (session?.mediaRecorder && session.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        session.mediaRecorder!.onstop = () => resolve();
        session.mediaRecorder!.stop();
      });

      // 合并录制数据
      if (session.recordingChunks.length > 0) {
        const blob = new Blob(session.recordingChunks, {
          type: session.recordingChunks[0].type,
        });

        recordingSession.fileSize = blob.size;
        recordingSession.endTime = new Date().toISOString();
        recordingSession.duration = Math.floor(
          (Date.now() - new Date(recordingSession.startTime).getTime()) / 1000
        );
        recordingSession.status = 'completed';

        // 创建本地 URL
        recordingSession.fileUrl = URL.createObjectURL(blob);

        // 自动上传到云端
        this.uploadRecording(blob, recordingSession).catch((err) => {
          console.error('录制文件上传失败:', err);
        });
      } else {
        recordingSession.status = 'failed';
      }

      session.isRecording = false;
      session.activeSessionId = null;
      session.mediaRecorder = null;
      session.recordingChunks = [];
    } else {
      // 会话可能已关闭，标记为完成
      recordingSession.endTime = new Date().toISOString();
      recordingSession.duration = Math.floor(
        (Date.now() - new Date(recordingSession.startTime).getTime()) / 1000
      );
      recordingSession.status = 'completed';
    }

    // 更新 IndexedDB
    await databaseService.put(STORE_NAMES.RECORDING_SESSIONS, recordingSession);

    return recordingSession;
  }

  // ==================== 录制历史 ====================

  async getRecordingHistory(cameraId: string, limit: number = 20): Promise<RecordingSession[]> {
    const allSessions = await databaseService.getByIndex<RecordingSession>(
      STORE_NAMES.RECORDING_SESSIONS,
      'cameraId',
      cameraId
    );

    return allSessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  // ==================== 事件管理 ====================

  async getAllEvents(limit: number = 50): Promise<SmartEvent[]> {
    const events = await databaseService.getAll<SmartEvent>(STORE_NAMES.EVENTS);
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async acknowledgeEvent(eventId: string): Promise<boolean> {
    const event = await databaseService.get<SmartEvent>(STORE_NAMES.EVENTS, eventId);
    if (!event) return false;

    event.acknowledged = true;
    await databaseService.put(STORE_NAMES.EVENTS, event);
    return true;
  }

  async updateStreamConfig(cameraId: string, config: Partial<StreamConfig>): Promise<boolean> {
    const session = this.sessions.get(cameraId);
    if (!session) return false;

    session.config = { ...session.config, ...config };

    // 如果运动检测配置变更，更新运动检测参数
    if (config.motionDetection !== undefined) {
      // 运动检测开关变更会在下一帧生效
    }

    return true;
  }

  onEventDetection(callback: (event: SmartEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  // ==================== WebSocket 连接 ====================

  private connectStreamProxy(session: MonitoringSession): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.getWebSocketUrl(session.cameraId);

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // 发送配置
          ws.send(JSON.stringify({
            type: 'config',
            quality: session.config.quality,
            audioEnabled: session.config.audioEnabled,
            nightVision: session.config.nightVision,
          }));
          resolve();
        };

        ws.onmessage = (event) => {
          this.handleStreamMessage(session, event);
        };

        ws.onerror = (error) => {
          console.error(`WebSocket 错误 [${session.cameraId}]:`, error);
          reject(new Error('WebSocket 连接失败'));
        };

        ws.onclose = (event) => {
          if (session.isMonitoring && !event.wasClean) {
            // 非正常关闭，尝试重连
            this.reconnectStream(session);
          }
        };

        session.ws = ws;
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleStreamMessage(session: MonitoringSession, event: MessageEvent): void {
    if (typeof event.data === 'string') {
      // 控制消息
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'stream_ready') {
          // 流媒体就绪，设置视频元素
          this.setupVideoFromStream(session, msg.streamUrl);
        }
      } catch {
        // 忽略非 JSON 消息
      }
    }
    // 二进制帧数据由 video element 直接处理
  }

  private setupVideoFromStream(session: MonitoringSession, streamUrl: string): void {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.src = streamUrl;

    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };

    session.videoElement = video;
  }

  private async reconnectStream(session: MonitoringSession): Promise<void> {
    // 指数退避重连
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (const delay of delays) {
      await new Promise(r => setTimeout(r, delay));
      if (!session.isMonitoring) return;

      try {
        await this.connectStreamProxy(session);
        return;
      } catch {
        continue;
      }
    }

    // 重连失败，发出事件
    this.emitEvent({
      id: `event-${Date.now()}`,
      type: 'environment',
      severity: 'critical',
      description: `摄像头 ${session.cameraId} 连接断开，重连失败`,
      cameraId: session.cameraId,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // ==================== 视频分析管道 ====================

  private setupVideoAnalysisPipeline(session: MonitoringSession): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    session.canvas = canvas;
    session.ctx = ctx;

    const analyzeFrame = () => {
      if (!session.isMonitoring || !session.videoElement || !session.ctx) {
        return;
      }

      const video = session.videoElement;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        // 动态调整 canvas 尺寸
        if (session.canvas!.width !== video.videoWidth || session.canvas!.height !== video.videoHeight) {
          session.canvas!.width = video.videoWidth || 640;
          session.canvas!.height = video.videoHeight || 480;
        }

        session.ctx.drawImage(video, 0, 0);
        const currentFrameData = session.ctx.getImageData(
          0, 0,
          session.canvas!.width,
          session.canvas!.height
        );

        // 运动检测
        if (session.config.motionDetection && session.prevFrameData) {
          const analysis = this.detectMotion(
            session.prevFrameData,
            currentFrameData,
            session.canvas!.width,
            session.canvas!.height,
            session.motionConfig
          );

          this.handleMotionAnalysis(session, analysis);
        }

        session.prevFrameData = currentFrameData;
      }

      session.animationFrameId = requestAnimationFrame(analyzeFrame);
    };

    session.animationFrameId = requestAnimationFrame(analyzeFrame);
  }

  // ==================== 运动检测算法 ====================

  private detectMotion(
    prevFrame: ImageData,
    currFrame: ImageData,
    width: number,
    height: number,
    config: MotionDetectionConfig
  ): FrameAnalysis {
    const prev = prevFrame.data;
    const curr = currFrame.data;
    const totalPixels = width * height;

    // 灵敏度映射：sensitivity 0-100 → threshold 50-5
    const threshold = 55 - (config.sensitivity * 0.5);

    // 帧差法：逐像素比较
    const diffMap = new Uint8Array(totalPixels);
    let diffCount = 0;

    // 降采样步长，加速计算
    const step = 2;
    let sampledPixels = 0;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        sampledPixels++;

        // 计算灰度差值
        const prevGray = prev[i] * 0.299 + prev[i + 1] * 0.587 + prev[i + 2] * 0.114;
        const currGray = curr[i] * 0.299 + curr[i + 1] * 0.587 + curr[i + 2] * 0.114;
        const diff = Math.abs(currGray - prevGray);

        if (diff > threshold) {
          diffMap[y * width + x] = 1;
          diffCount++;
        }
      }
    }

    const motionRatio = diffCount / sampledPixels;

    // 计算运动区域（连通区域简化：网格化检测）
    const motionRegions = this.findMotionRegions(diffMap, width, height, config.minAreaRatio);

    return {
      motionRatio,
      motionRegions,
      timestamp: Date.now(),
    };
  }

  private findMotionRegions(
    diffMap: Uint8Array,
    width: number,
    height: number,
    minAreaRatio: number
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const gridSize = 32;
    const gridCols = Math.ceil(width / gridSize);
    const gridRows = Math.ceil(height / gridSize);
    const grid = new Uint8Array(gridRows * gridCols);

    // 统计每个网格中的运动像素
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (diffMap[y * width + x]) {
          const gx = Math.floor(x / gridSize);
          const gy = Math.floor(y / gridSize);
          grid[gy * gridCols + gx]++;
        }
      }
    }

    // 网格中运动像素超过 30% 则标记为运动网格
    const threshold = gridSize * gridSize * 0.3;
    const regions: Array<{ x: number; y: number; width: number; height: number }> = [];

    // 简单的连通区域合并：扫描运动网格，合并相邻区域
    const visited = new Set<number>();

    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        const idx = gy * gridCols + gx;
        if (visited.has(idx) || grid[idx] < threshold) continue;

        // BFS 扩展连通区域
        const queue: Array<[number, number]> = [[gx, gy]];
        visited.add(idx);
        let minX = gx, maxX = gx, minY = gy, maxY = gy;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= gridCols || ny < 0 || ny >= gridRows) continue;
            const nIdx = ny * gridCols + nx;
            if (visited.has(nIdx) || grid[nIdx] < threshold) continue;
            visited.add(nIdx);
            queue.push([nx, ny]);
            minX = Math.min(minX, nx);
            maxX = Math.max(maxX, nx);
            minY = Math.min(minY, ny);
            maxY = Math.max(maxY, ny);
          }
        }

        const regionWidth = (maxX - minX + 1) * gridSize;
        const regionHeight = (maxY - minY + 1) * gridSize;
        const regionArea = regionWidth * regionHeight;
        const totalArea = width * height;

        // 只保留超过最小面积比的区域
        if (regionArea / totalArea >= minAreaRatio) {
          regions.push({
            x: minX * gridSize,
            y: minY * gridSize,
            width: regionWidth,
            height: regionHeight,
          });
        }
      }
    }

    return regions;
  }

  // ==================== 运动分析处理 ====================

  private handleMotionAnalysis(session: MonitoringSession, analysis: FrameAnalysis): void {
    const now = Date.now();

    // 更新运动历史
    session.motionHistory.push(analysis);
    if (session.motionHistory.length > 100) {
      session.motionHistory = session.motionHistory.slice(-100);
    }

    // 检测运动事件
    if (analysis.motionRatio > session.motionConfig.minAreaRatio) {
      session.lastMotionTime = now;

      // 冷却时间内不重复触发
      if (now - session.lastMotionEventTime >= session.motionConfig.cooldownMs) {
        session.lastMotionEventTime = now;

        const areaPercent = Math.round(analysis.motionRatio * 100);
        const regionCount = analysis.motionRegions.length;

        this.emitEvent({
          id: `event-${now}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'behavior',
          severity: areaPercent > 20 ? 'critical' : areaPercent > 10 ? 'warning' : 'info',
          description: `检测到运动：画面 ${areaPercent}% 区域变化，${regionCount} 个运动区域`,
          cameraId: session.cameraId,
          timestamp: new Date().toISOString(),
          metadata: {
            motionRatio: analysis.motionRatio,
            regions: analysis.motionRegions,
          },
          acknowledged: false,
        });
      }
    }

    // 异常行为检测：基于运动模式
    if (session.motionHistory.length >= session.motionConfig.abnormalPatternWindow) {
      this.detectAbnormalBehavior(session);
    }
  }

  // ==================== 异常行为检测 ====================

  private detectAbnormalBehavior(session: MonitoringSession): void {
    const window = session.motionConfig.abnormalPatternWindow;
    const recentHistory = session.motionHistory.slice(-window);

    // 计算运动频率
    const motionFrames = recentHistory.filter(h => h.motionRatio > session.motionConfig.minAreaRatio);
    const motionFrequency = motionFrames.length / window;

    // 计算运动强度变化
    const motionRatios = recentHistory.map(h => h.motionRatio);
    const avgMotion = motionRatios.reduce((s, v) => s + v, 0) / motionRatios.length;

    // 计算方差（运动波动）
    const variance = motionRatios.reduce((s, v) => s + Math.pow(v - avgMotion, 2), 0) / motionRatios.length;

    // 异常模式1：高频剧烈运动（可能表示宠物异常兴奋或受惊）
    if (motionFrequency > 0.8 && avgMotion > 0.1) {
      this.emitEvent({
        id: `event-${Date.now()}-abnormal`,
        type: 'behavior',
        severity: 'warning',
        description: '检测到异常行为：持续剧烈运动，可能存在异常兴奋或受惊',
        cameraId: session.cameraId,
        timestamp: new Date().toISOString(),
        metadata: {
          motionFrequency,
          avgMotion,
          pattern: 'high_frequency_intense',
        },
        acknowledged: false,
      });
      // 清空历史避免重复触发
      session.motionHistory = [];
      return;
    }

    // 异常模式2：运动强度剧烈波动（可能表示异常行为模式）
    if (variance > 0.01 && motionFrequency > 0.3) {
      this.emitEvent({
        id: `event-${Date.now()}-abnormal`,
        type: 'behavior',
        severity: 'info',
        description: '检测到异常行为：运动模式波动异常',
        cameraId: session.cameraId,
        timestamp: new Date().toISOString(),
        metadata: {
          motionFrequency,
          avgMotion,
          variance,
          pattern: 'irregular_motion',
        },
        acknowledged: false,
      });
      session.motionHistory = [];
    }
  }

  // ==================== 长时间静止检测 ====================

  private startNoMotionCheck(session: MonitoringSession): void {
    session.noMotionCheckInterval = setInterval(() => {
      if (!session.isMonitoring) return;

      const timeSinceMotion = Date.now() - session.lastMotionTime;
      if (timeSinceMotion >= session.motionConfig.noMotionThresholdMs) {
        this.emitEvent({
          id: `event-${Date.now()}-nomotion`,
          type: 'behavior',
          severity: 'info',
          description: `超过 ${Math.round(session.motionConfig.noMotionThresholdMs / 1000)} 秒未检测到运动`,
          cameraId: session.cameraId,
          timestamp: new Date().toISOString(),
          metadata: {
            noMotionDuration: timeSinceMotion,
            pattern: 'no_motion',
          },
          acknowledged: false,
        });

        // 重置计时，避免重复触发
        session.lastMotionTime = Date.now();
      }
    }, 5000); // 每 5 秒检查一次
  }

  // ==================== 录制相关 ====================

  private getVideoStream(session: MonitoringSession): MediaStream | null {
    if (session.videoElement && session.videoElement.srcObject instanceof MediaStream) {
      return session.videoElement.srcObject;
    }

    // 如果 video element 没有直接关联 stream，从 canvas 捕获
    if (session.canvas) {
      return session.canvas.captureStream(30);
    }

    return null;
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  }

  private getRecordingQuality(config: StreamConfig): { bitrate: number } {
    const qualityMap: Record<string, number> = {
      'low': 500_000,
      'medium': 1_500_000,
      'high': 3_000_000,
      'ultra': 6_000_000,
      'auto': 2_000_000,
      '720p': 1_500_000,
      '1080p': 3_000_000,
      '480p': 500_000,
    };
    return { bitrate: qualityMap[config.quality] || 2_000_000 };
  }

  private async handleRecordingError(session: MonitoringSession, sessionId: string): Promise<void> {
    const recordingSession = await databaseService.get<RecordingSession>(STORE_NAMES.RECORDING_SESSIONS, sessionId);
    if (recordingSession) {
      recordingSession.status = 'failed';
      recordingSession.endTime = new Date().toISOString();
      await databaseService.put(STORE_NAMES.RECORDING_SESSIONS, recordingSession);
    }

    session.isRecording = false;
    session.activeSessionId = null;
    session.mediaRecorder = null;
    session.recordingChunks = [];

    this.emitEvent({
      id: `event-${Date.now()}-recfail`,
      type: 'environment',
      severity: 'warning',
      description: `录制失败: ${session.cameraId}`,
      cameraId: session.cameraId,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  private async uploadRecording(blob: Blob, session: RecordingSession): Promise<void> {
    const file = new File([blob], `recording-${session.id}.webm`, { type: blob.type });

    try {
      const { cloudStorageService } = await import('./cloudStorageService');
      const result = await cloudStorageService.uploadFile(file, {
        cameraId: session.cameraId,
        tags: ['recording', 'auto-upload'],
        metadata: {
          recordingId: session.id,
          duration: session.duration,
        },
      });

      if (result.success && result.file) {
        session.fileUrl = result.file.url;
        await databaseService.put(STORE_NAMES.RECORDING_SESSIONS, session);
      }
    } catch (error) {
      console.error('录制文件上传失败:', error);
    }
  }

  // ==================== 事件通知 ====================

  private emitEvent(event: SmartEvent): void {
    // 持久化事件
    databaseService.put(STORE_NAMES.EVENTS, event).catch(() => {});

    // 通知回调
    this.eventCallbacks.forEach(cb => {
      try {
        cb(event);
      } catch {
        // 回调执行异常不影响其他回调
      }
    });
  }

  // ==================== 工具方法 ====================

  private getWebSocketUrl(cameraId: string): string {
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'wss://stream.pawsync.com/ws';
    return `${wsBaseUrl}/camera/${cameraId}`;
  }
}

export const monitorService = new MonitorService();
