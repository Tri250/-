export interface SymptomNode {
  id: string;
  type: 'question' | 'result';
  question?: string;
  description?: string;
  options?: SymptomOption[];
  result?: SymptomResult;
}

export interface SymptomOption {
  id: string;
  label: string;
  nextNodeId: string;
  value?: string | number;
}

export interface SymptomResult {
  title: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  possibleConditions: string[];
  recommendations: string[];
  emergency?: boolean;
  relatedManualIds?: string[];
  askDoctor?: boolean;
}

export interface SymptomSession {
  id: string;
  petId: string;
  petType: 'dog' | 'cat';
  currentNodeId: string;
  history: SymptomHistoryItem[];
  startedAt: string;
  completed?: boolean;
  result?: SymptomResult;
}

export interface SymptomHistoryItem {
  nodeId: string;
  question: string;
  answer: string;
  timestamp: string;
}

export const SYMPTOM_TREE_DATA: { [key: string]: SymptomNode } = {
  start: {
    id: 'start',
    type: 'question',
    question: '请选择宠物的主要不适部位',
    description: '选择最明显的症状部位开始诊断',
    options: [
      { id: 'digestive', label: '消化系统（呕吐、腹泻、食欲）', nextNodeId: 'digestive' },
      { id: 'respiratory', label: '呼吸系统（咳嗽、喷嚏、呼吸）', nextNodeId: 'respiratory' },
      { id: 'skin', label: '皮肤毛发（瘙痒、掉毛、红肿）', nextNodeId: 'skin' },
      { id: 'behavioral', label: '行为情绪（精神、活动、睡眠）', nextNodeId: 'behavioral' },
      { id: 'urinary', label: '泌尿系统（尿频、尿色、排尿）', nextNodeId: 'urinary' },
      { id: 'other', label: '其他症状', nextNodeId: 'other' },
    ],
  },
  digestive: {
    id: 'digestive',
    type: 'question',
    question: '主要的消化道症状是？',
    options: [
      { id: 'vomiting', label: '呕吐', nextNodeId: 'vomiting' },
      { id: 'diarrhea', label: '腹泻', nextNodeId: 'diarrhea' },
      { id: 'appetite', label: '食欲变化', nextNodeId: 'appetite' },
      { id: 'abdominal', label: '腹痛/腹部不适', nextNodeId: 'abdominal' },
    ],
  },
  vomiting: {
    id: 'vomiting',
    type: 'question',
    question: '呕吐的频率是？',
    options: [
      { id: 'freq-occasional', label: '偶尔（1-2次/天）', nextNodeId: 'vomiting-content' },
      { id: 'freq-frequent', label: '频繁（3次以上/天）', nextNodeId: 'vomiting-content' },
      { id: 'freq-continuous', label: '持续呕吐', nextNodeId: 'vomiting-emergency' },
    ],
  },
  'vomiting-content': {
    id: 'vomiting-content',
    type: 'question',
    question: '呕吐物的性质是？',
    options: [
      { id: 'vomit-food', label: '未消化的食物', nextNodeId: 'vomiting-duration' },
      { id: 'vomit-bile', label: '黄色/绿色胆汁', nextNodeId: 'vomiting-duration' },
      { id: 'vomit-blood', label: '带血或咖啡样物', nextNodeId: 'vomit-blood-result' },
      { id: 'vomit-other', label: '其他异常物质', nextNodeId: 'vomiting-duration' },
    ],
  },
  'vomiting-duration': {
    id: 'vomiting-duration',
    type: 'question',
    question: '症状持续多久了？',
    options: [
      { id: 'less-day', label: '不到24小时', nextNodeId: 'vomit-mild-result' },
      { id: '1-2-days', label: '1-2天', nextNodeId: 'vomit-moderate-result' },
      { id: 'more-2-days', label: '超过2天', nextNodeId: 'vomit-severe-result' },
    ],
  },
  'vomiting-emergency': {
    id: 'vomiting-emergency',
    type: 'result',
    result: {
      title: '紧急情况！持续呕吐',
      severity: 'critical',
      description: '宠物持续呕吐可能是严重问题的信号，需要立即就医。',
      possibleConditions: ['急性胃肠炎', '异物阻塞', '中毒', '胰腺炎', '肾功能衰竭'],
      recommendations: [
        '立即停止喂食喂水',
        '尽快带宠物去看兽医',
        '记录呕吐物的样子和频率',
        '注意是否有其他症状',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'vomit-blood-result': {
    id: 'vomit-blood-result',
    type: 'result',
    result: {
      title: '带血呕吐需重视',
      severity: 'high',
      description: '呕吐物带血可能提示消化道出血，需要及时就医检查。',
      possibleConditions: ['胃溃疡', '胃出血', '严重胃肠炎', '肿瘤', '出血性疾病'],
      recommendations: [
        '不要喂食任何东西',
        '立即就医检查',
        '保存呕吐物样本给医生看',
        '观察是否有其他出血症状',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'vomit-mild-result': {
    id: 'vomit-mild-result',
    type: 'result',
    result: {
      title: '轻度消化不适',
      severity: 'low',
      description: '偶尔呕吐可能是饮食不当或轻微消化不良。',
      possibleConditions: ['饮食不当', '消化不良', '轻微胃肠炎', '进食过快'],
      recommendations: [
        '暂时禁食12-24小时',
        '少量多次给予清水',
        '恢复时给予清淡易消化的食物',
        '观察症状是否加重',
      ],
      relatedManualIds: ['1'],
      askDoctor: false,
    },
  },
  'vomit-moderate-result': {
    id: 'vomit-moderate-result',
    type: 'result',
    result: {
      title: '中度消化问题',
      severity: 'moderate',
      description: '持续1-2天的呕吐需要关注，可能是感染或其他问题。',
      possibleConditions: ['病毒性肠炎', '细菌感染', '寄生虫', '胰腺炎早期'],
      recommendations: [
        '停止喂食观察',
        '注意补充水分防止脱水',
        '建议咨询兽医',
        '观察是否有腹泻等其他症状',
      ],
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'vomit-severe-result': {
    id: 'vomit-severe-result',
    type: 'result',
    result: {
      title: '严重消化问题',
      severity: 'high',
      description: '呕吐超过2天可能提示严重问题，需要就医。',
      possibleConditions: ['慢性胃肠炎', '胰腺炎', '肾脏问题', '肝脏疾病', '肠道阻塞'],
      recommendations: [
        '必须就医检查',
        '注意补水',
        '记录所有症状给医生',
        '不要自行用药',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  diarrhea: {
    id: 'diarrhea',
    type: 'question',
    question: '腹泻的情况是？',
    options: [
      { id: 'diarrhea-mild', label: '轻微，便便只是偏软', nextNodeId: 'diarrhea-duration' },
      { id: 'diarrhea-water', label: '水样便', nextNodeId: 'diarrhea-blood' },
      { id: 'diarrhea-bloody', label: '带血便', nextNodeId: 'diarrhea-bloody-result' },
    ],
  },
  'diarrhea-blood': {
    id: 'diarrhea-blood',
    type: 'question',
    question: '有带血吗？',
    options: [
      { id: 'blood-yes', label: '有血', nextNodeId: 'diarrhea-bloody-result' },
      { id: 'blood-no', label: '无血', nextNodeId: 'diarrhea-duration' },
    ],
  },
  'diarrhea-duration': {
    id: 'diarrhea-duration',
    type: 'question',
    question: '持续多久了？',
    options: [
      { id: 'diarrhea-less-day', label: '不到1天', nextNodeId: 'diarrhea-mild-result' },
      { id: 'diarrhea-1-2-days', label: '1-2天', nextNodeId: 'diarrhea-moderate-result' },
      { id: 'diarrhea-more', label: '超过2天', nextNodeId: 'diarrhea-severe-result' },
    ],
  },
  'diarrhea-bloody-result': {
    id: 'diarrhea-bloody-result',
    type: 'result',
    result: {
      title: '血便需立即就医',
      severity: 'critical',
      description: '粪便带血是严重症状，可能是感染、寄生虫或其他严重疾病。',
      possibleConditions: ['细小病毒', '冠状病毒', '出血性肠炎', '寄生虫感染', '直肠问题'],
      recommendations: [
        '立即就医',
        '不要喂食',
        '防止脱水',
        '带粪便样本给医生检查',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'diarrhea-mild-result': {
    id: 'diarrhea-mild-result',
    type: 'result',
    result: {
      title: '轻微腹泻',
      severity: 'low',
      description: '短期轻微腹泻通常是饮食变化或轻微不适引起。',
      possibleConditions: ['饮食变化', '轻微消化不良', '食物过敏', '应激反应'],
      recommendations: [
        '暂时给予温和易消化的食物',
        '保证饮水',
        '观察症状变化',
        '如果加重及时就医',
      ],
      relatedManualIds: ['1'],
      askDoctor: false,
    },
  },
  'diarrhea-moderate-result': {
    id: 'diarrhea-moderate-result',
    type: 'result',
    result: {
      title: '中度腹泻',
      severity: 'moderate',
      description: '持续1-2天的腹泻需要关注，可能是感染。',
      possibleConditions: ['细菌性肠炎', '病毒性肠炎', '寄生虫', '食物过敏'],
      recommendations: [
        '补充水分防止脱水',
        '清淡饮食',
        '建议咨询兽医',
        '观察是否有其他症状',
      ],
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'diarrhea-severe-result': {
    id: 'diarrhea-severe-result',
    type: 'result',
    result: {
      title: '严重腹泻',
      severity: 'high',
      description: '腹泻超过2天可能导致脱水和电解质紊乱，需要就医。',
      possibleConditions: ['严重感染', '炎性肠病', '胰腺问题', '其他慢性病'],
      recommendations: [
        '立即就医检查',
        '防止脱水很重要',
        '不要自行用药',
        '带粪便样本检查',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  respiratory: {
    id: 'respiratory',
    type: 'question',
    question: '呼吸系统的主要症状是？',
    options: [
      { id: 'cough', label: '咳嗽', nextNodeId: 'cough' },
      { id: 'sneeze', label: '打喷嚏/流鼻涕', nextNodeId: 'sneeze' },
      { id: 'breathing', label: '呼吸困难', nextNodeId: 'breathing-emergency' },
    ],
  },
  'breathing-emergency': {
    id: 'breathing-emergency',
    type: 'result',
    result: {
      title: '紧急！呼吸困难',
      severity: 'critical',
      description: '呼吸困难是紧急情况，需要立即就医！',
      possibleConditions: ['心力衰竭', '严重肺炎', '气胸', '哮喘', '异物阻塞', '中暑'],
      recommendations: [
        '立即就医！',
        '保持宠物安静',
        '避免激动',
        '如果是中暑立即降温',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  cough: {
    id: 'cough',
    type: 'question',
    question: '咳嗽的特点是？',
    options: [
      { id: 'cough-dry', label: '干咳', nextNodeId: 'cough-duration' },
      { id: 'cough-wet', label: '湿咳/有痰', nextNodeId: 'cough-duration' },
      { id: 'cough-gag', label: '咳嗽后呕吐/作呕', nextNodeId: 'cough-duration' },
    ],
  },
  'cough-duration': {
    id: 'cough-duration',
    type: 'question',
    question: '咳嗽多久了？',
    options: [
      { id: 'cough-less-day', label: '不到1天', nextNodeId: 'cough-mild-result' },
      { id: 'cough-1-3-days', label: '1-3天', nextNodeId: 'cough-moderate-result' },
      { id: 'cough-more', label: '超过3天或加重', nextNodeId: 'cough-severe-result' },
    ],
  },
  'cough-mild-result': {
    id: 'cough-mild-result',
    type: 'result',
    result: {
      title: '轻微咳嗽',
      severity: 'low',
      description: '短期轻微咳嗽可能是刺激或轻微感染。',
      possibleConditions: ['轻微刺激', '过敏', '轻微上呼吸道感染'],
      recommendations: [
        '避免烟雾和刺激物',
        '保持环境清洁',
        '观察症状变化',
        '多喝水',
      ],
      relatedManualIds: ['2'],
      askDoctor: false,
    },
  },
  'cough-moderate-result': {
    id: 'cough-moderate-result',
    type: 'result',
    result: {
      title: '中度呼吸道症状',
      severity: 'moderate',
      description: '持续咳嗽可能是感染或其他问题，建议就医。',
      possibleConditions: ['上呼吸道感染', '支气管炎', '犬窝咳', '过敏反应'],
      recommendations: [
        '建议就医检查',
        '保持温暖',
        '避免剧烈运动',
        '观察呼吸情况',
      ],
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'cough-severe-result': {
    id: 'cough-severe-result',
    type: 'result',
    result: {
      title: '严重呼吸道问题',
      severity: 'high',
      description: '持续加重的咳嗽可能是严重疾病。',
      possibleConditions: ['肺炎', '犬窝咳', '心脏病', '气管塌陷', '肿瘤'],
      recommendations: [
        '立即就医',
        '保持安静',
        '不要拖',
        '准备告知医生详细病史',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  skin: {
    id: 'skin',
    type: 'question',
    question: '皮肤问题主要是？',
    options: [
      { id: 'itch', label: '瘙痒/抓挠', nextNodeId: 'itch' },
      { id: 'hairloss', label: '掉毛', nextNodeId: 'hairloss' },
      { id: 'rash', label: '红疹/红肿', nextNodeId: 'rash' },
      { id: 'lump', label: '肿块/疙瘩', nextNodeId: 'lump' },
    ],
  },
  itch: {
    id: 'itch',
    type: 'question',
    question: '瘙痒的程度？',
    options: [
      { id: 'itch-mild', label: '轻微偶尔抓挠', nextNodeId: 'itch-mild-result' },
      { id: 'itch-moderate', label: '经常抓挠，皮肤发红', nextNodeId: 'itch-moderate-result' },
      { id: 'itch-severe', label: '严重抓挠，皮肤破损', nextNodeId: 'itch-severe-result' },
    ],
  },
  'itch-mild-result': {
    id: 'itch-mild-result',
    type: 'result',
    result: {
      title: '轻微皮肤瘙痒',
      severity: 'low',
      description: '轻微瘙痒可能是干燥或轻微刺激。',
      possibleConditions: ['皮肤干燥', '轻微过敏', '蚊虫叮咬', '环境刺激'],
      recommendations: [
        '使用温和宠物浴液',
        '保持皮肤保湿',
        '检查环境是否有刺激物',
        '观察是否加重',
      ],
      relatedManualIds: ['7'],
      askDoctor: false,
    },
  },
  'itch-moderate-result': {
    id: 'itch-moderate-result',
    type: 'result',
    result: {
      title: '中度皮肤问题',
      severity: 'moderate',
      description: '明显瘙痒可能是过敏、寄生虫或感染。',
      possibleConditions: ['过敏性皮炎', '跳蚤感染', '真菌感染', '皮肤细菌感染'],
      recommendations: [
        '检查是否有寄生虫',
        '避免可能的过敏原',
        '建议就医检查',
        '不要让宠物抓破皮',
      ],
      relatedManualIds: ['7'],
      askDoctor: true,
    },
  },
  'itch-severe-result': {
    id: 'itch-severe-result',
    type: 'result',
    result: {
      title: '严重皮肤问题',
      severity: 'high',
      description: '严重瘙痒和皮肤破损需要立即治疗。',
      possibleConditions: ['严重过敏', '严重真菌感染', '疥螨', '其他寄生虫', '自体免疫性疾病'],
      recommendations: [
        '立即就医',
        '防止继续抓挠',
        '可能需要伊丽莎白圈',
        '不要自行用药',
      ],
      relatedManualIds: ['3', '7'],
      askDoctor: true,
    },
  },
  'itch-mild-result': {
    id: 'itch-mild-result',
    type: 'result',
    result: {
      title: '轻微皮肤瘙痒',
      severity: 'low',
      description: '轻微瘙痒可能是干燥或轻微刺激。',
      possibleConditions: ['皮肤干燥', '轻微过敏', '蚊虫叮咬', '环境刺激物'],
      recommendations: [
        '使用温和宠物浴液',
        '保持皮肤保湿',
        '检查环境是否有刺激物',
        '观察是否加重',
      ],
      relatedManualIds: ['7'],
      askDoctor: false,
    },
  },
  behavioral: {
    id: 'behavioral',
    type: 'question',
    question: '主要的行为变化是？',
    options: [
      { id: 'lethargy', label: '精神差/嗜睡', nextNodeId: 'lethargy' },
      { id: 'anxiety', label: '焦虑/不安', nextNodeId: 'behavioral-mild-result' },
      { id: 'aggression', label: '攻击性增强', nextNodeId: 'behavioral-moderate-result' },
      { id: 'sleep', label: '睡眠习惯改变', nextNodeId: 'behavioral-mild-result' },
    ],
  },
  lethargy: {
    id: 'lethargy',
    type: 'question',
    question: '精神差的程度？',
    options: [
      { id: 'lethargy-mild', label: '只是不太活跃', nextNodeId: 'lethargy-duration' },
      { id: 'lethargy-moderate', label: '不愿活动', nextNodeId: 'lethargy-duration' },
      { id: 'lethargy-severe', label: '几乎不动/不愿起身', nextNodeId: 'lethargy-severe-result' },
    ],
  },
  'lethargy-duration': {
    id: 'lethargy-duration',
    type: 'question',
    question: '持续多久了？',
    options: [
      { id: 'lethargy-less-day', label: '不到1天', nextNodeId: 'behavioral-mild-result' },
      { id: 'lethargy-1-2-days', label: '1-2天', nextNodeId: 'behavioral-moderate-result' },
      { id: 'lethargy-more', label: '超过2天', nextNodeId: 'behavioral-severe-result' },
    ],
  },
  'lethargy-severe-result': {
    id: 'lethargy-severe-result',
    type: 'result',
    result: {
      title: '紧急！严重精神萎靡',
      severity: 'critical',
      description: '宠物几乎不动可能是严重疾病的信号。',
      possibleConditions: ['严重感染', '器官衰竭', '中毒', '严重疼痛', '严重贫血'],
      recommendations: [
        '立即就医！',
        '不要拖延',
        '保持宠物温暖',
        '记录所有症状',
      ],
      emergency: true,
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'behavioral-mild-result': {
    id: 'behavioral-mild-result',
    type: 'result',
    result: {
      title: '轻微行为变化',
      severity: 'low',
      description: '短期行为变化可能是应激或暂时的不适。',
      possibleConditions: ['应激反应', '环境变化', '轻微不适', '天气影响'],
      recommendations: [
        '保持环境稳定',
        '给予更多关注',
        '观察饮食和排便',
        '如果持续就医检查',
      ],
      relatedManualIds: ['2'],
      askDoctor: false,
    },
  },
  'behavioral-moderate-result': {
    id: 'behavioral-moderate-result',
    type: 'result',
    result: {
      title: '行为异常需关注',
      severity: 'moderate',
      description: '明显行为变化可能是健康问题的信号。',
      possibleConditions: ['疼痛', '甲状腺问题', '认知问题', '慢性疾病', '焦虑症'],
      recommendations: [
        '就医检查排除疾病',
        '保持规律作息',
        '不要惩罚行为变化',
        '观察其他症状',
      ],
      relatedManualIds: ['2'],
      askDoctor: true,
    },
  },
  'behavioral-severe-result': {
    id: 'behavioral-severe-result',
    type: 'result',
    result: {
      title: '严重行为异常',
      severity: 'high',
      description: '持续严重行为变化需要医疗检查。',
      possibleConditions: ['严重疼痛', '神经系统问题', '严重感染', '器官疾病', '肿瘤'],
      recommendations: [
        '尽快就医',
        '全面健康检查',
        '不要自行处理',
        '记录行为变化',
      ],
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  other: {
    id: 'other',
    type: 'question',
    question: '请描述其他症状',
    options: [
      { id: 'other-eye', label: '眼睛问题（红肿、分泌物）', nextNodeId: 'eye-result' },
      { id: 'other-ear', label: '耳朵问题（痒、分泌物、异味）', nextNodeId: 'ear-result' },
      { id: 'other-mouth', label: '口腔问题（口臭、流涎、拒食）', nextNodeId: 'mouth-result' },
      { id: 'other-lameness', label: '跛行/行动不便', nextNodeId: 'lameness-result' },
      { id: 'other-general', label: '其他综合症状', nextNodeId: 'general-result' },
    ],
  },
  'eye-result': {
    id: 'eye-result',
    type: 'result',
    result: {
      title: '眼睛问题',
      severity: 'moderate',
      description: '眼部不适可能是感染、炎症或其他问题。',
      possibleConditions: ['结膜炎', '角膜炎', '干眼症', '眼部外伤', '青光眼'],
      recommendations: [
        '不要让宠物抓眼睛',
        '用生理盐水清洁分泌物',
        '建议就医检查',
        '不要自行用药',
      ],
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'ear-result': {
    id: 'ear-result',
    type: 'result',
    result: {
      title: '耳朵问题',
      severity: 'moderate',
      description: '耳朵问题常见，可能是感染或寄生虫。',
      possibleConditions: ['耳螨', '细菌感染', '真菌感染', '过敏', '耳道异物'],
      recommendations: [
        '不要让宠物抓耳朵',
        '保持耳朵干燥',
        '建议就医检查',
        '可能需要清理耳道',
      ],
      relatedManualIds: ['7'],
      askDoctor: true,
    },
  },
  'mouth-result': {
    id: 'mouth-result',
    type: 'result',
    result: {
      title: '口腔问题',
      severity: 'moderate',
      description: '口腔问题会影响进食和整体健康。',
      possibleConditions: ['牙周病', '口腔溃疡', '牙齿问题', '口腔肿瘤', '牙龈炎'],
      recommendations: [
        '检查口腔情况',
        '提供软食',
        '建议就医检查',
        '注意口腔卫生',
      ],
      relatedManualIds: ['4'],
      askDoctor: true,
    },
  },
  'lameness-result': {
    id: 'lameness-result',
    type: 'result',
    result: {
      title: '跛行问题',
      severity: 'moderate',
      description: '跛行可能是关节、肌肉或骨骼问题。',
      possibleConditions: ['关节炎', '韧带损伤', '骨折', '关节脱位', '椎间盘问题'],
      recommendations: [
        '限制活动',
        '不要让宠物跳',
        '建议就医检查',
        '可能需要X光检查',
      ],
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
  'general-result': {
    id: 'general-result',
    type: 'result',
    result: {
      title: '综合症状',
      severity: 'moderate',
      description: '综合症状建议就医全面检查。',
      possibleConditions: ['多种可能', '需要专业诊断'],
      recommendations: [
        '记录所有症状',
        '建议就医检查',
        '观察症状变化',
        '提供详细病史给医生',
      ],
      relatedManualIds: ['3'],
      askDoctor: true,
    },
  },
};
