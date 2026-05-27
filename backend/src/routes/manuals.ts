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

      res.json({ 
        code: 200,
        message: '获取手册列表成功',
        data: { manuals: parsedManuals },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '获取手册失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const searchQuery = (q as string || '').replace(/[<>'"]/g, '');

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

    res.json({ 
      code: 200,
      message: '搜索手册成功',
      data: { manuals: parsedManuals },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '搜索手册失败',
      data: null,
      timestamp: new Date().toISOString()
    });
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

    res.json({ 
      code: 200,
      message: '获取书签成功',
      data: { bookmarks: parsedBookmarks },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取书签失败',
      data: null,
      timestamp: new Date().toISOString()
    });
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
      return res.status(409).json({ 
        code: 409,
        message: '已收藏该手册',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const manual = await prisma.healthManual.findUnique({
      where: { id: req.params.id },
    });

    if (!manual) {
      return res.status(404).json({ 
        code: 404,
        message: '手册不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
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

    res.status(201).json({ 
      code: 201,
      message: '收藏成功',
      data: { bookmark: parsedBookmark },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '收藏失败',
      data: null,
      timestamp: new Date().toISOString()
    });
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
      return res.status(404).json({ 
        code: 404,
        message: '书签不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ 
      code: 200,
      message: '取消收藏成功',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '取消收藏失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const manual = await prisma.healthManual.findUnique({
      where: { id: req.params.id },
    });

    if (!manual) {
      return res.status(404).json({ 
        code: 404,
        message: '手册不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    await prisma.healthManual.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    const parsedManual = {
      ...manual,
      tags: manual.tags ? JSON.parse(manual.tags) : [],
    };

    res.json({ 
      code: 200,
      message: '获取手册详情成功',
      data: { manual: parsedManual },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取手册失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
