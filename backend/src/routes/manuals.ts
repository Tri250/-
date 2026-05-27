import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

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

      const where: any = {};
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

      const parsedManuals = manuals.map(m => ({
        ...m,
        tags: m.tags ? JSON.parse(m.tags) : [],
      }));

      res.json({ manuals: parsedManuals });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '获取手册失败' });
    }
  }
);

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const searchQuery = q as string;

    const manuals = await prisma.healthManual.findMany({
      where: {
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
        ],
      },
      orderBy: { viewCount: 'desc' },
    });

    const parsedManuals = manuals.map(m => ({
      ...m,
      tags: m.tags ? JSON.parse(m.tags) : [],
    }));

    res.json({ manuals: parsedManuals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '搜索手册失败' });
  }
});

router.get('/bookmarks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const bookmarks = await prisma.manualBookmark.findMany({
      where: { userId: req.userId },
      include: { manual: true },
      orderBy: { createdAt: 'desc' },
    });

    const parsedBookmarks = bookmarks.map(b => ({
      ...b,
      manual: {
        ...b.manual,
        tags: b.manual.tags ? JSON.parse(b.manual.tags) : [],
      },
    }));

    res.json({ bookmarks: parsedBookmarks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取书签失败' });
  }
});

router.post('/:id/bookmark', authenticateToken, async (req: Request, res: Response) => {
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

    const parsedBookmark = {
      ...bookmark,
      manual: {
        ...bookmark.manual,
        tags: bookmark.manual.tags ? JSON.parse(bookmark.manual.tags) : [],
      },
    };

    res.status(201).json({ bookmark: parsedBookmark });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '收藏失败' });
  }
});

router.delete('/:id/bookmark', authenticateToken, async (req: Request, res: Response) => {
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

    const parsedManual = {
      ...manual,
      tags: manual.tags ? JSON.parse(manual.tags) : [],
    };

    res.json({ manual: parsedManual });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取手册失败' });
  }
});

export default router;
