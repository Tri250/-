// ============================================
// PawSync Pro 3.0 - Pet Food Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 宠粮成分分析类型定义
// ============================================

// 风险等级
export type RiskLevel = 'danger' | 'warning' | 'info';

// 成分类别
export type IngredientCategory = 
  | 'protein' 
  | 'preservatives' 
  | 'artificialColors' 
  | 'carrageenan' 
  | 'sweeteners' 
  | 'fillers' 
  | 'byProducts' 
  | 'percentage';

// 成分信息
export interface Ingredient {
  name: string;
  category: IngredientCategory;
  isHighQuality?: boolean;
  isRisk?: boolean;
  value?: number;
}

// 营养成分信息
export interface NutrientInfo {
  protein: number;  // 蛋白质百分比
  fat: number;      // 脂肪百分比
  fiber: number;    // 纤维百分比
  moisture: number; // 水分百分比
}

// 分析警告
export interface AnalysisWarning {
  level: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
}

// 产品信息
export interface ProductInfo {
  brand: string;
  name: string;
  species: 'cat' | 'dog';
  ingredients: string[];
  nutrientInfo: NutrientInfo;
  rating: number;
  isAAFCOCompliant: boolean;
  description: string;
}

// 分析结果
export interface FoodAnalysisResult {
  id: string;
  ingredientsText: string;
  extractedIngredients: Ingredient[];
  warnings: AnalysisWarning[];
  positivePoints: string[];
  overallScore: number;
  nutrientInfo: NutrientInfo;
  similarProducts: ProductInfo[];
  createdAt: string;
  species: 'cat' | 'dog';
}

// 搜索结果
export interface SearchResult {
  products: ProductInfo[];
  total: number;
  page: number;
  limit: number;
}

// 成分类别信息
export interface IngredientCategoryInfo {
  category: IngredientCategory;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  examples: string[];
}