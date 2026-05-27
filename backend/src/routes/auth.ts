import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth';
import { authenticateToken } from '../middleware';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('邮箱格式不正确').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('密码至少需要8个字符')
      .matches(/[A-Z]/)
      .withMessage('密码必须包含至少一个大写字母')
      .matches(/[a-z]/)
      .withMessage('密码必须包含至少一个小写字母')
      .matches(/[0-9]/)
      .withMessage('密码必须包含至少一个数字')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('密码必须包含至少一个特殊字符'),
    body('name').isLength({ min: 2 }).withMessage('用户名至少需要2个字符'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '注册信息验证失败',
        errors: errors.array().map(err => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    const { email, password, name, avatar } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ 
          code: 409,
          message: '该邮箱已被注册',
          data: null,
          timestamp: new Date().toISOString()
        });
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
        code: 201,
        message: '注册成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
          token,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '注册失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('邮箱格式不正确').normalizeEmail(),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '登录信息验证失败',
        errors: errors.array().map(err => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ 
          code: 401,
          message: '邮箱或密码错误',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          code: 401,
          message: '邮箱或密码错误',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      res.json({
        code: 200,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
          token,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '登录失败',
        data: null,
        timestamp: new Date().toISOString()
      });
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
      return res.status(404).json({ 
        code: 404,
        message: '用户不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ 
      code: 200,
      message: '获取用户信息成功',
      data: { user },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取用户信息失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/me', authenticateToken, [
  body('name').optional().isLength({ min: 2 }).withMessage('用户名至少需要2个字符'),
  body('avatar').optional().isURL().withMessage('头像URL格式不正确'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 400,
      message: '更新信息验证失败',
      errors: errors.array().map(err => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg
      })),
      timestamp: new Date().toISOString()
    });
  }

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

    res.json({ 
      code: 200,
      message: '更新用户信息成功',
      data: { user },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '更新用户信息失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
