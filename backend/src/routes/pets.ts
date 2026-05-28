import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

// 辅助函数：检查宠物所有权
const validatePetOwnership = async (petId: string, userId: string) => {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
  });
  
  if (!pet) return { error: '宠物不存在', status: 404 };
  if (pet.userId !== userId) return { error: '无权限操作该宠物', status: 403 };
  return { pet };
};

// 序列化检查记录
const serializeCheckup = (checkup: any) => ({
  ...checkup,
  attachments: checkup.attachments ? JSON.parse(checkup.attachments) : []
});

// 验证模式
const createPetSchema = z.object({
  name: z.string().min(1, '宠物名称不能为空'),
  avatar: z.string().optional(),
  type: z.enum(['DOG', 'CAT', 'OTHER'], { invalid_type_error: '无效的宠物类型' }),
  breed: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], { invalid_type_error: '无效的性别' }),
  birthday: z.coerce.date().optional(),
  weight: z.number().min(0).optional(),
  color: z.string().optional(),
  characteristics: z.string().optional(),
  healthStatus: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'CONCERN']).optional(),
});

const updatePetSchema = z.object({
  name: z.string().min(1, '宠物名称不能为空').optional(),
  avatar: z.string().optional(),
  breed: z.string().optional(),
  birthday: z.coerce.date().optional(),
  weight: z.number().min(0).optional(),
  color: z.string().optional(),
  characteristics: z.string().optional(),
  healthStatus: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'CONCERN']).optional(),
});

const createVaccineSchema = z.object({
  name: z.string().min(1, '疫苗名称不能为空'),
  date: z.coerce.date(),
  nextDate: z.coerce.date().optional(),
  vet: z.string().optional(),
  notes: z.string().optional(),
});

const updateVaccineSchema = z.object({
  name: z.string().min(1, '疫苗名称不能为空').optional(),
  date: z.coerce.date().optional(),
  nextDate: z.coerce.date().optional(),
  vet: z.string().optional(),
  notes: z.string().optional(),
});

const createCheckupSchema = z.object({
  date: z.coerce.date(),
  weight: z.number().min(0).optional(),
  vet: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

const updateCheckupSchema = z.object({
  date: z.coerce.date().optional(),
  weight: z.number().min(0).optional(),
  vet: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

const createGrowthSchema = z.object({
  date: z.coerce.date(),
  weight: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateGrowthSchema = z.object({
  date: z.coerce.date().optional(),
  weight: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// 获取宠物列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { userId: req.userId },
      include: {
        healthRecords: { 
          where: { deletedAt: null },
          take: 5, 
          orderBy: { createdAt: 'desc' } 
        },
        reminders: { 
          where: { isCompleted: false },
          take: 3,
          orderBy: { date: 'asc' }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ 
      code: 200,
      data: pets,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取宠物列表失败' 
    });
  }
});

// 创建宠物
router.post('/', validateBody(createPetSchema), async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.create({
      data: {
        userId: req.userId!,
        ...req.body,
      },
    });

    res.status(201).json({ 
      code: 201,
      data: pet,
      msg: '创建成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '创建宠物失败' 
    });
  }
});

// 获取单个宠物详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        healthRecords: { 
          where: { deletedAt: null },
          orderBy: { recordDate: 'desc' } 
        },
        vaccines: { orderBy: { date: 'desc' } },
        checkups: { orderBy: { date: 'desc' } },
        growthRecords: { orderBy: { date: 'asc' } },
        reminders: { orderBy: { date: 'asc' } },
      },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        error: '宠物不存在' 
      });
    }

    // 处理JSON字段
    const processedPet = {
      ...pet,
      checkups: pet.checkups.map(serializeCheckup),
    };

    res.json({ 
      code: 200,
      data: processedPet,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取宠物信息失败' 
    });
  }
});

// 更新宠物信息
router.put('/:id', validateBody(updatePetSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const pet = await prisma.pet.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ 
      code: 200,
      data: pet,
      msg: '更新成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '更新宠物失败' 
    });
  }
});

