import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { userId: req.userId },
      include: {
        healthRecords: { take: 5, orderBy: { createdAt: 'desc' } },
        reminders: { where: { isCompleted: false }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedPets = pets.map(p => ({
      ...p,
      healthRecords: p.healthRecords.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : [],
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
      })),
    }));

    res.json({ 
      code: 200,
      message: '获取宠物列表成功',
      data: { pets: parsedPets },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取宠物列表失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post(
  '/',
  [
    body('name').isLength({ min: 1 }).withMessage('宠物名称不能为空'),
    body('type').isIn(['DOG', 'CAT', 'OTHER']).withMessage('宠物类型仅支持 dog/cat/other'),
    body('gender').isIn(['MALE', 'FEMALE']).withMessage('性别仅支持 male/female'),
    body('birthday').optional().custom((value) => {
      if (value) {
        const birthday = new Date(value);
        const today = new Date();
        if (birthday > today) {
          throw new Error('生日不能为未来日期');
        }
      }
      return true;
    }),
    body('weight').optional().custom((value) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'number' && value < 0) {
          throw new Error('体重必须为正数');
        }
      }
      return true;
    }),
    body('healthStatus').optional().isIn(['EXCELLENT', 'GOOD', 'FAIR', 'CONCERN']).withMessage('健康状态仅支持 excellent/good/fair/concern'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '创建宠物信息验证失败',
        errors: errors.array().map(err => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const {
        name,
        avatar,
        type,
        breed,
        gender,
        birthday,
        weight,
        color,
        characteristics,
        healthStatus,
      } = req.body;

      const pet = await prisma.pet.create({
        data: {
          userId: req.userId!,
          name,
          avatar,
          type,
          breed,
          gender,
          birthday: birthday ? new Date(birthday) : null,
          weight,
          color,
          characteristics,
          healthStatus: healthStatus || 'GOOD',
        },
      });

      res.status(201).json({ 
        code: 201,
        message: '创建宠物成功',
        data: { pet },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '创建宠物失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: {
        id: req.params.id,
      },
      include: {
        healthRecords: { orderBy: { createdAt: 'desc' } },
        vaccines: { orderBy: { date: 'desc' } },
        checkups: { orderBy: { date: 'desc' } },
        growthRecords: { orderBy: { date: 'desc' } },
        reminders: { orderBy: { date: 'asc' } },
      },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const parsedPet = {
      ...pet,
      healthRecords: pet.healthRecords.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : [],
        attachments: r.attachments ? JSON.parse(r.attachments) : [],
      })),
      checkups: pet.checkups.map(c => ({
        ...c,
        attachments: c.attachments ? JSON.parse(c.attachments) : [],
      })),
    };

    res.json({ 
      code: 200,
      message: '获取宠物信息成功',
      data: { pet: parsedPet },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取宠物信息失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', [
  body('name').optional().isLength({ min: 1 }).withMessage('宠物名称不能为空'),
  body('type').optional().isIn(['DOG', 'CAT', 'OTHER']).withMessage('宠物类型仅支持 dog/cat/other'),
  body('gender').optional().isIn(['MALE', 'FEMALE']).withMessage('性别仅支持 male/female'),
  body('birthday').optional().custom((value) => {
    if (value) {
      const birthday = new Date(value);
      const today = new Date();
      if (birthday > today) {
        throw new Error('生日不能为未来日期');
      }
    }
    return true;
  }),
  body('weight').optional().custom((value) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'number' && value < 0) {
        throw new Error('体重必须为正数');
      }
    }
    return true;
  }),
  body('healthStatus').optional().isIn(['EXCELLENT', 'GOOD', 'FAIR', 'CONCERN']).withMessage('健康状态仅支持 excellent/good/fair/concern'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 400,
      message: '更新宠物信息验证失败',
      errors: errors.array().map(err => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg
      })),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const existingPet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!existingPet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingPet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const {
      name,
      avatar,
      breed,
      birthday,
      weight,
      color,
      characteristics,
      healthStatus,
    } = req.body;

    const pet = await prisma.pet.update({
      where: { id: req.params.id },
      data: {
        name,
        avatar,
        breed,
        birthday: birthday ? new Date(birthday) : undefined,
        weight,
        color,
        characteristics,
        healthStatus,
      },
    });

    res.json({ 
      code: 200,
      message: '更新宠物信息成功',
      data: { pet },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '更新宠物失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existingPet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!existingPet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (existingPet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    await prisma.pet.delete({
      where: { id: req.params.id },
    });

    res.json({ 
      code: 200,
      message: '删除宠物成功',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '删除宠物失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id/vaccines', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const vaccines = await prisma.petVaccine.findMany({
      where: {
        petId: req.params.id,
      },
      orderBy: { date: 'desc' },
    });

    res.json({ 
      code: 200,
      message: '获取疫苗记录成功',
      data: { vaccines },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取疫苗记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/:id/vaccines', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { name, date, nextDate, vet, notes } = req.body;

    if (nextDate && new Date(nextDate) < new Date(date)) {
      return res.status(400).json({ 
        code: 400,
        message: '下次接种日期应晚于本次接种日期',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const vaccine = await prisma.petVaccine.create({
      data: {
        petId: req.params.id,
        name,
        date: new Date(date),
        nextDate: nextDate ? new Date(nextDate) : null,
        vet,
        notes,
      },
    });

    res.status(201).json({ 
      code: 201,
      message: '添加疫苗记录成功',
      data: { vaccine },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '添加疫苗记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id/checkups', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const checkups = await prisma.petCheckup.findMany({
      where: {
        petId: req.params.id,
      },
      orderBy: { date: 'desc' },
    });

    const parsedCheckups = checkups.map(c => ({
      ...c,
      attachments: c.attachments ? JSON.parse(c.attachments) : [],
    }));

    res.json({ 
      code: 200,
      message: '获取体检记录成功',
      data: { checkups: parsedCheckups },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取体检记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/:id/checkups', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { date, weight, vet, notes, attachments = [] } = req.body;

    const checkup = await prisma.petCheckup.create({
      data: {
        petId: req.params.id,
        date: new Date(date),
        weight,
        vet,
        notes,
        attachments: JSON.stringify(attachments),
      },
    });

    const parsedCheckup = {
      ...checkup,
      attachments: JSON.parse(checkup.attachments),
    };

    res.status(201).json({ 
      code: 201,
      message: '添加体检记录成功',
      data: { checkup: parsedCheckup },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '添加体检记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id/growth', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const growthRecords = await prisma.petGrowth.findMany({
      where: {
        petId: req.params.id,
      },
      orderBy: { date: 'desc' },
    });

    res.json({ 
      code: 200,
      message: '获取成长记录成功',
      data: { growthRecords },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取成长记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/:id/growth', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该宠物',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { date, weight, height, notes } = req.body;

    const growthRecord = await prisma.petGrowth.create({
      data: {
        petId: req.params.id,
        date: new Date(date),
        weight,
        height,
        notes,
      },
    });

    res.status(201).json({ 
      code: 201,
      message: '添加成长记录成功',
      data: { growthRecord },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '添加成长记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
