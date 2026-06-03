import { AdvancedAIEngine } from './aiEngine';
import { generateId, sanitizeInput } from './utils';

interface HealthAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  score: number;
}

interface AnalysisResult {
  healthScore: number;
  alerts: HealthAlert[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

class AdvancedAIEngineService {
  private engine: AdvancedAIEngine;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor() {
    this.engine = new AdvancedAIEngine();
    this.cache = new Map();
  }

  private getCacheKey(petId: string, type: string): string {
    return `${petId}:${type}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async analyzeHealth(petId: string, symptoms: string[]): Promise<AnalysisResult> {
    const cacheKey = this.getCacheKey(petId, 'health');
    const cached = this.getCachedData<AnalysisResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const sanitizedSymptoms = symptoms.map((s) => sanitizeInput(s));
      const analysis = await this.engine.analyzeSymptoms(petId, sanitizedSymptoms);
      
      const result: AnalysisResult = {
        healthScore: analysis.healthScore,
        alerts: analysis.alerts.map((alert) => ({
          ...alert,
          score: alert.score ?? 50,
        })),
        recommendations: analysis.recommendations,
        riskLevel: this.calculateRiskLevel(analysis.healthScore),
        confidence: analysis.confidence,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Health analysis error:', error);
      throw error;
    }
  }

  async predictHealthRisks(petId: string): Promise<HealthAlert[]> {
    const cacheKey = this.getCacheKey(petId, 'risks');
    const cached = this.getCachedData<HealthAlert[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const predictions = await this.engine.predictRisks(petId);
      this.setCache(cacheKey, predictions);
      return predictions;
    } catch (error) {
      console.error('Risk prediction error:', error);
      throw error;
    }
  }

  async generateHealthReport(petId: string): Promise<string> {
    const cacheKey = this.getCacheKey(petId, 'report');
    const cached = this.getCachedData<string>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const report = await this.engine.generateReport(petId);
      this.setCache(cacheKey, report);
      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  async getBehaviorAnalysis(petId: string, timeframe: 'day' | 'week' | 'month'): Promise<any> {
    const cacheKey = this.getCacheKey(petId, `behavior:${timeframe}`);
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const analysis = await this.engine.analyzeBehavior(petId, timeframe);
      this.setCache(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Behavior analysis error:', error);
      throw error;
    }
  }

  async getNutritionRecommendation(petId: string): Promise<string> {
    try {
      return await this.engine.getNutritionAdvice(petId);
    } catch (error) {
      console.error('Nutrition recommendation error:', error);
      throw error;
    }
  }

  private calculateRiskLevel(healthScore: number): 'low' | 'medium' | 'high' {
    if (healthScore >= 80) return 'low';
    if (healthScore >= 60) return 'medium';
    return 'high';
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearPetCache(petId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(petId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }
}

export const advancedAIEngine = new AdvancedAIEngineService();
export type { HealthAlert, AnalysisResult };