// 删除宠物
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    await prisma.pet.delete({
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
      error: '删除宠物失败' 
    });
  }
});

// ==================== 疫苗记录 ====================

// 获取疫苗记录列表
router.get('/:id/vaccines', async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const vaccines = await prisma.petVaccine.findMany({
      where: { petId: req.params.id },
      orderBy: { date: 'desc' },
    });

    // 检查即将到期或已过期的疫苗
    const now = new Date();
    const vaccinesWithStatus = vaccines.map(vaccine => {
      let status = 'completed';
      if (vaccine.nextDate) {
        const nextDate = new Date(vaccine.nextDate);
        if (nextDate < now) {
          status = 'overdue';
        } else {
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
          if (nextDate <= thirtyDaysLater) {
            status = 'upcoming';
          }
        }
      }
      return { ...vaccine, status };
    });

    res.json({ 
      code: 200,
      data: vaccinesWithStatus,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取疫苗记录失败' 
    });
  }
});

// 创建疫苗记录
router.post('/:id/vaccines', validateBody(createVaccineSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const vaccine = await prisma.petVaccine.create({
      data: {
        petId: req.params.id,
        ...req.body,
      },
    });

    // 如果有下次接种日期，自动创建提醒
    if (req.body.nextDate) {
      await prisma.reminder.create({
        data: {
          petId: req.params.id,
          type: 'VACCINE',
          title: `${vaccine.name} 疫苗接种提醒`,
          notes: req.body.notes || '',
          date: new Date(req.body.nextDate),
          time: '09:00',
          repeat: 'ONCE',
        },
      });
    }

    res.status(201).json({ 
      code: 201,
      data: vaccine,
      msg: '创建成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '添加疫苗记录失败' 
    });
  }
});

// 更新疫苗记录
router.put('/:id/vaccines/:vaccineId', validateBody(updateVaccineSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const vaccine = await prisma.petVaccine.findFirst({
      where: { id: req.params.vaccineId, petId: req.params.id },
    });

    if (!vaccine) {
      return res.status(404).json({ 
        code: 404,
        error: '疫苗记录不存在' 
      });
    }

    const updatedVaccine = await prisma.petVaccine.update({
      where: { id: req.params.vaccineId },
      data: req.body,
    });

    res.json({ 
      code: 200,
      data: updatedVaccine,
      msg: '更新成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '更新疫苗记录失败' 
    });
  }
});

// 删除疫苗记录
router.delete('/:id/vaccines/:vaccineId', async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const vaccine = await prisma.petVaccine.findFirst({
      where: { id: req.params.vaccineId, petId: req.params.id },
    });

    if (!vaccine) {
      return res.status(404).json({ 
        code: 404,
        error: '疫苗记录不存在' 
      });
    }

    await prisma.petVaccine.delete({
      where: { id: req.params.vaccineId },
    });

    res.json({ 
      code: 200,
      msg: '删除成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '删除疫苗记录失败' 
    });
  }
});

// ==================== 体检记录 ====================

// 获取体检记录列表
router.get('/:id/checkups', async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const checkups = await prisma.petCheckup.findMany({
      where: { petId: req.params.id },
      orderBy: { date: 'desc' },
    });

    res.json({ 
      code: 200,
      data: checkups.map(serializeCheckup),
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取体检记录失败' 
    });
  }
});

// 创建体检记录
router.post('/:id/checkups', validateBody(createCheckupSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const { attachments, ...data } = req.body;
    const checkup = await prisma.petCheckup.create({
      data: {
        petId: req.params.id,
        ...data,
        attachments: JSON.stringify(attachments || []),
      },
    });

    res.status(201).json({ 
      code: 201,
      data: serializeCheckup(checkup),
      msg: '创建成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '添加体检记录失败' 
    });
  }
});

