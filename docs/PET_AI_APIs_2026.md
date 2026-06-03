# 宠物 AI API 文档 2026

## 目录

1. [可用宠物 AI API（2026）](#1-可用宠物-ai-api2026)
2. [集成场景](#2-集成场景)
3. [最佳实践](#3-最佳实践)
4. [竞争优势](#4-竞争优势)

---

## 1. 可用宠物 AI API（2026）

### 1.1 语音/声音识别 API

#### 1.1.1 宠物音频分析 API

| API 名称 | 提供商 | 功能描述 | 端点 | 认证方式 |
|---------|--------|---------|------|---------|
| PetAudio Analyze | PetAI Inc. | 实时宠物声音分析，支持多种宠物类型 | `POST /v1/audio/analyze` | Bearer Token |
| SoundPattern API | AnimalTech | 声音模式识别与分类 | `POST /v2/sound/pattern` | API Key |
| VocalEmotion API | PetSense | 声音情绪检测 | `POST /v1/vocal/emotion` | OAuth 2.0 |

**请求参数示例：**

```json
{
  "audio_url": "https://example.com/pet-audio.wav",
  "pet_type": "dog",
  "sample_rate": 44100,
  "duration_ms": 5000,
  "language": "zh-CN"
}
```

**响应示例：**

```json
{
  "request_id": "req_abc123",
  "pet_detected": true,
  "pet_type": "dog",
  "confidence": 0.95,
  "sound_type": "bark",
  "emotion": {
    "primary": "excited",
    "secondary": "happy",
    "confidence": 0.87
  },
  "metadata": {
    "processing_time_ms": 234,
    "model_version": "v3.2.1"
  }
}
```

#### 1.1.2 吠叫/喵叫分类服务

| 分类类型 | 支持宠物 | 分类数量 | 准确率 |
|---------|---------|---------|--------|
| 吠叫分类 | 犬类 | 12 种 | 94.5% |
| 喵叫分类 | 猫类 | 8 种 | 91.2% |
| 鸟鸣分类 | 鸟类 | 15 种 | 88.7% |
| 啮齿类声音 | 仓鼠/兔子 | 6 种 | 85.3% |

**犬类吠叫分类类型：**

- `alert_bark` - 警戒吠叫
- `playful_bark` - 玩耍吠叫
- `anxious_bark` - 焦虑吠叫
- `territorial_bark` - 领地吠叫
- `attention_bark` - 求关注吠叫
- `greeting_bark` - 问候吠叫
- `warning_bark` - 警告吠叫
- `lonely_bark` - 孤独吠叫
- `excited_bark` - 兴奋吠叫
- `fearful_bark` - 恐惧吠叫
- `pain_bark` - 疼痛吠叫
- `unknown_bark` - 未知类型

#### 1.1.3 声音情绪检测

**支持的情绪类型：**

| 情绪类别 | 情绪标签 | 描述 |
|---------|---------|------|
| 正面情绪 | happy, excited, content, relaxed | 开心、兴奋、满足、放松 |
| 负面情绪 | anxious, fearful, angry, sad | 焦虑、恐惧、愤怒、悲伤 |
| 中性情绪 | neutral, curious, alert | 中性、好奇、警觉 |
| 特殊状态 | pain, hungry, lonely | 疼痛、饥饿、孤独 |

---

### 1.2 图像/视频分析 API

#### 1.2.1 宠物面部检测 API

| API 名称 | 提供商 | 功能描述 | 端点 |
|---------|--------|---------|------|
| PetFace Detect | PetVision | 宠物面部检测与定位 | `POST /v1/face/detect` |
| PetFace Recognize | PetVision | 宠物面部识别（个体识别） | `POST /v1/face/recognize` |
| MultiPet Detect | AnimalAI | 多宠物同时检测 | `POST /v1/multi/detect` |

**请求参数：**

```json
{
  "image_url": "https://example.com/pet-photo.jpg",
  "detection_mode": "accurate",
  "return_landmarks": true,
  "return_attributes": true,
  "max_pets": 5
}
```

**响应示例：**

```json
{
  "request_id": "req_xyz789",
  "pets_detected": 2,
  "pets": [
    {
      "pet_id": "pet_001",
      "type": "dog",
      "breed": "Golden Retriever",
      "breed_confidence": 0.92,
      "bounding_box": {
        "x": 120,
        "y": 85,
        "width": 280,
        "height": 320
      },
      "landmarks": {
        "left_eye": {"x": 180, "y": 150},
        "right_eye": {"x": 280, "y": 148},
        "nose": {"x": 230, "y": 200},
        "mouth": {"x": 225, "y": 260}
      },
      "attributes": {
        "age_estimate": "2-3 years",
        "gender": "male",
        "color": "golden"
      }
    }
  ]
}
```

#### 1.2.2 图像情绪识别

**可识别情绪及对应行为指标：**

| 情绪 | 面部特征 | 身体语言 | 置信度范围 |
|-----|---------|---------|-----------|
| 快乐 | 嘴巴微张、眼睛明亮 | 尾巴摇摆、身体放松 | 0.85-0.98 |
| 焦虑 | 眼睛放大、耳朵后压 | 身体紧绷、尾巴夹紧 | 0.78-0.95 |
| 愤怒 | 牙齿外露、眼神锐利 | 身体僵硬、毛发竖起 | 0.82-0.96 |
| 恐惧 | 瞳孔放大、耳朵下垂 | 躲藏姿态、颤抖 | 0.75-0.92 |
| 放松 | 眼睛半闭、嘴巴放松 | 躺卧姿态、呼吸平稳 | 0.88-0.97 |
| 好奇 | 眼睛专注、耳朵前倾 | 头部倾斜、探索姿态 | 0.80-0.94 |

#### 1.2.3 品种识别服务

**支持的宠物类型及品种数量：**

| 宠物类型 | 品种数量 | Top-1 准确率 | Top-5 准确率 |
|---------|---------|-------------|-------------|
| 犬类 | 380+ | 89.2% | 97.5% |
| 猫类 | 70+ | 85.7% | 95.3% |
| 鸟类 | 200+ | 78.4% | 91.2% |
| 兔类 | 50+ | 82.1% | 93.8% |

**品种识别响应字段：**

```json
{
  "breed_predictions": [
    {
      "breed_name": "Golden Retriever",
      "breed_name_zh": "金毛寻回犬",
      "confidence": 0.92,
      "characteristics": {
        "size": "large",
        "temperament": ["friendly", "intelligent", "loyal"],
        "energy_level": "high",
        "grooming_needs": "moderate"
      }
    }
  ]
}
```

#### 1.2.4 图像健康监测

**可检测的健康指标：**

| 指标类别 | 检测项目 | 检测方式 | 准确率 |
|---------|---------|---------|--------|
| 眼部健康 | 眼睛红肿、分泌物、白内障迹象 | 眼部区域分析 | 87% |
| 口腔健康 | 牙龈颜色、牙齿状态、口臭迹象 | 口腔区域分析 | 82% |
| 皮肤健康 | 皮疹、脱毛、皮肤颜色异常 | 全身皮肤分析 | 85% |
| 体重评估 | 体态评分、肥胖程度 | 身体轮廓分析 | 78% |
| 行走姿态 | 跛行迹象、关节问题 | 视频/图像分析 | 80% |

---

### 1.3 健康分析 API

#### 1.3.1 症状检查 API

| API 名称 | 端点 | 功能描述 |
|---------|------|---------|
| Symptom Checker | `POST /v1/health/symptom-check` | 基于症状的健康评估 |
| Severity Assessment | `POST /v1/health/severity` | 症状严重程度评估 |
| Recommendation Engine | `POST /v1/health/recommend` | 就医建议生成 |

**请求示例：**

```json
{
  "pet_id": "pet_12345",
  "pet_profile": {
    "species": "dog",
    "breed": "Labrador Retriever",
    "age": 5,
    "weight": 28.5,
    "gender": "male",
    "medical_history": ["allergy_chicken", "ear_infection_history"]
  },
  "symptoms": [
    {
      "name": "vomiting",
      "name_zh": "呕吐",
      "duration_hours": 6,
      "frequency": 3,
      "severity": "moderate"
    },
    {
      "name": "lethargy",
      "name_zh": "精神萎靡",
      "duration_hours": 8,
      "severity": "mild"
    }
  ],
  "additional_notes": "食欲下降，饮水减少"
}
```

**响应示例：**

```json
{
  "assessment_id": "asm_abc123",
  "urgency_level": "moderate",
  "urgency_score": 65,
  "possible_conditions": [
    {
      "condition": "gastroenteritis",
      "condition_zh": "胃肠炎",
      "probability": 0.45,
      "description": "胃肠道炎症，可能由饮食不当或感染引起"
    },
    {
      "condition": "food_poisoning",
      "condition_zh": "食物中毒",
      "probability": 0.30,
      "description": "摄入有害物质或有毒食物"
    }
  ],
  "recommendations": [
    {
      "type": "immediate",
      "action": "停止喂食12小时，保持充足饮水",
      "priority": 1
    },
    {
      "type": "monitoring",
      "action": "观察症状变化，记录呕吐频率",
      "priority": 2
    },
    {
      "type": "veterinary",
      "action": "如症状持续超过24小时或加重，请尽快就医",
      "priority": 3
    }
  ],
  "red_flags": [
    "呕吐物带血",
    "持续呕吐超过24小时",
    "完全无法饮水"
  ]
}
```

#### 1.3.2 健康趋势分析

**支持的趋势分析类型：**

| 分析类型 | 数据来源 | 分析周期 | 输出格式 |
|---------|---------|---------|---------|
| 体重趋势 | 智能秤/手动录入 | 周/月/年 | 图表 + 文字说明 |
| 活动趋势 | 可穿戴设备 | 日/周/月 | 图表 + 对比基准 |
| 饮食趋势 | 智能喂食器 | 日/周 | 摄入量分析 |
| 睡眠趋势 | 可穿戴设备 | 日/周 | 睡眠质量报告 |
| 心率趋势 | 智能项圈 | 实时/日 | 心率变异性分析 |

#### 1.3.3 预测性健康监测

**预测模型能力：**

| 预测类型 | 预测窗口 | 准确率 | 数据需求 |
|---------|---------|--------|---------|
| 疾病风险预测 | 30-90天 | 78% | 历史健康数据 + 品种特征 |
| 体重变化预测 | 14-30天 | 85% | 饮食 + 活动数据 |
| 活动异常检测 | 实时 | 92% | 基准活动模式 |
| 慢性病风险 | 6-12月 | 72% | 长期健康记录 |

---

### 1.4 自然语言 API

#### 1.4.1 宠物护理问答服务

| API 名称 | 端点 | 功能描述 |
|---------|------|---------|
| Pet Q&A | `POST /v1/nlp/qa` | 宠物护理知识问答 |
| Context Q&A | `POST /v1/nlp/context-qa` | 基于宠物上下文的问答 |
| Follow-up Generator | `POST /v1/nlp/follow-up` | 后续问题建议生成 |

**请求示例：**

```json
{
  "question": "我的金毛最近总是挠耳朵，可能是什问题？",
  "pet_context": {
    "species": "dog",
    "breed": "Golden Retriever",
    "age": 3,
    "known_conditions": []
  },
  "conversation_history": [],
  "language": "zh-CN",
  "response_style": "detailed"
}
```

**响应示例：**

```json
{
  "answer": "金毛寻回犬经常挠耳朵可能有以下几种原因：\n\n1. **耳部感染**：金毛垂耳结构容易积聚湿气和污垢，是耳部感染的高发品种。\n\n2. **耳螨**：耳螨是一种常见的寄生虫感染，会导致剧烈瘙痒。\n\n3. **过敏反应**：食物过敏或环境过敏可能表现为耳部瘙痒。\n\n4. **异物**：草籽或其他异物进入耳道。\n\n**建议**：\n- 检查耳道是否有异味或分泌物\n- 观察耳朵内部是否红肿\n- 如症状持续，建议就医进行耳道检查",
  "confidence": 0.88,
  "sources": [
    {
      "title": "犬类耳部健康指南",
      "url": "https://vet-guide.com/ear-health",
      "relevance": 0.95
    }
  ],
  "follow_up_questions": [
    "如何在家检查狗狗的耳朵？",
    "耳部感染有哪些明显症状？",
    "金毛日常耳朵护理要注意什么？"
  ],
  "related_topics": ["耳部护理", "过敏管理", "寄生虫预防"]
}
```

#### 1.4.2 多语言支持

**支持的语言：**

| 语言代码 | 语言名称 | 支持程度 | 本地化程度 |
|---------|---------|---------|-----------|
| zh-CN | 简体中文 | 完整支持 | 100% |
| zh-TW | 繁体中文 | 完整支持 | 100% |
| en | 英语 | 完整支持 | 100% |
| ja | 日语 | 完整支持 | 95% |
| ko | 韩语 | 完整支持 | 90% |
| es | 西班牙语 | 基础支持 | 80% |
| fr | 法语 | 基础支持 | 75% |
| de | 德语 | 基础支持 | 75% |

---

## 2. 集成场景

### 2.1 场景一：实时情绪翻译

#### 场景描述

用户录制宠物的声音或拍摄照片，系统实时分析并翻译宠物的情绪状态，帮助主人理解宠物的需求和心理状态。

#### 处理流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  输入采集   │ -> │  宠物检测   │ -> │  特征提取   │ -> │  情绪分类   │
│ 音频/图像   │    │  类型识别   │    │  多模态融合 │    │  置信度计算 │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              v
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  结果展示   │ <- │  建议生成   │ <- │  解释生成   │ <- │  结果整合   │
│  用户界面   │    │  行为建议   │    │  情绪解释   │    │  多源融合   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

#### API 调用序列

```typescript
// 步骤 1: 宠物检测
const detectionResult = await petFaceDetect({
  image: imageData,
  detection_mode: 'accurate'
});

// 步骤 2: 情绪识别
const emotionResult = await emotionRecognition({
  image: imageData,
  pet_bbox: detectionResult.bounding_box,
  pet_type: detectionResult.pet_type
});

// 步骤 3: 声音分析（如果有音频）
const audioResult = await audioAnalysis({
  audio: audioData,
  pet_type: detectionResult.pet_type
});

// 步骤 4: 多模态融合
const fusedEmotion = await emotionFusion({
  visual_emotion: emotionResult,
  audio_emotion: audioResult,
  confidence_weights: { visual: 0.6, audio: 0.4 }
});
```

#### 输出格式

```json
{
  "emotion_translation": {
    "primary_emotion": {
      "label": "excited",
      "label_zh": "兴奋",
      "confidence": 0.91,
      "indicators": ["尾巴快速摇摆", "耳朵前倾", "嘴巴微张"]
    },
    "secondary_emotion": {
      "label": "happy",
      "label_zh": "开心",
      "confidence": 0.78
    },
    "explanation": "您的狗狗表现出明显的兴奋和开心情绪。这通常表示它对当前的事物或活动非常感兴趣和期待。",
    "possible_causes": [
      "期待玩耍或散步",
      "看到喜欢的人或其他宠物",
      "对食物或零食的期待"
    ],
    "suggestions": [
      "可以满足它的期待，进行互动或奖励",
      "注意控制兴奋程度，避免过度激动"
    ]
  },
  "processing_metadata": {
    "total_time_ms": 456,
    "models_used": ["pet-detect-v3", "emotion-visual-v2", "emotion-audio-v2"],
    "input_quality": "good"
  }
}
```

---

### 2.2 场景二：健康咨询

#### 场景描述

用户描述宠物的症状或健康问题，系统通过自然语言理解分析问题，结合宠物档案提供个性化的健康建议和就医指导。

#### 处理流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  用户提问   │ -> │  意图识别   │ -> │  实体抽取   │ -> │  上下文融合 │
│  文本输入   │    │  问题分类   │    │  症状识别   │    │  宠物档案   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              v
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  响应生成   │ <- │  建议构建   │ <- │  风险评估   │ <- │  知识检索   │
│  多语言输出 │    │  结构化回复 │    │  紧急度判断 │    │  专业知识库 │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

#### API 调用序列

```typescript
// 步骤 1: 意图识别
const intentResult = await intentRecognition({
  text: userQuestion,
  language: 'zh-CN'
});

// 步骤 2: 症状实体抽取
const entities = await entityExtraction({
  text: userQuestion,
  entity_types: ['symptom', 'body_part', 'duration', 'frequency']
});

// 步骤 3: 知识检索
const knowledge = await knowledgeRetrieval({
  query: userQuestion,
  pet_profile: petContext,
  top_k: 5
});

// 步骤 4: 风险评估
const riskAssessment = await riskAssessment({
  symptoms: entities.symptoms,
  pet_profile: petContext
});

// 步骤 5: 响应生成
const response = await responseGeneration({
  intent: intentResult,
  entities: entities,
  knowledge: knowledge,
  risk: riskAssessment,
  pet_context: petContext
});
```

#### 输出格式

```json
{
  "consultation_result": {
    "advice": {
      "summary": "根据您描述的症状，您的猫咪可能患有下泌尿道疾病（FLUTD），建议尽快就医检查。",
      "detailed_advice": "猫咪频繁进出猫砂盆但尿量很少，这是下泌尿道疾病的典型症状。这种情况在公猫中尤为危险，因为可能导致尿道完全阻塞。\n\n**紧急程度：较高**\n\n**建议措施：**\n1. 立即观察是否有排尿困难（完全无尿超过24小时是紧急情况）\n2. 确保充足的饮水\n3. 尽快预约兽医检查（建议24小时内）\n4. 避免自行用药",
      "home_care_tips": [
        "增加湿粮比例，促进饮水",
        "保持猫砂盆清洁",
        "减少环境压力"
      ]
    },
    "urgency_level": {
      "level": "high",
      "level_zh": "较高",
      "score": 75,
      "reason": "泌尿系统症状可能快速恶化，尤其是公猫"
    },
    "follow_up_suggestions": [
      "如何增加猫咪的饮水量？",
      "猫下泌尿道疾病的预防方法",
      "什么情况需要立即就医？"
    ],
    "vet_reminder": {
      "should_see_vet": true,
      "timeframe": "24小时内",
      "preparation_tips": [
        "记录症状出现的时间和频率",
        "观察是否有血尿",
        "记录最近的饮食和排便情况"
      ]
    }
  }
}
```

---

### 2.3 场景三：主动健康监测

#### 场景描述

系统持续监测宠物的健康指标（活动量、饮食、睡眠等），通过趋势分析和异常检测，主动发现潜在健康问题并及时预警。

#### 处理流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  数据采集   │ -> │  数据清洗   │ -> │  基准建立   │ -> │  趋势分析   │
│  多源融合   │    │  异常过滤   │    │  个性化模型 │    │  周期检测   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              v
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  预警通知   │ <- │  建议生成   │ <- │  风险评分   │ <- │  异常检测   │
│  多渠道推送 │    │  个性化建议 │    │  综合评估   │    │  模式识别   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

#### API 调用序列

```typescript
// 步骤 1: 获取健康指标历史
const healthMetrics = await getHealthMetrics({
  pet_id: petId,
  metrics: ['activity', 'sleep', 'food_intake', 'weight'],
  time_range: '30d'
});

// 步骤 2: 趋势分析
const trendAnalysis = await trendAnalysis({
  metrics: healthMetrics,
  analysis_type: 'comprehensive'
});

// 步骤 3: 异常检测
const anomalies = await anomalyDetection({
  current_metrics: healthMetrics.current,
  baseline: healthMetrics.baseline,
  sensitivity: 'medium'
});

// 步骤 4: 风险评估
const riskScore = await riskScoring({
  trends: trendAnalysis,
  anomalies: anomalies,
  pet_profile: petContext
});

// 步骤 5: 预警生成
if (riskScore.level !== 'normal') {
  const alert = await generateAlert({
    risk: riskScore,
    pet_id: petId,
    notification_channels: ['app', 'email']
  });
}
```

#### 输出格式

```json
{
  "monitoring_result": {
    "status": "warning",
    "warning": {
      "type": "activity_decrease",
      "type_zh": "活动量下降",
      "severity": "moderate",
      "detected_at": "2026-06-02T14:30:00Z",
      "details": {
        "baseline_activity": 8500,
        "current_activity": 5200,
        "deviation_percent": -38.8,
        "trend_duration": "5天"
      }
    },
    "recommendation": {
      "title": "活动量显著下降预警",
      "description": "您的狗狗过去5天的活动量比平时低约39%。这可能是以下原因：",
      "possible_reasons": [
        {
          "reason": "健康问题",
          "probability": 0.35,
          "description": "关节不适、消化问题或其他不适"
        },
        {
          "reason": "环境因素",
          "probability": 0.30,
          "description": "天气变化、作息改变等"
        },
        {
          "reason": "情绪问题",
          "probability": 0.25,
          "description": "焦虑、无聊或情绪低落"
        }
      ],
      "actions": [
        "观察狗狗是否有其他异常表现（食欲、精神状态）",
        "检查是否有身体不适的迹象",
        "尝试增加互动和游戏时间",
        "如持续超过7天，建议就医检查"
      ]
    },
    "next_check": "2026-06-03T14:30:00Z"
  }
}
```

---

## 3. 最佳实践

### 3.1 置信度阈值设置

#### 推荐阈值配置

| 应用场景 | 低置信度阈值 | 中置信度阈值 | 高置信度阈值 | 建议操作 |
|---------|-------------|-------------|-------------|---------|
| 情绪识别 | < 0.6 | 0.6 - 0.8 | > 0.8 | 低：提示用户确认；中：显示结果+置信度；高：直接显示 |
| 品种识别 | < 0.5 | 0.5 - 0.75 | > 0.75 | 低：显示多个候选；中：显示Top3；高：直接显示 |
| 健康预警 | < 0.4 | 0.4 - 0.7 | > 0.7 | 低：仅记录；中：软提醒；高：强提醒+建议就医 |
| 症状分析 | < 0.5 | 0.5 - 0.75 | > 0.75 | 低：建议更多信息；中：提供建议+免责声明；高：详细建议 |

#### 代码示例

```typescript
interface ConfidenceThreshold {
  low: number;
  medium: number;
  high: number;
}

const THRESHOLDS: Record<string, ConfidenceThreshold> = {
  emotion: { low: 0.6, medium: 0.8, high: 0.95 },
  breed: { low: 0.5, medium: 0.75, high: 0.9 },
  health_alert: { low: 0.4, medium: 0.7, high: 0.85 },
  symptom: { low: 0.5, medium: 0.75, high: 0.9 }
};

function getConfidenceLevel(
  confidence: number,
  thresholds: ConfidenceThreshold
): 'low' | 'medium' | 'high' {
  if (confidence < thresholds.low) return 'low';
  if (confidence < thresholds.medium) return 'medium';
  return 'high';
}

function handleResult(result: APIResult, scenario: string) {
  const level = getConfidenceLevel(
    result.confidence,
    THRESHOLDS[scenario]
  );

  switch (level) {
    case 'low':
      return {
        display: 'tentative',
        message: '结果置信度较低，建议提供更多信息或人工确认',
        showAlternatives: true
      };
    case 'medium':
      return {
        display: 'confident',
        message: `结果置信度: ${(result.confidence * 100).toFixed(0)}%`,
        showAlternatives: false
      };
    case 'high':
      return {
        display: 'very_confident',
        message: '结果可信度高',
        showAlternatives: false
      };
  }
}
```

---

### 3.2 错误处理

#### 错误类型定义

```typescript
enum PetAIErrorCode {
  // 客户端错误 (1000-1999)
  INVALID_INPUT = 1001,
  MISSING_REQUIRED_FIELD = 1002,
  INVALID_IMAGE_FORMAT = 1003,
  INVALID_AUDIO_FORMAT = 1004,
  FILE_TOO_LARGE = 1005,

  // 服务端错误 (2000-2999)
  INTERNAL_ERROR = 2001,
  MODEL_UNAVAILABLE = 2002,
  RATE_LIMIT_EXCEEDED = 2003,
  SERVICE_TIMEOUT = 2004,

  // 业务错误 (3000-3999)
  PET_NOT_DETECTED = 3001,
  LOW_QUALITY_INPUT = 3002,
  UNSUPPORTED_PET_TYPE = 3003,
  INSUFFICIENT_DATA = 3004
}

interface PetAIError {
  code: PetAIErrorCode;
  message: string;
  message_zh: string;
  details?: Record<string, unknown>;
  retry_after?: number;
  suggestion?: string;
}
```

#### 错误处理策略

```typescript
async function handleAPIError(error: PetAIError): Promise<ErrorResponse> {
  const errorHandlers: Record<PetAIErrorCode, () => ErrorResponse> = {
    [PetAIErrorCode.INVALID_INPUT]: () => ({
      userMessage: '输入数据格式不正确，请检查后重试',
      action: 'retry',
      logLevel: 'warn'
    }),

    [PetAIErrorCode.FILE_TOO_LARGE]: () => ({
      userMessage: '文件大小超过限制（最大10MB），请压缩后重试',
      action: 'compress_and_retry',
      logLevel: 'warn'
    }),

    [PetAIErrorCode.RATE_LIMIT_EXCEEDED]: () => ({
      userMessage: '请求过于频繁，请稍后再试',
      action: 'wait',
      waitTime: error.retry_after || 60,
      logLevel: 'info'
    }),

    [PetAIErrorCode.MODEL_UNAVAILABLE]: () => ({
      userMessage: '服务暂时不可用，正在切换备用服务',
      action: 'fallback',
      logLevel: 'error'
    }),

    [PetAIErrorCode.PET_NOT_DETECTED]: () => ({
      userMessage: '未能在图像中检测到宠物，请确保宠物清晰可见',
      action: 'retry_with_different_input',
      logLevel: 'info'
    }),

    // ... 其他错误处理
  };

  const handler = errorHandlers[error.code] || (() => ({
    userMessage: '发生未知错误，请联系客服',
    action: 'contact_support',
    logLevel: 'error'
  }));

  return handler();
}
```

#### 重试机制

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: PetAIErrorCode[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    PetAIErrorCode.SERVICE_TIMEOUT,
    PetAIErrorCode.MODEL_UNAVAILABLE,
    PetAIErrorCode.INTERNAL_ERROR
  ]
};

async function withRetry<T>(
  apiCall: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;

      if (!config.retryableErrors.includes((error as PetAIError).code)) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

---

### 3.3 用户反馈集成

#### 反馈收集机制

```typescript
interface UserFeedback {
  request_id: string;
  feedback_type: 'correct' | 'incorrect' | 'partial' | 'irrelevant';
  correction?: {
    field: string;
    original_value: unknown;
    corrected_value: unknown;
  };
  user_rating?: 1 | 2 | 3 | 4 | 5;
  comments?: string;
  timestamp: Date;
}

// 反馈收集点
const FEEDBACK_POINTS = {
  emotion_result: {
    question: '情绪识别结果是否准确？',
    options: ['非常准确', '基本准确', '部分准确', '不准确'],
    allowCorrection: true
  },
  breed_result: {
    question: '品种识别是否正确？',
    options: ['正确', '不正确'],
    allowCorrection: true,
    correctionType: 'breed_selection'
  },
  health_advice: {
    question: '这条建议对您有帮助吗？',
    options: ['很有帮助', '有一定帮助', '帮助不大', '没有帮助'],
    allowCorrection: false
  }
};
```

#### 模型优化流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  反馈收集   │ -> │  数据验证   │ -> │  标注更新   │ -> │  模型微调   │
│  多渠道聚合 │    │  质量过滤   │    │  训练集扩充 │    │  A/B测试    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

### 3.4 隐私考虑

#### 数据处理原则

| 原则 | 描述 | 实施方式 |
|-----|------|---------|
| 最小化收集 | 仅收集必要数据 | 按功能需求限定数据范围 |
| 本地处理 | 优先本地计算 | 敏感数据本地预处理 |
| 匿名化 | 去除个人标识 | 请求ID与用户ID分离 |
| 限时存储 | 设定数据保留期 | 图像/音频24小时后删除 |
| 用户控制 | 用户拥有数据控制权 | 提供数据导出和删除功能 |

#### 隐私保护实现

```typescript
interface PrivacyConfig {
  data_retention_hours: number;
  anonymize_requests: boolean;
  local_processing_preferred: boolean;
  allow_data_usage_for_training: boolean;
}

const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  data_retention_hours: 24,
  anonymize_requests: true,
  local_processing_preferred: true,
  allow_data_usage_for_training: false
};

// 请求匿名化
function anonymizeRequest(request: APIRequest): AnonymizedRequest {
  return {
    ...request,
    user_id: hash(request.user_id),
    timestamp: new Date(),
    metadata: {
      ...request.metadata,
      ip_address: undefined,
      device_info: undefined
    }
  };
}

// 数据清理调度
async function scheduleDataCleanup(requestId: string, hours: number) {
  await scheduleTask({
    task_id: `cleanup_${requestId}`,
    execute_at: Date.now() + hours * 60 * 60 * 1000,
    action: 'delete_request_data',
    params: { request_id: requestId }
  });
}
```

#### 合规性检查

```typescript
const COMPLIANCE_CHECKS = {
  gdpr: {
    right_to_access: true,
    right_to_deletion: true,
    data_portability: true,
    consent_required: true
  },
  ccpa: {
    right_to_know: true,
    right_to_delete: true,
    right_to_opt_out: true
  },
  china_personal_info: {
    consent_required: true,
    purpose_limitation: true,
    security_measures: true
  }
};
```

---

## 4. 竞争优势

### 4.1 本应用 AI 的独特优势

#### 4.1.1 多模态融合能力

| 能力维度 | 本应用 | 行业平均 | 优势说明 |
|---------|--------|---------|---------|
| 音频+图像融合 | ✅ 支持 | 部分支持 | 同时分析声音和图像，情绪识别准确率提升15% |
| 实时处理 | < 500ms | 1-2s | 边缘计算+云端混合架构 |
| 跨模态一致性 | 92% | 75% | 多模态结果自动校验和融合 |

#### 4.1.2 个性化模型

```
┌─────────────────────────────────────────────────────────────┐
│                    个性化模型架构                            │
├─────────────────────────────────────────────────────────────┤
│  基础模型（通用）                                            │
│  ├── 宠物类型识别                                            │
│  ├── 基础情绪分类                                            │
│  └── 常见品种识别                                            │
├─────────────────────────────────────────────────────────────┤
│  个性化层（用户特定）                                        │
│  ├── 个体宠物识别                                            │
│  ├── 个性化行为模式学习                                      │
│  ├── 健康基线建立                                            │
│  └── 用户偏好适应                                            │
├─────────────────────────────────────────────────────────────┤
│  上下文增强                                                  │
│  ├── 历史交互记忆                                            │
│  ├── 环境因素考量                                            │
│  └── 时序模式识别                                            │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.3 本地化优势

| 本地化维度 | 支持情况 | 竞争对手对比 |
|-----------|---------|-------------|
| 中文语言支持 | 母语级支持 | 多数产品翻译质量差 |
| 本地宠物品种 | 覆盖中国常见品种+本土品种 | 国际产品品种库不完整 |
| 中国医疗体系 | 对接本地兽医网络 | 国际产品无本地资源 |
| 文化适配 | 符合中国养宠习惯 | 西方养宠观念差异 |

---

### 4.2 与竞品对比

| 功能特性 | 本应用 | 竞品A | 竞品B | 竞品C |
|---------|--------|-------|-------|-------|
| 实时情绪翻译 | ✅ | ✅ | ❌ | ✅ |
| 多宠物支持 | ✅ 无限 | ✅ 最多3只 | ✅ 最多5只 | ❌ 单只 |
| 健康预警 | ✅ 主动式 | ✅ 被动式 | ❌ | ✅ 被动式 |
| 品种识别 | 380+ | 200+ | 150+ | 100+ |
| 中文支持 | ✅ 完整 | ⚠️ 部分 | ❌ | ⚠️ 翻译 |
| 离线功能 | ✅ 基础功能 | ❌ | ❌ | ⚠️ 有限 |
| 隐私保护 | ✅ 本地优先 | ⚠️ 云端为主 | ⚠️ | ❌ |
| 价格 | 免费+订阅 | 订阅 | 免费+广告 | 订阅 |

---

### 4.3 未来路线图

#### 2026 Q3

- [ ] 增强现实（AR）宠物情绪可视化
- [ ] 宠物社交网络匹配（基于性格分析）
- [ ] 智能项圈/穿戴设备深度集成

#### 2026 Q4

- [ ] 多宠物互动分析
- [ ] 宠物行为训练建议系统
- [ ] 视频实时分析能力

#### 2027 H1

- [ ] 预测性健康模型 v2（更早预警）
- [ ] 宠物年龄预测与老年护理规划
- [ ] 跨物种互动分析（多宠物家庭）

#### 2027 H2

- [ ] 全息投影宠物情绪展示
- [ ] 脑机接口探索（宠物神经信号分析）
- [ ] 元宇宙宠物数字孪生

---

## 附录

### A. API 速率限制

| API 类别 | 免费用户 | 基础订阅 | 高级订阅 |
|---------|---------|---------|---------|
| 图像分析 | 10次/天 | 100次/天 | 无限制 |
| 音频分析 | 20次/天 | 200次/天 | 无限制 |
| 健康咨询 | 5次/天 | 50次/天 | 无限制 |
| 品种识别 | 10次/天 | 100次/天 | 无限制 |

### B. 支持的文件格式

| 类型 | 支持格式 | 最大大小 |
|-----|---------|---------|
| 图像 | JPEG, PNG, WebP, HEIC | 10MB |
| 音频 | WAV, MP3, M4A, FLAC | 20MB |
| 视频 | MP4, MOV, WebM | 100MB |

### C. 技术支持联系方式

- **技术文档**: https://docs.petai.example.com
- **API 状态**: https://status.petai.example.com
- **开发者社区**: https://community.petai.example.com
- **技术支持**: support@petai.example.com

---

*文档版本: 1.0.0*
*最后更新: 2026-06-03*
*维护团队: Pet AI 技术团队*
