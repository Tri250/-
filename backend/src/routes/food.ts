import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

router.post(
  '/analyze',
  [
    body('ingredients').isString().withMessage('配料表不能为空'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '请求验证失败',
        errors: errors.array().map((err: any) => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const { ingredients, foodName, petId } = req.body;

      const analysis = analyzeFoodIngredients(ingredients, foodName);

      const foodAnalysis = await prisma.foodAnalysis.create({
        data: {
          userId: req.userId!,
          petId,
          foodName,
          ingredients,
          nutritionScore: analysis.nutritionScore,
          warnings: JSON.stringify(analysis.warnings),
          recommendations: JSON.stringify(analysis.recommendations),
        },
      });

      res.json({ 
        code: 200,
        message: '宠物粮分析成功',
        data: { 
          analysis,
          foodAnalysis 
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '宠物粮分析失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.post(
  '/ocr-analyze',
  [
    body('imageBase64').isString().withMessage('图片数据不能为空'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '请求验证失败',
        errors: errors.array().map((err: any) => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const { imageBase64, petId } = req.body;

      const mockIngredients = mockOCRResult();
      const analysis = analyzeFoodIngredients(mockIngredients, '识别的宠物粮');

      const foodAnalysis = await prisma.foodAnalysis.create({
        data: {
          userId: req.userId!,
          petId,
          foodName: 'OCR识别',
          ingredients: mockIngredients,
          nutritionScore: analysis.nutritionScore,
          warnings: JSON.stringify(analysis.warnings),
          recommendations: JSON.stringify(analysis.recommendations),
        },
      });

      res.json({ 
        code: 200,
        message: 'OCR识别分析成功',
        data: { 
          ocrResult: mockIngredients,
          analysis,
          foodAnalysis 
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: 'OCR识别失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/history', async (req: Request, res: Response) => {
  try {
    const analyses = await prisma.foodAnalysis.findMany({
      where: { userId: req.userId },
      include: { pet: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ 
      code: 200,
      message: '获取分析历史成功',
      data: { analyses },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取分析历史失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    const analysis = await prisma.foodAnalysis.findUnique({
      where: { id: req.params.id },
    });

    if (!analysis) {
      return res.status(404).json({ 
        code: 404,
        message: '分析记录不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (analysis.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该记录',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    await prisma.foodAnalysis.delete({
      where: { id: req.params.id },
    });

    res.json({ 
      code: 200,
      message: '删除分析记录成功',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '删除分析记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/recommend', [
  body('petId').isString().withMessage('宠物ID不能为空'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 400,
      message: '请求验证失败',
      errors: errors.array().map((err: any) => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg
      })),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { petId, age, weight, activityLevel, healthConditions } = req.body;

    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const recommendations = generateNutritionRecommendations(
      pet.type,
      pet.breed,
      age || calculateAge(pet.birthday),
      weight || pet.weight,
      activityLevel,
      healthConditions
    );

    res.json({ 
      code: 200,
      message: '营养建议生成成功',
      data: recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '生成营养建议失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

function analyzeFoodIngredients(ingredients: string, foodName?: string) {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let nutritionScore = 70;

  const lowerIngredients = ingredients.toLowerCase();

  if (lowerIngredients.includes('添加剂')) {
    warnings.push('配料中含有添加剂，请留意');
    nutritionScore -= 5;
  }

  if (lowerIngredients.includes('防腐剂')) {
    warnings.push('配料中含有防腐剂');
    nutritionScore -= 5;
  }

  if (lowerIngredients.includes('人工色素')) {
    warnings.push('配料中含有人工色素');
    nutritionScore -= 5;
  }

  if (lowerIngredients.includes('肉粉')) {
    warnings.push('使用肉粉作为蛋白质来源，建议选择鲜肉配方');
    nutritionScore -= 10;
  }

  if (lowerIngredients.includes('鲜肉') || lowerIngredients.includes('鲜鸡肉') || lowerIngredients.includes('鲜牛肉')) {
    recommendations.push('使用鲜肉作为主要原料，品质较好');
    nutritionScore += 10;
  }

  if (lowerIngredients.includes('三文鱼') || lowerIngredients.includes('鱼油')) {
    recommendations.push('含有Omega-3脂肪酸，对毛发健康有益');
    nutritionScore += 5;
  }

  if (lowerIngredients.includes('益生菌')) {
    recommendations.push('含有益生菌，有助于肠道健康');
    nutritionScore += 5;
  }

  if (lowerIngredients.includes('维生素') && lowerIngredients.includes('矿物质')) {
    recommendations.push('营养成分全面');
    nutritionScore += 5;
  }

  if (lowerIngredients.includes('糙米') || lowerIngredients.includes('燕麦')) {
    recommendations.push('使用优质谷物，易消化');
    nutritionScore += 5;
  }

  if (lowerIngredients.includes('玉米') && !lowerIngredients.includes('糙米')) {
    warnings.push('主要谷物为玉米，可能引起部分宠物过敏');
    nutritionScore -= 5;
  }

  if (warnings.length === 0) {
    recommendations.push('配料表整体健康，建议持续观察宠物食用后的状态');
  }

  return {
    foodName,
    nutritionScore: Math.max(0, Math.min(100, nutritionScore)),
    warnings,
    recommendations,
    ingredientCount: ingredients.split(/[,，、]/).filter(i => i.trim()).length,
  };
}

function mockOCRResult(): string {
  const ingredientsList = [
    '鸡肉, 鸡肉粉, 糙米, 玉米, 鸡脂肪, 三文鱼油, 天然香料, 维生素A, 维生素D3, 维生素E, 牛磺酸',
    '鲜鸡肉, 糙米, 燕麦, 三文鱼, 鸡油, 益生菌, 蓝莓, 胡萝卜, 矿物质, 维生素',
    '牛肉粉, 玉米粉, 小麦, 动物脂肪, 人工香料, 防腐剂, 色素',
    '鲜三文鱼, 豌豆, 土豆, 亚麻籽油, 椰子油, 益生菌, 南瓜, 维生素复合物',
    '鸡肉, 火鸡肉, 糙米, 燕麦, 鸡肝, 三文鱼油, 亚麻籽, 维生素, 矿物质',
  ];

  return ingredientsList[Math.floor(Math.random() * ingredientsList.length)];
}

function generateNutritionRecommendations(
  petType: string,
  breed: string,
  age: number | null,
  weight: number | null,
  activityLevel: string = 'normal',
  healthConditions: string[] = []
) {
  const recommendations: any = {
    petType,
    breed,
    age,
    weight,
    activityLevel,
    dailyCalories: weight ? Math.floor(weight * (petType === 'CAT' ? 30 : 25)) : null,
    keyNutrients: [],
    feedingTips: [],
    ingredientPreferences: [],
    warnings: [],
  };

  if (petType === 'DOG') {
    recommendations.keyNutrients = ['蛋白质 22-30%', '脂肪 10-15%', '碳水化合物 40-50%'];
    recommendations.feedingTips = ['分2-3次喂食', '控制零食不超过每日热量10%'];
  } else {
    recommendations.keyNutrients = ['蛋白质 26-30%', '脂肪 9-15%', '牛磺酸 0.1%'];
    recommendations.feedingTips = ['分2-4次喂食', '注意毛球控制'];
  }

  if (age && age < 1) {
    recommendations.keyNutrients.push('钙磷比 1.1-1.4:1');
    recommendations.feedingTips.push('幼犬/幼猫需更高蛋白质');
    recommendations.ingredientPreferences.push('DHA促进大脑发育');
  } else if (age && age > 7) {
    recommendations.keyNutrients.push('易消化蛋白质');
    recommendations.feedingTips.push('减少热量摄入防止肥胖');
    recommendations.ingredientPreferences.push('关节保护成分如葡萄糖胺');
  }

  if (activityLevel === 'high') {
    recommendations.keyNutrients.push('更高脂肪含量提供能量');
    recommendations.feedingTips.push('增加喂食量或次数');
  } else if (activityLevel === 'low') {
    recommendations.keyNutrients.push('低脂肪配方');
    recommendations.feedingTips.push('控制食量防止肥胖');
  }

  if (healthConditions.includes('过敏')) {
    recommendations.warnings.push('建议无谷物配方');
    recommendations.ingredientPreferences.push('单一蛋白质来源');
  }

  if (healthConditions.includes('肥胖')) {
    recommendations.warnings.push('选择低热量配方');
    recommendations.feedingTips.push('严格控制食量');
  }

  if (healthConditions.includes('肾脏问题')) {
    recommendations.warnings.push('选择低磷低蛋白配方');
    recommendations.feedingTips.push('咨询兽医制定饮食方案');
  }

  if (breed === '折耳猫') {
    recommendations.ingredientPreferences.push('关节保护成分');
    recommendations.feedingTips.push('控制体重减轻关节负担');
  }

  if (breed === '柯基' || breed === '腊肠') {
    recommendations.warnings.push('注意椎间盘问题');
    recommendations.feedingTips.push('控制体重，避免跳跃');
  }

  return recommendations;
}

function calculateAge(birthday: Date | null): number | null {
  if (!birthday) return null;
  const today = new Date();
  const diff = today.getTime() - birthday.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default router;
