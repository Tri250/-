// ============================================
// PawSync Pro 3.0 - Voice Analysis Result Card
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 声音分析结果展示组件
// 显示意图识别结果、可解释性特征、行为建议
// ============================================

import React, { useState } from 'react';
import {
  Clock,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  Volume2,
  Timer,
  Music,
  TrendingUp,
  Users,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import type {
  VoiceAnalysisResult,
  IntentionResult,
  ExplainableAudioFeatures,
  PetIntention,
} from '../../types/voice-analysis';
import { INTENTION_CONFIGS } from '../../types/voice-analysis';

// ==================== 类型定义 ====================

interface VoiceAnalysisResultCardProps {
  /** 声音分析结果 */
  analysisResult: VoiceAnalysisResult;
  /** 意图识别结果（可选） */
  intentionResult?: IntentionResult;
  /** 分享回调 */
  onShare?: () => void;
  /** 重试回调 */
  onRetry?: () => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否默认展开详情 */
  defaultExpanded?: boolean;
}

// ==================== 子组件 ====================

/**
 * 意图徽章组件
 */
function IntentionBadge({ intention, confidence }: { intention: PetIntention; confidence: number }) {
  const config = INTENTION_CONFIGS[intention];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor}`}>
      <span className="text-2xl">{config.icon}</span>
      <div className="flex flex-col">
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
        <span className="text-xs text-gray-500">
          置信度: {(confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

/**
 * 特征展示组件
 */
function FeatureDisplay({ features }: { features: ExplainableAudioFeatures }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 音高特征 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700">音高</span>
        </div>
        <div className="text-lg font-bold text-blue-600">
          {features.pitch.mean.toFixed(0)} Hz
        </div>
        <div className="text-xs text-blue-500 mt-1">
          {features.pitch.explanation}
        </div>
      </div>

      {/* 能量特征 */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">能量</span>
        </div>
        <div className="text-lg font-bold text-orange-600">
          {features.energy.mean.toFixed(0)}%
        </div>
        <div className="text-xs text-orange-500 mt-1">
          {features.energy.explanation}
        </div>
      </div>

      {/* 持续时间 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Timer className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-700">时长</span>
        </div>
        <div className="text-lg font-bold text-green-600">
          {features.duration.total.toFixed(1)} 秒
        </div>
        <div className="text-xs text-green-500 mt-1">
          {features.duration.explanation}
        </div>
      </div>

      {/* 节奏特征 */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Music className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-700">节奏</span>
        </div>
        <div className="text-lg font-bold text-purple-600">
          {features.rhythm.pattern === 'steady' ? '稳定' :
           features.rhythm.pattern === 'accelerating' ? '加快' :
           features.rhythm.pattern === 'decelerating' ? '放缓' : '不规则'}
        </div>
        <div className="text-xs text-purple-500 mt-1">
          {features.rhythm.explanation}
        </div>
      </div>
    </div>
  );
}

/**
 * 意图分布图表组件
 */
function IntentionDistributionChart({ distribution }: { distribution: Record<PetIntention, number> }) {
  const sortedIntentions = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-2">
      {sortedIntentions.map(([intention, probability]) => {
        const config = INTENTION_CONFIGS[intention as PetIntention];
        const percentage = (probability * 100).toFixed(0);

        return (
          <div key={intention} className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{config.label}</span>
                <span className="text-sm font-medium text-gray-700">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${config.gradient}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 行为建议组件
 */
function SuggestionsList({ suggestions }: { suggestions: string[] }) {
  return (
    <div className="space-y-2">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="flex items-start gap-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg"
        >
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
          <span className="text-sm text-gray-700">{suggestion}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 社区统计组件
 */
function CommunityStats({ stats }: {
  stats: {
    similarCases: number;
    commonFollowUp: string;
    averageDuration: number;
  }
}) {
  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-teal-500" />
        <span className="text-sm font-medium text-teal-700">社区数据</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-teal-600">{stats.similarCases}</div>
          <div className="text-xs text-teal-500">相似案例</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-teal-600">{stats.commonFollowUp}</div>
          <div className="text-xs text-teal-500">常见后续</div>
        </div>
        <div>
          <div className="text-lg font-bold text-teal-600">{stats.averageDuration.toFixed(1)}s</div>
          <div className="text-xs text-teal-500">平均时长</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 推理过程展示组件
 */
function ReasoningList({ reasoning }: { reasoning: string[] }) {
  return (
    <div className="space-y-1">
      {reasoning.map((reason, index) => (
        <div key={index} className="flex items-start gap-2">
          <TrendingUp className="w-3 h-3 text-gray-400 mt-1" />
          <span className="text-xs text-gray-600">{reason}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * 声音分析结果展示组件
 */
export function VoiceAnalysisResultCard({
  analysisResult,
  intentionResult,
  onShare,
  onRetry,
  showActions = true,
  defaultExpanded = false,
}: VoiceAnalysisResultCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const config = INTENTION_CONFIGS[analysisResult.primaryIntention];
  const confidencePercentage = (analysisResult.confidence * 100).toFixed(0);

  // 置信度等级颜色
  const confidenceLevelColor = {
    high: 'text-green-500',
    medium: 'text-yellow-500',
    low: 'text-red-500',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      {/* 头部区域 */}
      <div className="p-5 bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <IntentionBadge
            intention={analysisResult.primaryIntention}
            confidence={analysisResult.confidence}
          />
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              analysisResult.confidenceLevel === 'high' ? 'bg-green-50' :
              analysisResult.confidenceLevel === 'medium' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <AlertCircle className={`w-3 h-3 ${confidenceLevelColor[analysisResult.confidenceLevel]}`} />
              <span className={`text-xs font-medium ${confidenceLevelColor[analysisResult.confidenceLevel]}`}>
                {analysisResult.confidenceLevel === 'high' ? '高置信度' :
                 analysisResult.confidenceLevel === 'medium' ? '中等置信度' : '低置信度'}
              </span>
            </div>
          </div>
        </div>

        {/* 意图描述 */}
        <div className="relative bg-gradient-to-br from-orange-50 to-peach-50 rounded-xl p-4 mb-4">
          <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-orange-50" />
          <p className="text-gray-700 text-center leading-relaxed font-medium">
            "{config.description}"
          </p>
        </div>

        {/* 时间和来源信息 */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(analysisResult.timestamp).toLocaleString('zh-CN')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              {analysisResult.inferenceMode === 'backend' ? '🤖 AI 模型' : '📊 本地分析'}
            </span>
            <span className="text-gray-500">
              耗时 {analysisResult.processingTime}ms
            </span>
          </div>
        </div>
      </div>

      {/* 可解释性特征 */}
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">音频特征分析</h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>收起详情</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>展开详情</span>
              </>
            )}
          </button>
        </div>
        <FeatureDisplay features={analysisResult.features} />
      </div>

      {/* 展开的详细信息 */}
      {expanded && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 animate-slideDown">
          {/* 意图分布 */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">意图分布</h4>
            <IntentionDistributionChart distribution={analysisResult.intentionDistribution} />
          </div>

          {/* 推理过程 */}
          {analysisResult.reasoning.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">推理过程</h4>
              <ReasoningList reasoning={analysisResult.reasoning} />
            </div>
          )}

          {/* 行为指标 */}
          {analysisResult.behaviorIndicators.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">行为指标</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.behaviorIndicators.map((indicator, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200"
                  >
                    {indicator}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 行为建议 */}
      {intentionResult && intentionResult.suggestions.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            <Lightbulb className="w-4 h-4 inline mr-1 text-yellow-500" />
            行为建议
          </h3>
          <SuggestionsList suggestions={intentionResult.suggestions} />
        </div>
      )}

      {/* 社区统计 */}
      {intentionResult?.communityStats && (
        <div className="px-5 py-4 border-t border-gray-100">
          <CommunityStats stats={intentionResult.communityStats} />
        </div>
      )}

      {/* 操作按钮 */}
      {showActions && (
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <div className="flex justify-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">再录一次</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">分享结果</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {!analysisResult.success && analysisResult.error && (
        <div className="px-5 py-3 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">{analysisResult.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 简化版本组件 ====================

/**
 * 简化版声音分析结果卡片
 * 用于列表展示
 */
export function VoiceAnalysisResultCardCompact({
  analysisResult,
  onClick,
}: {
  analysisResult: VoiceAnalysisResult;
  onClick?: () => void;
}) {
  const config = INTENTION_CONFIGS[analysisResult.primaryIntention];

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
            <span className="text-xl">{config.icon}</span>
          </div>
          <div>
            <div className={`font-semibold ${config.color}`}>{config.label}</div>
            <div className="text-xs text-gray-500">
              {(analysisResult.confidence * 100).toFixed(0)}% 置信度
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {new Date(analysisResult.timestamp).toLocaleTimeString('zh-CN')}
        </div>
      </div>

      {/* 简化的特征展示 */}
      <div className="mt-3 flex gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
          <Volume2 className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-blue-600">
            {analysisResult.features.pitch.mean.toFixed(0)}Hz
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg">
          <Activity className="w-3 h-3 text-orange-400" />
          <span className="text-xs text-orange-600">
            {analysisResult.features.energy.mean.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
          <Timer className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-600">
            {analysisResult.features.duration.total.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
}

export default VoiceAnalysisResultCard;