// 更新体检记录
router.put('/:id/checkups/:checkupId', validateBody(updateCheckupSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const checkup = await prisma.petCheckup.findFirst({
      where: { id: req.params.checkupId, petId: req.params.id },
    });

    if (!checkup) {
      return res.status(404).json({ 
        code: 404,
        error: '体检记录不存在' 
      });
    }

    const { attachments, ...data } = req.body;
    const updateData: any = { ...data };
    if (attachments !== undefined) {
      updateData.attachments = JSON.stringify(attachments);
    }

    const updatedCheckup = await prisma.petCheckup.update({
      where: { id: req.params.checkupId },
      data: updateData,
    });

    res.json({ 
      code: 200,
      data: serializeCheckup(updatedCheckup),
      msg: '更新成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '更新体检记录失败' 
    });
  }
});

// 删除体检记录
router.delete('/:id/checkups/:checkupId', async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const checkup = await prisma.petCheckup.findFirst({
      where: { id: req.params.checkupId, petId: req.params.id },
    });

    if (!checkup) {
      return res.status(404).json({ 
        code: 404,
        error: '体检记录不存在' 
      });
    }

    await prisma.petCheckup.delete({
      where: { id: req.params.checkupId },
    });

    res.json({ 
      code: 200,
      msg: '删除成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '删除体检记录失败' 
    });
  }
});

// ==================== 成长记录 ====================

// 获取成长记录列表
router.get('/:id/growth', async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const growthRecords = await prisma.petGrowth.findMany({
      where: { petId: req.params.id },
      orderBy: { date: 'asc' },
    });

    // 分析体重变化
    let weightAnalysis: any = null;
    if (growthRecords.length >= 2) {
      const validWeights = growthRecords.filter(r => r.weight !== null);
      if (validWeights.length >= 2) {
        const firstWeight = validWeights[0].weight!;
        const lastWeight = validWeights[validWeights.length - 1].weight!;
        const weightChange = lastWeight - firstWeight;
        const weightChangePercent = ((weightChange / firstWeight) * 100).toFixed(1);
        
        weightAnalysis = {
          firstWeight,
          lastWeight,
          weightChange,
          weightChangePercent: `${weightChangePercent}%`,
          trend: weightChange > 0 ? 'increasing' : weightChange < 0 ? 'decreasing' : 'stable',
        };
      }
    }

    res.json({ 
      code: 200,
      data: growthRecords,
      analysis: weightAnalysis,
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '获取成长记录失败' 
    });
  }
});

// 创建成长记录
router.post('/:id/growth', validateBody(createGrowthSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const growthRecord = await prisma.petGrowth.create({
      data: {
        petId: req.params.id,
        ...req.body,
      },
    });

    res.status(201).json({ 
      code: 201,
      data: growthRecord,
      msg: '创建成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '添加成长记录失败' 
    });
  }
});

// 更新成长记录
router.put('/:id/growth/:growthId', validateBody(updateGrowthSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const growthRecord = await prisma.petGrowth.findFirst({
      where: { id: req.params.growthId, petId: req.params.id },
    });

    if (!growthRecord) {
      return res.status(404).json({ 
        code: 404,
        error: '成长记录不存在' 
      });
    }

    const updatedGrowthRecord = await prisma.petGrowth.update({
      where: { id: req.params.growthId },
      data: req.body,
    });

    res.json({ 
      code: 200,
      data: updatedGrowthRecord,
      msg: '更新成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '更新成长记录失败' 
    });
  }
});

// 删除成长记录
router.delete('/:id/growth/:growthId', async (req: Request, res: Response) => {
  try {
    const validation = await validatePetOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({ 
        code: validation.status,
        error: validation.error 
      });
    }

    const growthRecord = await prisma.petGrowth.findFirst({
      where: { id: req.params.growthId, petId: req.params.id },
    });

    if (!growthRecord) {
      return res.status(404).json({ 
        code: 404,
        error: '成长记录不存在' 
      });
    }

    await prisma.petGrowth.delete({
      where: { id: req.params.growthId },
    });

    res.json({ 
      code: 200,
      msg: '删除成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      error: '删除成长记录失败' 
    });
  }
});

export default router;
