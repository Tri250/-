import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

// 验证模式
const createReminderSchema = z.object({
  petId: z.string().min(1, '宠物ID不能为空'),
  type: z.enum(['VACCINE', 'DEWORMING', 'CHECKUP', 'BATH', 'BRUSH_TEETH', 'MEDICINE', 'GROOMING', 'CUSTOM'], {
    invalid_type_error: '无效的提醒类型',
  }),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  notes: z.string().max(1000, '备注不能超过1000字符').optional(),
  date: z.coerce.date(),
  time: z.string().min(1, '时间不能为空'),
  repeat: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
    invalid_type_error: '无效的重复类型',
  }),
  endDate: z.coerce.date().optional(),
});

const updateReminderSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  notes: z.string().max(1000, '备注不能超过1000字符').optional(),
  date: z.coerce.date().optional(),
  time: z.string().optional(),
  repeat: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
    invalid_type_error: '无效的重复类型',
  }).optional(),
  endDate: z.coerce.date().optional(),
  isCompleted: z.boolean().optional(),
});

// 获取提醒列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { petId, type, completed } = req.query;
    
    // 获取用户的所有宠物ID
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
      include: { pet: { select: { id: true, name: true, avatar: true } } },
      orderBy: { date: 'asc' },
    });

    res.json({ 
      code: 200,
      data: reminders,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取提醒失败' 
    });
  }
});

// 获取即将到来的提醒
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

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
          lte: thirtyDaysLater,
        },
      },
      include: { pet: { select: { id: true, name: true, avatar: true } } },
      orderBy: { date: 'asc' },
    });

    // 标记紧急程度
    const nowTime = now.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const remindersWithUrgency = reminders.map(reminder => {
      const reminderTime = new Date(reminder.date).getTime();
      const daysUntil = Math.ceil((reminderTime - nowTime) / oneDayMs);
      let urgency = 'normal';
      if (daysUntil <= 1) urgency = 'urgent';
      else if (daysUntil <= 7) urgency = 'soon';
      return { ...reminder, urgency, daysUntil };
    });

    res.json({ 
      code: 200,
      data: remindersWithUrgency,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取即将到期提醒失败' 
    });
  }
});

// 获取已过期的提醒
router.get('/overdue', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const userPets = await prisma.pet.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });
    const petIds = userPets.map(p => p.id);

    const reminders = await prisma.reminder.findMany({
      where: {
        petId: { in: petIds },
        isCompleted: false,
        date: { lt: now },
      },
      include: { pet: { select: { id: true, name: true, avatar: true } } },
      orderBy: { date: 'asc' },
    });

    res.json({ 
      code: 200,
      data: reminders,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取过期提醒失败' 
    });
  }
});

// 创建提醒
router.post('/', validateBody(createReminderSchema), async (req: Request, res: Response) => {
  try {
    const { petId, ...data } = req.body;

    // 验证宠物所有权
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        error: '宠物不存在' 
      });
    }

    const reminder = await prisma.reminder.create({
      data: {
        petId,
        ...data,
      },
      include: { pet: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(201).json({ 
      code: 201,
      data: reminder,
      msg: '创建成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '创建提醒失败' 
    });
  }
});

// 获取单个提醒
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
      include: { pet: { select: { id: true, name: true, avatar: true } } },
    });

    if (!reminder) {
      return res.status(404).json({ 
        code: 404,
        error: '提醒不存在' 
      });
    }

    res.json({ 
      code: 200,
      data: reminder,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取提醒失败' 
    });
  }
});

// 更新提醒
router.put('/:id', validateBody(updateReminderSchema), async (req: Request, res: Response) => {
  try {
    // 验证提醒所有权
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
    });

    if (!reminder) {
      return res.status(404).json({ 
        code: 404,
        error: '提醒不存在' 
      });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: req.body,
      include: { pet: { select: { id: true, name: true, avatar: true } } },
    });

    res.json({ 
      code: 200,
      data: updatedReminder,
      msg: '更新成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '更新提醒失败' 
    });
  }
});

// 删除提醒
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
    });

    if (!reminder) {
      return res.status(404).json({ 
        code: 404,
        error: '提醒不存在' 
      });
    }

    await prisma.reminder.delete({
      where: { id: req.params.id },
    });

    res.json({ 
      code: 200,
      msg: '删除成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '删除提醒失败' 
    });
  }
});

// 标记提醒完成
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: req.params.id,
        pet: { userId: req.userId },
      },
      include: { pet: true },
    });

    if (!reminder) {
      return res.status(404).json({ 
        code: 404,
        error: '提醒不存在' 
      });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
      include: { pet: { select: { id: true, name: true, avatar: true } } },
    });

    // 自动创建健康记录（可选功能）
    // 如果是疫苗、体检等类型，可以自动创建对应的健康记录
    if (reminder.type === 'VACCINE' || reminder.type === 'CHECKUP' || reminder.type === 'DEWORMING') {
      let recordType = 'TEXT';
      let tags: string[] = [];
      
      switch (reminder.type) {
        case 'VACCINE':
          recordType = 'TEXT';
          tags = ['疫苗', '接种'];
          break;
        case 'CHECKUP':
          recordType = 'TEXT';
          tags = ['体检', '检查'];
          break;
        case 'DEWORMING':
          recordType = 'TEXT';
          tags = ['驱虫'];
          break;
      }

      await prisma.healthRecord.create({
        data: {
          userId: reminder.pet.userId,
          petId: reminder.petId,
          type: recordType,
          title: reminder.title,
          content: reminder.notes || '',
          tags: JSON.stringify(tags),
          attachments: JSON.stringify([]),
          recordDate: new Date(),
          isImportant: false,
        },
      });
    }

    // 如果是重复提醒，创建下一次提醒
    if (reminder.repeat !== 'ONCE' && reminder.endDate) {
      const nextDate = new Date(reminder.date);
      
      switch (reminder.repeat) {
        case 'DAILY':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'WEEKLY':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'MONTHLY':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'YEARLY':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      if (nextDate <= new Date(reminder.endDate)) {
        await prisma.reminder.create({
          data: {
            petId: reminder.petId,
            type: reminder.type,
            title: reminder.title,
            notes: reminder.notes,
            date: nextDate,
            time: reminder.time,
            repeat: reminder.repeat,
            endDate: reminder.endDate,
          },
        });
      }
    }

    res.json({ 
      code: 200,
      data: updatedReminder,
      msg: '标记完成成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '标记完成失败' 
    });
  }
});

export default router;
