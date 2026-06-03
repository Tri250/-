import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Heart,
  Home,
  Stethoscope,
  Clock,
  FileText
} from 'lucide-react';
import { 
  ConsultationSymptom, 
  ConsultationSymptomCategory, 
  SYMPTOM_CATEGORIES, 
  SymptomAnalysisResult,
  UrgencyLevel 
} from '../../types/ai-consultation';

interface SymptomSelfCheckProps {
  onAnalysisComplete: (result: SymptomAnalysisResult) => void;
  onCancel: () => void;
  onConfirmResult?: (result: SymptomAnalysisResult) => void;
}

export const SymptomSelfCheck: React.FC<SymptomSelfCheckProps> = ({ 
  onAnalysisComplete, 
  onCancel,
  onConfirmResult
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<ConsultationSymptom[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['digestive']);
  const [showResult, setShowResult] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSymptom = (symptom: ConsultationSymptom) => {
    setSelectedSymptoms(prev => {
      const isSelected = prev.some(s => s.id === symptom.id);
      if (isSelected) {
        return prev.filter(s => s.id !== symptom.id);
      }
      return [...prev, symptom];
    });
  };

  const analysisResult = useMemo<SymptomAnalysisResult>(() => {
    if (selectedSymptoms.length === 0) {
      return {
        selectedSymptoms: [],
        severityScore: 0,
        urgencyLevel: 'observe',
        preliminaryDiagnosis: [],
        homeCareAdvice: [],
        warningSigns: [],
        whenToSeeVet: [],
        vetVisitPreparation: [],
      };
    }

    // 计算严重程度分数
    const severityWeights = { low: 1, medium: 2, high: 3 };
    const baseScore = selectedSymptoms.reduce((sum, s) => sum + severityWeights[s.severity], 0);
    const symptomCountBonus = selectedSymptoms.length > 3 ? (selectedSymptoms.length - 3) * 0.5 : 0;
    const severityScore = Math.min(10, baseScore + symptomCountBonus);

    // 确定紧急程度
    let urgencyLevel: UrgencyLevel;
    const hasHighSeverity = selectedSymptoms.some(s => s.severity === 'high');
    const hasMultipleMedium = selectedSymptoms.filter(s => s.severity === 'medium').length >= 2;
    
    if (hasHighSeverity || severityScore >= 7) {
      urgencyLevel = 'emergency';
    } else if (hasMultipleMedium || severityScore >= 4 || selectedSymptoms.length >= 4) {
      urgencyLevel = 'consult';
    } else {
      urgencyLevel = 'observe';
    }

    // 收集可能的诊断
    const allConditions = selectedSymptoms
      .flatMap(s => s.relatedConditions || [])
      .filter((condition, index, self) => self.indexOf(condition) === index);
    const preliminaryDiagnosis = allConditions.slice(0, 5);

    // 生成家庭护理建议
    const homeCareAdvice = generateHomeCareAdvice(selectedSymptoms, urgencyLevel);

    // 生成警告信号
    const warningSigns = generateWarningSigns(selectedSymptoms);

    // 生成就医建议
    const whenToSeeVet = generateWhenToSeeVet(selectedSymptoms, urgencyLevel);

    // 生成就医准备
    const vetVisitPreparation = generateVetVisitPreparation(selectedSymptoms);

    return {
      selectedSymptoms,
      severityScore,
      urgencyLevel,
      preliminaryDiagnosis,
      homeCareAdvice,
      warningSigns,
      whenToSeeVet,
      vetVisitPreparation,
    };
  }, [selectedSymptoms]);

  const handleAnalyze = () => {
    setShowResult(true);
    onAnalysisComplete(analysisResult);
  };

  const getUrgencyConfig = (level: UrgencyLevel) => {
    switch (level) {
      case 'emergency':
        return {
          label: '急诊',
          color: 'text-error-600',
          bgColor: 'bg-error-100',
          borderColor: 'border-error-300',
          icon: AlertTriangle,
          description: '建议立即就医或联系急诊兽医',
        };
      case 'consult':
        return {
          label: '就医',
          color: 'text-warning-600',
          bgColor: 'bg-warning-100',
          borderColor: 'border-warning-300',
          icon: Stethoscope,
          description: '建议尽快预约兽医检查',
        };
      default:
        return {
          label: '观察',
          color: 'text-success-600',
          bgColor: 'bg-success-100',
          borderColor: 'border-success-300',
          icon: Home,
          description: '可以在家观察，注意症状变化',
        };
    }
  };

  if (showResult) {
    const urgencyConfig = getUrgencyConfig(analysisResult.urgencyLevel);
    const UrgencyIcon = urgencyConfig.icon;

    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 max-w-md mx-auto">
        {/* 结果头部 */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto rounded-full ${urgencyConfig.bgColor} flex items-center justify-center mb-3`}>
            <UrgencyIcon className={`w-8 h-8 ${urgencyConfig.color}`} />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-1">症状分析结果</h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${urgencyConfig.bgColor} ${urgencyConfig.borderColor} border`}>
            <span className={`font-medium ${urgencyConfig.color}`}>{urgencyConfig.label}</span>
            <span className="text-sm text-neutral-600">严重程度: {analysisResult.severityScore.toFixed(1)}/10</span>
          </div>
          <p className="text-sm text-neutral-500 mt-2">{urgencyConfig.description}</p>
        </div>

        {/* 已选症状 */}
        <div className="mb-4">
          <h4 className="font-medium text-neutral-700 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            已选症状 ({selectedSymptoms.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map(symptom => (
              <span 
                key={symptom.id}
                className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm"
              >
                {symptom.name}
              </span>
            ))}
          </div>
        </div>

        {/* 可能原因 */}
        {analysisResult.preliminaryDiagnosis.length > 0 && (
          <div className="mb-4 p-3 bg-neutral-50 rounded-xl">
            <h4 className="font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              可能原因
            </h4>
            <ul className="space-y-1">
              {analysisResult.preliminaryDiagnosis.map((diagnosis, index) => (
                <li key={index} className="text-sm text-neutral-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                  {diagnosis}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 家庭护理建议 */}
        {analysisResult.homeCareAdvice.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl">
            <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
              <Home className="w-4 h-4" />
              家庭护理建议
            </h4>
            <ul className="space-y-1.5">
              {analysisResult.homeCareAdvice.map((advice, index) => (
                <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{advice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 需要警惕的信号 */}
        {analysisResult.warningSigns.length > 0 && (
          <div className="mb-4 p-3 bg-warning-50 rounded-xl">
            <h4 className="font-medium text-warning-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              需要警惕的信号
            </h4>
            <ul className="space-y-1.5">
              {analysisResult.warningSigns.map((sign, index) => (
                <li key={index} className="text-sm text-warning-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-warning-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 何时就医 */}
        {analysisResult.whenToSeeVet.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 rounded-xl">
            <h4 className="font-medium text-purple-700 mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              何时就医
            </h4>
            <ul className="space-y-1.5">
              {analysisResult.whenToSeeVet.map((item, index) => (
                <li key={index} className="text-sm text-purple-600 flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 就医准备 */}
        {analysisResult.urgencyLevel !== 'observe' && analysisResult.vetVisitPreparation.length > 0 && (
          <div className="mb-4 p-3 bg-neutral-50 rounded-xl">
            <h4 className="font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              就医准备
            </h4>
            <ul className="space-y-1.5">
              {analysisResult.vetVisitPreparation.map((item, index) => (
                <li key={index} className="text-sm text-neutral-600 flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 免责声明 */}
        <div className="p-3 bg-neutral-100 rounded-xl mb-4">
          <p className="text-xs text-neutral-500 text-center">
            ⚠️ 以上分析仅供参考，不能替代专业兽医诊断。如有疑虑，请及时就医。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowResult(false)}
            className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
          >
            重新选择
          </button>
          <button
            type="button"
            onClick={() => {
              if (onConfirmResult) {
                onConfirmResult(analysisResult);
              } else {
                onCancel();
              }
            }}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg active:scale-95 transition-all"
          >
            完成
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 max-w-md mx-auto">
      {/* 头部 */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-2">
          <Heart className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-semibold text-neutral-800">症状自查</h3>
        <p className="text-sm text-neutral-500">请选择宠物目前出现的症状</p>
      </div>

      {/* 症状分类列表 */}
      <div className="space-y-2 mb-4 max-h-[320px] overflow-y-auto">
        {SYMPTOM_CATEGORIES.map((category: ConsultationSymptomCategory) => {
          const isExpanded = expandedCategories.includes(category.id);
          const selectedInCategory = selectedSymptoms.filter(s => 
            category.symptoms.some(cs => cs.id === s.id)
          );

          return (
            <div key={category.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full px-3 py-2.5 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-neutral-700">{category.name}</span>
                  {selectedInCategory.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-600 rounded text-xs font-medium">
                      {selectedInCategory.length}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </button>

              {isExpanded && (
                <div className="p-2 space-y-1.5">
                  {category.symptoms.map((symptom: ConsultationSymptom) => {
                    const isSelected = selectedSymptoms.some(s => s.id === symptom.id);
                    const severityColors = {
                      low: 'border-neutral-200',
                      medium: 'border-warning-200',
                      high: 'border-error-200',
                    };

                    return (
                      <button
                        key={symptom.id}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all ${
                          isSelected
                            ? 'bg-primary-100 border-2 border-primary-300 text-primary-700'
                            : `bg-white border ${severityColors[symptom.severity]} text-neutral-600 hover:bg-neutral-50`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{symptom.name}</span>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-primary-500" />
                          )}
                        </div>
                        {symptom.relatedConditions && symptom.relatedConditions.length > 0 && (
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">
                            可能: {symptom.relatedConditions.slice(0, 2).join('、')}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 补充说明 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          补充说明（可选）
        </label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="描述其他症状或详细情况..."
          rows={2}
          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
        />
      </div>

      {/* 已选症状统计 */}
      {selectedSymptoms.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-xl">
          <p className="text-sm text-primary-700 font-medium mb-1">
            已选择 {selectedSymptoms.length} 个症状
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedSymptoms.slice(0, 5).map(s => (
              <span key={s.id} className="text-xs px-2 py-0.5 bg-primary-100 text-primary-600 rounded">
                {s.name}
              </span>
            ))}
            {selectedSymptoms.length > 5 && (
              <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-600 rounded">
                +{selectedSymptoms.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={selectedSymptoms.length === 0}
          className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
            selectedSymptoms.length > 0
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg active:scale-95'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          开始分析
        </button>
      </div>
    </div>
  );
};

// 辅助函数：生成家庭护理建议
function generateHomeCareAdvice(symptoms: ConsultationSymptom[], urgencyLevel: UrgencyLevel): string[] {
  const advice: string[] = [];
  
  const hasDigestive = symptoms.some(s => ['vomit', 'diarrhea', 'constipation', 'loss_of_appetite'].includes(s.id));
  const hasRespiratory = symptoms.some(s => ['cough', 'sneeze', 'short_breath'].includes(s.id));
  const hasSkin = symptoms.some(s => ['hair_loss', 'itching', 'dandruff', 'rash'].includes(s.id));
  const hasBehavior = symptoms.some(s => ['lethargy', 'anxiety', 'aggression', 'abnormal_vocal'].includes(s.id));
  const hasUrinary = symptoms.some(s => ['frequent_urination', 'blood_in_urine', 'difficult_urination'].includes(s.id));

  if (urgencyLevel === 'observe') {
    if (hasDigestive) {
      advice.push('暂时禁食4-6小时，之后提供少量易消化的食物');
      advice.push('确保充足的饮水，防止脱水');
    }
    if (hasRespiratory) {
      advice.push('保持环境通风，避免刺激性气味');
      advice.push('观察呼吸频率变化');
    }
    if (hasSkin) {
      advice.push('检查是否有寄生虫，定期驱虫');
      advice.push('保持皮肤清洁干燥');
    }
    if (hasBehavior) {
      advice.push('提供安静舒适的环境');
      advice.push('避免过度刺激，给予充足休息');
    }
    if (hasUrinary) {
      advice.push('鼓励多饮水');
      advice.push('保持猫砂盆清洁（如果是猫）');
    }
    
    if (advice.length === 0) {
      advice.push('密切观察症状变化');
      advice.push('记录症状出现的时间和频率');
    }
  } else if (urgencyLevel === 'consult') {
    advice.push('在就医前保持宠物舒适');
    advice.push('记录症状的详细情况，包括开始时间、频率等');
    advice.push('避免自行用药');
  }

  return advice;
}

// 辅助函数：生成警告信号
function generateWarningSigns(symptoms: ConsultationSymptom[]): string[] {
  const signs: string[] = [];
  
  const hasDigestive = symptoms.some(s => ['vomit', 'diarrhea'].includes(s.id));
  const hasLethargy = symptoms.some(s => s.id === 'lethargy');
  const hasUrinary = symptoms.some(s => ['blood_in_urine', 'difficult_urination'].includes(s.id));

  if (hasDigestive) {
    signs.push('呕吐或腹泻持续超过24小时');
    signs.push('出现血便或血呕吐物');
    signs.push('完全无法进食或饮水');
  }
  if (hasLethargy) {
    signs.push('精神状态持续恶化');
    signs.push('对周围环境完全失去兴趣');
  }
  if (hasUrinary) {
    signs.push('完全无法排尿超过24小时');
    signs.push('排尿时明显疼痛');
  }

  // 通用警告信号
  signs.push('出现新的严重症状');
  signs.push('现有症状明显加重');

  return signs.slice(0, 5);
}

// 辅助函数：生成就医建议
function generateWhenToSeeVet(symptoms: ConsultationSymptom[], urgencyLevel: UrgencyLevel): string[] {
  const suggestions: string[] = [];

  if (urgencyLevel === 'observe') {
    suggestions.push('如果症状持续超过48小时没有改善');
    suggestions.push('如果症状加重或出现新症状');
    suggestions.push('如果宠物出现明显的不适或疼痛');
  } else if (urgencyLevel === 'consult') {
    suggestions.push('建议在24-48小时内预约兽医');
    suggestions.push('如果症状持续或加重，尽快就医');
    
    const hasHighSeverity = symptoms.some(s => s.severity === 'high');
    if (hasHighSeverity) {
      suggestions.unshift('有高严重程度症状，建议优先就医');
    }
  } else {
    suggestions.push('建议立即就医或联系24小时急诊兽医');
    suggestions.push('不要等待症状自行缓解');
  }

  return suggestions;
}

// 辅助函数：生成就医准备
function generateVetVisitPreparation(symptoms: ConsultationSymptom[]): string[] {
  const preparation: string[] = [
    '记录症状开始的时间和变化过程',
    '准备宠物最近的饮食和活动记录',
    '带上宠物的疫苗和医疗记录（如有）',
    '列出所有正在使用的药物或补充剂',
  ];

  const hasDigestive = symptoms.some(s => ['vomit', 'diarrhea'].includes(s.id));
  if (hasDigestive) {
    preparation.push('如有呕吐物或排泄物样本，可拍照带给兽医参考');
  }

  return preparation;
}

export default SymptomSelfCheck;
