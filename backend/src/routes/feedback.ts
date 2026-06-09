// ============================================
// PawSync Pro - feedback.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 用户反馈闭环系统后端 API
// ============================================

import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware';
import prisma from '../lib/prisma';

const router = Router();

// ==================== 类型定义 ====================

/**
 * 反馈类型
 */
type FeedbackRating = 'accurate' | 'inaccurate' | 'alternative';

/**
 * 反馈状态
 */
type FeedbackStatus = 'pending' | 'processed' | 'applied' | 'dismissed';

/**
 * 情绪类型
 */
type PrimaryEmotion = 'happy' | 'curious' | 'anxious' | 'angry' | 'needs' | 'calm' | 'excited' | 'safe';

/**
 * 反馈记录接口
 */
interface FeedbackRecord {
  id: string;
  analysisId: string;
  petId: string;
  userId: string;
  rating: FeedbackRating;
  correctedEmotion?: PrimaryEmotion;
  comment?: string;
  originalEmotion: PrimaryEmotion;
  originalConfidence: number;
  originalTranslation: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt?: Date;
  processedAt?: Date;
  appliedToModel?: boolean;
}

/**
 * 错误代码
 */
enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  FEEDBACK_NOT_FOUND = 'FEEDBACK_NOT_FOUND',
  PET_NOT_FOUND = 'PET_NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// ==================== 内存存储（模拟） ====================
// 在生产环境中应该使用数据库存储

const feedbackStore: Map<string, FeedbackRecord> = new Map();
const analysisFeedbackMap: Map<string, string[]> = new Map(); // analysisId -> feedbackIds

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

// ==================== 路由定义 ====================

/**
 * POST /api/v2/translator/feedback
 * 提交分析反馈
 *
 * 请求体：
 * - analysisId: 分析结果ID
 * - rating: 反馈类型 (accurate | inaccurate | alternative)
 * - correctedEmotion: 修正后的情绪（当 rating 为 inaccurate 时）
 * - comment: 用户备注（可选）
 * - originalEmotion: 原始分析的情绪
 * - originalConfidence: 原始分析的置信度
 *
 * 响应：
 * - feedback: 反馈记录
 * - message: 成功消息
 */
