import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { foodApi } from '../lib/api';
import { Utensils, AlertCircle, CheckCircle, Search, Camera, TrendingUp, BookOpen } from 'lucide-react';

export default function FoodAnalysis() {
  const { currentPet } = useAppStore();
  const [ingredients, setIngredients] = useState('');
  const [foodName, setFoodName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [nutritionRecommend, setNutritionRecommend] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommend'>('analysis');

  const handleAnalyze = async () => {
    if (!ingredients.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await foodApi.analyze({
        ingredients,
        foodName: foodName || undefined,
        petId: currentPet?.id,
      });
      setAnalysis(response.data.analysis);
      
      const historyResponse = await foodApi.getHistory();
      setHistory(historyResponse.data?.analyses || []);
    } catch (error) {
      console.error('Failed to analyze food:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecommend = async () => {
    setIsAnalyzing(true);
    try {
      const response = await foodApi.recommend({
        petId: currentPet.id,
        age: currentPet.age,
        weight: 5,
        activityLevel: 'normal',
      });
      setNutritionRecommend(response.data);
    } catch (error) {
      console.error('Failed to get recommendation:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">宠物粮分析</h1>
          <p className="text-gray-600">科学分析宠物粮成分，为毛孩子选择最佳饮食</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'analysis'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Utensils className="inline-block w-5 h-5 mr-2" />
            成分分析
          </button>
          <button
            onClick={() => setActiveTab('recommend')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'recommend'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="inline-block w-5 h-5 mr-2" />
            营养推荐
          </button>
        </div>

        {activeTab === 'analysis' ? (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <Search className="w-6 h-6 text-orange-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">分析宠物粮配料表</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">宠物粮名称（可选）</label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="例如：皇家室内成猫粮"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">配料表</label>
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-40 resize-none"
                    placeholder="请输入宠物粮的配料表，例如：鸡肉粉、大米、玉米、植物油、牛骨粉..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    拍照识别
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={!ingredients.trim() || isAnalyzing}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      !ingredients.trim() || isAnalyzing
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                    }`}
                  >
                    {isAnalyzing ? '分析中...' : '开始分析'}
                  </button>
                </div>
              </div>
            </div>

            {analysis && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">分析结果</h2>
                  <div className={`px-4 py-2 rounded-full ${getScoreBg(analysis.nutritionScore)}`}>
                    <span className={`text-xl font-bold ${getScoreColor(analysis.nutritionScore)}`}>
                      {analysis.nutritionScore}分
                    </span>
                  </div>
                </div>

                {analysis.foodName && (
                  <p className="text-gray-600 mb-4">宠物粮：{analysis.foodName}</p>
                )}

                {analysis.warnings && analysis.warnings.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      注意事项
                    </h3>
                    <ul className="space-y-1">
                      {analysis.warnings.map((warning: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-red-400 mr-1">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-green-600 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      推荐建议
                    </h3>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-400 mr-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="w-6 h-6 text-orange-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">分析历史</h2>
              </div>

              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无分析记录</p>
              ) : (
                <div className="space-y-4">
                  {history.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{item.foodName || '未命名'}</p>
                          <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full ${getScoreBg(item.nutritionScore)}`}>
                          <span className={`font-bold ${getScoreColor(item.nutritionScore)}`}>
                            {item.nutritionScore}分
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">个性化营养推荐</h2>
            </div>

            <button
              onClick={handleRecommend}
              disabled={isAnalyzing}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                isAnalyzing
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
              }`}
            >
              {isAnalyzing ? '生成推荐中...' : '生成营养推荐'}
            </button>

            {nutritionRecommend && (
              <div className="mt-6 space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">宠物信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">类型：</span>
                      <span className="text-gray-800">{nutritionRecommend.petType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">品种：</span>
                      <span className="text-gray-800">{nutritionRecommend.breed || '未指定'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">年龄：</span>
                      <span className="text-gray-800">{nutritionRecommend.age}岁</span>
                    </div>
                    <div>
                      <span className="text-gray-500">每日热量：</span>
                      <span className="text-gray-800">{nutritionRecommend.dailyCalories} kcal</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">关键营养需求</h3>
                  <div className="flex flex-wrap gap-2">
                    {nutritionRecommend.keyNutrients?.map((nutrient: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {nutrient}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">喂食建议</h3>
                  <ul className="space-y-1">
                    {nutritionRecommend.feedingTips?.map((tip: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-400 mr-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {nutritionRecommend.warnings && nutritionRecommend.warnings.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-medium text-red-800 mb-2">注意事项</h3>
                    <ul className="space-y-1">
                      {nutritionRecommend.warnings.map((warning: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <AlertCircle className="w-4 h-4 mr-1 text-red-400" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 flex items-start">
          <BookOpen className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">📚 营养知识</p>
            <p className="text-sm text-blue-700">优质宠物粮应遵循AAFCO（美国饲料管理协会）标准，蛋白质含量应在合理范围内，避免过多添加剂和人工色素。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
