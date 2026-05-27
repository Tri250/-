import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

router.get(
  '/',
  [
    query('petId').optional().isString(),
    query('type').optional().isString(),
    query('tag').optional().isString(),
    query('important').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { petId, type, tag, important } = req.query;

      const userPets = await prisma.pet.findMany({
        where: { userId: req.userId },
        select: { id: true },
      });
      const petIds = userPets.map(p => p.id);

      const where: any = { petId: { in: petIds } };
      
      if (petId) where.petId = petId;
      if (type) where.type = type;
      if (important === 'true') where.isImportant = true;

      const records = await prisma.healthRecord.findMany({
        where,
        include: { pet: true },
        orderBy: { createdAt: 'desc' },
      });

      let parsedRecords = records.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : [],
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
      }));

      if (tag) {
        parsedRecords = parsedRecords.filter(record => 
          record.tags.some((t: string) => t.includes(tag as string))
        );
      }

      res.json({ 
        code: 200,
        message: '获取健康记录成功',
        data: { records: parsedRecords },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '获取健康记录失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    const userPets = await prisma.pet.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });
    const petIds = userPets.map(p => p.id);

    const searchQuery = (q as string || '').replace(/[<>'"]/g, '');

    const records = await prisma.healthRecord.findMany({
      where: {
        petId: { in: petIds },
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
        ],
      },
      include: { pet: true },
      orderBy: { createdAt: 'desc' },
    });

    const parsedRecords = records.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
      attachments: r.attachments ? JSON.parse(r.attachments) : [],
    }));

    res.json({ 
      code: 200,
      message: '搜索健康记录成功',
      data: { records: parsedRecords },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '搜索记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post(
  '/',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
    body('type').isIn(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE']).withMessage('记录类型无效'),
    body('title').isLength({ min: 1 }).withMessage('标题不能为空'),
    body('content').isLength({ min: 1 }).withMessage('内容不能为空'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '创建健康记录验证失败',
        errors: errors.array().map(err => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const { petId, type, title, content, tags = [], attachments = [], voiceDuration, isImportant } = req.body;

      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({ 
          code: 404,
          message: '宠物不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const record = await prisma.healthRecord.create({
        data: {
          petId,
          type,
          title,
          content,
          tags: JSON.stringify(tags),
          attachments: JSON.stringify(attachments),
          voiceDuration,
          isImportant: isImportant || false,
        },
        include: { pet: true },
      });

      const parsedRecord = {
        ...record,
        tags: JSON.parse(record.tags),
        attachments: JSON.parse(record.attachments),
      };

      res.status(201).json({ 
        code: 201,
        message: '创建健康记录成功',
        data: { record: parsedRecord },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '创建记录失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const record = await prisma.healthRecord.findFirst({
      where: {
        id: req.params.id,
      },
      include: { pet: true },
    });

    if (!record) {
      return res.status(404).json({ 
        code: 404,
        message: '记录不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (record.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该记录',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const parsedRecord = {
      ...record,
      tags: record.tags ? JSON.parse(record.tags) : [],
      attachments: record.attachments ? JSON.parse(record.attachments) : [],
    };

    res.json({ 
      code: 200,
      message: '获取健康记录成功',
      data: { record: parsedRecord },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existingRecord = await prisma.healthRecord.findFirst({
      where: {
        id: req.params.id,
      },
      include: { pet: true },
    });

    if (!existingRecord) {
      return res.status(404).json({ 
        code: 404,
        message: '记录不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingRecord.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该记录',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { title, content, tags, attachments, isImportant } = req.body;

    const record = await prisma.healthRecord.update({
      where: { id: req.params.id },
      data: {
        title,
        content,
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags),
        attachments: typeof attachments === 'string' ? attachments : JSON.stringify(attachments),
        isImportant,
      },
      include: { pet: true },
    });

    const parsedRecord = {
      ...record,
      tags: JSON.parse(record.tags),
      attachments: JSON.parse(record.attachments),
    };

    res.json({ 
      code: 200,
      message: '更新健康记录成功',
      data: { record: parsedRecord },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '更新记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existingRecord = await prisma.healthRecord.findFirst({
      where: {
        id: req.params.id,
      },
      include: { pet: true },
    });

    if (!existingRecord) {
      return res.status(404).json({ 
        code: 404,
        message: '记录不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingRecord.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该记录',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    await prisma.healthRecord.delete({
      where: { id: req.params.id },
    });

    res.json({ 
      code: 200,
      message: '删除健康记录成功',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '删除记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
