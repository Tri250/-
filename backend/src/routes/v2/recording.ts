/**
 * v2 录制路由
 * 提供录制开始、停止、历史查询、下载、删除和存储统计接口
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../../middleware';
import {
  RecordingStartRequest,
  RecordingStartResponse,
  RecordingStopRequest,
  RecordingStopResponse,
  RecordingHistoryItem,
  RecordingHistoryResponse,
  StorageStats,
  RecordingStatus,
  QualityLevel,
  ErrorCode,
} from '../../types/v2-streaming';

const router = Router();

// ==================== 录制会话存储 ====================

// 在实际项目中应该存储到数据库
interface RecordingSession {
  sessionId: string;
  cameraId: string;
  deviceId?: string;
  status: RecordingStatus;
  startTime: Date;
  endTime?: Date;
  duration: number;
  fileSize: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  quality: QualityLevel;
  enableAudio: boolean;
  tags: string[];
  description?: string;
  createdAt: Date;
}

// 录制会话存储
const recordingSessions: Map<string, RecordingSession> = new Map();

// 摄像头到会话的映射
const cameraSessions: Map<string, string[]> = new Map();

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

// ==================== 录制开始路由 ====================

/**
 * POST /api/v2/recording/start
 * 开始录制
 * 
 * 请求：
 * - cameraId: 摄像头ID
 * - deviceId: 设备ID（可选）
 * - duration: 录制时长（可选，秒）
 * - quality: 画质（可选）
 * - enableAudio: 是否录制音频（可选）
 * - tags: 标签（可选）
 * - description: 描述（可选）
 * 
 * 响应：
 * - sessionId: 录制会话ID
 * - cameraId: 摄像头ID
 * - status: 录制状态
 * - startTime: 开始时间
 * - estimatedSize: 预估文件大小
 * - message: 消息
 */
