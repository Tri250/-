import type { FoodAnalysisResult, NutrientInfo, FoodSafetyRating } from '../types/pet-food';
import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

// 条形码扫描结果
interface BarcodeScanResult {
  barcode: string;
  format: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

// 营养素参考值
const NUTRIENT_REFERENCES: Record<string, { name: string; unit: string; dailyValueDog: number; dailyValueCat: number }> = {
  protein: { name: '蛋白质', unit: 'g', dailyValueDog: 25, dailyValueCat: 30 },
  fat: { name: '脂肪', unit: 'g', dailyValueDog: 14, dailyValueCat: 9 },
  fiber: { name: '纤维', unit: 'g', dailyValueDog: 4, dailyValueCat: 2 },
  moisture: { name: '水分', unit: 'g', dailyValueDog: 0, dailyValueCat: 0 },
  ash: { name: '灰分', unit: 'g', dailyValueDog: 0, dailyValueCat: 0 },
  calcium: { name: '钙', unit: 'mg', dailyValueDog: 500, dailyValueCat: 400 },
  phosphorus: { name: '磷', unit: 'mg', dailyValueDog: 400, dailyValueCat: 350 },
  vitamin_a: { name: '维生素A', unit: 'IU', dailyValueDog: 5000, dailyValueCat: 7500 },
  vitamin_d: { name: '维生素D', unit: 'IU', dailyValueDog: 500, dailyValueCat: 500 },
  vitamin_e: { name: '维生素E', unit: 'IU', dailyValueDog: 30, dailyValueCat: 30 },
  taurine: { name: '牛磺酸', unit: 'mg', dailyValueDog: 0, dailyValueCat: 250 },
  omega3: { name: 'Omega-3', unit: 'mg', dailyValueDog: 150, dailyValueCat: 100 },
  omega6: { name: 'Omega-6', unit: 'mg', dailyValueDog: 2000, dailyValueCat: 1500 },
};

// 有毒食物数据库
const TOXIC_FOODS: Record<string, { name: string; toxicity: 'low' | 'moderate' | 'high' | 'severe'; symptoms: string[]; treatment: string }> = {
  chocolate: { name: '巧克力', toxicity: 'severe', symptoms: ['呕吐', '腹泻', '心跳加速', '震颤', '癫痫', '死亡'], treatment: '立即就医，诱导呕吐' },
  onion: { name: '洋葱', toxicity: 'high', symptoms: ['溶血性贫血', '虚弱', '呼吸急促', '红尿'], treatment: '立即就医，输血可能必要' },
  garlic: { name: '大蒜', toxicity: 'high', symptoms: ['溶血性贫血', '虚弱', '呼吸急促'], treatment: '立即就医' },
  grape: { name: '葡萄/葡萄干', toxicity: 'severe', symptoms: ['肾衰竭', '呕吐', '腹泻', '食欲不振'], treatment: '立即就医，监测肾功能' },
  xylitol: { name: '木糖醇', toxicity: 'severe', symptoms: ['低血糖', '肝衰竭', '呕吐', '癫痫'], treatment: '紧急就医，监测血糖和肝功能' },
  avocado: { name: '牛油果', toxicity: 'moderate', symptoms: ['呕吐', '腹泻', '心肌损伤'], treatment: '就医观察' },
  macadamia: { name: '夏威夷果', toxicity: 'moderate', symptoms: ['虚弱', '呕吐', '发烧', '震颤'], treatment: '就医，通常预后良好' },
  alcohol: { name: '酒精', toxicity: 'severe', symptoms: ['昏迷', '呼吸抑制', '酸中毒', '死亡'], treatment: '紧急就医' },
  caffeine: { name: '咖啡因', toxicity: 'high', symptoms: ['心跳加速', '震颤', '癫痫', '死亡'], treatment: '立即就医' },
  raw_dough: { name: '生面团', toxicity: 'moderate', symptoms: ['腹胀', '酒精中毒', '呼吸困难'], treatment: '就医观察' },
  bones: { name: '煮熟的骨头', toxicity: 'moderate', symptoms: ['消化道穿孔', '梗阻', '出血'], treatment: '立即就医，可能需要手术' },
};

export class PetFoodAnalysisService {
  // ─── 条形码扫描（Capacitor Camera 条码检测） ──────────────

  async scanBarcode(imageData: string): Promise<BarcodeScanResult | null> {
    try {
      // 使用 Capacitor Camera 的条码检测
      const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');

      const result = await BarcodeScanner.readBarcodesFromImage({
        image: imageData,
      });

      if (result.barcodes && result.barcodes.length > 0) {
        const barcode = result.barcodes[0];
        return {
          barcode: barcode.displayValue || barcode.rawValue || '',
          format: barcode.format || 'unknown',
          bounds: barcode.cornerPoints ? {
            x: Math.min(...barcode.cornerPoints.map(p => p.x)),
            y: Math.min(...barcode.cornerPoints.map(p => p.y)),
            width: Math.max(...barcode.cornerPoints.map(p => p.x)) - Math.min(...barcode.cornerPoints.map(p => p.x)),
            height: Math.max(...barcode.cornerPoints.map(p => p.y)) - Math.min(...barcode.cornerPoints.map(p => p.y)),
          } : undefined,
        };
      }
    } catch {
      // Capacitor ML Kit 不可用，尝试使用 Canvas 分析
      return this.localBarcodeDetection(imageData);
    }
    return null;
  }

