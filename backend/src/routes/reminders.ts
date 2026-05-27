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

      res.json({ 
        code: 200,
        message: '获取提醒列表成功',
        data: { reminders },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '获取提醒失败',
        data: null,
        timestamp: new Date().toISOString()
      });
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

    res.json({ 
      code: 200,
      message: '获取即将到期提醒成功',
      data: { reminders },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取即将到期提醒失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post(
  '/',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
    body('type').isIn([
      'VACCINE',
      'DEWORMING',
      'CHECKUP',
      'BATH',
      'BRUSH_TEETH',
      'MEDICINE',
      'GROOMING',
      'CUSTOM',
    ]).withMessage('提醒类型无效'),
    body('title').isLength({ min: 1 }).withMessage('标题不能为空'),
    body('date').isISO8601().withMessage('日期格式不正确'),
    body('time').isString().withMessage('时间不能为空'),
    body('repeat').isIn(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).withMessage('重复类型无效'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '创建提醒验证失败',
        errors: errors.array().map(err => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const { petId, type, title, notes, date, time, repeat, endDate } = req.body;

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

      const reminderDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reminderDate < today) {
        return res.status(400).json({ 
          code: 400,
          message: '提醒日期不能早于今天',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      if (endDate && new Date(endDate) < reminderDate) {
        return res.status(400).json({ 
          code: 400,
          message: '结束日期应晚于开始日期',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const reminder = await prisma.reminder.create({
        data: {
          petId,
          type,
          title,
          notes,
          date: new Date(date),
          time,
          repeat,
          endDate: endDate ? new Date(endDate) : null,
        },
        include: { pet: true },
      });

      res.status(201).json({ 
        code: 201,
        message: '创建提醒成功',
        data: { reminder },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '创建提醒失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
      },
      include: { pet: true },
    });

    if (!reminder) {
      return res.status(404).json({ 
        code: 404,
        message: '提醒不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (reminder.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该提醒',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ 
      code: 200,
      message: '获取提醒成功',
      data: { reminder },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取提醒失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
      },
      include: { pet: true },
    });

    if (!existingReminder) {
      return res.status(404).json({ 
        code: 404,
        message: '提醒不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingReminder.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该提醒',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { title, notes, date, time, repeat, endDate } = req.body;

    if (date) {
      const reminderDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reminderDate < today) {
        return res.status(400).json({ 
          code: 400,
          message: '提醒日期不能早于今天',
          data: null,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (endDate && date && new Date(endDate) < new Date(date)) {
      return res.status(400).json({ 
        code: 400,
        message: '结束日期应晚于开始日期',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        title,
        notes,
        date: date ? new Date(date) : undefined,
        time,
        repeat,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: { pet: true },
    });

    res.json({ 
      code: 200,
      message: '更新提醒成功',
      data: { reminder },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '更新提醒失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
      },
      include: { pet: true },
    });

    if (!existingReminder) {
      return res.status(404).json({ 
        code: 404,
        message: '提醒不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingReminder.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该提醒',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    await prisma.reminder.delete({
      where: { id: req.params.id },
    });

    res.json({ 
      code: 200,
      message: '删除提醒成功',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '删除提醒失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
      },
      include: { pet: true },
    });

    if (!existingReminder) {
      return res.status(404).json({ 
        code: 404,
        message: '提醒不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingReminder.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该提醒',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingReminder.isCompleted) {
      return res.status(400).json({ 
        code: 400,
        message: '该提醒已经完成',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
      include: { pet: true },
    });

    res.json({ 
      code: 200,
      message: '标记完成成功',
      data: { reminder },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '标记完成失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
