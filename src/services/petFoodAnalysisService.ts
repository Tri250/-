// ============================================
// PawSync Pro 3.0 - Pet Food Analysis Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 宠粮成分分析服务（OCR+成分数据库+规则引擎）
// ============================================

import type { FoodAnalysisResult, Ingredient, RiskLevel, NutrientInfo, AnalysisWarning, ProductInfo } from '../types/pet-food';

const MOCK_DELAY = 500;

// 风险成分列表
const RISK_INGREDIENTS = {
  preservatives: ['BHA', 'BHT', 'TBHQ', '乙氧基喹啉', '没食子酸丙酯'],
  artificialColors: ['诱惑红', '柠檬黄', '日落黄', '亮蓝', '赤藓红', '人工色素'],
  carrageenan: ['卡拉胶'],
  sweeteners: ['蔗糖', '果糖', '玉米糖浆', '葡萄糖浆', '甜蜜素', '阿斯巴甜'],
  fillers: ['玉米', '小麦', '大豆', '大米糠', '麦麸'],
  byProducts: ['肉粉', '肉骨粉', '家禽副产品', '动物副产品']
};

// 优质蛋白质来源
const HIGH_QUALITY_PROTEINS = [
  '鸡肉', '鸡胸肉', '鸡里脊', '火鸡肉', '鸭肉', '牛肉', '牛腱肉',
  '三文鱼', '鳕鱼', '金枪鱼', '羊肉', '鹿肉', '兔肉', '猪肉',
  '鲜鸡肉', '新鲜鸡肉', '去骨鸡肉', '整鸡'
];

// 国产宠粮数据库（模拟）
const petFoodDatabase: Record<string, ProductInfo> = {
  '渴望六种鱼': {
    brand: 'Orijen',
    name: '渴望六种鱼',
    species: 'cat',
    ingredients: ['新鲜三文鱼', '新鲜鳕鱼', '新鲜比目鱼', '新鲜鲭鱼', '新鲜沙丁鱼', '新鲜鳟鱼', '鱼粉', '木薯', '豌豆', '鹰嘴豆'],
    nutrientInfo: { protein: 40, fat: 20, fiber: 4, moisture: 12 },
    rating: 4.8,
    isAAFCOCompliant: true,
    description: '加拿大进口，六种深海鱼配方'
  },
  '皇家室内成猫粮': {
    brand: 'Royal Canin',
    name: '皇家室内成猫粮',
    species: 'cat',
    ingredients: ['鸡肉粉', '糙米', '玉米', '小麦', '鸡肉脂肪', '甜菜粕', '天然香料'],
    nutrientInfo: { protein: 30, fat: 15, fiber: 7, moisture: 10 },
    rating: 3.8,
    isAAFCOCompliant: true,
    description: '专为室内猫设计，控制毛球'
  },
  '渴望鸡肉': {
    brand: 'Orijen',
    name: '渴望鸡肉',
    species: 'dog',
    ingredients: ['新鲜鸡肉', '新鲜火鸡肉', '新鲜鸡肝', '新鲜鸡心', '三文鱼', '鸡骨', '南瓜', '胡萝卜', '菠菜'],
    nutrientInfo: { protein: 38, fat: 18, fiber: 3, moisture: 12 },
    rating: 4.9,
    isAAFCOCompliant: true,
    description: '加拿大进口，高肉含量配方'
  },
  '爱肯拿鸭肉梨': {
    brand: 'Acana',
    name: '爱肯拿鸭肉梨',
    species: 'dog',
    ingredients: ['新鲜鸭肉', '新鲜梨', '新鲜南瓜', '豌豆', '扁豆', '鸭肉粉', '三文鱼油', '鸡脂肪'],
    nutrientInfo: { protein: 30, fat: 15, fiber: 5, moisture: 12 },
    rating: 4.7,
    isAAFCOCompliant: true,
    description: '低敏配方，适合敏感肠胃'
  },
  '麦富迪鲜肉倍护': {
    brand: 'Myfoodie',
    name: '麦富迪鲜肉倍护',
    species: 'cat',
    ingredients: ['鲜鸡肉', '鸡肉粉', '三文鱼', '糙米', '玉米', '鸡肉油', '蛋黄粉'],
    nutrientInfo: { protein: 32, fat: 18, fiber: 3, moisture: 10 },
    rating: 4.0,
    isAAFCOCompliant: true,
    description: '国产优质猫粮，鲜肉配方'
  },
  '伯纳天纯无谷': {
    brand: 'Pure&Natural',
    name: '伯纳天纯无谷',
    species: 'dog',
    ingredients: ['鸡肉', '鱼肉', '马铃薯', '红薯', '豌豆', '鸡油', '三文鱼油'],
    nutrientInfo: { protein: 30, fat: 16, fiber: 4, moisture: 10 },
    rating: 4.2,
    isAAFCOCompliant: true,
    description: '无谷物配方，适合敏感体质'
  }
};

