import React, { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Smile, Frown, Meh, AlertCircle, Heart, Sparkles } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface ExpressionResult {
  expression: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'sleepy';
  confidence: number;
  details: {
    eyeOpenness: number;
    mouthOpenness: number;
    earPosition: 'up' | 'down' | 'neutral';
    tailPosition?: 'up' | 'down' | 'neutral';
  };
  interpretation: string;
}

interface FaceExpressionAnalyzerProps {
  onAnalyze?: (result: ExpressionResult) => void;
  className?: string;
}

const expressionConfig = {
  happy: { 
    label: '开心', 
    icon: Smile, 
    color: 'bg-green-100 text-green-700',
    description: '毛孩子看起来很开心！'
  },
  sad: { 
    label: '难过', 
    icon: Frown, 
    color: 'bg-blue-100 text-blue-700',
    description: '毛孩子似乎有点低落。'
  },
  angry: { 
    label: '生气', 
    icon: AlertCircle, 
    color: 'bg-red-100 text-red-700',
    description: '毛孩子可能感到不安或生气。'
  },
  surprised: { 
    label: '惊讶', 
    icon: Sparkles, 
    color: 'bg-yellow-100 text-yellow-700',
    description: '毛孩子被什么吸引住了！'
  },
  neutral: { 
    label: '平静', 
    icon: Meh, 
    color: 'bg-gray-100 text-gray-700',
    description: '毛孩子状态平静放松。'
  },
  sleepy: { 
    label: '困倦', 
    icon: Heart, 
    color: 'bg-purple-100 text-purple-700',
    description: '毛孩子有点困了。'
  },
};

// 模拟表情分析
const mockAnalyzeExpression = (imageData: string): Promise<ExpressionResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const expressions: ExpressionResult['expression'][] = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'sleepy'];
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      
      resolve({
        expression: randomExpression,
        confidence: 70 + Math.random() * 25,
        details: {
          eyeOpenness: 30 + Math.random() * 70,
          mouthOpenness: Math.random() * 50,
          earPosition: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'neutral',
        },
        interpretation: expressionConfig[randomExpression].description,
      });
    }, 1500);
  });
};

export const FaceExpressionAnalyzer: React.FC<FaceExpressionAnalyzerProps> = ({
  onAnalyze,
  className = '',
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ExpressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;

    setIsAnalyzing(true);
    try {
      const analysisResult = await mockAnalyzeExpression(image);
      setResult(analysisResult);
      onAnalyze?.(analysisResult);
    } finally {
      setIsAnalyzing(false);
    }
  }, [image, onAnalyze]);

  const handleReset = useCallback(() => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const ExpressionIcon = result ? expressionConfig[result.expression].icon : Smile;

  return (
    <Card className={`p-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-gray-800">表情识别</h3>
      </div>

      {/* 图片预览区 */}
      <div className="relative mb-4">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <Camera className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">点击拍照或选择照片</p>
            <p className="text-xs text-gray-400 mt-1">支持猫咪和狗狗</p>
          </div>
        ) : (
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <img 
              src={image} 
              alt="宠物照片" 
              className="w-full h-full object-cover"
            />
            
            {/* 分析中遮罩 */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                <p className="text-white text-sm">分析中...</p>
              </div>
            )}

            {/* 重拍按钮 */}
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* 分析按钮 */}
      {image && !result && !isAnalyzing && (
        <Button
          variant="primary"
          className="w-full mb-4"
          onClick={handleAnalyze}
          icon={<Sparkles className="w-4 h-4" />}
        >
          开始分析
        </Button>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          {/* 主要表情 */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${expressionConfig[result.expression].color}`}>
              <ExpressionIcon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={expressionConfig[result.expression].color}>
                  {expressionConfig[result.expression].label}
                </Badge>
                <span className="text-sm text-gray-500">
                  置信度 {result.confidence.toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{result.interpretation}</p>
            </div>
          </div>

          {/* 细节指标 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-1">眼睛睁开</p>
              <p className="text-sm font-bold text-gray-800">{result.details.eyeOpenness.toFixed(0)}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-1">嘴巴张开</p>
              <p className="text-sm font-bold text-gray-800">{result.details.mouthOpenness.toFixed(0)}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-1">耳朵</p>
              <p className="text-sm font-bold text-gray-800">
                {result.details.earPosition === 'up' ? '竖起' : 
                 result.details.earPosition === 'down' ? '下垂' : '自然'}
              </p>
            </div>
          </div>

          {/* 建议 */}
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-700">
              <span className="font-medium">💡 建议：</span>
              {result.expression === 'happy' && '继续保持良好的互动！'}
              {result.expression === 'sad' && '多陪伴毛孩子，给它一些关爱。'}
              {result.expression === 'angry' && '给毛孩子一些空间，不要强迫它。'}
              {result.expression === 'surprised' && '看看是什么引起了它的注意！'}
              {result.expression === 'neutral' && '是个训练或玩耍的好时机。'}
              {result.expression === 'sleepy' && '让毛孩子好好休息吧。'}
            </p>
          </div>

          {/* 重新分析 */}
          <Button
            variant="secondary"
            className="w-full mt-4"
            onClick={handleReset}
            icon={<Camera className="w-4 h-4" />}
          >
            分析另一张
          </Button>
        </div>
      )}
    </Card>
  );
};

export default FaceExpressionAnalyzer;
