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

      const parsedRecords = records.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : [],
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
      }));

      res.json({ records: parsedRecords });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '获取健康记录失败' });
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

    const searchQuery = q as string;

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

    res.json({ records: parsedRecords });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '搜索记录失败' });
  }
});

router.post(
  '/',
  [
    body('petId').isString(),
    body('type').isIn(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE']),
    body('title').isLength({ min: 1 }),
    body('content').isLength({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { petId, type, title, content, tags = [], attachments = [], voiceDuration, isImportant } = req.body;

      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({ error: '宠物不存在' });
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

      res.status(201).json({ record: parsedRecord });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '创建记录失败' });
    }
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const record = await prisma.healthRecord.findFirst({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
      include: { pet: true },
    });

    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const parsedRecord = {
      ...record,
      tags: record.tags ? JSON.parse(record.tags) : [],
      attachments: record.attachments ? JSON.parse(record.attachments) : [],
    };

    res.json({ record: parsedRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, content, tags, attachments, isImportant } = req.body;

    const record = await prisma.healthRecord.updateMany({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
      data: {
        title,
        content,
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags),
        attachments: typeof attachments === 'string' ? attachments : JSON.stringify(attachments),
        isImportant,
      },
    });

    if (record.count === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const updatedRecord = await prisma.healthRecord.findUnique({
      where: { id: req.params.id },
      include: { pet: true },
    });

    const parsedRecord = {
      ...updatedRecord,
      tags: updatedRecord?.tags ? JSON.parse(updatedRecord.tags) : [],
      attachments: updatedRecord?.attachments ? JSON.parse(updatedRecord.attachments) : [],
    };

    res.json({ record: parsedRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新记录失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const record = await prisma.healthRecord.deleteMany({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
    });

    if (record.count === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除记录失败' });
  }
});

export default router;
