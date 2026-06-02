import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { ReminderType, RepeatType } from '../types/enums';

const router = Router();

router.use(authenticateToken);

router.get(
  '/',
  [
    query('petId').optional().isString(),
    query('type').optional().isString(),
    query('completed').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { petId, type, completed } = req.query;

      const userPets = await prisma.pet.findMany({
        where: { userId: req.userId },
        select: { id: true },
      });
      const petIds = userPets.map(p => p.id);

      const where: any = { petId: { in: petIds } };
      
      if (petId) where.petId = petId;
      if (type) where.type = type;
      if (completed !== undefined) where.isCompleted = completed === 'true';

      const reminders = await prisma.reminder.findMany({
        where,
        include: { pet: true },
        orderBy: { date: 'asc' },
      });

      res.json({ reminders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '获取提醒失败' });
    }
  }
);

router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    const userPets = await prisma.pet.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });
    const petIds = userPets.map(p => p.id);

    const reminders = await prisma.reminder.findMany({
      where: {
        petId: { in: petIds },
        isCompleted: false,
        date: {
          gte: now,
          lte: oneWeekLater,
        },
      },
      include: { pet: true },
      orderBy: { date: 'asc' },
    });

    res.json({ reminders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取即将到期提醒失败' });
  }
});

router.post(
  '/',
  [
    body('petId').isString(),
    body('type').isIn([
      'VACCINE',
      'DEWORMING',
      'CHECKUP',
      'BATH',
      'BRUSH_TEETH',
      'MEDICINE',
      'GROOMING',
      'CUSTOM',
    ]),
    body('title').isLength({ min: 1 }),
    body('date').isISO8601(),
    body('time').isString(),
    body('repeat').isIn(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { petId, type, title, notes, date, time, repeat, endDate } = req.body;

      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({ error: '宠物不存在' });
      }

      const reminder = await prisma.reminder.create({
        data: {
          petId,
          type: type as ReminderType,
          title,
          notes,
          date: new Date(date),
          time,
          repeat: repeat as RepeatType,
          endDate: endDate ? new Date(endDate) : null,
        },
        include: { pet: true },
      });

      res.status(201).json({ reminder });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '创建提醒失败' });
    }
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
      include: { pet: true },
    });

    if (!reminder) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    res.json({ reminder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取提醒失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, notes, date, time, repeat, endDate } = req.body;

    const reminder = await prisma.reminder.updateMany({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
      data: {
        title,
        notes,
        date: date ? new Date(date) : undefined,
        time,
        repeat: repeat as RepeatType,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    if (reminder.count === 0) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    const updatedReminder = await prisma.reminder.findUnique({
      where: { id: req.params.id },
      include: { pet: true },
    });

    res.json({ reminder: updatedReminder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新提醒失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const reminder = await prisma.reminder.deleteMany({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
    });

    if (reminder.count === 0) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除提醒失败' });
  }
});

router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const reminder = await prisma.reminder.updateMany({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    if (reminder.count === 0) {
      return res.status(404).json({ error: '提醒不存在' });
    }

    const updatedReminder = await prisma.reminder.findUnique({
      where: { id: req.params.id },
      include: { pet: true },
    });

    res.json({ reminder: updatedReminder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '标记完成失败' });
  }
});

export default router;