class PetFoodAnalysisService {
  private ingredientCache: Record<string, FoodAnalysisResult> = {};

  constructor() {}

  // 模拟OCR识别配料表
  async extractIngredientsFromImage(_imageBase64: string): Promise<string> {
    await this.simulateDelay(MOCK_DELAY);

    const mockIngredients = [
      '鸡肉粉 30%',
      '三文鱼粉 20%',
      '玉米',
      '小麦',
      '鸡油',
      '天然香料',
      '维生素A',
      '维生素D3',
      '牛磺酸',
      'BHT防腐剂'
    ];

    return mockIngredients.join('、');
  }

  // NER提取成分关键词
  extractIngredientKeywords(text: string): Ingredient[] {
    const keywords: Ingredient[] = [];
    const textLower = text.toLowerCase();

    // 提取蛋白质来源
    HIGH_QUALITY_PROTEINS.forEach(protein => {
      if (textLower.includes(protein.toLowerCase())) {
        keywords.push({ name: protein, category: 'protein', isHighQuality: true });
      }
    });

    // 检测风险成分
    Object.entries(RISK_INGREDIENTS).forEach(([category, ingredients]) => {
      ingredients.forEach(ingredient => {
        if (textLower.includes(ingredient.toLowerCase())) {
          keywords.push({
            name: ingredient,
            category: category as 'preservatives' | 'artificialColors' | 'carrageenan' | 'sweeteners' | 'fillers' | 'byProducts',
            isHighQuality: false,
            isRisk: true
          });
        }
      });
    });

    // 提取数字和百分比
    const percentageRegex = /(\d+\.?\d*)%/g;
    let match;
    while ((match = percentageRegex.exec(text)) !== null) {
      keywords.push({
        name: match[0],
        category: 'percentage',
        isHighQuality: false,
        value: parseFloat(match[1])
      });
    }

    return keywords;
  }

  // 分析配料表
  async analyzeIngredients(
    ingredientsText: string,
    petProfile?: { species: 'cat' | 'dog'; allergies?: string[] }
  ): Promise<FoodAnalysisResult> {
    await this.simulateDelay(MOCK_DELAY);

    const keywords = this.extractIngredientKeywords(ingredientsText);
    const warnings: AnalysisWarning[] = [];
    const positivePoints: string[] = [];

    // 分析动物蛋白排名
    const proteinIngredients = keywords.filter(k => k.category === 'protein');
    const hasHighQualityProtein = proteinIngredients.some(p => p.isHighQuality);
    
    if (hasHighQualityProtein && ingredientsText.split('、')[0].includes('鸡肉')) {
      positivePoints.push('主要成分是优质动物蛋白');
    } else if (!hasHighQualityProtein) {
      warnings.push({
        level: 'warning' as RiskLevel,
        title: '蛋白质来源',
        description: '未检测到优质动物蛋白作为主要成分',
        recommendation: '建议选择以鲜肉为主要成分的猫粮'
      });
    }

    // 检测风险成分
    const riskIngredients = keywords.filter(k => k.isRisk);
    riskIngredients.forEach(ingredient => {
      warnings.push({
        level: this.getRiskLevel(ingredient.category),
        title: this.getRiskTitle(ingredient.category),
        description: `检测到${ingredient.name}，这是一种${this.getRiskDescription(ingredient.category)}`,
        recommendation: this.getRiskRecommendation(ingredient.category)
      });
    });

    // 谷物含量评估
    const fillerIngredients = keywords.filter(k => k.category === 'fillers');
    if (fillerIngredients.length >= 2) {
      warnings.push({
        level: 'warning',
        title: '谷物含量偏高',
        description: `检测到${fillerIngredients.map(f => f.name).join('、')}等谷物成分`,
        recommendation: '如果宠物有过敏倾向，建议选择无谷配方'
      });
    }

    // 与宠物档案交叉比对
    if (petProfile?.allergies) {
      petProfile.allergies.forEach(allergy => {
        if (ingredientsText.toLowerCase().includes(allergy.toLowerCase())) {
          warnings.push({
            level: 'danger',
            title: '过敏原警告',
            description: `检测到宠物过敏成分：${allergy}`,
            recommendation: '请避免使用含有此成分的宠粮'
          });
        }
      });
    }

    // 计算综合评分
    const score = this.calculateScore(warnings, positivePoints);

    // 查找相似产品
    const similarProducts = this.findSimilarProducts(keywords, petProfile?.species);

    return {
      id: `analysis-${Date.now()}`,
      ingredientsText,
      extractedIngredients: keywords,
      warnings,
      positivePoints,
      overallScore: score,
      nutrientInfo: this.generateNutrientInfo(score),
      similarProducts,
      createdAt: new Date().toISOString(),
      species: petProfile?.species || 'cat'
    };
  }

