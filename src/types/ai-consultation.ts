export type ConsultationType = 'chat' | 'photo_analysis' | 'report' | 'voice_input';

export type MessageType = 'text' | 'image' | 'voice' | 'system' | 'mixed';

export type MessageStatus = 'sending' | 'sent' | 'error' | 'processing';

export interface ImageAnalysisResult {
  id: string;
  imageUrl: string;
  analysisType: 'symptom' | 'general' | 'food' | 'environment' | 'behavior';
  detectedIssues: string[];
  confidence: number;
  description: string;
  recommendations: string[];
  severityLevel: 'low' | 'medium' | 'high' | 'urgent';
  petType?: string;
  analyzedAt: string;
}

export interface VoiceRecognitionResult {
  id: string;
  audioUrl: string;
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
  detectedKeywords: string[];
  processedAt: string;
}

export interface ColloquialExpression {
  original: string;
  standard: string;
  category: 'slang' | 'dialect' | 'abbreviation' | 'emotional' | 'internet';
  contextHint?: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'voice';
  url: string;
  name?: string;
  size?: number;
  duration?: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType: MessageType;
  attachments?: MessageAttachment[];
  status?: MessageStatus;
  createdAt: string;
}

export interface ConversationContext {
  petInfo?: {
    type?: string;
    breed?: string;
    age?: number;
    gender?: string;
    weight?: number;
  };
  discussedTopics: string[];
  mentionedSymptoms: string[];
  lastIntent?: string;
}

export interface AIConsultation {
  id: string;
  petId: string;
  type: ConsultationType;
  title: string;
  messages: AIMessage[];
  context: ConversationContext;
  createdAt: string;
  updatedAt: string;
}

export interface TrendReport {
  id: string;
  petId: string;
  period: '7d' | '30d' | '90d';
  title: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  healthScore: number;
  chartsData: any;
  createdAt: string;
}

export interface ConversationHistory {
  id: string;
  petId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export const QUICK_QUESTIONS = [
  '我的猫最近食欲不振，怎么办？',
  '狗狗呕吐了需要去医院吗？',
  '如何判断宠物是否发烧？',
  '宠物驱虫多久一次？',
  '猫咪应激反应有哪些表现？',
  '狗狗换牙期需要注意什么？',
];

export const SYMPTOM_KEYWORDS = [
  '食欲不振', '呕吐', '腹泻', '咳嗽', '发烧', '脱毛',
  '嗜睡', '攻击性', '焦虑', '口臭', '眼屎', '耳垢',
  '跛行', '瘙痒', '打喷嚏', '流鼻涕', '便秘', '尿频',
];

export const INPUT_VALIDATION_CONFIG = {
  maxLength: 2000,
  minLength: 2,
  maxAttachments: 5,
  maxAttachmentSize: 10 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedAudioTypes: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'],
};

export const PROHIBITED_CONTENT_PATTERNS = [
  { pattern: /暴力|虐待|打|踢|摔|扔|砸|杀|死|毒|药死/gi, category: 'violence', severity: 'high' },
  { pattern: /色情|裸体|性/gi, category: 'adult', severity: 'high' },
  { pattern: /赌博|赌钱|赌狗/gi, category: 'gambling', severity: 'medium' },
  { pattern: /毒品|吸毒|贩毒/gi, category: 'drugs', severity: 'high' },
  { pattern: /诈骗|骗钱|骗人/gi, category: 'fraud', severity: 'medium' },
  { pattern: /政治敏感|反动|颠覆/gi, category: 'political', severity: 'high' },
  { pattern: /恐怖|恐怖主义|恐怖分子/gi, category: 'terrorism', severity: 'high' },
  { pattern: /歧视|种族歧视|性别歧视/gi, category: 'discrimination', severity: 'medium' },
  { pattern: /诅咒|咒骂|骂人/gi, category: 'profanity', severity: 'low' },
  { pattern: /广告|推销|营销|卖货/gi, category: 'spam', severity: 'low' },
];

export const MULTILINGUAL_CONFIG = {
  supportedLanguages: ['zh-CN', 'zh-TW', 'en-US', 'en-GB', 'ja', 'ko'],
  defaultLanguage: 'zh-CN',
  languageDetectionPatterns: {
    'zh-CN': [/[\u4e00-\u9fa5]/, /怎么|什么|为什么|如何/],
    'zh-TW': [/[\u4e00-\u9fa5]/, /怎麼|甚麼|為甚麼|如何/],
    'en-US': [/^[a-zA-Z\s,.!?]+$/, /what|why|how|when|where/],
    'en-GB': [/^[a-zA-Z\s,.!?]+$/, /what|why|how|when|where/],
    'ja': [/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fa5]/, /どう|なぜ|何|いつ/],
    'ko': [/[\uac00-\ud7af]/, /어떻게|왜|무엇|언제/],
  },
};

export interface InputValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
  detectedLanguage?: string;
  hasProhibitedContent?: boolean;
  prohibitedCategories?: string[];
  contentLength?: number;
}

