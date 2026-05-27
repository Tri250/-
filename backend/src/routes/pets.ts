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

    res.json({ pets: parsedPets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取宠物列表失败' });
  }
});

router.post(
  '/',
  [
    body('name').isLength({ min: 1 }),
    body('type').isIn(['DOG', 'CAT', 'OTHER']),
    body('gender').isIn(['MALE', 'FEMALE']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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

      res.status(201).json({ pet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '创建宠物失败' });
    }
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
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
      return res.status(404).json({ error: '宠物不存在' });
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

    res.json({ pet: parsedPet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取宠物信息失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
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

    const pet = await prisma.pet.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      data: {
        name,
        avatar,
        breed,
        birthday: birthday ? new Date(birthday) : null,
        weight,
        color,
        characteristics,
        healthStatus,
      },
    });

    if (pet.count === 0) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    const updatedPet = await prisma.pet.findUnique({
      where: { id: req.params.id },
    });

    res.json({ pet: updatedPet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新宠物失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (pet.count === 0) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除宠物失败' });
  }
});

router.get('/:id/vaccines', async (req: Request, res: Response) => {
  try {
    const vaccines = await prisma.petVaccine.findMany({
      where: {
        petId: req.params.id,
        pet: { userId: req.userId },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ vaccines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取疫苗记录失败' });
  }
});

router.post('/:id/vaccines', async (req: Request, res: Response) => {
  try {
    const { name, date, nextDate, vet, notes } = req.body;

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

    res.status(201).json({ vaccine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '添加疫苗记录失败' });
  }
});

router.get('/:id/checkups', async (req: Request, res: Response) => {
  try {
    const checkups = await prisma.petCheckup.findMany({
      where: {
        petId: req.params.id,
        pet: { userId: req.userId },
      },
      orderBy: { date: 'desc' },
    });

    const parsedCheckups = checkups.map(c => ({
      ...c,
      attachments: c.attachments ? JSON.parse(c.attachments) : [],
    }));

    res.json({ checkups: parsedCheckups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取体检记录失败' });
  }
});

router.post('/:id/checkups', async (req: Request, res: Response) => {
  try {
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

    res.status(201).json({ checkup: parsedCheckup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '添加体检记录失败' });
  }
});

router.get('/:id/growth', async (req: Request, res: Response) => {
  try {
    const growthRecords = await prisma.petGrowth.findMany({
      where: {
        petId: req.params.id,
        pet: { userId: req.userId },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ growthRecords });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取成长记录失败' });
  }
});

router.post('/:id/growth', async (req: Request, res: Response) => {
  try {
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

    res.status(201).json({ growthRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '添加成长记录失败' });
  }
});

export default router;
