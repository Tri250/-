/**
 * 回忆路由
 * 处理宠物回忆/相册相关的 API 请求
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { body, query, validationResult } from 'express-validator';
import { memoriesService, MemoryType } from '../services/memoriesService';
import { authenticateToken } from '../middleware';
import prisma from '../lib/prisma';

const router = Router();

// 配置 Multer 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    // 临时文件名，后续会被服务重命名
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// 文件过滤器
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持图片和视频'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * GET /api/memories/:petId
 * 获取宠物回忆列表
 */
router.get('/:petId', [
  query('type').optional().isIn(['PHOTO', 'VIDEO']),
  query('isFavorite').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { petId } = req.params;
    const { type, isFavorite, limit, offset } = req.query;

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    // 获取回忆列表
    const result = await memoriesService.getMemoriesByPetId(petId, {
      type: type as MemoryType | undefined,
      isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      memories: result.memories,
      total: result.total,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
  } catch (error) {
    console.error('获取回忆列表失败:', error);
    res.status(500).json({ error: '获取回忆列表失败' });
  }
});

/**
 * POST /api/memories/:petId
 * 上传新回忆（支持文件上传）
 */
router.post('/:petId', upload.single('file'), [
  body('title').isLength({ min: 1, max: 100 }).withMessage('标题长度应在1-100字符之间'),
  body('description').optional().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('location').optional().isLength({ max: 100 }).withMessage('地点长度不能超过100字符'),
  body('tags').optional().isArray().withMessage('标签应为数组'),
  body('isFavorite').optional().isBoolean().withMessage('收藏状态应为布尔值'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { petId } = req.params;

    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片或视频文件' });
    }

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    // 创建回忆
    const memory = await memoriesService.createMemory(
      {
        petId,
        title: req.body.title,
        description: req.body.description,
        type: 'PHOTO', // 类型由文件决定
        location: req.body.location,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        isFavorite: req.body.isFavorite === 'true',
      },
      req.file
    );

    res.status(201).json({
      message: '回忆上传成功',
      memory,
    });
  } catch (error) {
    console.error('上传回忆失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '上传回忆失败' });
  }
});

/**
 * GET /api/memories/:petId/stats
 * 获取回忆统计信息
 */
router.get('/:petId/stats', async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    const stats = await memoriesService.getMemoryStats(petId);

    res.json(stats);
  } catch (error) {
    console.error('获取回忆统计失败:', error);
    res.status(500).json({ error: '获取回忆统计失败' });
  }
});

/**
 * GET /api/memories/:petId/search
 * 搜索回忆
 */
router.get('/:petId/search', [
  query('keyword').isLength({ min: 1 }).withMessage('搜索关键词不能为空'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { petId } = req.params;
    const { keyword } = req.query;

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    const memories = await memoriesService.searchMemories(petId, keyword as string);

    res.json({ memories });
  } catch (error) {
    console.error('搜索回忆失败:', error);
    res.status(500).json({ error: '搜索回忆失败' });
  }
});

/**
 * GET /api/memories/detail/:id
 * 获取单个回忆详情
 */
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const memory = await memoriesService.getMemoryById(id);

    if (!memory) {
      return res.status(404).json({ error: '回忆不存在' });
    }

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: memory.petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(403).json({ error: '无权访问该回忆' });
    }

    res.json({ memory });
  } catch (error) {
    console.error('获取回忆详情失败:', error);
    res.status(500).json({ error: '获取回忆详情失败' });
  }
});

/**
 * PUT /api/memories/:id
 * 更新回忆信息
 */
router.put('/:id', [
  body('title').optional().isLength({ min: 1, max: 100 }).withMessage('标题长度应在1-100字符之间'),
  body('description').optional().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('location').optional().isLength({ max: 100 }).withMessage('地点长度不能超过100字符'),
  body('tags').optional().isArray().withMessage('标签应为数组'),
  body('isFavorite').optional().isBoolean().withMessage('收藏状态应为布尔值'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;

    // 获取回忆并验证归属
    const memory = await memoriesService.getMemoryById(id);

    if (!memory) {
      return res.status(404).json({ error: '回忆不存在' });
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id: memory.petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(403).json({ error: '无权修改该回忆' });
    }

    // 更新回忆
    const updatedMemory = await memoriesService.updateMemory(id, {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      tags: req.body.tags,
      isFavorite: req.body.isFavorite,
    });

    res.json({
      message: '回忆更新成功',
      memory: updatedMemory,
    });
  } catch (error) {
    console.error('更新回忆失败:', error);
    res.status(500).json({ error: '更新回忆失败' });
  }
});

/**
 * POST /api/memories/:id/favorite
 * 切换收藏状态
 */
router.post('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取回忆并验证归属
    const memory = await memoriesService.getMemoryById(id);

    if (!memory) {
      return res.status(404).json({ error: '回忆不存在' });
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id: memory.petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(403).json({ error: '无权操作该回忆' });
    }

    // 切换收藏状态
    const updatedMemory = await memoriesService.toggleFavorite(id);

    res.json({
      message: updatedMemory.isFavorite ? '已添加到收藏' : '已取消收藏',
      memory: updatedMemory,
    });
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '切换收藏状态失败' });
  }
});

/**
 * DELETE /api/memories/:id
 * 删除回忆
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取回忆并验证归属
    const memory = await memoriesService.getMemoryById(id);

    if (!memory) {
      return res.status(404).json({ error: '回忆不存在' });
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id: memory.petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(403).json({ error: '无权删除该回忆' });
    }

    // 删除回忆
    const success = await memoriesService.deleteMemory(id);

    if (success) {
      res.json({ message: '回忆删除成功' });
    } else {
      res.status(500).json({ error: '删除回忆失败' });
    }
  } catch (error) {
    console.error('删除回忆失败:', error);
    res.status(500).json({ error: '删除回忆失败' });
  }
});

export default router;