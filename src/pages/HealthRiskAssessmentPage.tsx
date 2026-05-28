import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Clock,
  HeartPulse,
  Shield,
  Scale,
  Footprints,
  Droplets,
  Thermometer,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { healthRiskEngine } from '../services/healthRiskEngine';
import { 
  HealthRiskAssessment as HealthRiskAssessmentType, 
  HealthRiskFactor,
  getStatusColor,
  getStatusForScore
} from '../types/health-risk';

interface HealthRiskAssessmentPageProps {
  onNavigate: (page: string) => void;
}

interface MockPetData {
  petId: string;
  petName: string;
  petType: 'dog' | 'cat';
  age: number;
  currentWeight: number;
  idealWeight: number;
  lastCheckupDate?: string;
  lastVaccineDate?: string;
  vaccineCompliance: number;
  dailyActivity: number;
  nutritionScore: number;
  currentSymptoms: string[];
  bcsScore?: number;
  weightHistory: { date: string; weight: number }[];
}

export const HealthRiskAssessmentPage: React.FC<HealthRiskAssessmentPageProps> = ({ onNavigate }) => {
  const [assessment, setAssessment] = useState<HealthRiskAssessmentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState<HealthRiskFactor | null>(null);

  // 模拟宠物数据
  const mockPetData: MockPetData = {
    petId: 'pet-1',
    petName: '毛球',
    petType: 'dog',
    age: 36, // 3岁
    currentWeight: 12.5,
    idealWeight: 11.0,
    lastCheckupDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastVaccineDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    vaccineCompliance: 85,
    dailyActivity: 45,
    nutritionScore: 78,
    currentSymptoms: [],
    bcsScore: 6,
    weightHistory: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weight: 11.8 + (i / 30) * 0.7
    }))
  };

  useEffect(() => {
    const calculateAssessment = async () => {
      try {
        const result = await healthRiskEngine.calculateHealthRisk(mockPetData);
        setAssessment(result);
      } catch (error) {
        console.error('评估失败:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateAssessment();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'good': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'fair': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'poor': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFactorIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Scale className="w-5 h-5" />;
      case 'vaccine': return <Shield className="w-5 h-5" />;
      case 'activity': return <Footprints className="w-5 h-5" />;
      case 'nutrition': return <Droplets className="w-5 h-5" />;
      case 'symptom': return <Thermometer className="w-5 h-5" />;
      case 'checkup': return <Clock className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-blue-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getRiskText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '低风险';
      case 'moderate': return '中等风险';
      case 'high': return '高风险';
      case 'critical': return '紧急风险';
      default: return '未知风险';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center animate-pulse">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">健康评估中...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">评估失败，请重试</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-emerald-600 text-white rounded-xl"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-emerald-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-800">健康风险评估</h1>
              <p className="text-xs text-neutral-500">{assessment.petName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 总体评分卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden"
        >
          <div className={`bg-gradient-to-r ${getScoreBgColor(assessment.overallScore)} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">综合健康评分</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{assessment.overallScore}</span>
                  <span className="text-lg opacity-80">/100</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(assessment.overallStatus)}
                  <span className="text-sm font-medium">
                    {assessment.overallStatus === 'excellent' ? '优秀' : 
                     assessment.overallStatus === 'good' ? '良好' : 
                     assessment.overallStatus === 'fair' ? '一般' : 
                     assessment.overallStatus === 'poor' ? '较差' : '危险'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">风险等级</div>
                <div className="text-lg font-bold">{getRiskText(assessment.riskLevel)}</div>
              </div>
            </div>
          </div>

          {/* 趋势分析 */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex items-center gap-1 ${assessment.trend.trend === 'improving' ? 'text-emerald-600' : assessment.trend.trend === 'declining' ? 'text-red-600' : 'text-gray-600'}`}>
                {assessment.trend.trend === 'improving' ? <TrendingUp className="w-4 h-4" /> : 
                 assessment.trend.trend === 'declining' ? <TrendingDown className="w-4 h-4" /> : 
                 <Activity className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {assessment.trend.trend === 'improving' ? '健康趋势向好' : 
                   assessment.trend.trend === 'declining' ? '健康趋势下降' : '健康趋势稳定'}
                </span>
              </div>
            </div>

            {/* 迷你趋势图 */}
            <div className="h-24 flex items-end gap-1">
              {assessment.trend.historicalScores.slice(-14).map((data, index) => (
                <div 
                  key={data.date}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${(data.score / 100) * 100}%`,
                    backgroundColor: index === 13 ? getStatusColor(getStatusForScore(data.score)) : '#93c5fd'
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* 预警提醒 */}
        {assessment.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800 mb-2">需要关注</h3>
                <ul className="space-y-1">
                  {assessment.alerts.map((alert, index) => (
                    <li key={index} className="text-sm text-amber-700">• {alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* 健康因子详情 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-800">健康维度分析</h2>
          {assessment.factors.map((factor, index) => (
            <motion.div
              key={factor.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setSelectedFactor(factor);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    factor.status === 'excellent' ? 'bg-emerald-100 text-emerald-600' :
                    factor.status === 'good' ? 'bg-blue-100 text-blue-600' :
                    factor.status === 'fair' ? 'bg-amber-100 text-amber-600' :
                    factor.status === 'poor' ? 'bg-orange-100 text-orange-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {getFactorIcon(factor.type)}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">{factor.name}</p>
                    <p className="text-xs text-neutral-500">{factor.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(factor.score)}`}>
                    {factor.score}
                  </div>
                  <div className="w-16 h-1.5 bg-neutral-200 rounded-full mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        factor.score >= 90 ? 'bg-emerald-500' :
                        factor.score >= 75 ? 'bg-blue-500' :
                        factor.score >= 60 ? 'bg-amber-500' :
                        factor.score >= 40 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 改进建议 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <h3 className="font-semibold text-neutral-800 mb-3">改进建议</h3>
          <ul className="space-y-2">
            {assessment.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm text-neutral-600">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 下次体检 */}
        {assessment.nextCheckupDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">下次体检建议</p>
                <p className="text-xs text-blue-600">
                  {new Date(assessment.nextCheckupDate).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('add-checkup');
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                预约
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 健康因子详情模态框 */}
      <AnimatePresence>
        {selectedFactor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                setSelectedFactor(null);
              }}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">{selectedFactor.name}</h3>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedFactor(null);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(selectedFactor.score)}`}>
                    {selectedFactor.score}
                    <span className="text-2xl text-gray-400">/100</span>
                  </div>
                  <p className="text-gray-500 mt-2">{selectedFactor.description}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-800 mb-2">建议</h4>
                  <p className="text-sm text-gray-600">{selectedFactor.recommendation}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedFactor(null);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-600 text-white rounded-xl font-medium"
                >
                  知道了
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
