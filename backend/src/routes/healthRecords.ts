import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { validateBody } from '../middleware/validation.middleware';
import { RecordType } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

const createHealthRecordSchema = z.object({
  petId: z.string().min(1, '宠物ID不能为空'),
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字符'),
  content: z.string().max(3000, '内容不能超过3000字符'),
  type: z.enum(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE'], {
    invalid_type_error: '无效的记录类型',
  }),
  recordDate: z.coerce.date().optional(),
  tags: z.array(z.string().max(20, '标签不能超过20字符')).optional(),
  attachments: z.array(z.string()).optional(),
  voiceDuration: z.number().int().optional(),
  isImportant: z.boolean().optional(),
});

const updateHealthRecordSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100字符').optional(),
  content: z.string().max(3000, '内容不能超过3000字符').optional(),
  type: z.enum(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE'], {
    invalid_type_error: '无效的记录类型',
  }).optional(),
  recordDate: z.coerce.date().optional(),
  tags: z.array(z.string().max(20, '标签不能超过20字符')).optional(),
  attachments: z.array(z.string()).optional(),
  voiceDuration: z.number().int().optional(),
  isImportant: z.boolean().optional(),
});

const searchHealthRecordSchema = z.object({
  keyword: z.string().optional(),
  petId: z.string().optional(),
  type: z.enum(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  tag: z.string().optional(),
  page: z.string().default('1'),
  pageSize: z.string().default('10'),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50);
    const skip = (page - 1) * pageSize;
    const { petId, type, tag, important } = req.query;

    const where: any = { userId, deletedAt: null };

    if (petId) where.petId = petId;
    if (type) where.type = type;
    if (tag) where.tags = { has: tag };
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

    res.json({
      code: 200,
      data: records,
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

router.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50);
    const skip = (page - 1) * pageSize;
    const { keyword, petId, type, startDate, endDate, tag } = req.query;

    const where: any = { userId, deletedAt: null };

    if (keyword && keyword !== '') {
      where.OR = [
        { title: { contains: keyword as string, mode: 'insensitive' } },
        { content: { contains: keyword as string, mode: 'insensitive' } },
      ];
    }

    if (petId) where.petId = petId;
    if (type) where.type = type;
    if (tag) where.tags = { has: tag };
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

    res.json({
      code: 200,
      data: records,
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

router.post('/', validateBody(createHealthRecordSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId, title, content, type, recordDate, tags, attachments, voiceDuration, isImportant } = req.body;

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
        type: type as RecordType,
        recordDate: recordDate || new Date(),
        tags: tags || [],
        attachments: attachments || [],
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
      data: record,
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

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const record = await prisma.healthRecord.findUnique({
      where: { id, userId, deletedAt: null },
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

    res.json({
      code: 200,
      data: record,
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

router.put('/:id', validateBody(updateHealthRecordSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const body = req.body;

    const allowedFields = ['title', 'content', 'type', 'recordDate', 'tags', 'attachments', 'voiceDuration', 'isImportant'];
    const updateData = Object.keys(body)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        error: '没有需要更新的字段',
      });
    }

    const existingRecord = await prisma.healthRecord.findUnique({
      where: { id, userId, deletedAt: null },
    });

    if (!existingRecord) {
      return res.status(404).json({
        code: 404,
        error: '健康记录不存在',
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
      data: updatedRecord,
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

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const record = await prisma.healthRecord.findUnique({
      where: { id, userId, deletedAt: null },
    });

    if (!record) {
      return res.status(404).json({
        code: 404,
        error: '健康记录不存在',
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
