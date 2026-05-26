import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth';
import { authenticateToken } from '../middleware';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').isLength({ min: 2 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, avatar } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: '邮箱已注册' });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatar,
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '注册失败' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '登录失败' });
    }
  }
);

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

export default router;