export const INTENT_KEYWORDS = {
  diagnosis: ['是什么原因', '为什么', '怎么回事', '是什么病', '诊断', '什么问题', '出了什么', '怎么得的', '病因', '得病', '生病', '不舒服', '异常', '不对劲', '怪怪的', '看起来不好', '状态不好'],
  treatment: ['怎么治', '吃什么药', '怎么处理', '治疗方法', '怎么办', '咋办', '咋治', '咋弄', '能治吗', '好治吗', '用药', '吃药', '治疗', '治愈', '康复', '好转', '恢复', '搞定', '解决'],
  prevention: ['如何预防', '怎么预防', '注意事项', '怎么避免', '预防措施', '防范', '防止', '避免', '预防方法', '预防技巧', '预防知识', '预防建议', '预防指南', '预防要点'],
  nutrition: ['吃什么', '饮食', '营养', '喂食', '狗粮', '猫粮', '喂啥', '给啥吃', '吃啥好', '吃啥', '食谱', '饭', '饭量', '食量', '喂饭', '喂粮', '零食', '罐头', '主食', '辅食', '补品', '营养品', '维生素', '钙', '蛋白质'],
  behavior: ['行为', '训练', '习惯', '性格', '脾气', '习性', '动作', '表现', '举动', '反应', '态度', '脾气不好', '脾气大', '凶', '乖', '听话', '不听话', '调皮', '捣乱', '搞破坏', '乱叫', '乱跑', '乱咬', '乱抓'],
  emergency: ['紧急', '急救', '马上', '立即', '危险', '严重', '急', '急救', '快', '赶紧', '赶快', '立刻', '马上', '紧急情况', '危急', '生命危险', '救命', '来不及', '等不及', '很严重', '特别严重', '非常严重', '挺严重', '相当严重', '严重吗', '危险吗', '有危险吗', '会死吗', '会不会死', '能不能救', '还有救吗'],
  consultation: ['咨询', '问问', '请教', '求助', '帮忙', '帮帮我', '帮我看', '帮我分析', '帮我判断', '帮我看看', '帮我想想', '帮我查查', '帮我了解', '帮我确认', '帮我确定'],
  confirmation: ['是这样吗', '对吗', '正确吗', '确定吗', '确认', '是不是', '对不对', '行不行', '可以吗', '能行吗', '没问题吗', '正常吗', '正常不', '算正常吗', '算不算正常'],
  comparison: ['哪个好', '哪个更好', '哪个更适合', '比较', '对比', '区别', '差别', '不同', '差异', '选哪个', '怎么选', '选择', '抉择', '对比一下', '比较一下'],
  followup: ['还有', '另外', '还有呢', '然后呢', '接下来', '继续', '接着', '还有其他', '还有什么', '补充', '补充一下', '再说一下', '再问一下', '再聊聊'],
  clarification: ['什么意思', '不懂', '不明白', '不理解', '不清楚', '不太懂', '不太明白', '不太理解', '不太清楚', '解释一下', '说明一下', '详细说说', '详细解释', '详细说明', '具体点', '详细点', '再详细点'],
  cost: ['多少钱', '费用', '价格', '花费', '贵不贵', '便宜', '划算', '贵吗', '便宜吗', '多少钱大概', '大概多少钱', '预算', '开销', '支出', '成本'],
  time: ['多久', '什么时候', '时间', '多长时间', '几天', '几周', '几个月', '多久能好', '多久恢复', '多久见效', '什么时候能好', '什么时候恢复', '什么时候见效', '需要多久', '要多久'],
  quantity: ['多少', '多大', '多长', '多重', '多少量', '多少次', '多少个', '多大剂量', '多大用量', '多少合适', '多少适量', '适量', '适量多少', '合适多少'],
};

export const AMBIGUOUS_KEYWORDS = [
  '不舒服', '不好', '有问题', '不对', '异常', '奇怪', '怪', '不好说', '说不清', '不清楚',
  '好像', '似乎', '可能', '大概', '也许', '不确定', '不太确定', '不太清楚', '不太明白',
  '有点', '稍微', '一点', '略微', '轻微', '轻度', '中度', '重度', '严重程度不确定',
];

export const MULTI_INTENT_INDICATORS = [
  '和', '并且', '同时', '另外', '还有', '也', '又', '以及', '同时还有', '一方面', '另一方面',
  '既', '又', '不仅', '而且', '除了', '还有', '先是', '然后', '接着', '之后', '最后',
  '第一', '第二', '第三', '首先', '其次', '再次', '最后', '一来', '二来',
];

