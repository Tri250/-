/**
 * v2 流媒体路由
 * 提供 WebRTC 连接、RTSP 代理、流健康状态和画质切换接口
 */

import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { streamingService } from '../../services/streamingService';
import { authenticateToken } from '../../middleware';
import {
  WebRTCConnectRequest,
  WebRTCAnswerRequest,
  RTSPProxyRequest,
  QualitySwitchRequest,
  ErrorCode,
} from '../../types/v2-streaming';

const router = Router();

// ==================== 验证中间件 ====================

/**
 * 验证错误处理中间件
 */
const handleValidationErrors = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '请求参数验证失败',
      code: ErrorCode.INVALID_REQUEST,
      details: errors.array(),
    });
  }
  next();
};

// ==================== WebRTC 相关路由 ====================

/**
 * POST /api/v2/streaming/webrtc/connect
 * 建立 WebRTC 连接
 * 
 * 请求：
 * - deviceId: 设备ID
 * - quality: 画质级别（可选）
 * - enableAudio: 是否启用音频（可选）
 * - enableVideo: 是否启用视频（可选）
 * 
 * 响应：
 * - sessionId: 会话ID
 * - sdpOffer: SDP offer
 * - iceServers: ICE 服务器配置
 * - status: 连接状态
 * - createdAt: 创建时间
 */
