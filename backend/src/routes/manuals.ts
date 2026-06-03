import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { _ManualCategory, _PetType } from '@prisma/client';

const router = Router();

router.get(
  '/',
  [
    query('category').optional().isString(),
    query('petType').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { category, petType } = req.query;

      const where: { category?: string; OR?: { petType: string | null }[] } = {};
      if (category) where.category = category;
      if (petType) {
        where.OR = [{ petType: petType }, { petType: null }];
      }

      const manuals = await prisma.healthManual.findMany({
        where,
        orderBy: [
          { isOfficial: 'desc' },
          { viewCount: 'desc' },
        ],
      });

      res.json({ manuals });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '获取手册失败' });
    }
  }
);

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    const manuals = await prisma.healthManual.findMany({
      where: {
        OR: [
          { title: { contains: q as string, mode: 'insensitive' } },
          { content: { contains: q as string, mode: 'insensitive' } },
          { tags: { hasSome: [q as string] } },
        ],
      },
      orderBy: { viewCount: 'desc' },
    });

    res.json({ manuals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '搜索手册失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const manual = await prisma.healthManual.findUnique({
      where: { id: req.params.id },
    });

    if (!manual) {
      return res.status(404).json({ error: '手册不存在' });
    }

    await prisma.healthManual.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({ manual });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取手册失败' });
  }
});

router.use(authenticateToken);

router.get('/bookmarks', async (req: Request, res: Response) => {
  try {
    const bookmarks = await prisma.manualBookmark.findMany({
      where: { userId: req.userId },
      include: { manual: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookmarks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取书签失败' });
  }
});

router.post('/:id/bookmark', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.manualBookmark.findFirst({
      where: {
        userId: req.userId,
        manualId: req.params.id,
      },
    });

    if (existing) {
      return res.status(400).json({ error: '已收藏' });
    }

    const bookmark = await prisma.manualBookmark.create({
      data: {
        userId: req.userId!,
        manualId: req.params.id,
      },
      include: { manual: true },
    });

    res.status(201).json({ bookmark });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '收藏失败' });
  }
});

router.delete('/:id/bookmark', async (req: Request, res: Response) => {
  try {
    const bookmark = await prisma.manualBookmark.deleteMany({
      where: {
        userId: req.userId,
        manualId: req.params.id,
      },
    });

    if (bookmark.count === 0) {
      return res.status(404).json({ error: '书签不存在' });
    }

    res.json({ message: '取消收藏成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '取消收藏失败' });
  }
});

export default router;