  private async localBarcodeDetection(_imageData: string): Promise<BarcodeScanResult | null> {
    // 简单的本地条码检测 - 实际项目中需要更复杂的图像处理
    // 这里返回 null 表示无法本地检测，需要用户手动输入
    return null;
  }

  // ─── 食品分析 API ─────────────────────────────────────────

  async analyzeFood(
    imageData: string,
    petId: string,
    petType: 'dog' | 'cat',
    barcode?: string,
  ): Promise<FoodAnalysisResult> {
    const response = await fetch(`${API_BASE_URL}/food/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        petId,
        petType,
        barcode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Food analysis API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as FoodAnalysisResult;

    // 持久化到 databaseService
    await databaseService.put(STORE_NAMES.PET_FOOD_ANALYSES, {
      ...result,
      petId,
      source: 'food_analysis',
    });

    return result;
  }

  // ─── 营养数据库查询 ───────────────────────────────────────

  async queryFoodDatabase(
    query: string,
    petType?: 'dog' | 'cat',
  ): Promise<Array<{ name: string; brand?: string; barcode?: string; nutrients: NutrientInfo }>> {
    const params = new URLSearchParams({ q: query });
    if (petType) params.set('petType', petType);

    const response = await fetch(`${API_BASE_URL}/food/database?${params}`);

    if (!response.ok) {
      throw new Error(`Food database API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ─── 有毒食物检测 ─────────────────────────────────────────

  checkToxicIngredients(ingredients: string[]): {
    toxicItems: Array<{ name: string; toxicity: string; symptoms: string[]; treatment: string }>;
    isSafe: boolean;
    highestToxicity: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  } {
    const toxicItems: Array<{ name: string; toxicity: string; symptoms: string[]; treatment: string }> = [];
    let highestToxicity: 'none' | 'low' | 'moderate' | 'high' | 'severe' = 'none';
    const toxicityOrder: Array<'low' | 'moderate' | 'high' | 'severe'> = ['low', 'moderate', 'high', 'severe'];

    const ingredientsLower = ingredients.map(i => i.toLowerCase());

    for (const [key, toxicFood] of Object.entries(TOXIC_FOODS)) {
      const keywords = [key, toxicFood.name, ...toxicFood.name.split('/')];
      const found = keywords.some(kw => ingredientsLower.some(i => i.includes(kw.toLowerCase())));

      if (found) {
        toxicItems.push(toxicFood);
        const currentIdx = toxicityOrder.indexOf(toxicFood.toxicity);
        const highestIdx = toxicityOrder.indexOf(highestToxicity);
        if (currentIdx > highestIdx) {
          highestToxicity = toxicFood.toxicity;
        }
      }
    }

    return {
      toxicItems,
      isSafe: toxicItems.length === 0,
      highestToxicity: highestToxicity === 'none' ? 'none' : highestToxicity,
    };
  }

  // ─── 营养评估 ─────────────────────────────────────────────

  evaluateNutrition(
    nutrients: NutrientInfo,
    petType: 'dog' | 'cat',
    petAge?: number,
    petWeight?: number,
  ): {
    score: number;
    assessment: string;
    deficiencies: string[];
    excesses: string[];
    recommendations: string[];
  } {
    const deficiencies: string[] = [];
    const excesses: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    for (const [key, ref] of Object.entries(NUTRIENT_REFERENCES)) {
      const value = nutrients[key as keyof NutrientInfo];
      if (value === undefined || value === null) continue;

      const dailyValue = petType === 'cat' ? ref.dailyValueCat : ref.dailyValueDog;
      if (dailyValue === 0) continue;

      const ratio = (value as number) / dailyValue;

      if (ratio < 0.7) {
        deficiencies.push(`${ref.name}含量不足（${value}${ref.unit}，建议${dailyValue}${ref.unit}）`);
        score -= 10;
        recommendations.push(`增加${ref.name}摄入，建议每日${dailyValue}${ref.unit}以上`);
      } else if (ratio > 2.0) {
        excesses.push(`${ref.name}含量过高（${value}${ref.unit}，建议不超过${dailyValue * 2}${ref.unit}）`);
        score -= 8;
        recommendations.push(`减少${ref.name}摄入，避免过量`);
      }
    }

    // 特殊检查
    if (petType === 'cat') {
      const taurine = nutrients.taurine;
      if (taurine !== undefined && taurine < 200) {
        deficiencies.push('牛磺酸含量不足（猫必需，建议250mg以上）');
        score -= 15;
        recommendations.push('猫咪必须摄入充足的牛磺酸，建议选择含牛磺酸的猫粮');
      }
    }

    if (petWeight && petAge) {
      const isSenior = petAge > (petType === 'cat' ? 10 : 7);
      if (isSenior && nutrients.protein && nutrients.protein < 20) {
        recommendations.push('老年宠物建议适当增加优质蛋白质摄入');
      }
      const isPuppy = petAge < 1;
      if (isPuppy && nutrients.protein && nutrients.protein < 25) {
        deficiencies.push('幼宠需要更高蛋白质含量');
        score -= 10;
        recommendations.push('幼宠建议蛋白质含量25%以上');
      }
    }

    let assessment = '';
    if (score >= 90) assessment = '营养均衡，品质优良';
    else if (score >= 75) assessment = '营养基本均衡，部分指标需关注';
    else if (score >= 60) assessment = '营养不够均衡，建议调整饮食';
    else assessment = '营养严重不均衡，建议更换食品';

    return {
      score: Math.max(0, Math.min(100, score)),
      assessment,
      deficiencies,
      excesses,
      recommendations,
    };
  }

  // ─── 安全评级 ──────────────────────────────────────────────

  rateFoodSafety(
    ingredients: string[],
    nutrients: NutrientInfo,
    petType: 'dog' | 'cat',
  ): FoodSafetyRating {
    const toxicCheck = this.checkToxicIngredients(ingredients);

    let safetyScore = 100;

    // 有毒成分扣分
    if (toxicCheck.highestToxicity === 'severe') safetyScore -= 80;
    else if (toxicCheck.highestToxicity === 'high') safetyScore -= 50;
    else if (toxicCheck.highestToxicity === 'moderate') safetyScore -= 30;
    else if (toxicCheck.highestToxicity === 'low') safetyScore -= 10;

    // 添加剂扣分
    const artificialPreservatives = ['BHA', 'BHT', '乙氧基喹啉', '亚硝酸钠'];
    const artificialColors = ['红色40号', '黄色5号', '黄色6号', '蓝色2号'];
    const ingredientsStr = ingredients.join(' ');

    for (const preservative of artificialPreservatives) {
      if (ingredientsStr.includes(preservative)) safetyScore -= 5;
    }
    for (const color of artificialColors) {
      if (ingredientsStr.includes(color)) safetyScore -= 3;
    }

    safetyScore = Math.max(0, Math.min(100, safetyScore));

    let rating: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
    if (safetyScore >= 90) rating = 'excellent';
    else if (safetyScore >= 75) rating = 'good';
    else if (safetyScore >= 60) rating = 'fair';
    else if (safetyScore >= 40) rating = 'poor';
    else rating = 'dangerous';

    return {
      rating,
      score: safetyScore,
      toxicIngredients: toxicCheck.toxicItems.map(t => t.name),
      warnings: toxicCheck.toxicItems.map(t => `${t.name}：${t.symptoms.join('、')}`),
    };
  }

  // ─── 条码扫描 + 分析组合 ──────────────────────────────────

  async scanAndAnalyze(
    imageData: string,
    petId: string,
    petType: 'dog' | 'cat',
  ): Promise<FoodAnalysisResult> {
    // 先尝试扫描条形码
    const barcode = await this.scanBarcode(imageData);

    // 如果有条形码，先查询数据库
    if (barcode?.barcode) {
      try {
        const dbResults = await this.queryFoodDatabase(barcode.barcode, petType);
        if (dbResults.length > 0) {
          // 数据库有记录，用数据库数据 + 图片分析
          const result = await this.analyzeFood(imageData, petId, petType, barcode.barcode);
          return result;
        }
      } catch {
        // 数据库查询失败，继续走图片分析
      }
    }

    // 直接走图片分析
    return this.analyzeFood(imageData, petId, petType, barcode?.barcode);
  }

  // ─── 历史记录 ──────────────────────────────────────────────

  async getAnalysisHistory(petId: string, limit: number = 20): Promise<FoodAnalysisResult[]> {
    try {
      const records = await databaseService.getByIndex<FoodAnalysisResult & { petId: string; source: string }>(
        STORE_NAMES.PET_FOOD_ANALYSES,
        'petId',
        petId,
      );
      return records
        .filter(r => r.source === 'food_analysis')
        .sort((a, b) => new Date(b.analyzedAt || '').getTime() - new Date(a.analyzedAt || '').getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  // ─── 获取有毒食物列表 ─────────────────────────────────────

  getToxicFoodList(): Array<{ key: string; name: string; toxicity: string; symptoms: string[] }> {
    return Object.entries(TOXIC_FOODS).map(([key, food]) => ({
      key,
      name: food.name,
      toxicity: food.toxicity,
      symptoms: food.symptoms,
    }));
  }

  // ─── 获取营养素参考值 ─────────────────────────────────────

  getNutrientReferences(petType: 'dog' | 'cat'): Record<string, { name: string; unit: string; dailyValue: number }> {
    const result: Record<string, { name: string; unit: string; dailyValue: number }> = {};
    for (const [key, ref] of Object.entries(NUTRIENT_REFERENCES)) {
      result[key] = {
        name: ref.name,
        unit: ref.unit,
        dailyValue: petType === 'cat' ? ref.dailyValueCat : ref.dailyValueDog,
      };
    }
    return result;
  }
}

export const petFoodAnalysisService = new PetFoodAnalysisService();