router.post(
  '/webrtc/connect',
  authenticateToken,
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('quality').optional().isIn(['low', 'medium', 'high', 'auto']).withMessage('quality 必须是 low、medium、high 或 auto'),
    body('enableAudio').optional().isBoolean().withMessage('enableAudio 必须是布尔值'),
    body('enableVideo').optional().isBoolean().withMessage('enableVideo 必须是布尔值'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const request: WebRTCConnectRequest = {
        deviceId: req.body.deviceId,
        quality: req.body.quality || 'auto',
        enableAudio: req.body.enableAudio !== false,
        enableVideo: req.body.enableVideo !== false,
      };

      // 调用流媒体服务建立连接
      const result = await streamingService.connectWebRTC(request);

      console.log(`[WebRTC Connect] deviceId=${request.deviceId}, sessionId=${result.sessionId}, status=${result.status}`);

      res.json(result);
    } catch (error) {
      console.error('WebRTC 连接错误:', error);
      res.status(500).json({
        error: 'WebRTC 连接失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

/**
 * POST /api/v2/streaming/webrtc/answer
 * 接收 SDP answer
 * 
 * 请求：
 * - sessionId: 会话ID
 * - sdpAnswer: SDP answer
 * - iceCandidates: ICE 候选（可选）
 * 
 * 响应：
 * - success: 是否成功
 * - message: 消息
 * - sessionId: 会话ID
 */
router.post(
  '/webrtc/answer',
  authenticateToken,
  [
    body('sessionId').isString().notEmpty().withMessage('sessionId 不能为空'),
    body('sdpAnswer').isString().notEmpty().withMessage('sdpAnswer 不能为空'),
    body('iceCandidates').optional().isArray().withMessage('iceCandidates 必须是数组'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const request: WebRTCAnswerRequest = {
        sessionId: req.body.sessionId,
        sdpAnswer: req.body.sdpAnswer,
        iceCandidates: req.body.iceCandidates || [],
      };

      // 调用流媒体服务处理 answer
      const result = await streamingService.handleWebRTCAnswer(request);

      console.log(`[WebRTC Answer] sessionId=${request.sessionId}, success=${result.success}`);

      res.json(result);
    } catch (error) {
      console.error('WebRTC Answer 处理错误:', error);
      res.status(500).json({
        error: 'WebRTC Answer 处理失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== RTSP 相关路由 ====================

/**
 * POST /api/v2/streaming/rtsp/proxy
 * RTSP 代理连接
 * 
 * 请求：
 * - deviceId: 设备ID
 * - rtspUrl: RTSP 流地址
 * - username: RTSP 用户名（可选）
 * - password: RTSP 密码（可选）
 * - quality: 画质级别（可选）
 * 
 * 响应：
 * - sessionId: 会话ID
 * - websocketUrl: WebSocket 播放地址
 * - hlsUrl: HLS 播放地址（可选）
 * - status: 连接状态
 * - createdAt: 创建时间
 */
router.post(
  '/rtsp/proxy',
  authenticateToken,
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('rtspUrl').isString().notEmpty().withMessage('rtspUrl 不能为空'),
    body('username').optional().isString().withMessage('username 必须是字符串'),
    body('password').optional().isString().withMessage('password 必须是字符串'),
    body('quality').optional().isIn(['low', 'medium', 'high', 'auto']).withMessage('quality 必须是 low、medium、high 或 auto'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const request: RTSPProxyRequest = {
        deviceId: req.body.deviceId,
        rtspUrl: req.body.rtspUrl,
        username: req.body.username,
        password: req.body.password,
        quality: req.body.quality || 'auto',
      };

      // 调用流媒体服务创建 RTSP 代理
      const result = await streamingService.createRTSPProxy(request);

      console.log(`[RTSP Proxy] deviceId=${request.deviceId}, sessionId=${result.sessionId}, status=${result.status}`);

      res.json(result);
    } catch (error) {
      console.error('RTSP 代理错误:', error);
      res.status(500).json({
        error: 'RTSP 代理连接失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 流健康状态路由 ====================

/**
 * GET /api/v2/streaming/health/:deviceId
 * 获取流健康状态
 * 
 * 参数：
 * - deviceId: 设备ID
 * 
 * 响应：
 * - deviceId: 设备ID
 * - status: 流状态
 * - uptime: 运行时间
 * - bitrate: 码率
 * - fps: 帧率
 * - resolution: 分辨率
 * - packetLoss: 丢包率
 * - latency: 延迟
 * - lastFrameTime: 最后帧时间
 * - errors: 错误列表
 */
router.get(
  '/health/:deviceId',
  authenticateToken,
  [
    param('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;

      // 调用流媒体服务获取健康状态
      const result = await streamingService.getStreamHealth(deviceId);

      console.log(`[Stream Health] deviceId=${deviceId}, status=${result.status}`);

      res.json(result);
    } catch (error) {
      console.error('获取流健康状态错误:', error);
      res.status(500).json({
        error: '获取流健康状态失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 画质切换路由 ====================

/**
 * POST /api/v2/streaming/quality/:deviceId
 * 切换画质
 * 
 * 参数：
 * - deviceId: 设备ID
 * 
 * 请求：
 * - quality: 画质级别
 * 
 * 响应：
 * - success: 是否成功
 * - message: 消息
 * - currentQuality: 当前画质
 * - bitrate: 码率
 * - resolution: 分辨率
 */
router.post(
  '/quality/:deviceId',
  authenticateToken,
  [
    param('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('quality').isIn(['low', 'medium', 'high', 'auto']).withMessage('quality 必须是 low、medium、high 或 auto'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const request: QualitySwitchRequest = {
        deviceId,
        quality: req.body.quality,
      };

      // 调用流媒体服务切换画质
      const result = await streamingService.switchQuality(request);

      console.log(`[Quality Switch] deviceId=${deviceId}, quality=${request.quality}, success=${result.success}`);

      res.json(result);
    } catch (error) {
      console.error('画质切换错误:', error);
      res.status(500).json({
        error: '画质切换失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 会话管理路由 ====================

/**
 * DELETE /api/v2/streaming/session/:sessionId
 * 断开流会话
 * 
 * 参数：
 * - sessionId: 会话ID
 * 
 * 响应：
 * - success: 是否成功
 * - message: 消息
 */
router.delete(
  '/session/:sessionId',
  authenticateToken,
  [
    param('sessionId').isString().notEmpty().withMessage('sessionId 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      // 调用流媒体服务断开连接
      await streamingService.disconnect(sessionId);

      console.log(`[Session Disconnect] sessionId=${sessionId}`);

      res.json({
        success: true,
        message: '会话已断开',
        sessionId,
      });
    } catch (error) {
      console.error('断开会话错误:', error);
      res.status(500).json({
        error: '断开会话失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

/**
 * GET /api/v2/streaming/sessions
 * 获取所有活跃会话
 * 
 * 响应：
 * - webrtc: WebRTC 会话列表
 * - rtsp: RTSP 会话列表
 */
router.get(
  '/sessions',
  authenticateToken,
  async (_req: Request, res: Response) => {
    try {
      const result = streamingService.getActiveSessions();

      console.log(`[Active Sessions] webrtc=${result.webrtc.length}, rtsp=${result.rtsp.length}`);

      res.json(result);
    } catch (error) {
      console.error('获取活跃会话错误:', error);
      res.status(500).json({
        error: '获取活跃会话失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

export default router;