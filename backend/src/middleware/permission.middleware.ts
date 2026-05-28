import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      pet?: any;
    }
  }
}

export async function validatePetOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { petId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ 
      code: 401, 
      error: '未登录' 
    });
  }

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404, 
        error: '宠物不存在' 
      });
    }

    if (pet.userId !== userId) {
      return res.status(403).json({ 
        code: 403, 
        error: '无权限访问此宠物数据' 
      });
    }

    req.pet = pet;
    next();
  } catch (error) {
    console.error('权限校验错误:', error);
    return res.status(500).json({ 
      code: 500, 
      error: '服务器错误' 
    });
  }
}

export async function validatePetOwnershipFromBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { petId } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ 
      code: 401, 
      error: '未登录' 
    });
  }

  if (!petId) {
    return res.status(400).json({ 
      code: 400, 
      error: 'petId 为必填参数' 
    });
  }

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404, 
        error: '宠物不存在' 
      });
    }

    if (pet.userId !== userId) {
      return res.status(403).json({ 
        code: 403, 
        error: '无权限访问此宠物数据' 
      });
    }

    req.pet = pet;
    next();
  } catch (error) {
    console.error('权限校验错误:', error);
    return res.status(500).json({ 
      code: 500, 
      error: '服务器错误' 
    });
  }
}
