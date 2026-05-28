import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

// 辅助函数：序列化健康记录（处理JSON字段）
const serializeHealthRecord = (record: any) => {
  return {
    ...record,
    tags: record.tags ? JSON.parse(record.tags) : [],
    attachments: record.attachments ? JSON.parse(record.attachments) : [],
    pet: record.pet ? {
      id: record.pet.id,
      name: record.pet.name,
      avatar: record.pet.avatar,
      type: record.pet.type
    } : undefined
  };
};

// 验证模式
const createHealthRecordSchema = z.object({
  petId: z.string().min(1, '宠物ID不能为空'),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().max(10000, '内容不能超过10000字符'),
  type: z.enum(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE'], {
    invalid_type_error: '无效的记录类型',
  }),
  recordDate: z.coerce.date().optional(),
  tags: z.array(z.string().max(50, '标签不能超过50字符')).max(10, '最多支持10个标签').optional(),
  attachments: z.array(z.string()).optional(),
  voiceDuration: z.number().int().min(0).optional(),
  isImportant: z.boolean().optional(),
});

const updateHealthRecordSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  content: z.string().max(10000, '内容不能超过10000字符').optional(),
  type: z.enum(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE'], {
    invalid_type_error: '无效的记录类型',
  }).optional(),
  recordDate: z.coerce.date().optional(),
  tags: z.array(z.string().max(50, '标签不能超过50字符')).max(10, '最多支持10个标签').optional(),
  attachments: z.array(z.string()).optional(),
  voiceDuration: z.number().int().min(0).optional(),
  isImportant: z.boolean().optional(),
});

// 获取健康记录列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    const skip = (page - 1) * pageSize;
    const { petId, type, tag, important } = req.query;

    const where: any = { userId, deletedAt: null };

    if (petId) where.petId = petId;
    if (type) where.type = type;
    if (important === 'true') where.isImportant = true;

    const [records, total] = await Promise.all([
      prisma.healthRecord.findMany({
        where,
        include: {
          pet: {
            select: { id: true, name: true, avatar: true, type: true },
          },
        },
        orderBy: { recordDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.healthRecord.count({ where }),
    ]);

    // 如果有标签筛选，在内存中进一步过滤
    let filteredRecords = records;
    if (tag && tag !== '') {
      filteredRecords = records.filter(record => {
        const tags = record.tags ? JSON.parse(record.tags) : [];
        return tags.includes(tag);
      });
    }

    res.json({
      code: 200,
      data: filteredRecords.map(serializeHealthRecord),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      msg: 'success',
    });
  } catch (error) {
    console.error('获取健康记录失败:', error);
    res.status(500).json({
      code: 500,
      error: '获取健康记录失败',
    });
  }
});

// 搜索健康记录
router.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    const skip = (page - 1) * pageSize;
    const { keyword, petId, type, startDate, endDate, tag } = req.query;

    const where: any = { userId, deletedAt: null };

    if (petId) where.petId = petId;
    if (type) where.type = type;
    if (startDate && endDate) {
      where.recordDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else if (startDate) {
      where.recordDate = { gte: new Date(startDate as string) };
    } else if (endDate) {
      where.recordDate = { lte: new Date(endDate as string) };
    }

    const records = await prisma.healthRecord.findMany({
      where,
      include: {
        pet: {
          select: { id: true, name: true, avatar: true, type: true },
        },
      },
      orderBy: { recordDate: 'desc' },
    });

    // 在内存中进行关键词和标签的进一步筛选
    let filteredRecords = records;

    if (keyword && keyword !== '') {
      const lowerKeyword = (keyword as string).toLowerCase();
      filteredRecords = filteredRecords.filter(record => {
        const titleMatch = record.title.toLowerCase().includes(lowerKeyword);
        const contentMatch = record.content.toLowerCase().includes(lowerKeyword);
        const tags = record.tags ? JSON.parse(record.tags) : [];
        const tagMatch = tags.some((t: string) => t.toLowerCase().includes(lowerKeyword));
        return titleMatch || contentMatch || tagMatch;
      });
    }

    if (tag && tag !== '') {
      filteredRecords = filteredRecords.filter(record => {
        const tags = record.tags ? JSON.parse(record.tags) : [];
        return tags.includes(tag);
      });
    }

    // 分页
    const total = filteredRecords.length;
    const paginatedRecords = filteredRecords.slice(skip, skip + pageSize);

    res.json({
      code: 200,
      data: paginatedRecords.map(serializeHealthRecord),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      msg: 'success',
    });
  } catch (error) {
    console.error('搜索健康记录失败:', error);
    res.status(500).json({
      code: 500,
      error: '搜索健康记录失败',
    });
  }
});