  // 搜索宠粮产品
  async searchProducts(query: string, species?: 'cat' | 'dog'): Promise<ProductInfo[]> {
    await this.simulateDelay(300);

    let results = Object.values(petFoodDatabase);
    
    if (species) {
      results = results.filter(p => p.species === species);
    }
    
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(queryLower) || 
        p.brand.toLowerCase().includes(queryLower)
      );
    }

    return results;
  }

  // 获取产品详情
  async getProductDetails(productName: string): Promise<ProductInfo | null> {
    await this.simulateDelay(200);
    return petFoodDatabase[productName] || null;
  }

  // 获取所有产品
  async getAllProducts(species?: 'cat' | 'dog'): Promise<ProductInfo[]> {
    await this.simulateDelay(200);
    
    let results = Object.values(petFoodDatabase);
    if (species) {
      results = results.filter(p => p.species === species);
    }
    
    return results;
  }

  // 分析产品
  async analyzeProduct(productName: string, petProfile?: { species: 'cat' | 'dog'; allergies?: string[] }): Promise<FoodAnalysisResult | null> {
    await this.simulateDelay(MOCK_DELAY);

    const product = petFoodDatabase[productName];
    if (!product) return null;

    const ingredientsText = product.ingredients.join('、');
    return this.analyzeIngredients(ingredientsText, petProfile);
  }

  private getRiskLevel(category: string): RiskLevel {
    const riskMap: Record<string, RiskLevel> = {
      preservatives: 'danger',
      artificialColors: 'danger',
      carrageenan: 'warning',
      sweeteners: 'warning',
      fillers: 'info',
      byProducts: 'info'
    };
    return riskMap[category] || 'info';
  }

  private getRiskTitle(category: string): string {
    const titleMap: Record<string, string> = {
      preservatives: '人工防腐剂',
      artificialColors: '人工色素',
      carrageenan: '卡拉胶',
      sweeteners: '添加糖',
      fillers: '填充物',
      byProducts: '副产品'
    };
    return titleMap[category] || category;
  }

  private getRiskDescription(category: string): string {
    const descMap: Record<string, string> = {
      preservatives: '人工防腐剂，长期摄入可能对健康造成影响',
      artificialColors: '人工色素，可能引起过敏反应',
      carrageenan: '增稠剂，部分研究认为可能引发肠道炎症',
      sweeteners: '添加糖，可能导致肥胖和糖尿病',
      fillers: '廉价填充物，营养价值较低',
      byProducts: '动物副产品，质量参差不齐'
    };
    return descMap[category] || '需要关注的成分';
  }

  private getRiskRecommendation(category: string): string {
    const recMap: Record<string, string> = {
      preservatives: '建议选择使用天然防腐剂如维生素E的产品',
      artificialColors: '建议选择无人工色素的产品',
      carrageenan: '如果宠物有肠胃敏感，建议避免',
      sweeteners: '建议选择低糖或无糖配方',
      fillers: '建议选择以肉类为主要成分的产品',
      byProducts: '建议选择明确标注肉类来源的产品'
    };
    return recMap[category] || '建议关注成分表';
  }

  private calculateScore(warnings: AnalysisWarning[], positivePoints: string[]): number {
    let score = 70;

    // 根据警告扣分
    warnings.forEach(warning => {
      if (warning.level === 'danger') score -= 15;
      else if (warning.level === 'warning') score -= 8;
      else score -= 3;
    });

    // 根据优点加分
    score += positivePoints.length * 5;

    // 限制分数范围
    return Math.max(0, Math.min(100, score));
  }

  private generateNutrientInfo(score: number): NutrientInfo {
    if (score >= 85) {
      return { protein: 38 + Math.random() * 5, fat: 18 + Math.random() * 4, fiber: 3 + Math.random() * 2, moisture: 10 + Math.random() * 3 };
    } else if (score >= 70) {
      return { protein: 32 + Math.random() * 5, fat: 15 + Math.random() * 3, fiber: 4 + Math.random() * 2, moisture: 10 + Math.random() * 2 };
    } else {
      return { protein: 28 + Math.random() * 4, fat: 12 + Math.random() * 3, fiber: 5 + Math.random() * 2, moisture: 11 + Math.random() * 2 };
    }
  }

  private findSimilarProducts(keywords: Ingredient[], species?: 'cat' | 'dog'): ProductInfo[] {
    let results = Object.values(petFoodDatabase);
    
    if (species) {
      results = results.filter(p => p.species === species);
    }

    // 根据蛋白质成分匹配
    const proteinKeywords = keywords.filter(k => k.category === 'protein');
    if (proteinKeywords.length > 0) {
      results = results.filter(p => {
        return proteinKeywords.some(pk => 
          p.ingredients.some(ing => ing.includes(pk.name))
        );
      });
    }

    return results.slice(0, 3);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const petFoodAnalysisService = new PetFoodAnalysisService();