export const INTERNET_SLANG = {
  'yyds': '永远的神/最好的',
  'emo': '情绪低落/抑郁',
  '破防': '心理防线被突破/受不了了',
  '躺平': '不想动/懒洋洋',
  '摆烂': '放弃/不努力',
  '内卷': '过度竞争',
  '摸鱼': '偷懒/不认真',
  '社死': '尴尬/丢脸',
  '绝绝子': '非常好/很棒',
  '无语子': '无语/无语了',
  '暴风哭泣': '哭得很厉害',
  '笑死': '很好笑',
  '狠狠': '非常/很',
  '真的会谢': '真的感谢/真的无语',
  '栓Q': '谢谢',
  '芭比Q了': '完了/完蛋了',
  '完了芭比Q': '完了/完蛋了',
  '达咩': '不行/拒绝',
  '哒咩': '不行/拒绝',
  '不可以': '不行',
  '咱就是说': '就是说',
  '一整个': '完全/整个',
  '大无语': '非常无语',
  '家人们': '大家/各位',
  '集美们': '姐妹们',
  '兄弟们': '兄弟们',
  '宝子们': '宝贝们/亲爱的',
  '亲': '亲爱的',
  '亲亲': '亲一下',
  '么么哒': '亲一下',
  '萌萌哒': '很可爱',
  '可爱死了': '非常可爱',
  '爱了爱了': '很喜欢',
  '心动了': '喜欢/心动',
  '入股不亏': '值得尝试',
  '安利': '推荐',
  '踩雷': '遇到不好的',
  '翻车': '失败/出问题',
  '打call': '支持/加油',
  '冲': '加油/努力',
  '冲冲冲': '加油加油加油',
  '冲鸭': '加油',
  '奥利给': '加油/给力',
  '给力': '很好/厉害',
  '赞': '好/很好',
  '好评': '好的评价',
  '差评': '不好的评价',
  '翻白眼': '无语/不屑',
  '汗': '无语/尴尬',
  '汗颜': '尴尬/不好意思',
  '捂脸': '尴尬/不好意思',
  '哭晕在厕所': '很伤心/很无奈',
  '笑哭': '又笑又哭',
  '狗头保命': '开玩笑/调侃',
  '狗头': '开玩笑/调侃',
  '滑稽': '好笑/搞笑',
  '机智': '聪明',
  '厉害': '很好/很强',
  '牛': '厉害',
  '牛批': '厉害',
  '牛逼': '厉害',
  '666': '厉害/很棒',
  '六六六': '厉害/很棒',
  '太强了': '厉害',
  '绝了': '很好/很厉害',
  '神了': '很好/很厉害',
  '神仙': '非常好',
  '神仙级别': '非常好',
  '天花板': '最高级别/最好',
  '顶流': '顶级/最好',
  '宝藏': '很好的发现',
  '宝藏级': '非常好的',
  '宝藏男孩女孩': '很好的人',
  '宝藏宠物': '很好的宠物',
};

export const DIALECT_EXPRESSIONS = {
  '咋': '怎么',
  '咋了': '怎么了',
  '咋回事': '怎么回事',
  '咋办': '怎么办',
  '咋整': '怎么办',
  '咋弄': '怎么办',
  '咋治': '怎么治',
  '咋样': '怎么样',
  '咋个好': '怎么好',
  '啥': '什么',
  '啥事': '什么事',
  '啥情况': '什么情况',
  '啥意思': '什么意思',
  '啥问题': '什么问题',
  '啥毛病': '什么毛病',
  '啥病': '什么病',
  '啥症状': '什么症状',
  '啥原因': '什么原因',
  '啥原因导致': '什么原因导致',
  '啥导致的': '什么导致的',
  '啥引起的': '什么引起的',
  '啥玩意': '什么东西',
  '啥东西': '什么东西',
  '啥时候': '什么时候',
  '啥地方': '什么地方',
  '啥位置': '什么位置',
  '啥部位': '什么部位',
  '弄': '做/搞',
  '弄一下': '做一下',
  '弄好': '做好',
  '弄不好': '做不好',
  '弄坏了': '搞坏了',
  '整': '做/搞',
  '整一下': '做一下',
  '整好': '做好',
  '整不好': '做不好',
  '整坏了': '搞坏了',
  '搞': '做',
  '搞一下': '做一下',
  '搞好': '做好',
  '搞不好': '做不好',
  '搞坏了': '弄坏了',
  '搞砸了': '做失败了',
  '搞不定': '做不到',
  '搞得到': '能做',
  '搞不到': '做不到',
  '俺': '我',
  '俺家': '我家',
  '俺的': '我的',
  '俺们': '我们',
  '咱': '我/我们',
  '咱家': '我家',
  '咱的': '我的',
  '咱们': '我们',
  '偶': '我',
  '偶家': '我家',
  '偶的': '我的',
  '侬': '你',
  '侬家': '你家',
  '侬的': '你的',
  '阿拉': '我们',
  '阿拉家': '我们家',
  '阿拉的': '我们的',
  '唔': '不',
  '唔好': '不好',
  '唔行': '不行',
  '唔可以': '不可以',
  '唔能': '不能',
  '唔会': '不会',
  '唔是': '不是',
  '唔要': '不要',
  '唔想': '不想',
  '唔知': '不知道',
  '唔懂': '不懂',
  '唔明': '不明白',
  '唔清楚': '不清楚',
  '唔确定': '不确定',
  '唔一定': '不一定',
  '唔太': '不太',
  '唔太好': '不太好',
  '唔太清楚': '不太清楚',
  '唔太确定': '不太确定',
  '唔太明白': '不太明白',
  '唔太懂': '不太懂',
};