router.post(
  '/',
  authenticateToken,
  [
    body('analysisId').isString().notEmpty().withMessage('analysisId 不能为空'),
    body('rating').isIn(['accurate', 'inaccurate', 'alternative']).withMessage('rating 必须是 accurate、inaccurate 或 alternative'),
    body('correctedEmotion').optional().isIn(['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe']),
    body('comment').optional().isString().isLength({ max: 500 }).withMessage('comment 不能超过500字符'),
    body('originalEmotion').optional().isIn(['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe']),
    body('originalConfidence').optional().isInt({ min: 0, max: 100 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        analysisId,
        rating,
        correctedEmotion,
        comment,
        originalEmotion,
        originalConfidence,
      } = req.body;

      // 检查是否已提交过反馈（同一分析只能提交一次）
      const existingFeedbackIds = analysisFeedbackMap.get(analysisId) || [];
      const userFeedbacks = existingFeedbackIds
        .map(id => feedbackStore.get(id))
        .filter(f => f?.userId === req.userId);

      if (userFeedbacks.length > 0) {
        return res.status(400).json({
          error: '该分析已提交过反馈',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      // 验证：如果 rating 是 inaccurate，必须提供 correctedEmotion
      if (rating === 'inaccurate' && !correctedEmotion) {
        return res.status(400).json({
          error: '当 rating 为 inaccurate 时，必须提供 correctedEmotion',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      // 创建反馈记录
      const feedbackId = uuidv4();
      const feedback: FeedbackRecord = {
        id: feedbackId,
        analysisId,
        petId: 'unknown', // 如果有 petId 参数，可以从请求中获取
        userId: req.userId!,
        rating,
        correctedEmotion,
        comment,
        originalEmotion: originalEmotion || 'calm',
        originalConfidence: originalConfidence || 95,
        originalTranslation: '',
        status: 'pending',
        createdAt: new Date(),
      };

      // 存储反馈
      feedbackStore.set(feedbackId, feedback);

      // 更新分析反馈映射
      const feedbackIds = analysisFeedbackMap.get(analysisId) || [];
      feedbackIds.push(feedbackId);
      analysisFeedbackMap.set(analysisId, feedbackIds);

      // 记录反馈日志
      console.log(`[Feedback] userId=${req.userId}, analysisId=${analysisId}, rating=${rating}, correctedEmotion=${correctedEmotion || 'N/A'}`);

      res.json({
        feedback: {
          id: feedback.id,
          analysisId: feedback.analysisId,
          rating: feedback.rating,
          correctedEmotion: feedback.correctedEmotion,
          comment: feedback.comment,
          status: feedback.status,
          createdAt: feedback.createdAt.toISOString(),
        },
        message: '反馈提交成功，感谢您的反馈！这将帮助我们持续改进分析准确度。',
      });
    } catch (error) {
      console.error('反馈提交错误:', error);
      res.status(500).json({
        error: '反馈提交失败',
        code: ErrorCode.INTERNAL_ERROR,
      });
    }
  }
);

/**
 * GET /api/v2/translator/feedback/history
 * 获取反馈历史记录
 *
 * 查询参数：
 * - petId: 宠物ID（可选）
 * - rating: 反馈类型筛选（可选）
 * - limit: 返回数量限制（默认20）
 * - offset: 偏移量（默认0）
 *
 * 响应：
 * - feedbacks: 反馈记录列表
 * - total: 总数量
 */
router.get(
  '/history',
  authenticateToken,
  [
    query('petId').optional().isString(),
    query('rating').optional().isIn(['accurate', 'inaccurate', 'alternative']),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(20),
    query('offset').optional().isInt({ min: 0 }).default(0),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { petId, rating, limit = 20, offset = 0 } = req.query;

      // 获取用户的所有反馈
      let feedbacks = Array.from(feedbackStore.values())
        .filter(f => f.userId === req.userId);

      // 按条件筛选
      if (petId) {
        feedbacks = feedbacks.filter(f => f.petId === petId);
      }

      if (rating) {
        feedbacks = feedbacks.filter(f => f.rating === rating);
      }

      // 按时间排序（最新的在前）
      feedbacks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // 分页
      const total = feedbacks.length;
      const paginatedFeedbacks = feedbacks.slice(
        Number(offset),
        Number(offset) + Number(limit)
      );

      res.json({
        feedbacks: paginatedFeedbacks.map(f => ({
          id: f.id,
          analysisId: f.analysisId,
          petId: f.petId,
          rating: f.rating,
          correctedEmotion: f.correctedEmotion,
          comment: f.comment,
          originalEmotion: f.originalEmotion,
          originalConfidence: f.originalConfidence,
          status: f.status,
          createdAt: f.createdAt.toISOString(),
        })),
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      console.error('获取反馈历史错误:', error);
      res.status(500).json({
        error: '获取反馈历史失败',
        code: ErrorCode.INTERNAL_ERROR,
      });
    }
  }
);

/**
 * GET /api/v2/translator/feedback/trends
 * 获取反馈趋势分析
 *
 * 查询参数：
 * - petId: 宠物ID（可选）
 *
 * 响应：
 * - totalFeedback: 总反馈数
 * - accurateCount: 准确反馈数
 * - inaccurateCount: 不准确反馈数
 * - alternativeCount: 换一种反馈数
 * - accuracyRate: 准确率
 * - emotionCorrections: 情绪修正统计
 * - commonIssues: 常见问题
 * - improvementSuggestions: 改进建议
 */
router.get(
  '/trends',
  authenticateToken,
  [
    query('petId').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.query;

      // 获取用户的所有反馈
      let feedbacks = Array.from(feedbackStore.values())
        .filter(f => f.userId === req.userId);

      if (petId) {
        feedbacks = feedbacks.filter(f => f.petId === petId);
      }

      // 计算统计数据
      const totalFeedback = feedbacks.length;
      const accurateCount = feedbacks.filter(f => f.rating === 'accurate').length;
      const inaccurateCount = feedbacks.filter(f => f.rating === 'inaccurate').length;
      const alternativeCount = feedbacks.filter(f => f.rating === 'alternative').length;

      const accuracyRate = totalFeedback > 0
        ? Math.round((accurateCount / totalFeedback) * 100)
        : 0;

      // 分析情绪修正情况
      const emotionCorrections: Record<PrimaryEmotion, {
        count: number;
        correctedTo: Record<PrimaryEmotion, number>;
      }> = {} as Record<PrimaryEmotion, { count: number; correctedTo: Record<PrimaryEmotion, number> }>;

      const emotions: PrimaryEmotion[] = [
        'happy', 'curious', 'anxious', 'angry',
        'needs', 'calm', 'excited', 'safe'
      ];

      for (const emotion of emotions) {
        emotionCorrections[emotion] = { count: 0, correctedTo: {} as Record<PrimaryEmotion, number> };
      }

      for (const feedback of feedbacks) {
        if (feedback.rating === 'inaccurate' && feedback.correctedEmotion) {
          const original = feedback.originalEmotion;
          const corrected = feedback.correctedEmotion;

          emotionCorrections[original].count++;
          emotionCorrections[original].correctedTo[corrected] =
            (emotionCorrections[original].correctedTo[corrected] || 0) + 1;
        }
      }

      // 分析常见问题
      const commonIssues = analyzeCommonIssues(feedbacks);

      // 生成改进建议
      const improvementSuggestions = generateImprovementSuggestions(feedbacks, emotionCorrections, accuracyRate);

      // 计算分析周期
      const sortedFeedbacks = [...feedbacks].sort((a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime()
      );

      const startDate = sortedFeedbacks[0]?.createdAt?.toISOString() || new Date().toISOString();
      const endDate = sortedFeedbacks[sortedFeedbacks.length - 1]?.createdAt?.toISOString() || new Date().toISOString();

      res.json({
        totalFeedback,
        accurateCount,
        inaccurateCount,
        alternativeCount,
        accuracyRate,
        emotionCorrections,
        commonIssues,
        improvementSuggestions,
        period: { startDate, endDate },
      });
    } catch (error) {
      console.error('获取反馈趋势错误:', error);
      res.status(500).json({
        error: '获取反馈趋势失败',
        code: ErrorCode.INTERNAL_ERROR,
      });
    }
  }
);

/**
 * GET /api/v2/translator/feedback/summary
 * 获取反馈统计摘要
 *
 * 查询参数：
 * - petId: 宠物ID（可选）
 *
 * 响应：
 * - total: 总反馈数
 * - accurate: 准确反馈数
 * - inaccurate: 不准确反馈数
 * - alternative: 换一种反馈数
 * - accuracyRate: 准确率
 * - recentFeedback: 最近反馈
 * - topCorrectedEmotions: 最常被修正的情绪
 */
router.get(
  '/summary',
  authenticateToken,
  [
    query('petId').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.query;

      // 获取用户的所有反馈
      let feedbacks = Array.from(feedbackStore.values())
        .filter(f => f.userId === req.userId);

      if (petId) {
        feedbacks = feedbacks.filter(f => f.petId === petId);
      }

      const total = feedbacks.length;
      const accurate = feedbacks.filter(f => f.rating === 'accurate').length;
      const inaccurate = feedbacks.filter(f => f.rating === 'inaccurate').length;
      const alternative = feedbacks.filter(f => f.rating === 'alternative').length;

      const accuracyRate = total > 0 ? Math.round((accurate / total) * 100) : 0;

      // 计算最常被修正的情绪
      const correctionCounts: Record<PrimaryEmotion, {
        count: number;
        correctedTo: Record<PrimaryEmotion, number>;
      }> = {} as Record<PrimaryEmotion, { count: number; correctedTo: Record<PrimaryEmotion, number> }>;

      for (const feedback of feedbacks) {
        if (feedback.rating === 'inaccurate' && feedback.correctedEmotion) {
          const original = feedback.originalEmotion;
          if (!correctionCounts[original]) {
            correctionCounts[original] = { count: 0, correctedTo: {} };
          }
          correctionCounts[original].count++;
          correctionCounts[original].correctedTo[feedback.correctedEmotion] =
            (correctionCounts[original].correctedTo[feedback.correctedEmotion] || 0) + 1;
        }
      }

      // 获取修正次数最多的情绪
      const topCorrectedEmotions = Object.entries(correctionCounts)
        .filter(([, data]) => data.count > 0)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([emotion, data]) => {
          const mostCorrectedTo = Object.entries(data.correctedTo)
            .sort((a, b) => b[1] - a[1])[0]?.[0] as PrimaryEmotion;
          return {
            emotion: emotion as PrimaryEmotion,
            correctionCount: data.count,
            mostCorrectedTo,
          };
        });

      // 获取最近反馈
      const recentFeedback = feedbacks
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map(f => ({
          id: f.id,
          analysisId: f.analysisId,
          rating: f.rating,
          correctedEmotion: f.correctedEmotion,
          originalEmotion: f.originalEmotion,
          createdAt: f.createdAt.toISOString(),
        }));

      res.json({
        total,
        accurate,
        inaccurate,
        alternative,
        accuracyRate,
        recentFeedback,
        topCorrectedEmotions,
      });
    } catch (error) {
      console.error('获取反馈摘要错误:', error);
      res.status(500).json({
        error: '获取反馈摘要失败',
        code: ErrorCode.INTERNAL_ERROR,
      });
    }
  }
);

/**
 * GET /api/v2/translator/feedback/:id
 * 获取单个反馈详情
 *
 * 响应：
 * - feedback: 反馈详情
 */
router.get(
  '/:id',
  authenticateToken,
  [
    param('id').isString().notEmpty().withMessage('id 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const feedback = feedbackStore.get(id);

      if (!feedback || feedback.userId !== req.userId) {
        return res.status(404).json({
          error: '反馈不存在',
          code: ErrorCode.FEEDBACK_NOT_FOUND,
        });
      }

      res.json({
        feedback: {
          id: feedback.id,
          analysisId: feedback.analysisId,
          petId: feedback.petId,
          rating: feedback.rating,
          correctedEmotion: feedback.correctedEmotion,
          comment: feedback.comment,
          originalEmotion: feedback.originalEmotion,
          originalConfidence: feedback.originalConfidence,
          originalTranslation: feedback.originalTranslation,
          status: feedback.status,
          createdAt: feedback.createdAt.toISOString(),
          updatedAt: feedback.updatedAt?.toISOString(),
        },
      });
    } catch (error) {
      console.error('获取反馈详情错误:', error);
      res.status(500).json({
        error: '获取反馈详情失败',
        code: ErrorCode.INTERNAL_ERROR,
      });
    }
  }
);

// ==================== 辅助函数 ====================

/**
 * 分析常见问题
 */
function analyzeCommonIssues(feedbacks: FeedbackRecord[]): string[] {
  const issues: string[] = [];

  // 分析不准确反馈中的评论
  const inaccurateFeedbacks = feedbacks.filter(f =>
    f.rating === 'inaccurate' && f.comment
  );

  // 统计关键词
  const keywordCounts: Record<string, number> = {};
  const keywords = ['音调', '强度', '频率', '节奏', '音色', '环境', '时间', '宠物类型'];

  for (const feedback of inaccurateFeedbacks) {
    const comment = feedback.comment || '';
    for (const keyword of keywords) {
      if (comment.includes(keyword)) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    }
  }

  // 找出高频问题关键词
  for (const [keyword, count] of Object.entries(keywordCounts)) {
    if (count >= 3) {
      issues.push(`${keyword}特征分析可能需要优化（出现${count}次）`);
    }
  }

  // 分析特定情绪的准确率
  const emotionAccuracy: Record<PrimaryEmotion, { total: number; accurate: number }> = {} as Record<PrimaryEmotion, { total: number; accurate: number }>;

  const emotions: PrimaryEmotion[] = [
    'happy', 'curious', 'anxious', 'angry',
    'needs', 'calm', 'excited', 'safe'
  ];

  for (const emotion of emotions) {
    emotionAccuracy[emotion] = { total: 0, accurate: 0 };
  }

  for (const feedback of feedbacks) {
    emotionAccuracy[feedback.originalEmotion].total++;
    if (feedback.rating === 'accurate') {
      emotionAccuracy[feedback.originalEmotion].accurate++;
    }
  }

  // 情绪标签映射
  const emotionLabels: Record<PrimaryEmotion, string> = {
    happy: '开心',
    curious: '好奇',
    anxious: '焦虑',
    angry: '生气',
    needs: '有需求',
    calm: '平静',
    excited: '兴奋',
    safe: '安心',
  };

  // 找出准确率低的情绪
  for (const [emotion, stats] of Object.entries(emotionAccuracy)) {
    if (stats.total >= 5) {
      const rate = stats.accurate / stats.total;
      if (rate < 0.6) {
        issues.push(`${emotionLabels[emotion as PrimaryEmotion]}情绪识别准确率偏低（${Math.round(rate * 100)}%）`);
      }
    }
  }

  return issues.slice(0, 5);
}

/**
 * 生成改进建议
 */
function generateImprovementSuggestions(
  feedbacks: FeedbackRecord[],
  emotionCorrections: Record<PrimaryEmotion, { count: number; correctedTo: Record<PrimaryEmotion, number> }>,
  accuracyRate: number
): string[] {
  const suggestions: string[] = [];

  // 基于整体准确率
  if (accuracyRate < 70) {
    suggestions.push('建议增加更多训练数据以提高整体准确率');
  }

  // 情绪标签映射
  const emotionLabels: Record<PrimaryEmotion, string> = {
    happy: '开心',
    curious: '好奇',
    anxious: '焦虑',
    angry: '生气',
    needs: '有需求',
    calm: '平静',
    excited: '兴奋',
    safe: '安心',
  };

  // 基于情绪修正分析
  for (const [fromEmotion, correction] of Object.entries(emotionCorrections)) {
    if (correction.count >= 3) {
      const correctedToEntries = Object.entries(correction.correctedTo);
      if (correctedToEntries.length > 0) {
        const [toEmotion] = correctedToEntries.sort((a, b) => b[1] - a[1])[0];
        suggestions.push(
          `${emotionLabels[fromEmotion as PrimaryEmotion]}常被误判，建议增加${emotionLabels[toEmotion as PrimaryEmotion]}的特征权重`
        );
      }
    }
  }

  // 基于反馈类型分布
  const alternativeCount = feedbacks.filter(f => f.rating === 'alternative').length;
  if (alternativeCount > feedbacks.length * 0.2) {
    suggestions.push('用户经常请求换一种解释，建议优化翻译文案的多样性');
  }

  // 基于置信度分析
  const lowConfidenceInaccurate = feedbacks.filter(f =>
    f.rating === 'inaccurate' && f.originalConfidence < 80
  );
  if (lowConfidenceInaccurate.length > 0) {
    suggestions.push('低置信度结果更容易出错，建议提高置信度阈值或增加二次确认');
  }

  return suggestions.slice(0, 5);
}

export default router;