// 创建健康记录
router.post('/', validateBody(createHealthRecordSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, title, content, type, recordDate, tags, attachments, voiceDuration, isImportant } = req.body;

    // 验证宠物所有权
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return res.status(404).json({
        code: 404,
        error: '宠物不存在',
      });
    }

    if (pet.userId !== userId) {
      return res.status(403).json({
        code: 403,
        error: '无权限操作该宠物',
      });
    }

    const record = await prisma.healthRecord.create({
      data: {
        userId,
        petId,
        title,
        content,
        type,
        recordDate: recordDate || new Date(),
        tags: JSON.stringify(tags || []),
        attachments: JSON.stringify(attachments || []),
        voiceDuration,
        isImportant: isImportant || false,
      },
      include: {
        pet: {
          select: { id: true, name: true, avatar: true, type: true },
        },
      },
    });

    res.status(201).json({
      code: 201,
      data: serializeHealthRecord(record),
      msg: '创建成功',
    });
  } catch (error) {
    console.error('创建健康记录失败:', error);
    res.status(500).json({
      code: 500,
      error: '创建健康记录失败',
    });
  }
});

// 获取单条健康记录详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const record = await prisma.healthRecord.findUnique({
      where: { id },
      include: {
        pet: {
          select: { id: true, name: true, avatar: true, type: true },
        },
      },
    });

    if (!record) {
      return res.status(404).json({
        code: 404,
        error: '健康记录不存在',
      });
    }

    if (record.userId !== userId) {
      return res.status(403).json({
        code: 403,
        error: '无权限访问该记录',
      });
    }

    if (record.deletedAt) {
      return res.status(404).json({
        code: 404,
        error: '健康记录已删除',
      });
    }

    res.json({
      code: 200,
      data: serializeHealthRecord(record),
      msg: 'success',
    });
  } catch (error) {
    console.error('获取健康记录详情失败:', error);
    res.status(500).json({
      code: 500,
      error: '获取健康记录详情失败',
    });
  }
});

// 更新健康记录
router.put('/:id', validateBody(updateHealthRecordSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, content, type, recordDate, tags, attachments, voiceDuration, isImportant } = req.body;

    // 查找现有记录并验证权限
    const existingRecord = await prisma.healthRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return res.status(404).json({
        code: 404,
        error: '健康记录不存在',
      });
    }

    if (existingRecord.userId !== userId) {
      return res.status(403).json({
        code: 403,
        error: '无权限修改该记录',
      });
    }

    if (existingRecord.deletedAt) {
      return res.status(404).json({
        code: 404,
        error: '健康记录已删除',
      });
    }

    // 构建更新数据
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (recordDate !== undefined) updateData.recordDate = recordDate;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (attachments !== undefined) updateData.attachments = JSON.stringify(attachments);
    if (voiceDuration !== undefined) updateData.voiceDuration = voiceDuration;
    if (isImportant !== undefined) updateData.isImportant = isImportant;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        error: '没有需要更新的字段',
      });
    }

    const updatedRecord = await prisma.healthRecord.update({
      where: { id },
      data: updateData,
      include: {
        pet: {
          select: { id: true, name: true, avatar: true, type: true },
        },
      },
    });

    res.json({
      code: 200,
      data: serializeHealthRecord(updatedRecord),
      msg: '更新成功',
    });
  } catch (error) {
    console.error('更新健康记录失败:', error);
    res.status(500).json({
      code: 500,
      error: '更新健康记录失败',
    });
  }
});

// 删除健康记录（逻辑删除）
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const record = await prisma.healthRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return res.status(404).json({
        code: 404,
        error: '健康记录不存在',
      });
    }

    if (record.userId !== userId) {
      return res.status(403).json({
        code: 403,
        error: '无权限删除该记录',
      });
    }

    if (record.deletedAt) {
      return res.status(404).json({
        code: 404,
        error: '健康记录已删除',
      });
    }

    await prisma.healthRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({
      code: 200,
      msg: '删除成功',
    });
  } catch (error) {
    console.error('删除健康记录失败:', error);
    res.status(500).json({
      code: 500,
      error: '删除健康记录失败',
    });
  }
});

export default router;