router.post(
  '/start',
  authenticateToken,
  [
    body('cameraId').isString().notEmpty().withMessage('cameraId 不能为空'),
    body('deviceId').optional().isString().withMessage('deviceId 必须是字符串'),
    body('duration').optional().isInt({ min: 10, max: 3600 }).withMessage('duration 必须是 10-3600 的整数'),
    body('quality').optional().isIn(['low', 'medium', 'high', 'auto']).withMessage('quality 必须是 low、medium、high 或 auto'),
    body('enableAudio').optional().isBoolean().withMessage('enableAudio 必须是布尔值'),
    body('tags').optional().isArray().withMessage('tags 必须是数组'),
    body('description').optional().isString().withMessage('description 必须是字符串'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const request: RecordingStartRequest = {
        cameraId: req.body.cameraId,
        deviceId: req.body.deviceId,
        duration: req.body.duration,
        quality: req.body.quality || 'medium',
        enableAudio: req.body.enableAudio !== false,
        tags: req.body.tags || [],
        description: req.body.description,
      };

      // 检查摄像头是否已有录制会话
      const existingSessions = cameraSessions.get(request.cameraId) || [];
      const activeSession = existingSessions.find(id => {
        const session = recordingSessions.get(id);
        return session && session.status === 'recording';
      });

      if (activeSession) {
        const session = recordingSessions.get(activeSession)!;
        return res.status(400).json({
          error: '摄像头正在录制中',
          code: ErrorCode.INVALID_REQUEST,
          sessionId: session.sessionId,
        });
      }

      // 创建录制会话
      const sessionId = uuidv4();
      const session: RecordingSession = {
        sessionId,
        cameraId: request.cameraId,
        deviceId: request.deviceId,
        status: 'recording',
        startTime: new Date(),
        duration: 0,
        fileSize: 0,
        quality: request.quality || 'medium',
        enableAudio: request.enableAudio !== false,
        tags: request.tags || [],
        description: request.description,
        createdAt: new Date(),
      };

      // 存储会话
      recordingSessions.set(sessionId, session);

      // 更新摄像头映射
      const cameraSessionIds = cameraSessions.get(request.cameraId) || [];
      cameraSessionIds.push(sessionId);
      cameraSessions.set(request.cameraId, cameraSessionIds);

      // 计算预估文件大小
      const bitrateMap: Record<QualityLevel, number> = {
        low: 500,      // 500 kbps
        medium: 1500,  // 1500 kbps
        high: 4000,    // 4000 kbps
        auto: 2000,    // 2000 kbps
      };
      const quality = request.quality || 'medium';
      const bitrate = bitrateMap[quality] * 1000;  // 转换为 bps
      const estimatedSize = request.duration 
        ? Math.floor(bitrate * request.duration / 8) 
        : undefined;

      const response: RecordingStartResponse = {
        sessionId,
        cameraId: request.cameraId,
        status: 'recording',
        startTime: session.startTime.toISOString(),
        estimatedSize,
        message: '录制已开始',
      };

      console.log(`[Recording Start] cameraId=${request.cameraId}, sessionId=${sessionId}, quality=${request.quality}`);

      res.json(response);

      // 如果设置了时长，自动停止录制（模拟）
      if (request.duration) {
        setTimeout(async () => {
          try {
            await stopRecording(sessionId);
          } catch (error) {
            console.error('自动停止录制错误:', error);
          }
        }, request.duration * 1000);
      }
    } catch (error) {
      console.error('开始录制错误:', error);
      res.status(500).json({
        error: '开始录制失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 录制停止路由 ====================

/**
 * POST /api/v2/recording/stop
 * 停止录制
 * 
 * 请求：
 * - sessionId: 录制会话ID
 * 
 * 响应：
 * - sessionId: 录制会话ID
 * - status: 录制状态
 * - endTime: 结束时间
 * - duration: 实际录制时长
 * - fileSize: 文件大小
 * - fileUrl: 文件下载地址
 * - thumbnailUrl: 缩略图地址
 * - message: 消息
 */
router.post(
  '/stop',
  authenticateToken,
  [
    body('sessionId').isString().notEmpty().withMessage('sessionId 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const request: RecordingStopRequest = {
        sessionId: req.body.sessionId,
      };

      const result = await stopRecording(request.sessionId);

      console.log(`[Recording Stop] sessionId=${request.sessionId}, duration=${result.duration}s, fileSize=${result.fileSize}`);

      res.json(result);
    } catch (error) {
      console.error('停止录制错误:', error);
      res.status(500).json({
        error: '停止录制失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

/**
 * 停止录制内部函数
 */
async function stopRecording(sessionId: string): Promise<RecordingStopResponse> {
  const session = recordingSessions.get(sessionId);
  
  if (!session) {
    throw new Error('录制会话不存在');
  }

  if (session.status !== 'recording') {
    throw new Error('录制会话不在录制状态');
  }

  // 更新会话状态
  session.status = 'completed';
  session.endTime = new Date();
  session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);

  // 计算文件大小（模拟）
  const bitrateMap: Record<QualityLevel, number> = {
    low: 500,
    medium: 1500,
    high: 4000,
    auto: 2000,
  };
  const bitrate = bitrateMap[session.quality] * 1000;
  session.fileSize = Math.floor(bitrate * session.duration / 8);

  // 生成文件 URL（模拟）
  session.fileUrl = `/uploads/recordings/${sessionId}.mp4`;
  session.thumbnailUrl = `/uploads/thumbnails/${sessionId}.jpg`;

  return {
    sessionId,
    status: 'completed',
    endTime: session.endTime.toISOString(),
    duration: session.duration,
    fileSize: session.fileSize,
    fileUrl: session.fileUrl,
    thumbnailUrl: session.thumbnailUrl,
    message: '录制已停止',
  };
}

// ==================== 录制历史路由 ====================

/**
 * GET /api/v2/recording/history/:cameraId
 * 获取录制历史
 * 
 * 参数：
 * - cameraId: 摄像头ID
 * - page: 页码（可选）
 * - pageSize: 每页数量（可选）
 * - status: 状态过滤（可选）
 * 
 * 响应：
 * - cameraId: 摄像头ID
 * - total: 总数量
 * - page: 当前页
 * - pageSize: 每页数量
 * - items: 录制历史项数组
 */
router.get(
  '/history/:cameraId',
  authenticateToken,
  [
    param('cameraId').isString().notEmpty().withMessage('cameraId 不能为空'),
    query('page').optional().isInt({ min: 1 }).withMessage('page 必须是大于 0 的整数'),
    query('pageSize').optional().isInt({ min: 1, max: 50 }).withMessage('pageSize 必须是 1-50 的整数'),
    query('status').optional().isIn(['pending', 'recording', 'paused', 'completed', 'failed', 'processing']).withMessage('status 必须是有效的录制状态'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { cameraId } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const status = req.query.status as RecordingStatus | undefined;

      // 获取摄像头的录制会话
      const sessionIds = cameraSessions.get(cameraId) || [];
      let sessions = sessionIds
        .map(id => recordingSessions.get(id))
        .filter(session => session !== undefined) as RecordingSession[];

      // 状态过滤
      if (status) {
        sessions = sessions.filter(session => session.status === status);
      }

      // 按时间排序（最新的在前）
      sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

      // 分页
      const total = sessions.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pageSessions = sessions.slice(startIndex, endIndex);

      // 转换为历史项
      const items: RecordingHistoryItem[] = pageSessions.map(session => ({
        sessionId: session.sessionId,
        cameraId: session.cameraId,
        deviceId: session.deviceId,
        status: session.status,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        duration: session.duration,
        fileSize: session.fileSize,
        fileUrl: session.fileUrl,
        thumbnailUrl: session.thumbnailUrl,
        tags: session.tags,
        description: session.description,
        createdAt: session.createdAt.toISOString(),
      }));

      const response: RecordingHistoryResponse = {
        cameraId,
        total,
        page,
        pageSize,
        items,
      };

      console.log(`[Recording History] cameraId=${cameraId}, total=${total}, page=${page}`);

      res.json(response);
    } catch (error) {
      console.error('获取录制历史错误:', error);
      res.status(500).json({
        error: '获取录制历史失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 录制下载路由 ====================

/**
 * GET /api/v2/recording/download/:sessionId
 * 下载录制文件
 * 
 * 参数：
 * - sessionId: 录制会话ID
 * 
 * 响应：
 * - 文件下载或下载链接
 */
router.get(
  '/download/:sessionId',
  authenticateToken,
  [
    param('sessionId').isString().notEmpty().withMessage('sessionId 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const session = recordingSessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: '录制会话不存在',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      if (session.status !== 'completed') {
        return res.status(400).json({
          error: '录制未完成，无法下载',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      // 返回下载信息
      console.log(`[Recording Download] sessionId=${sessionId}, fileSize=${session.fileSize}`);

      res.json({
        sessionId,
        fileUrl: session.fileUrl,
        fileSize: session.fileSize,
        duration: session.duration,
        quality: session.quality,
        format: 'mp4',
        message: '文件准备下载',
      });
    } catch (error) {
      console.error('下载录制文件错误:', error);
      res.status(500).json({
        error: '下载录制文件失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 录制删除路由 ====================

/**
 * DELETE /api/v2/recording/:sessionId
 * 删除录制
 * 
 * 参数：
 * - sessionId: 录制会话ID
 * 
 * 响应：
 * - success: 是否成功
 * - message: 消息
 */
router.delete(
  '/:sessionId',
  authenticateToken,
  [
    param('sessionId').isString().notEmpty().withMessage('sessionId 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const session = recordingSessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: '录制会话不存在',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      // 不能删除正在录制的会话
      if (session.status === 'recording') {
        return res.status(400).json({
          error: '正在录制的会话无法删除，请先停止录制',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      // 删除会话
      recordingSessions.delete(sessionId);

      // 从摄像头映射中移除
      const cameraSessionIds = cameraSessions.get(session.cameraId) || [];
      const index = cameraSessionIds.indexOf(sessionId);
      if (index > -1) {
        cameraSessionIds.splice(index, 1);
        cameraSessions.set(session.cameraId, cameraSessionIds);
      }

      console.log(`[Recording Delete] sessionId=${sessionId}, cameraId=${session.cameraId}`);

      res.json({
        success: true,
        message: '录制已删除',
        sessionId,
      });
    } catch (error) {
      console.error('删除录制错误:', error);
      res.status(500).json({
        error: '删除录制失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 存储统计路由 ====================

/**
 * GET /api/v2/recording/storage/stats
 * 存储统计
 * 
 * 响应：
 * - totalSpace: 总空间
 * - usedSpace: 已用空间
 * - freeSpace: 剩余空间
 * - usagePercentage: 使用百分比
 * - recordingCount: 录制文件数量
 * - oldestRecording: 最早录制时间
 * - newestRecording: 最新录制时间
 * - averageFileSize: 平均文件大小
 * - totalDuration: 总录制时长
 */
router.get(
  '/storage/stats',
  authenticateToken,
  async (_req: Request, res: Response) => {
    try {
      // 计算统计数据
      let totalSize = 0;
      let totalDuration = 0;
      let recordingCount = 0;
      let oldestRecordingDate: string = '';
      let newestRecordingDate: string = '';

      // 使用 Array.from 避免迭代器问题
      const sessions = Array.from(recordingSessions.values());
      for (const session of sessions) {
        if (session.status === 'completed') {
          totalSize += session.fileSize;
          totalDuration += session.duration;
          recordingCount++;

          const sessionStartTime = session.startTime.toISOString();
          if (!oldestRecordingDate || session.startTime.toISOString() < oldestRecordingDate) {
            oldestRecordingDate = sessionStartTime;
          }
          if (!newestRecordingDate || session.startTime.toISOString() > newestRecordingDate) {
            newestRecordingDate = sessionStartTime;
          }
        }
      }

      // 模拟存储空间（实际应从系统获取）
      const totalSpace = 100 * 1024 * 1024 * 1024;  // 100 GB
      const usedSpace = totalSize;
      const freeSpace = totalSpace - usedSpace;
      const usagePercentage = Math.round((usedSpace / totalSpace) * 100);
      const averageFileSize = recordingCount > 0 ? Math.floor(totalSize / recordingCount) : 0;

      const stats: StorageStats = {
        totalSpace,
        usedSpace,
        freeSpace,
        usagePercentage,
        recordingCount,
        oldestRecording: oldestRecordingDate,
        newestRecording: newestRecordingDate,
        averageFileSize,
        totalDuration,
      };

      console.log(`[Storage Stats] recordings=${recordingCount}, used=${Math.round(usedSpace / 1024 / 1024)}MB, usage=${usagePercentage}%`);

      res.json(stats);
    } catch (error) {
      console.error('获取存储统计错误:', error);
      res.status(500).json({
        error: '获取存储统计失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 录制状态查询路由 ====================

/**
 * GET /api/v2/recording/status/:sessionId
 * 获取录制状态
 * 
 * 参数：
 * - sessionId: 录制会话ID
 * 
 * 响应：
 * - sessionId: 录制会话ID
 * - status: 录制状态
 * - duration: 当前录制时长
 * - fileSize: 当前文件大小
 */
router.get(
  '/status/:sessionId',
  authenticateToken,
  [
    param('sessionId').isString().notEmpty().withMessage('sessionId 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const session = recordingSessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: '录制会话不存在',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      // 如果正在录制，计算当前时长和大小
      let currentDuration = session.duration;
      let currentFileSize = session.fileSize;

      if (session.status === 'recording') {
        currentDuration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
        
        const bitrateMap: Record<QualityLevel, number> = {
          low: 500,
          medium: 1500,
          high: 4000,
          auto: 2000,
        };
        const bitrate = bitrateMap[session.quality] * 1000;
        currentFileSize = Math.floor(bitrate * currentDuration / 8);
      }

      console.log(`[Recording Status] sessionId=${sessionId}, status=${session.status}, duration=${currentDuration}s`);

      res.json({
        sessionId,
        cameraId: session.cameraId,
        status: session.status,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        duration: currentDuration,
        fileSize: currentFileSize,
        quality: session.quality,
        enableAudio: session.enableAudio,
      });
    } catch (error) {
      console.error('获取录制状态错误:', error);
      res.status(500).json({
        error: '获取录制状态失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 批量删除路由 ====================

/**
 * DELETE /api/v2/recording/batch
 * 批量删除录制
 * 
 * 请求：
 * - sessionIds: 录制会话ID数组
 * 
 * 响应：
 * - success: 是否成功
 * - deletedCount: 删除数量
 * - failedCount: 失败数量
 * - message: 消息
 */
router.delete(
  '/batch',
  authenticateToken,
  [
    body('sessionIds').isArray({ min: 1, max: 50 }).withMessage('sessionIds 必须是 1-50 的数组'),
    body('sessionIds.*').isString().notEmpty().withMessage('sessionIds 元素不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const sessionIds = req.body.sessionIds as string[];

      let deletedCount = 0;
      let failedCount = 0;
      const failedSessions: string[] = [];

      for (const sessionId of sessionIds) {
        const session = recordingSessions.get(sessionId);
        
        if (!session) {
          failedCount++;
          failedSessions.push(sessionId);
          continue;
        }

        if (session.status === 'recording') {
          failedCount++;
          failedSessions.push(sessionId);
          continue;
        }

        // 删除会话
        recordingSessions.delete(sessionId);

        // 从摄像头映射中移除
        const cameraSessionIds = cameraSessions.get(session.cameraId) || [];
        const index = cameraSessionIds.indexOf(sessionId);
        if (index > -1) {
          cameraSessionIds.splice(index, 1);
          cameraSessions.set(session.cameraId, cameraSessionIds);
        }

        deletedCount++;
      }

      console.log(`[Batch Delete] deleted=${deletedCount}, failed=${failedCount}`);

      res.json({
        success: true,
        deletedCount,
        failedCount,
        failedSessions,
        message: `成功删除 ${deletedCount} 个录制，失败 ${failedCount} 个`,
      });
    } catch (error) {
      console.error('批量删除录制错误:', error);
      res.status(500).json({
        error: '批量删除录制失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

export default router;