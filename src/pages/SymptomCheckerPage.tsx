import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Phone,
  Home,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { symptomCheckerService } from '../services/symptomCheckerService';
import { 
  SymptomNode, 
  SymptomSession, 
  SymptomResult,
  SYMPTOM_TREE_DATA 
} from '../types/symptom-checker';
import { HealthManual } from '../types/health-manual';

interface SymptomCheckerPageProps {
  onNavigate: (page: string) => void;
}

export const SymptomCheckerPage: React.FC<SymptomCheckerPageProps> = ({ onNavigate }) => {
  const [session, setSession] = useState<SymptomSession | null>(null);
  const [currentNode, setCurrentNode] = useState<SymptomNode | null>(null);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const newSession = symptomCheckerService.startSession('pet-1', 'dog');
    setSession(newSession);
    const node = symptomCheckerService.getCurrentNode(newSession.id);
    setCurrentNode(node);
    setLoading(false);
  }, []);

  const handleSelectOption = (optionId: string) => {
    if (!session) return;

    const result = symptomCheckerService.selectOption(session.id, optionId);
    setCurrentNode(result.node);
    if (result.completed && result.result) {
      setResult(result.result);
    }
  };

  const handleGoBack = () => {
    if (!session) return;

    const node = symptomCheckerService.goBack(session.id);
    setCurrentNode(node);
    setResult(null);
  };

  const handleReset = () => {
    if (!session) return;

    const node = symptomCheckerService.resetSession(session.id);
    setCurrentNode(node);
    setResult(null);
  };

  const handleAskAI = () => {
    onNavigate('ai-consultant');
  };

  const handleViewManual = () => {
    onNavigate('health-manuals');
  };

  const handleEmergency = () => {
    alert('建议立即联系宠物医院！');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-emerald-600';
      case 'moderate': return 'text-blue-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-emerald-100';
      case 'moderate': return 'bg-blue-100';
      case 'high': return 'bg-orange-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="w-8 h-8 text-emerald-600" />;
      case 'moderate': return <Activity className="w-8 h-8 text-blue-600" />;
      case 'high': return <AlertTriangle className="w-8 h-8 text-orange-600" />;
      case 'critical': return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default: return <Activity className="w-8 h-8 text-gray-600" />;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'low': return '轻微';
      case 'moderate': return '中等';
      case 'high': return '严重';
      case 'critical': return '紧急';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-800">症状自查</h1>
              <p className="text-xs text-neutral-500">宠物健康助手</p>
            </div>
          </div>
          {!result && session && session.history.length > 0 && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                handleReset();
              }}
              className="ml-auto p-2 rounded-full hover:bg-neutral-100"
            >
              <RefreshCw className="w-5 h-5 text-neutral-600" />
            </button>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 进度指示器 */}
        {session && session.history.length > 0 && !result && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Home className="w-4 h-4" />
              <span>问题 {session.history.length}/5</span>
            </div>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
              <div 
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  i < session.history.length 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
            </div>
          </div>
        )}

        {/* 历史记录 */}
        {session && session.history.length > 0 && (
          <div className="mb-6 space-y-3">
            {session.history.map((item, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-2">Q: {item.question}</p>
              <p className="text-sm font-medium text-gray-800">A: {item.answer}</p>
            </div>
          ))}
          </div>
        )}

        {/* 结果展示 */}
        <AnimatePresence>
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 结果标题 */}
              <div className={`${getSeverityBgColor(result.severity)} rounded-2xl p-6 text-center`}>
                <div className="flex justify-center mb-4">
                  {getSeverityIcon(result.severity)}
                </div>
                <h2 className={`text-2xl font-bold ${getSeverityColor(result.severity)} mb-2`}>
                  {result.title}
                </h2>
                <p className={`text-sm ${getSeverityColor(result.severity)}`}>
                  严重程度: {getSeverityText(result.severity)}
                </p>
              </div>

              {/* 描述 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-medium text-gray-800 mb-2">分析结果</h3>
                <p className="text-sm text-gray-600">{result.description}</p>
              </div>

              {/* 可能的情况 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-medium text-gray-800 mb-3">可能的情况</h3>
                <div className="flex flex-wrap gap-2">
                  {result.possibleConditions.map((condition, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>

              {/* 建议 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-medium text-gray-800 mb-3">建议措施</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 紧急提示 */}
              {result.emergency && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">紧急提示</h4>
                      <p className="text-sm text-red-700">
                        建议立即带宠物就医！
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="space-y-3">
                {result.askDoctor && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAskAI();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    咨询 AI 医生
                  </button>
                )}

                {result.emergency && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleEmergency();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    紧急联系医院
                  </button>
                )}

                {result.relatedManualIds && result.relatedManualIds.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewManual();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    查看相关手册
                  </button>
                  )}

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleReset();
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  重新自查
                </button>
              </div>
            </motion.div>
          ) : (
            /* 问题界面 */
            currentNode && (
              <motion.div
                key="question"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{currentNode.question}</h2>
                  {currentNode.description && (
                    <p className="text-sm text-gray-500">{currentNode.description}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {currentNode.options?.map((option) => (
                  <button
                    key={option.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectOption(option.id);
                    }}
                    className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <span className="font-medium text-gray-800">{option.label}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
                </div>

                {session && session.history.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleGoBack();
                    }}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    返回上一步
                  </button>
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
