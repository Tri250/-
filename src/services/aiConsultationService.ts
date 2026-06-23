import type { AIMessage, ConversationContext, ImageAnalysisResult, VoiceRecognitionResult, InputValidationResult } from '../types/ai-consultation';
import { INTENT_KEYWORDS, AMBIGUOUS_KEYWORDS, MULTI_INTENT_INDICATORS, INTERNET_SLANG, DIALECT_EXPRESSIONS, INPUT_VALIDATION_CONFIG, PROHIBITED_CONTENT_PATTERNS, MULTILINGUAL_CONFIG } from '../types/ai-consultation';
import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

interface AIResponse {
  content: string;
  confidence: number;
  source?: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  detectedIntents?: string[];
  isMultiIntent?: boolean;
  imageAnalysis?: ImageAnalysisResult;
  voiceResult?: VoiceRecognitionResult;
  severity?: 'low' | 'medium' | 'high' | 'urgent';
  reasoning?: string[];
  alternatives?: string[];
}

// 严重程度评估配置
const SEVERITY_ASSESSMENT = {
  // 紧急情况关键词（需要立即就医）
  urgent: {
    keywords: ['抽搐', '痉挛', '癫痫', '昏迷', '昏厥', '意识不清', '呼吸困难', '喘不过气', '张口呼吸',
               '大量出血', '血不止', '喷血', '中毒', '误食巧克力', '误食洋葱', '误食葡萄', '吃老鼠药',
               '尿闭', '无法排尿', '尿不出来', '骨折', '断腿', '瘫痪', '站不起来', '完全不能动',
               '眼球突出', '眼睛受伤严重', '持续呕吐', '呕吐不止', '吐血', '严重腹泻', '血便', '拉血'],
    response: '🚨 **紧急情况警告** 🚨\n\n这是**紧急情况**，需要立即就医！\n\n**请立即采取以下措施：**\n1. ⏰ 立即联系最近的24小时宠物医院\n2. 🚗 尽快将宠物送往医院，途中保持安静和温暖\n3. 📝 记录症状发生的时间和表现\n4. ⛔ 不要自行用药或处理，等待专业兽医\n\n**时间非常关键！** 这种情况延误可能导致严重后果。',
  },
  // 高严重程度（尽快就医）
  high: {
    keywords: ['高烧', '体温超过40', '体温41', '严重', '很严重', '非常严重', '肿块', '包块', '肿瘤',
               '心脏病', '肾衰竭', '肝衰竭', '糖尿病', '细小', '犬瘟', '猫瘟', '传腹',
               '持续', '不止', '频繁', '精神萎靡', '不吃不喝', '完全不吃'],
    response: '⚠️ **紧急提示** ⚠️\n\n这种情况需要**尽快就医**（建议24小时内）。\n\n**建议措施：**\n1. 📞 尽快预约宠物医院\n2. 👀 继续观察症状变化，如有加重立即就医\n3. 📝 记录症状详情供兽医参考\n4. ⛔ 避免自行用药\n\n如果症状加重或出现其他严重表现，请立即就医！',
  },
  // 中等严重程度
  medium: {
    keywords: ['呕吐', '腹泻', '拉肚子', '食欲不振', '不吃', '没胃口', '咳嗽', '打喷嚏',
               '皮肤问题', '红肿', '脱毛', '瘙痒', '抓挠', '耳炎', '眼睛发炎',
               '跛行', '腿瘸', '关节疼', '口臭', '牙结石'],
    response: '📋 **建议关注**\n\n这种情况建议观察24-48小时，如症状持续或加重请就医。\n\n**建议措施：**\n1. 👀 密切观察症状变化\n2. 📝 记录症状出现时间和表现\n3. 🏠 保持舒适环境\n4. 💧 确保充足饮水',
  },
  // 低严重程度
  low: {
    keywords: ['驱虫', '疫苗', '体检', '洗澡', '美容', '训练', '喂养', '饮食', '营养',
               '绝育', '配种', '怀孕', '换牙', '社会化', '行为问题'],
    response: 'ℹ️ **一般咨询**\n\n这是日常护理相关问题，以下是一些建议：',
  },
};

// 意图优先级
const INTENT_PRIORITY: Record<string, number> = {
  emergency: 100,
  diagnosis: 90,
  treatment: 80,
  prevention: 70,
  nutrition: 60,
  behavior: 50,
  consultation: 40,
  confirmation: 30,
  comparison: 25,
  followup: 20,
  clarification: 15,
  cost: 10,
  time: 10,
  quantity: 10,
};

interface IntentAnalysisResult {
  intents: string[];
  isAmbiguous: boolean;
  ambiguityReason?: string;
  isMultiIntent: boolean;
  processedMessage: string;
  detectedSlang: string[];
  detectedDialect: string[];
}

interface ColloquialPattern {
  pattern: RegExp;
  standardForm: string;
  category: 'slang' | 'dialect' | 'abbreviation' | 'emotional' | 'internet';
  contextHint?: string;
}

const colloquialPatterns: ColloquialPattern[] = [
  { pattern: /拉垮|拉跨/gi, standardForm: '不好/质量差', category: 'slang' },
  { pattern: /绝了|绝绝子/gi, standardForm: '非常好/很厉害', category: 'slang' },
  { pattern: /无语|无语子/gi, standardForm: '无语/无奈', category: 'slang' },
  { pattern: /破防/gi, standardForm: '受不了/崩溃', category: 'slang' },
  { pattern: /躺平/gi, standardForm: '不想动/懒洋洋', category: 'slang' },
  { pattern: /摆烂/gi, standardForm: '放弃/不努力', category: 'slang' },
  { pattern: /emo/gi, standardForm: '情绪低落/抑郁', category: 'slang' },
  { pattern: /芭比Q|芭比q/gi, standardForm: '完了/完蛋了', category: 'slang' },
  { pattern: /栓Q|栓q/gi, standardForm: '谢谢', category: 'slang' },
  { pattern: /达咩|哒咩/gi, standardForm: '不行/拒绝', category: 'slang' },
  { pattern: /冲鸭|冲冲冲/gi, standardForm: '加油/努力', category: 'slang' },
  { pattern: /奥利给/gi, standardForm: '加油/给力', category: 'slang' },
  { pattern: /666|六六六/gi, standardForm: '厉害/很棒', category: 'slang' },
  { pattern: /yyds/gi, standardForm: '最好的/永远的神', category: 'slang' },
  { pattern: /咱就是说/gi, standardForm: '就是说', category: 'slang' },
  { pattern: /一整个/gi, standardForm: '完全/整个', category: 'slang' },
  { pattern: /家人们|集美们|宝子们/gi, standardForm: '大家/各位', category: 'slang' },
  { pattern: /萌萌哒|可爱死了/gi, standardForm: '很可爱', category: 'slang' },
  { pattern: /爱了爱了|心动了/gi, standardForm: '很喜欢', category: 'slang' },
  { pattern: /安利/gi, standardForm: '推荐', category: 'slang' },
  { pattern: /踩雷/gi, standardForm: '遇到不好的', category: 'slang' },
  { pattern: /翻车/gi, standardForm: '失败/出问题', category: 'slang' },
  { pattern: /打call/gi, standardForm: '支持/加油', category: 'slang' },
  { pattern: /狗头|狗头保命/gi, standardForm: '开玩笑/调侃', category: 'slang' },
  { pattern: /捂脸|汗|汗颜/gi, standardForm: '尴尬/不好意思', category: 'slang' },
  { pattern: /笑哭|哭晕在厕所/gi, standardForm: '无奈/哭笑不得', category: 'slang' },
  { pattern: /宝藏/gi, standardForm: '很好的发现', category: 'slang' },
  { pattern: /天花板/gi, standardForm: '最高级别/最好', category: 'slang' },
  { pattern: /绝绝子|神了|神仙/gi, standardForm: '非常好', category: 'slang' },
  { pattern: /牛批|牛逼|牛/gi, standardForm: '厉害', category: 'slang' },
  { pattern: /给力|赞|好评/gi, standardForm: '好/很好', category: 'slang' },
  { pattern: /咋了|咋回事/gi, standardForm: '怎么了/怎么回事', category: 'dialect' },
  { pattern: /咋办|咋整|咋弄/gi, standardForm: '怎么办', category: 'dialect' },
  { pattern: /咋治/gi, standardForm: '怎么治', category: 'dialect' },
  { pattern: /咋样/gi, standardForm: '怎么样', category: 'dialect' },
  { pattern: /啥事|啥情况/gi, standardForm: '什么事/什么情况', category: 'dialect' },
  { pattern: /啥意思/gi, standardForm: '什么意思', category: 'dialect' },
  { pattern: /啥问题|啥毛病/gi, standardForm: '什么问题/什么毛病', category: 'dialect' },
  { pattern: /啥病|啥症状/gi, standardForm: '什么病/什么症状', category: 'dialect' },
  { pattern: /啥原因/gi, standardForm: '什么原因', category: 'dialect' },
  { pattern: /啥时候/gi, standardForm: '什么时候', category: 'dialect' },
  { pattern: /啥地方|啥位置/gi, standardForm: '什么地方/什么位置', category: 'dialect' },
  { pattern: /俺家|俺的/gi, standardForm: '我家/我的', category: 'dialect' },
  { pattern: /咱家|咱的/gi, standardForm: '我家/我的', category: 'dialect' },
  { pattern: /偶家|偶的/gi, standardForm: '我家/我的', category: 'dialect' },
  { pattern: /阿拉家|阿拉的/gi, standardForm: '我们家/我们的', category: 'dialect' },
  { pattern: /唔好|唔行/gi, standardForm: '不好/不行', category: 'dialect' },
  { pattern: /唔知|唔懂/gi, standardForm: '不知道/不懂', category: 'dialect' },
  { pattern: /唔清楚/gi, standardForm: '不清楚', category: 'dialect' },
  { pattern: /唔太清楚|唔太明白/gi, standardForm: '不太清楚/不太明白', category: 'dialect' },
  { pattern: /有点儿|有点点/gi, standardForm: '有一点', category: 'abbreviation' },
  { pattern: /稍微有点|略微有点/gi, standardForm: '有一点', category: 'abbreviation' },
  { pattern: /不怎么|不太怎么/gi, standardForm: '不太', category: 'abbreviation' },
  { pattern: /挺严重的|蛮严重的/gi, standardForm: '很严重', category: 'emotional' },
  { pattern: /特别严重|非常严重/gi, standardForm: '很严重', category: 'emotional' },
  { pattern: /超级严重|严重死了/gi, standardForm: '非常严重', category: 'emotional' },
  { pattern: /好严重|严重得很/gi, standardForm: '很严重', category: 'emotional' },
  { pattern: /挺担心|蛮担心/gi, standardForm: '很担心', category: 'emotional' },
  { pattern: /特别担心|非常担心/gi, standardForm: '很担心', category: 'emotional' },
  { pattern: /超级担心|担心死了/gi, standardForm: '非常担心', category: 'emotional' },
  { pattern: /好担心|担心得很/gi, standardForm: '很担心', category: 'emotional' },
  { pattern: /挺着急|蛮着急/gi, standardForm: '很着急', category: 'emotional' },
  { pattern: /特别着急|非常着急/gi, standardForm: '很着急', category: 'emotional' },
  { pattern: /着急死了|急死了/gi, standardForm: '非常着急', category: 'emotional' },
  { pattern: /好着急|着急得很/gi, standardForm: '很着急', category: 'emotional' },
  { pattern: /心疼死了|心疼得很/gi, standardForm: '非常心疼', category: 'emotional' },
  { pattern: /好心疼|挺心疼/gi, standardForm: '很心疼', category: 'emotional' },
  { pattern: /吓死了|吓坏了/gi, standardForm: '很害怕', category: 'emotional' },
  { pattern: /吓死我了|吓死个人/gi, standardForm: '很害怕', category: 'emotional' },
  { pattern: /吓得不轻|吓了一跳/gi, standardForm: '很害怕', category: 'emotional' },
];

const imageAnalysisPatterns = {
  skinIssues: ['红肿', '脱毛', '皮屑', '结痂', '溃疡', '疙瘩', '疹子', '斑点', '色素沉着', '皮肤变色'],
  eyeIssues: ['眼红', '流泪', '眼屎', '眼睛睁不开', '眼睛浑浊', '瞳孔异常', '眼睑异常', '眼球突出'],
  earIssues: ['耳朵红', '耳朵肿', '耳垢多', '耳朵分泌物', '耳朵异味', '耳血肿'],
  mouthIssues: ['牙龈红', '牙龈出血', '牙齿松动', '口腔溃疡', '舌头异常', '口臭'],
  bodyIssues: ['肿块', '包块', '肿胀', '淤血', '伤口', '骨折', '变形', '不对称'],
  behaviorIssues: ['姿势异常', '走路异常', '站立困难', '躺卧异常', '表情异常'],
  foodIssues: ['食物变质', '食物颜色异常', '食物气味异常', '食物形状异常'],
  environmentIssues: ['环境脏乱', '环境危险', '环境不适', '温度异常', '湿度异常'],
};

const voiceKeywordPatterns = {
  symptoms: ['不舒服', '难受', '疼', '痛', '痒', '吐', '拉', '咳', '喘', '抖', '抽', '晕', '昏', '烧', '热', '冷'],
  emotions: ['担心', '着急', '害怕', '紧张', '焦虑', '心疼', '难过', '着急', '急', '慌'],
  urgency: ['紧急', '急', '马上', '立即', '赶紧', '赶快', '快', '立刻', '等不及', '来不及'],
  actions: ['看', '查', '检查', '观察', '摸', '量', '测', '拍', '照', '问', '咨询'],
  petTypes: ['猫', '狗', '猫咪', '狗狗', '小狗', '大狗', '小猫', '大猫', '宠物', '毛孩子'],
};

interface HealthKnowledgeBase {
  symptoms: Record<string, {
    conditions: { name: string; probability: number; severity: string; recommendation: string }[];
    generalAdvice: string[];
  }>;
  commonQuestions: Record<string, { answer: string; confidence: number }>;
  petTypeAdvice: Record<string, Record<string, string>>;
  followUpQuestions: Record<string, string[]>;
  contextResponses: Record<string, string>;
}

const symptomSynonyms: Record<string, string[]> = {
  '食欲不振': ['食欲不振', '没胃口', '不想吃', '不吃饭', '拒食', '不吃东西', '吃得少', '厌食', '食量减少', '挑食', '不吃粮', '不吃肉', '不吃零食', '对食物没兴趣', '闻闻就走', '看都不看'],
  '呕吐': ['呕吐', '吐了', '反胃', '呕', '吐', '恶心', '吐白沫', '吐黄水', '吐绿水', '吐血', '吐食物', '吐水', '干呕', '想吐吐不出来', '喷射性呕吐'],
  '咳嗽': ['咳嗽', '咳', '打喷嚏', '咳咳', '干咳', '湿咳', '有痰', '咳痰', '喘咳', '呛咳', '干呕咳嗽', '阵发性咳嗽', '持续性咳嗽', '咳得厉害', '咳出血'],
  '腹泻': ['腹泻', '拉肚子', '拉稀', '便便稀', '软便', '拉', '大便稀', '水样便', '血便', '粘液便', '黑便', '大便次数多', '频繁排便', '拉水', '拉血', '便血', '大便不成形'],
  '发烧': ['发烧', '发热', '体温高', '体温', '发烫', '热度', '高烧', '低烧', '体温升高', '身体发热', '耳朵热', '肚子热', '摸起来热', '额头热'],
  '脱毛': ['脱毛', '掉毛', '掉毛严重', '毛掉得多', '秃', '掉头发', '斑秃', '局部脱毛', '全身脱毛', '毛稀疏', '毛发脱落', '秃斑', '毛越来越少', '毛色变差'],
  '嗜睡': ['嗜睡', '贪睡', '爱睡觉', '没精神', '精神不好', '懒洋洋', '不爱动', '整天睡觉', '睡得多', '活力下降', '精神萎靡', '昏昏欲睡', '反应迟钝', '不爱玩耍'],
  '攻击性': ['攻击性', '凶', '咬人', '攻击', '脾气坏', '暴躁', '咬主人', '咬其他宠物', '攻击行为', '突然咬人', '护食咬人', '护玩具咬人', '领地攻击', '恐惧攻击'],
  '瘙痒': ['瘙痒', '痒', '抓', '挠', '皮肤痒', '一直抓', '抓破', '挠痒', '抓耳朵', '抓身体', '舔爪子', '咬尾巴', '蹭墙', '蹭地板', '频繁抓挠', '抓出血'],
  '口臭': ['口臭', '口气', '嘴巴臭', '口臭味', '臭味', '嘴巴味道重', '口腔异味', '呼吸臭', '哈气臭', '牙齿臭', '牙龈臭'],
  '眼屎': ['眼屎', '眼睛分泌物', '眼泪', '眼红', '眼睛发炎', '眼分泌物多', '眼睛睁不开', '眼睛糊住', '眼屎多', '流泪', '眼睛红肿', '眼结膜炎', '角膜炎', '眼睛浑浊'],
  '耳垢': ['耳垢', '耳朵脏', '耳屎', '耳朵臭', '抓耳朵', '耳朵分泌物', '耳朵红', '耳炎', '耳朵发炎', '耳血肿', '耳朵肿', '耳螨', '耳朵痒', '摇头', '甩头'],
  '跛行': ['跛行', '瘸', '腿瘸', '走路一瘸一拐', '不敢着地', '拖着走', '腿疼', '关节疼', '腿软', '站不稳', '走路困难', '跳跃困难', '后腿无力', '前腿无力', '四肢无力'],
  '便秘': ['便秘', '拉不出', '大便干', '排便困难', '不拉屎', '几天没拉', '大便硬', '排便费力', '蹲很久拉不出', '想拉拉不出', '大便少', '排便次数少'],
  '尿频': ['尿频', '尿多', '频繁尿', '尿血', '排尿困难', '尿少', '尿不出来', '憋尿', '尿淋漓', '尿失禁', '尿滴沥', '尿痛', '尿颜色异常', '尿浑浊', '尿有异味'],
  '焦虑': ['焦虑', '紧张', '害怕', '不安', '恐惧', '应激', '压力大', '分离焦虑', '独自在家焦虑', '怕人', '怕声音', '怕陌生人', '怕其他动物', '躲起来', '不敢出来'],
  '呼吸困难': ['呼吸困难', '喘', '喘气', '呼吸急促', '气短', '憋气', '张口呼吸', '呼吸声大', '呼吸有杂音', '喘息', '呼吸费力', '缺氧', '呼吸快', '呼吸慢', '呼吸不规则'],
  '皮肤问题': ['皮肤问题', '皮肤病', '皮屑', '皮肤红', '皮肤肿', '皮疹', '湿疹', '皮炎', '皮肤感染', '皮肤溃烂', '皮肤结痂', '皮肤起疙瘩', '皮肤脓包', '真菌感染', '细菌感染'],
  '体重变化': ['体重变化', '变瘦', '瘦了', '体重下降', '消瘦', '变胖', '胖了', '体重增加', '肥胖', '超重', '体重减轻', '瘦得快', '胖得快', '体重不稳定'],
  '饮水异常': ['饮水异常', '不喝水', '喝水少', '喝水多', '饮水量变化', '突然多喝水', '突然少喝水', '渴', '口渴', '不想喝水', '只喝一点点', '大量饮水', '饮水量增加'],
  '行为异常': ['行为异常', '行为怪异', '异常行为', '突然改变', '行为变化', '性格变化', '突然变凶', '突然变乖', '突然躲起来', '突然不爱动', '突然爱叫', '突然不爱叫', '行为反常'],
  '眼部问题': ['眼部问题', '眼睛问题', '眼睛红', '眼睛肿', '眼睛流泪', '眼睛睁不开', '眼睛浑浊', '眼睛发蓝', '眼睛发白', '瞳孔异常', '眼球震颤', '眼睛斜视', '眼睑内翻', '眼睑外翻', '青光眼', '白内障'],
  '口腔问题': ['口腔问题', '口腔溃疡', '牙龈炎', '牙龈红', '牙龈出血', '牙齿松动', '牙结石', '牙周病', '口腔肿物', '口腔肿瘤', '舌头异常', '流口水', '口水多', '吞咽困难'],
  '关节问题': ['关节问题', '关节炎', '关节肿', '关节疼', '关节僵硬', '关节变形', '关节积液', '关节磨损', '髋关节问题', '膝关节问题', '肘关节问题', '脊椎问题', '腰椎问题', '颈椎问题'],
  '神经系统问题': ['神经系统问题', '抽搐', '癫痫', '痉挛', '震颤', '抖动', '抽筋', '意识不清', '昏迷', '晕厥', '走路不稳', '共济失调', '转圈', '头部倾斜', '眼球震颤', '瘫痪'],
  '消化系统问题': ['消化系统问题', '消化不良', '胃胀', '腹胀', '肚子胀', '胃疼', '肚子疼', '肠胃不适', '胃肠炎', '胃炎', '肠炎', '胰腺炎', '肝病', '肾病', '消化道出血'],
  '泌尿系统问题': ['泌尿系统问题', '尿路感染', '膀胱炎', '尿道炎', '尿结石', '膀胱结石', '肾结石', '肾炎', '肾功能不全', '尿毒症', '膀胱肿瘤', '尿道阻塞', '尿闭'],
  '生殖系统问题': ['生殖系统问题', '子宫蓄脓', '乳腺炎', '乳腺肿瘤', '睾丸炎', '前列腺炎', '前列腺肥大', '阴道炎', '难产', '假孕', '发情异常', '不孕', '流产'],
  '心血管问题': ['心血管问题', '心脏病', '心力衰竭', '心律不齐', '心跳过快', '心跳过慢', '心脏杂音', '心肌病', '心脏瓣膜病', '动脉硬化', '贫血', '血压异常', '血栓'],
  '呼吸系统问题': ['呼吸系统问题', '肺炎', '支气管炎', '气管炎', '肺水肿', '肺气肿', '哮喘', '呼吸道感染', '上呼吸道感染', '下呼吸道感染', '鼻腔问题', '鼻窦炎', '喉炎'],
  '传染病': ['传染病', '犬瘟', '猫瘟', '细小病毒', '冠状病毒', '狂犬病', '传染性肝炎', '传染性腹膜炎', '猫传腹', '猫艾滋', '猫白血病', '犬副流感', '犬传染性气管支气管炎'],
  '寄生虫病': ['寄生虫病', '蛔虫', '钩虫', '绦虫', '鞭虫', '心丝虫', '跳蚤', '蜱虫', '螨虫', '耳螨', '疥螨', '虱子', '球虫', '弓形虫', '贾第鞭毛虫'],
  '中毒': ['中毒', '吃错东西', '误食', '食物中毒', '药物中毒', '化学中毒', '巧克力中毒', '洋葱中毒', '葡萄中毒', '老鼠药中毒', '清洁剂中毒', '农药中毒', '重金属中毒'],
  '外伤': ['外伤', '受伤', '伤口', '骨折', '扭伤', '拉伤', '挫伤', '烧伤', '烫伤', '割伤', '咬伤', '抓伤', '撞伤', '摔伤', '出血', '流血', '淤血', '血肿'],
  '肿瘤': ['肿瘤', '癌症', '肿块', '瘤子', '包块', '肉瘤', '骨瘤', '脂肪瘤', '乳腺瘤', '淋巴瘤', '黑色素瘤', '鳞状细胞癌', '肥大细胞瘤', '良性肿瘤', '恶性肿瘤'],
  '老年疾病': ['老年疾病', '老年痴呆', '认知障碍', '阿尔茨海默', '关节老化', '器官衰竭', '肾功能衰退', '心脏老化', '视力下降', '听力下降', '老年性白内障', '老年性关节炎'],
  '幼宠问题': ['幼宠问题', '幼犬问题', '幼猫问题', '小狗问题', '小猫问题', '发育不良', '生长缓慢', '先天缺陷', '遗传病', '佝偻病', '软骨病', '脐疝', '隐睾', '肛门闭锁'],
};

const questionSynonyms: Record<string, string[]> = {
  '驱虫': ['驱虫', '打虫', '寄生虫', '体内驱虫', '体外驱虫', '虫子', '蛔虫', '跳蚤', '蜱虫', '心丝虫', '绦虫', '钩虫', '螨虫', '耳螨', '疥螨', '球虫', '弓形虫', '驱虫药', '驱虫时间', '驱虫频率', '怎么驱虫', '驱虫方法'],
  '疫苗': ['疫苗', '打针', '免疫', '预防针', '接种', '狂犬', '猫三联', '狗四联', '犬五联', '犬七联', '猫五联', '疫苗接种', '疫苗时间', '疫苗频率', '疫苗副作用', '疫苗反应', '疫苗注意事项', '什么时候打疫苗', '疫苗价格', '疫苗种类'],
  '体检': ['体检', '检查', '健康检查', '身体检查', '查体', '化验', '血常规', '生化检查', 'X光', 'B超', '心电图', '尿检', '粪检', '体检项目', '体检费用', '体检时间', '体检频率', '体检报告', '体检结果', '体检注意事项'],
  '换牙': ['换牙', '长牙', '牙齿', '乳牙', '双排牙', '掉牙', '恒牙', '牙齿发育', '换牙时间', '换牙期', '换牙症状', '换牙注意事项', '牙齿护理', '刷牙', '洁牙', '牙齿问题', '牙结石', '牙周病', '牙龈炎'],
  '应激': ['应激', '紧张', '害怕', '焦虑', '适应', '新环境', '搬家', '新宠物', '新主人', '应激反应', '应激症状', '应激处理', '应激预防', '应激原因', '应激治疗', '应激药物', '应激管理', '环境变化', '社交化'],
  '发烧判断': ['发烧', '发热', '体温', '量体温', '测体温', '温度', '体温计', '体温测量', '体温正常值', '体温范围', '体温偏高', '体温偏低', '发烧症状', '发烧原因', '发烧处理', '发烧治疗', '退烧', '退烧药', '物理降温'],
  '饮水量': ['喝水', '饮水', '喝水量', '水量', '水', '不喝水', '喝水多', '喝水少', '饮水量正常', '饮水量异常', '饮水建议', '饮水方法', '饮水器', '饮水机', '流动水', '自来水', '矿泉水', '纯净水', '湿粮补水', '补水'],
  '体重管理': ['体重', '减肥', '胖', '瘦', '体型', '超重', '肥胖', '体重控制', '体重监测', '体重标准', '体重范围', '体重异常', '体重增加', '体重减少', '减肥方法', '减肥饮食', '减肥运动', '增重', '增肥', '体脂率', 'BCS评分'],
  '绝育': ['绝育', '去势', '结扎', '阉割', '做手术', '摘除', '绝育手术', '绝育时间', '绝育年龄', '绝育好处', '绝育风险', '绝育费用', '绝育恢复', '绝育护理', '绝育后注意事项', '绝育副作用', '绝育后行为变化', '绝育后体重变化', '公猫绝育', '母猫绝育', '公狗绝育', '母狗绝育'],
  '喂养': ['喂养', '喂食', '吃', '狗粮', '猫粮', '食物', '营养', '饮食', '喂食时间', '喂食频率', '喂食量', '喂食方法', '主食', '零食', '罐头', '干粮', '湿粮', '自制食物', '生骨肉', '营养搭配', '营养需求', '营养补充', '维生素', '矿物质', '蛋白质', '脂肪', '碳水化合物'],
  '洗澡': ['洗澡', '洗浴', '清洁', '沐浴', '香波', '洗毛', '洗澡频率', '洗澡时间', '洗澡方法', '洗澡注意事项', '洗澡水温', '洗澡用品', '洗澡步骤', '洗澡后护理', '吹干', '梳毛', '美容', '修剪', '指甲修剪', '耳朵清洁', '眼睛清洁'],
  '训练': ['训练', '教', '学会', '行为', '习惯', '指令', '服从训练', '行为训练', '社会化训练', '基础训练', '高级训练', '训练方法', '训练技巧', '训练时间', '训练频率', '训练奖励', '训练惩罚', '训练工具', '训练用品', '训练师', '训练课程', '训练问题', '训练效果'],
  '社交化': ['社交化', '社交', '交友', '相处', '接触', '社会化训练', '社交训练', '社交时间', '社交方法', '社交问题', '社交恐惧', '社交焦虑', '社交技巧', '社交环境', '社交对象', '社交机会', '社交重要性', '社交好处', '社交风险'],
  '睡眠': ['睡眠', '睡觉', '休息', '睡眠时间', '睡眠质量', '睡眠问题', '睡眠习惯', '睡眠环境', '睡眠位置', '睡眠姿势', '睡眠异常', '睡眠过多', '睡眠不足', '睡眠障碍', '失眠', '嗜睡', '睡眠建议', '睡眠改善'],
  '运动': ['运动', '活动', '锻炼', '散步', '遛狗', '跑步', '玩耍', '运动量', '运动时间', '运动频率', '运动方式', '运动建议', '运动不足', '运动过度', '运动损伤', '运动恢复', '运动好处', '运动风险', '运动环境', '运动工具', '运动用品'],
  '环境': ['环境', '居住', '生活', '空间', '环境布置', '环境设置', '环境适应', '环境变化', '环境安全', '环境危险', '环境清洁', '环境消毒', '环境温度', '环境湿度', '环境噪音', '环境光线', '环境气味', '环境改善', '环境优化'],
  '安全': ['安全', '危险', '风险', '安全措施', '安全检查', '安全隐患', '安全环境', '安全用品', '安全行为', '安全意识', '安全训练', '安全预防', '安全急救', '安全知识', '安全提示', '安全警告', '安全建议', '安全注意事项'],
  '急救': ['急救', '紧急', '急救措施', '急救方法', '急救步骤', '急救知识', '急救技能', '急救用品', '急救包', '急救药品', '急救电话', '急救医院', '急救时间', '急救重要性', '急救准备', '急救培训', '急救案例', '急救经验'],
  '药物': ['药物', '药', '吃药', '用药', '药物种类', '药物作用', '药物副作用', '药物剂量', '药物时间', '药物频率', '药物方法', '药物注意事项', '药物禁忌', '药物过敏', '药物反应', '药物存储', '药物过期', '药物购买', '药物使用', '药物选择', '药物咨询', '药物推荐'],
  '医院': ['医院', '诊所', '兽医', '医生', '医院选择', '医院推荐', '医院费用', '医院服务', '医院时间', '医院预约', '医院检查', '医院治疗', '医院手术', '医院住院', '医院出院', '医院复查', '医院随访', '医院记录', '医院报告', '医院诊断'],
  '费用': ['费用', '价格', '成本', '花费', '费用预算', '费用控制', '费用节省', '费用比较', '费用估算', '费用明细', '费用项目', '费用支付', '费用报销', '费用保险', '费用记录', '费用管理', '费用建议', '费用问题', '费用咨询'],
  '保险': ['保险', '宠物保险', '保险种类', '保险费用', '保险范围', '保险理赔', '保险购买', '保险选择', '保险推荐', '保险比较', '保险好处', '保险风险', '保险注意事项', '保险条款', '保险合同', '保险期限', '保险续期', '保险取消', '保险咨询'],
  '旅行': ['旅行', '出行', '旅游', '搬家', '旅行准备', '旅行用品', '旅行方法', '旅行注意事项', '旅行安全', '旅行风险', '旅行建议', '旅行经验', '旅行案例', '旅行问题', '旅行咨询', '旅行安排', '旅行计划', '旅行时间', '旅行距离', '旅行方式'],
  '季节': ['季节', '夏天', '冬天', '春天', '秋天', '季节变化', '季节注意', '季节护理', '季节问题', '季节建议', '季节疾病', '季节预防', '季节适应', '季节准备', '季节用品', '季节饮食', '季节运动', '季节环境', '季节温度', '季节湿度'],
  '年龄': ['年龄', '年龄阶段', '幼宠', '成年', '老年', '年龄问题', '年龄护理', '年龄建议', '年龄疾病', '年龄预防', '年龄适应', '年龄变化', '年龄特点', '年龄需求', '年龄营养', '年龄运动', '年龄行为', '年龄健康', '年龄寿命', '年龄估算'],
  '品种': ['品种', '种类', '品种特点', '品种问题', '品种疾病', '品种护理', '品种建议', '品种行为', '品种性格', '品种需求', '品种营养', '品种运动', '品种健康', '品种寿命', '品种选择', '品种比较', '品种推荐', '品种咨询', '品种知识'],
  '性格': ['性格', '脾气', '个性', '性格特点', '性格问题', '性格行为', '性格训练', '性格适应', '性格变化', '性格评估', '性格改善', '性格建议', '性格咨询', '性格知识', '性格类型', '性格分析', '性格影响', '性格因素'],
  '寿命': ['寿命', '生命', '寿命长度', '寿命延长', '寿命因素', '寿命建议', '寿命护理', '寿命健康', '寿命问题', '寿命咨询', '寿命知识', '寿命统计', '寿命数据', '寿命研究', '寿命案例', '寿命经验'],
  '繁殖': ['繁殖', '生育', '怀孕', '生产', '繁殖时间', '繁殖年龄', '繁殖准备', '繁殖护理', '繁殖建议', '繁殖问题', '繁殖风险', '繁殖费用', '繁殖咨询', '繁殖知识', '繁殖方法', '繁殖选择', '繁殖控制', '繁殖管理'],
  '遗传': ['遗传', '遗传病', '遗传问题', '遗传疾病', '遗传因素', '遗传风险', '遗传预防', '遗传检测', '遗传咨询', '遗传知识', '遗传研究', '遗传案例', '遗传经验', '遗传建议', '遗传护理', '遗传管理'],
  '营养': ['营养', '营养需求', '营养补充', '营养缺乏', '营养过剩', '营养均衡', '营养建议', '营养咨询', '营养知识', '营养问题', '营养食物', '营养品', '营养剂', '营养方案', '营养计划', '营养管理', '营养评估'],
  '行为问题': ['行为问题', '行为异常', '行为障碍', '行为矫正', '行为治疗', '行为咨询', '行为建议', '行为知识', '行为案例', '行为经验', '行为预防', '行为管理', '行为训练', '行为方法', '行为技巧', '行为工具', '行为用品'],
  '心理健康': ['心理健康', '心理问题', '心理疾病', '心理护理', '心理建议', '心理咨询', '心理治疗', '心理预防', '心理管理', '心理知识', '心理案例', '心理经验', '心理因素', '心理影响', '心理评估', '心理改善'],
};

const healthKnowledgeBase: HealthKnowledgeBase = {
  symptoms: {
    '食欲不振': {
      conditions: [
        { name: '应激反应', probability: 0.4, severity: 'low', recommendation: '提供安静环境，尝试不同食物，观察24-48小时。可尝试加热食物增加香味，或更换食物品牌' },
        { name: '消化系统问题', probability: 0.3, severity: 'medium', recommendation: '暂时禁食12小时，提供清水，如持续请就医。观察是否有呕吐、腹泻等伴随症状' },
        { name: '口腔问题', probability: 0.2, severity: 'medium', recommendation: '检查口腔是否有异物、炎症、牙结石或溃疡。如有口臭、流口水需进一步检查' },
        { name: '潜在疾病', probability: 0.1, severity: 'high', recommendation: '如伴随其他症状（发热、呕吐、腹泻、精神萎靡）请立即就医。可能涉及肝肾疾病、传染病等' },
      ],
      generalAdvice: ['保持食物新鲜，避免放置过久', '提供多种食物选择，尝试不同口味', '定时定量喂食，建立规律饮食习惯', '观察精神状态和活动量变化', '记录食欲变化时间和程度', '检查环境是否有变化因素'],
    },
    '呕吐': {
      conditions: [
        { name: '饮食不当', probability: 0.5, severity: 'low', recommendation: '禁食12-24小时，少量多次给水。之后给予清淡易消化食物如白粥、煮熟的鸡肉' },
        { name: '毛球症（猫）', probability: 0.25, severity: 'low', recommendation: '使用化毛膏或猫草帮助排出毛球。定期梳毛减少毛球形成。严重时需就医' },
        { name: '肠胃炎', probability: 0.15, severity: 'medium', recommendation: '观察粪便和精神状态，必要时送医院检查。可能需要抗生素或止吐药治疗' },
        { name: '严重疾病', probability: 0.1, severity: 'high', recommendation: '如频繁呕吐（每天超过3次）、带血、精神萎靡、腹痛请立即送医院。可能涉及胰腺炎、肠梗阻、肾病等' },
      ],
      generalAdvice: ['记录呕吐频率、时间和呕吐物性状', '避免喂油腻、辛辣、生冷食物', '提供充足清水，防止脱水', '观察是否伴随腹泻、发热', '呕吐后禁食4-6小时再尝试少量喂食', '检查是否误食异物或有毒物质'],
    },
    '咳嗽': {
      conditions: [
        { name: '轻微感冒/上呼吸道感染', probability: 0.4, severity: 'low', recommendation: '保持温暖，增加环境湿度，观察1-2天。可使用加湿器，避免冷空气刺激' },
        { name: '呼吸道感染', probability: 0.3, severity: 'medium', recommendation: '观察是否有鼻涕、发热、精神下降，必要时就医。可能需要抗生素治疗' },
        { name: '异物吸入/气管问题', probability: 0.2, severity: 'high', recommendation: '如咳嗽剧烈、持续、呼吸困难请立即检查。小型犬常见气管塌陷问题' },
        { name: '过敏/哮喘', probability: 0.1, severity: 'medium', recommendation: '检查环境中是否有新的过敏原（花粉、灰尘、清洁剂）。哮喘需长期管理' },
      ],
      generalAdvice: ['保持室内空气清新，定期通风', '避免烟雾、灰尘和刺激性气味', '监测呼吸状态和频率', '注意是否伴有发热、流鼻涕', '记录咳嗽时间、频率和特点', '避免过度运动诱发咳嗽'],
    },
    '腹泻': {
      conditions: [
        { name: '饮食变化/食物不耐受', probability: 0.4, severity: 'low', recommendation: '暂时喂食清淡食物（白粥、煮熟鸡肉），逐渐恢复正常饮食。避免突然换粮' },
        { name: '寄生虫感染', probability: 0.3, severity: 'medium', recommendation: '检查粪便是否有虫体或虫卵，必要时驱虫。定期预防性驱虫很重要' },
        { name: '细菌感染', probability: 0.2, severity: 'medium', recommendation: '观察是否发热、精神下降，必要时就医。可能需要抗生素和益生菌治疗' },
        { name: '病毒感染（细小/猫瘟）', probability: 0.1, severity: 'high', recommendation: '如伴随发热、呕吐、血便、精神萎靡请立即就医！这是致命性疾病，需紧急治疗' },
      ],
      generalAdvice: ['补充水分防止脱水，可给电解质水', '记录粪便颜色、性状和频率', '避免油腻、生冷、难消化食物', '暂时禁食后给易消化食物', '观察是否伴随呕吐、发热', '保持环境清洁，防止感染扩散'],
    },
    '发烧': {
      conditions: [
        { name: '感染（细菌/病毒）', probability: 0.5, severity: 'medium', recommendation: '监测体温变化，必要时就医检查感染源。可能需要抗生素或抗病毒治疗' },
        { name: '炎症反应', probability: 0.3, severity: 'medium', recommendation: '观察伴随症状，找出炎症部位。可能涉及关节炎、肠胃炎等' },
        { name: '疫苗反应', probability: 0.1, severity: 'low', recommendation: '接种后24-48小时轻微发热正常，观察即可。如持续或加重需就医' },
        { name: '严重疾病', probability: 0.1, severity: 'high', recommendation: '体温超过39.5°C或持续超过24小时请就医。可能涉及传染病、肿瘤、自身免疫疾病' },
      ],
      generalAdvice: ['保持舒适环境温度，不要过度包裹', '提供充足清水，鼓励饮水', '定时测量体温（每4-6小时）', '记录体温变化曲线', '观察精神状态和食欲变化', '避免剧烈运动，保持休息'],
    },
    '脱毛': {
      conditions: [
        { name: '正常换毛季节', probability: 0.4, severity: 'low', recommendation: '增加梳毛频率，使用合适梳子。春秋季换毛正常，无需担心' },
        { name: '皮肤问题（过敏/感染）', probability: 0.3, severity: 'medium', recommendation: '检查皮肤是否有红肿、皮屑、结痂。可能需要抗过敏或抗真菌治疗' },
        { name: '压力/焦虑', probability: 0.2, severity: 'low', recommendation: '提供安全环境和互动，减少压力源。过度舔毛可能是心理问题' },
        { name: '营养缺乏/内分泌问题', probability: 0.1, severity: 'medium', recommendation: '检查饮食是否均衡，补充必要营养。甲状腺问题也可导致脱毛' },
      ],
      generalAdvice: ['定期梳毛，促进血液循环', '保持皮肤清洁，适度洗澡', '提供营养补充（Omega-3）', '检查是否有皮肤病变', '观察脱毛部位和模式', '避免过度使用洗浴产品'],
    },
    '嗜睡': {
      conditions: [
        { name: '正常休息/年龄因素', probability: 0.4, severity: 'low', recommendation: '观察是否恢复活力，老年宠物睡眠增多正常。确保睡眠质量' },
        { name: '疲劳/运动过度', probability: 0.3, severity: 'low', recommendation: '保证充足休息，调整运动量。观察恢复情况' },
        { name: '发热或疾病', probability: 0.2, severity: 'high', recommendation: '测量体温，如异常请就医。可能是感染、疼痛或其他疾病的信号' },
        { name: '药物影响', probability: 0.1, severity: 'low', recommendation: '检查近期用药情况，某些药物可能导致嗜睡。咨询兽医' },
      ],
      generalAdvice: ['记录睡眠时长和模式变化', '监测精神状态和反应能力', '保证舒适休息环境', '观察食欲和排便变化', '检查是否有其他伴随症状', '定期唤醒互动观察状态'],
    },
    '攻击性': {
      conditions: [
        { name: '恐惧或压力', probability: 0.4, severity: 'medium', recommendation: '提供安全空间，避免刺激源。使用正向训练方法，不要惩罚' },
        { name: '领地行为', probability: 0.3, severity: 'low', recommendation: '适当社交化训练，建立规则。可能需要行为矫正训练' },
        { name: '疼痛', probability: 0.2, severity: 'high', recommendation: '检查是否有身体不适、外伤或疾病。疼痛会导致攻击行为' },
        { name: '未绝育/激素影响', probability: 0.1, severity: 'low', recommendation: '考虑绝育手术，减少激素驱动行为。绝育后行为可能改善' },
      ],
      generalAdvice: ['避免惩罚，使用正向强化', '提供充足玩具和活动', '观察触发因素和情境', '建立稳定规则和边界', '考虑专业行为训练师', '确保人和其他宠物安全'],
    },
    '瘙痒': {
      conditions: [
        { name: '皮肤过敏（食物/环境）', probability: 0.4, severity: 'medium', recommendation: '检查过敏原，可能需要过敏测试。使用抗过敏药物或特殊饮食' },
        { name: '寄生虫（跳蚤/螨虫）', probability: 0.3, severity: 'medium', recommendation: '检查是否有跳蚤、螨虫，使用驱虫产品。定期预防性驱虫' },
        { name: '皮肤干燥', probability: 0.2, severity: 'low', recommendation: '使用保湿洗浴产品，增加Omega-3摄入。避免过度洗澡' },
        { name: '真菌感染', probability: 0.1, severity: 'medium', recommendation: '就医检查，使用抗真菌药物。真菌感染需要长期治疗' },
      ],
      generalAdvice: ['定期驱虫，每月体外驱虫', '保持皮肤清洁但不过度洗澡', '检查皮肤状况和抓挠部位', '使用温和洗浴产品', '补充皮肤营养（鱼油）', '避免已知过敏原'],
    },
    '口臭': {
      conditions: [
        { name: '牙结石/牙周病', probability: 0.5, severity: 'medium', recommendation: '定期洁牙，使用洁牙骨或洁牙零食。严重时需专业洗牙' },
        { name: '口腔炎症/溃疡', probability: 0.25, severity: 'medium', recommendation: '检查口腔，必要时就医。可能需要抗生素或消炎治疗' },
        { name: '消化问题', probability: 0.15, severity: 'low', recommendation: '调整饮食，观察消化情况。胃肠道问题可能导致口臭' },
        { name: '肾脏问题/糖尿病', probability: 0.1, severity: 'high', recommendation: '如伴随其他症状（多饮多尿、体重下降）请就医检查' },
      ],
      generalAdvice: ['定期刷牙，每天或每周2-3次', '使用洁牙零食和玩具', '定期口腔检查', '观察饮食习惯变化', '检查牙龈颜色和状态', '避免喂食导致口臭的食物'],
    },
    '呼吸困难': {
      conditions: [
        { name: '呼吸道感染', probability: 0.3, severity: 'medium', recommendation: '观察伴随症状，必要时就医。可能需要抗生素治疗' },
        { name: '心脏问题', probability: 0.25, severity: 'high', recommendation: '如运动后呼吸困难、夜间加重请立即就医检查心脏功能' },
        { name: '过敏/哮喘', probability: 0.2, severity: 'medium', recommendation: '检查过敏原，避免刺激。哮喘需长期药物管理' },
        { name: '肺水肿/严重疾病', probability: 0.15, severity: 'high', recommendation: '如严重呼吸困难、张口呼吸请立即就医！这是紧急情况' },
        { name: '气管塌陷（小型犬）', probability: 0.1, severity: 'medium', recommendation: '避免刺激气管，控制体重。严重时需手术或药物治疗' },
      ],
      generalAdvice: ['保持空气清新流通', '避免烟雾和刺激性气味', '监测呼吸频率和状态', '记录呼吸困难发生情境', '避免过度运动和激动', '保持适宜环境温度'],
    },
    '皮肤问题': {
      conditions: [
        { name: '过敏性皮炎', probability: 0.35, severity: 'medium', recommendation: '找出过敏原，使用抗过敏药物。可能需要特殊饮食或环境调整' },
        { name: '细菌/真菌感染', probability: 0.25, severity: 'medium', recommendation: '就医检查，使用抗生素或抗真菌药物。需要持续治疗' },
        { name: '寄生虫感染', probability: 0.2, severity: 'medium', recommendation: '检查并驱除寄生虫，使用预防产品。定期体外驱虫' },
        { name: '内分泌问题', probability: 0.1, severity: 'medium', recommendation: '检查甲状腺、肾上腺功能。内分泌问题需长期管理' },
        { name: '自身免疫疾病', probability: 0.1, severity: 'high', recommendation: '就医详细检查，可能需要免疫抑制治疗' },
      ],
      generalAdvice: ['定期检查皮肤状态', '保持皮肤清洁干燥', '使用温和洗浴产品', '补充皮肤营养', '避免已知过敏原', '定期驱虫预防'],
    },
    '神经系统问题': {
      conditions: [
        { name: '癫痫', probability: 0.3, severity: 'high', recommendation: '记录发作情况，就医检查。可能需要长期抗癫痫药物治疗' },
        { name: '中毒', probability: 0.2, severity: 'high', recommendation: '如突然出现神经症状，怀疑中毒请立即就医！时间很关键' },
        { name: '脑部疾病/肿瘤', probability: 0.15, severity: 'high', recommendation: '就医进行详细检查（MRI/CT）。需要专业诊断和治疗' },
        { name: '代谢性疾病', probability: 0.15, severity: 'medium', recommendation: '检查血糖、肝肾功能。代谢问题可能导致神经症状' },
        { name: '外伤/脊柱问题', probability: 0.2, severity: 'high', recommendation: '如怀疑外伤或脊柱问题请立即就医，避免移动造成二次伤害' },
      ],
      generalAdvice: ['记录发作时间、频率和表现', '发作时保持冷静，保护宠物安全', '避免刺激和过度兴奋', '定期复查和药物调整', '保持规律生活作息', '注意安全防止受伤'],
    },
    '泌尿系统问题': {
      conditions: [
        { name: '尿路感染', probability: 0.35, severity: 'medium', recommendation: '就医检查，使用抗生素治疗。增加饮水量帮助冲洗' },
        { name: '膀胱结石/尿结石', probability: 0.25, severity: 'high', recommendation: '就医检查，可能需要手术或特殊饮食管理' },
        { name: '猫下泌尿道疾病(FLUTD)', probability: 0.2, severity: 'high', recommendation: '公猫尿闭是紧急情况！立即就医。需要特殊饮食和压力管理' },
        { name: '肾功能问题', probability: 0.15, severity: 'high', recommendation: '检查肾功能，可能需要长期管理。肾病需特殊饮食' },
        { name: '膀胱肿瘤', probability: 0.05, severity: 'high', recommendation: '就医详细检查，确定治疗方案' },
      ],
      generalAdvice: ['增加饮水量', '保持猫砂盆清洁', '观察尿液颜色和量', '定期尿液检查', '避免压力因素', '特殊饮食管理'],
    },
    '心血管问题': {
      conditions: [
        { name: '心力衰竭', probability: 0.3, severity: 'high', recommendation: '就医检查，可能需要长期药物治疗。定期复查心功能' },
        { name: '心律不齐', probability: 0.25, severity: 'medium', recommendation: '就医检查心电图，确定心律问题类型和治疗方案' },
        { name: '心脏瓣膜病', probability: 0.2, severity: 'high', recommendation: '定期心脏检查，可能需要药物或手术治疗' },
        { name: '心肌病', probability: 0.15, severity: 'high', recommendation: '就医详细检查，确定心肌病类型。需要长期管理' },
        { name: '贫血', probability: 0.1, severity: 'medium', recommendation: '检查贫血原因，可能需要补充营养或治疗原发病' },
      ],
      generalAdvice: ['定期心脏检查', '控制运动量', '避免过度激动', '控制体重', '低盐饮食', '按时服药'],
    },
    '外伤': {
      conditions: [
        { name: '软组织损伤', probability: 0.4, severity: 'medium', recommendation: '休息，冷敷，观察恢复情况。严重时就医检查' },
        { name: '骨折', probability: 0.2, severity: 'high', recommendation: '立即就医！不要移动受伤部位，固定后送医院' },
        { name: '伤口/出血', probability: 0.25, severity: 'medium', recommendation: '清洁伤口，止血包扎。严重出血或深伤口需就医' },
        { name: '烧伤/烫伤', probability: 0.1, severity: 'high', recommendation: '冷却伤处，不要涂抹任何东西，立即就医' },
        { name: '头部/脊柱损伤', probability: 0.05, severity: 'high', recommendation: '立即就医！小心移动，避免二次伤害' },
      ],
      generalAdvice: ['保持冷静评估伤情', '止血和清洁伤口', '避免移动严重伤患', '记录受伤原因和时间', '观察精神状态变化', '及时就医严重伤情'],
    },
    '中毒': {
      conditions: [
        { name: '食物中毒（巧克力/洋葱/葡萄）', probability: 0.35, severity: 'high', recommendation: '立即就医！告知误食种类和量。时间很关键' },
        { name: '药物中毒', probability: 0.2, severity: 'high', recommendation: '立即就医！带药物包装告知兽医' },
        { name: '化学物质中毒', probability: 0.15, severity: 'high', recommendation: '立即就医！避免接触更多毒物' },
        { name: '植物中毒', probability: 0.15, severity: 'high', recommendation: '立即就医！告知植物种类' },
        { name: '农药/杀虫剂中毒', probability: 0.15, severity: 'high', recommendation: '立即就医！这是紧急情况' },
      ],
      generalAdvice: ['立即就医不要等待', '告知毒物种类和量', '保留毒物样本', '不要自行处理', '观察症状变化', '预防再次发生'],
    },
    '传染病': {
      conditions: [
        { name: '犬瘟热', probability: 0.2, severity: 'high', recommendation: '立即就医隔离！高度致命，需要专业支持治疗' },
        { name: '细小病毒', probability: 0.2, severity: 'high', recommendation: '立即就医隔离！高度致命，需要紧急治疗' },
        { name: '猫瘟', probability: 0.15, severity: 'high', recommendation: '立即就医隔离！高度致命，需要紧急治疗' },
        { name: '猫传染性腹膜炎(FIP)', probability: 0.15, severity: 'high', recommendation: '就医检查，目前治疗困难，需要支持护理' },
        { name: '狂犬病', probability: 0.05, severity: 'high', recommendation: '如有接触史立即就医报告！这是法定传染病' },
        { name: '其他传染病', probability: 0.25, severity: 'medium', recommendation: '就医检查确定病原，针对性治疗' },
      ],
      generalAdvice: ['立即隔离防止传播', '就医检查确诊', '告知接触史', '支持治疗护理', '预防接种很重要', '环境消毒'],
    },
    '肿瘤': {
      conditions: [
        { name: '良性肿瘤', probability: 0.4, severity: 'medium', recommendation: '就医检查确定性质，可能需要手术切除' },
        { name: '恶性肿瘤', probability: 0.3, severity: 'high', recommendation: '就医详细检查，确定治疗方案（手术/化疗/放疗）' },
        { name: '脂肪瘤', probability: 0.15, severity: 'low', recommendation: '通常良性，观察生长速度。影响功能时切除' },
        { name: '乳腺肿瘤', probability: 0.1, severity: 'high', recommendation: '就医检查，约50%恶性。绝育可预防' },
        { name: '淋巴瘤', probability: 0.05, severity: 'high', recommendation: '就医详细检查，可能需要化疗' },
      ],
      generalAdvice: ['定期检查肿块变化', '记录大小、位置、生长速度', '观察是否疼痛或影响功能', '及时就医确诊', '考虑治疗方案', '绝育预防乳腺肿瘤'],
    },
    '老年疾病': {
      conditions: [
        { name: '认知功能障碍(痴呆)', probability: 0.25, severity: 'medium', recommendation: '提供稳定环境，使用补充剂可能有帮助' },
        { name: '关节炎', probability: 0.3, severity: 'medium', recommendation: '控制体重，适度运动，使用关节保护剂和止痛药' },
        { name: '器官功能衰退', probability: 0.25, severity: 'high', recommendation: '定期体检，针对性管理。特殊饮食很重要' },
        { name: '老年性心脏病', probability: 0.1, severity: 'high', recommendation: '定期心脏检查，药物管理' },
        { name: '老年性肾病', probability: 0.1, severity: 'high', recommendation: '定期肾功能检查，特殊饮食管理' },
      ],
      generalAdvice: ['定期体检（每半年）', '调整饮食和运动', '保持舒适环境', '观察行为变化', '提供适当辅助', '保持生活质量'],
    },
    '幼宠问题': {
      conditions: [
        { name: '发育问题', probability: 0.3, severity: 'medium', recommendation: '提供营养均衡食物，定期体检监测发育' },
        { name: '先天缺陷', probability: 0.2, severity: 'high', recommendation: '就医检查，确定是否需要治疗或手术' },
        { name: '寄生虫感染', probability: 0.25, severity: 'medium', recommendation: '从2周龄开始驱虫，定期驱虫很重要' },
        { name: '传染病风险', probability: 0.15, severity: 'high', recommendation: '完成疫苗接种系列，避免接触未免疫动物' },
        { name: '营养缺乏', probability: 0.1, severity: 'medium', recommendation: '提供幼宠专用食物，确保营养充足' },
      ],
      generalAdvice: ['定期驱虫和疫苗', '提供幼宠专用食物', '避免接触病患', '定期体检监测', '社会化训练', '建立良好习惯'],
    },
  },
  commonQuestions: {
    '驱虫': {
      answer: '常规驱虫建议：体内驱虫每3-6个月一次，体外驱虫每月一次。具体频率需根据宠物生活环境和兽医建议调整。幼犬幼猫建议从2周龄开始驱虫，每2周一次直到3月龄。',
      confidence: 0.98,
    },
    '疫苗': {
      answer: '基础疫苗包括猫三联/狗四联，首年完成基础免疫后每年加强一次。狂犬病疫苗根据当地法规执行，通常每年或三年一次。幼宠6-8周龄开始首免，每隔3-4周接种一次，共3-4次。',
      confidence: 0.97,
    },
    '体检': {
      answer: '建议每年进行一次全面体检，7岁以上老年宠物建议每半年一次。体检项目包括血常规、生化、X光、B超等。定期体检可以早期发现潜在健康问题。',
      confidence: 0.96,
    },
    '绝育': {
      answer: '建议在6-12月龄进行绝育手术。绝育可以预防多种疾病（如子宫蓄脓、乳腺肿瘤、前列腺问题），减少攻击性和标记行为。术后需注意护理，防止舔舐伤口。',
      confidence: 0.96,
    },
    '喂养': {
      answer: '成犬建议每天喂食2次，成猫可自由采食或分2-3次。选择优质商业粮或均衡自制餐。幼宠需要更高频率喂食（3-4次/天）。避免喂食巧克力、洋葱、葡萄等有毒食物。',
      confidence: 0.97,
    },
  },
  petTypeAdvice: {
    cat: {
      hairball: '定期喂食化毛膏或猫草，每周1-2次。长毛猫需要更频繁的梳毛来减少毛球形成。',
      water: '猫咪天生不爱喝水，可尝试流动水源（饮水机）、湿粮增加水分摄入。每天需水量约40-60ml/kg体重',
      emergency: '猫咪紧急情况：尿闭（公猫）、呼吸困难、持续呕吐、突然瘫痪。这些情况需立即就医',
    },
    dog: {
      exercise: '每天至少两次散步，运动量根据体型和年龄调整。小型犬30分钟，中型犬60分钟，大型犬90分钟以上',
      training: '坚持基础服从训练，正向强化为主。基础指令：坐下、趴下、等待、过来。社会化训练在3-14周龄最关键',
      emergency: '狗狗紧急情况：呼吸困难、严重出血、中毒、持续呕吐腹泻、骨折。立即就医',
    },
  },
  followUpQuestions: {
    '食欲不振': ['这种情况持续多久了？', '宠物最近有没有换粮或环境变化？', '除了食欲不振还有其他症状吗？'],
    '呕吐': ['呕吐物是什么样子的？', '呕吐频率如何？', '最近有没有吃过不干净的东西？'],
    '腹泻': ['粪便是什么颜色和性状？', '有没有血丝或粘液？', '腹泻持续多久了？'],
    '发烧': ['体温是多少度？', '有没有测量过体温？', '除了发热还有其他症状吗？'],
    '咳嗽': ['咳嗽是干咳还是有痰？', '咳嗽频率如何？', '有没有接触过其他生病的动物？'],
    '瘙痒': ['瘙痒部位在哪里？', '皮肤有没有红肿或脱毛？', '最近有没有换过洗浴用品或食物？'],
    '呼吸困难': ['呼吸困难是什么时候开始的？', '运动后呼吸困难会加重吗？', '有没有咳嗽或其他症状？'],
    '皮肤问题': ['皮肤问题持续多久了？', '有没有瘙痒或疼痛？', '有没有脱毛或红肿？'],
    '神经系统问题': ['发作是什么时候开始的？', '发作频率如何？', '发作时有什么表现？'],
    '泌尿系统问题': ['排尿困难持续多久了？', '尿液颜色和量怎么样？', '有没有血尿？'],
    '心血管问题': ['症状是什么时候开始的？', '运动后症状会加重吗？', '有没有咳嗽？'],
    '外伤': ['受伤是什么时候发生的？', '受伤原因是什么？', '伤口位置和程度怎么样？'],
    '中毒': ['误食了什么？', '误食量是多少？', '误食时间是什么时候？'],
    '传染病': ['症状是什么时候开始的？', '有没有接触过其他病患？', '有没有完成疫苗接种？'],
    '肿瘤': ['肿块是什么时候发现的？', '肿块位置在哪里？', '肿块大小和形状怎么样？'],
    '老年疾病': ['症状是什么时候开始的？', '最近行为有没有变化？', '有没有定期体检？'],
    '幼宠问题': ['幼宠年龄多大？', '有没有完成疫苗接种？', '有没有定期驱虫？'],
    '行为异常': ['行为问题是什么时候开始的？', '最近环境有没有变化？', '有没有受过训练？'],
    '眼部问题': ['眼部问题持续多久了？', '有没有分泌物或流泪？', '眼睛有没有浑浊？'],
    '口腔问题': ['口腔问题持续多久了？', '有没有口臭？', '牙龈有没有红肿出血？'],
    '关节问题': ['关节问题持续多久了？', '哪个关节有问题？', '有没有肿胀或疼痛？'],
  },
  contextResponses: {
    'continue': '关于您刚才提到的症状，请问还有其他需要补充的吗？',
    'clarify': '为了更准确地判断，我需要了解更多信息：',
    'reassure': '请不要过于担心，这种情况在宠物中比较常见。',
    'urgent': '⚠️ 根据您描述的情况，建议您尽快带宠物就医检查。',
    'monitor': '建议您继续观察24-48小时，如果症状加重请及时就医。',
    'emergency': '🚨 这是紧急情况！请立即联系最近的宠物医院或急诊。',
    'followUp': '请问症状现在有好转吗？还是出现了新的问题？',
    'moreInfo': '请提供更多详细信息，以便我给出更准确的建议。',
    'professional': '建议您咨询专业兽医进行详细检查和诊断。',
    'prevention': '预防措施很重要，可以减少很多健康问题的发生。',
    'homeCare': '在家护理期间请注意观察症状变化，如有异常及时就医。',
    'medication': '用药前请咨询兽医，不要自行使用人用药物。',
    'dietAdvice': '饮食调整对很多健康问题有帮助，请参考具体建议。',
    'behaviorAdvice': '行为问题需要耐心训练，建议使用正向强化方法。',
    'ageRelated': '年龄相关的变化需要注意，建议定期体检监测。',
  },
};

export class AIConsultationService {
  private consultations: Map<string, AIMessage[]> = new Map();

  // ─── 本地紧急关键词预筛（不依赖网络） ─────────────────────

  private checkSevereSymptoms(message: string): { hasSevereSymptoms: boolean; response: string; severity: 'low' | 'medium' | 'high' | 'urgent' } {
    const severityLevels: Array<'urgent' | 'high' | 'medium' | 'low'> = ['urgent', 'high', 'medium', 'low'];
    for (const level of severityLevels) {
      const assessment = SEVERITY_ASSESSMENT[level];
      for (const keyword of assessment.keywords) {
        if (message.includes(keyword)) {
          let response = assessment.response;
          if (level === 'urgent') {
            response += '\n\n需要我帮您查找附近的宠物医院吗？';
          } else if (level === 'high') {
            response += '\n\n请问症状持续多长时间了？是否有其他伴随症状？';
          } else if (level === 'medium') {
            response += '\n\n请问这种情况持续多久了？是否有加重趋势？';
          }
          return { hasSevereSymptoms: true, response, severity: level };
        }
      }
    }
    return { hasSevereSymptoms: false, response: '', severity: 'low' };
  }

  private assessOverallSeverity(message: string, detectedSymptoms: string[]): { severity: 'low' | 'medium' | 'high' | 'urgent'; reasoning: string[] } {
    const reasoning: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | 'urgent' = 'low';
    const severityCheck = this.checkSevereSymptoms(message);
    if (severityCheck.hasSevereSymptoms) {
      maxSeverity = severityCheck.severity;
      reasoning.push(`检测到${severityCheck.severity === 'urgent' ? '紧急' : severityCheck.severity === 'high' ? '严重' : '中等'}程度关键词`);
    }
    for (const symptom of detectedSymptoms) {
      const symptomData = healthKnowledgeBase.symptoms[symptom];
      if (symptomData) {
        const hasHighSeverity = symptomData.conditions.some(c => c.severity === 'high' && c.probability > 0.15);
        if (hasHighSeverity && (maxSeverity === 'low' || maxSeverity === 'medium')) {
          maxSeverity = 'high';
          reasoning.push(`症状「${symptom}」可能涉及严重疾病`);
        }
      }
    }
    if (detectedSymptoms.length >= 3 && maxSeverity === 'low') {
      maxSeverity = 'medium';
      reasoning.push('多个症状同时出现，建议关注');
    }
    return { severity: maxSeverity, reasoning };
  }

  // ─── 本地意图/症状分析（保留作为快速预筛） ─────────────────

  private detectIntent(message: string): string | null {
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }
    return null;
  }

  private detectAllIntents(message: string): string[] {
    const intents: string[] = [];
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        intents.push(intent);
      }
    }
    return intents;
  }

  private detectMultiIntent(message: string): boolean {
    return MULTI_INTENT_INDICATORS.some(indicator => message.includes(indicator));
  }

  private detectAmbiguity(message: string): { isAmbiguous: boolean; reason?: string } {
    for (const keyword of AMBIGUOUS_KEYWORDS) {
      if (message.includes(keyword)) {
        const contextKeywords = ['但是', '可是', '不过', '只是', '不清楚', '不知道', '不确定'];
        const hasContext = contextKeywords.some(k => message.includes(k));
        if (!hasContext || message.length < 15) {
          return { isAmbiguous: true, reason: `检测到模糊表达「${keyword}」，需要更多信息来确定具体情况` };
        }
      }
    }
    return { isAmbiguous: false };
  }

  private processInternetSlang(message: string): { processed: string; detected: string[] } {
    const detected: string[] = [];
    let processed = message;
    for (const [slang, meaning] of Object.entries(INTERNET_SLANG)) {
      if (message.toLowerCase().includes(slang.toLowerCase())) {
        detected.push(`${slang}(${meaning})`);
        processed = processed.replace(new RegExp(slang, 'gi'), meaning);
      }
    }
    return { processed, detected };
  }

  private processDialectExpressions(message: string): { processed: string; detected: string[] } {
    const detected: string[] = [];
    let processed = message;
    for (const [dialect, standard] of Object.entries(DIALECT_EXPRESSIONS)) {
      if (message.includes(dialect)) {
        detected.push(`${dialect}→${standard}`);
        processed = processed.replace(new RegExp(dialect, 'g'), standard);
      }
    }
    return { processed, detected };
  }

  private analyzeIntent(message: string): IntentAnalysisResult {
    const slangResult = this.processInternetSlang(message);
    const dialectResult = this.processDialectExpressions(slangResult.processed);
    const processedMessage = dialectResult.processed;
    const intents = this.detectAllIntents(processedMessage);
    const isMultiIntent = this.detectMultiIntent(processedMessage);
    const ambiguityResult = this.detectAmbiguity(processedMessage);
    return {
      intents,
      isAmbiguous: ambiguityResult.isAmbiguous,
      ambiguityReason: ambiguityResult.reason,
      isMultiIntent,
      processedMessage,
      detectedSlang: slangResult.detected,
      detectedDialect: dialectResult.detected,
    };
  }

  matchesSynonym(question: string, synonyms: string[]): boolean {
    const lowerQuestion = question.toLowerCase();
    return synonyms.some(synonym => lowerQuestion.includes(synonym.toLowerCase()));
  }

  private extractSymptoms(message: string): string[] {
    const foundSymptoms: string[] = [];
    for (const [symptom, synonyms] of Object.entries(symptomSynonyms)) {
      if (this.matchesSynonym(message, synonyms)) {
        foundSymptoms.push(symptom);
      }
    }
    return foundSymptoms;
  }

  private extractPetInfo(message: string): Partial<ConversationContext['petInfo']> {
    const info: Partial<ConversationContext['petInfo']> = {};
    if (message.includes('猫') || message.includes('猫咪')) info.type = 'cat';
    else if (message.includes('狗') || message.includes('狗狗')) info.type = 'dog';
    const ageMatch = message.match(/(\d+)\s*(岁|月|年)/);
    if (ageMatch) {
      const num = parseInt(ageMatch[1]);
      info.age = message.includes('月') ? num / 12 : num;
    }
    const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*(kg|公斤|斤)/);
    if (weightMatch) {
      const weight = parseFloat(weightMatch[1]);
      info.weight = message.includes('斤') ? weight / 2 : weight;
    }
    return info;
  }

  extractContextInfo(message: string, currentContext: ConversationContext): Partial<ConversationContext> {
    const update: Partial<ConversationContext> = {};
    const petInfo = this.extractPetInfo(message);
    if (Object.keys(petInfo).length > 0) update.petInfo = { ...currentContext.petInfo, ...petInfo };
    const symptoms = this.extractSymptoms(message);
    if (symptoms.length > 0) update.mentionedSymptoms = Array.from(new Set([...currentContext.mentionedSymptoms, ...symptoms]));
    const intent = this.detectIntent(message);
    if (intent) {
      update.lastIntent = intent;
      update.discussedTopics = Array.from(new Set([...currentContext.discussedTopics, intent]));
    }
    return update;
  }

  // ─── 输入验证（保留本地逻辑） ──────────────────────────────

  validateInput(content: string, attachments?: { type: string; size?: number }[]): InputValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const prohibitedCategories: string[] = [];
    if (!content || content.trim().length === 0) {
      if (!attachments || attachments.length === 0) {
        errors.push('输入内容不能为空');
        return { isValid: false, errors, warnings, hasProhibitedContent: false, prohibitedCategories: [], contentLength: 0 };
      }
    }
    const trimmedContent = content.trim();
    const contentLength = trimmedContent.length;
    if (contentLength < INPUT_VALIDATION_CONFIG.minLength && contentLength > 0) {
      errors.push(`输入内容太短，至少需要${INPUT_VALIDATION_CONFIG.minLength}个字符`);
    }
    if (contentLength > INPUT_VALIDATION_CONFIG.maxLength) {
      errors.push(`输入内容太长，最多允许${INPUT_VALIDATION_CONFIG.maxLength}个字符`);
    }
    if (attachments && attachments.length > INPUT_VALIDATION_CONFIG.maxAttachments) {
      errors.push(`附件数量超出限制，最多允许${INPUT_VALIDATION_CONFIG.maxAttachments}个附件`);
    }
    if (attachments) {
      for (const attachment of attachments) {
        if (attachment.type.startsWith('image/') && !INPUT_VALIDATION_CONFIG.allowedImageTypes.includes(attachment.type)) {
          errors.push(`不支持的图片格式：${attachment.type}`);
        }
        if (attachment.type.startsWith('audio/') && !INPUT_VALIDATION_CONFIG.allowedAudioTypes.includes(attachment.type)) {
          errors.push(`不支持的音频格式：${attachment.type}`);
        }
        if (attachment.size && attachment.size > INPUT_VALIDATION_CONFIG.maxAttachmentSize) {
          errors.push(`附件大小超出限制：${Math.round(attachment.size / 1024 / 1024)}MB，最大允许${INPUT_VALIDATION_CONFIG.maxAttachmentSize / 1024 / 1024}MB`);
        }
      }
    }
    for (const prohibited of PROHIBITED_CONTENT_PATTERNS) {
      if (prohibited.pattern.test(trimmedContent)) {
        prohibitedCategories.push(prohibited.category);
        if (prohibited.severity === 'high') errors.push(`内容包含禁止的敏感内容（${prohibited.category}）`);
        else if (prohibited.severity === 'medium') warnings.push(`内容可能包含不适当内容（${prohibited.category}）`);
        else warnings.push(`内容包含可能不合适的内容（${prohibited.category}）`);
      }
    }
    // eslint-disable-next-line no-control-regex
    const garbagePattern = /^[\s\u0000-\u001F\u007F-\u009F\u2000-\u20FF\uFF00-\uFFEF]*$/;
    if (garbagePattern.test(trimmedContent) && contentLength > 0) {
      errors.push('输入内容包含无效字符或乱码');
    }
    const repeatedPattern = /^(.)\1{50,}$/;
    if (repeatedPattern.test(trimmedContent)) {
      errors.push('输入内容包含大量重复字符，可能是无效输入');
    }
    // eslint-disable-next-line no-control-regex
    const controlChars = trimmedContent.match(/[\u0000-\u001F\u007F-\u009F]/g);
    if (controlChars && controlChars.length > 5) {
      warnings.push('输入内容包含控制字符，已自动清理');
    }
    const sanitizedContent = trimmedContent
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const detectedLanguage = this.detectLanguage(sanitizedContent);
    const isValid = errors.length === 0;
    const hasProhibitedContent = prohibitedCategories.length > 0;
    return { isValid, errors, warnings, sanitizedContent: isValid ? sanitizedContent : undefined, detectedLanguage, hasProhibitedContent, prohibitedCategories, contentLength };
  }

  detectLanguage(content: string): string {
    if (!content || content.trim().length === 0) return MULTILINGUAL_CONFIG.defaultLanguage;
    const trimmedContent = content.trim();
    for (const [language, patterns] of Object.entries(MULTILINGUAL_CONFIG.languageDetectionPatterns)) {
      const [charPattern, keywordPattern] = patterns;
      if (charPattern.test(trimmedContent) && keywordPattern.test(trimmedContent)) return language;
    }
    if (/[\u4e00-\u9fa5]/.test(trimmedContent)) return 'zh-CN';
    if (/^[a-zA-Z\s,.!?'"()-]+$/.test(trimmedContent)) return 'en-US';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(trimmedContent)) return 'ja';
    if (/[\uac00-\ud7af]/.test(trimmedContent)) return 'ko';
    return MULTILINGUAL_CONFIG.defaultLanguage;
  }

  sanitizeInput(content: string): string {
    return content
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\u200B/g, '')
      .replace(/\uFEFF/g, '')
      .replace(/\s+/g, ' ')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
      .substring(0, INPUT_VALIDATION_CONFIG.maxLength);
  }

  // ─── 本地快速预筛分析（保留，用于紧急情况不需要等网络） ────

  analyzeQuestion(question: string, petType?: string, context?: ConversationContext): AIResponse {
    const validation = this.validateInput(question);
    if (!validation.isValid) return this.handleInvalidInput(validation);
    if (validation.contentLength === 0) return this.handleEmptyInput();
    if (validation.contentLength > INPUT_VALIDATION_CONFIG.maxLength * 0.8) return this.handleLongInput(question);

    const sanitizedQuestion = validation.sanitizedContent || this.sanitizeInput(question);

    // 紧急关键词本地检测（不依赖网络）
    const severeSymptomCheck = this.checkSevereSymptoms(sanitizedQuestion);
    if (severeSymptomCheck.hasSevereSymptoms) {
      return { content: severeSymptomCheck.response, confidence: 0.95, detectedIntents: ['emergency'], severity: severeSymptomCheck.severity, reasoning: [`检测到${severeSymptomCheck.severity}程度症状`] };
    }

    const outOfScopeCheck = this.checkOutOfScope(sanitizedQuestion);
    if (outOfScopeCheck.isOutOfScope) {
      return { content: outOfScopeCheck.response, confidence: 0.90, detectedIntents: ['out_of_scope'], needsClarification: true, severity: 'low' };
    }

    const intentAnalysis = this.analyzeIntent(sanitizedQuestion);
    const detectedSymptoms = this.extractSymptoms(intentAnalysis.processedMessage);
    const severityAssessment = this.assessOverallSeverity(sanitizedQuestion, detectedSymptoms);

    if (intentAnalysis.isAmbiguous && detectedSymptoms.length === 0) {
      return { content: this.generateClarificationResponse(intentAnalysis.ambiguityReason || '需要更多信息', detectedSymptoms), confidence: 0.75, needsClarification: true, clarificationQuestion: intentAnalysis.ambiguityReason, detectedIntents: intentAnalysis.intents, severity: severityAssessment.severity, reasoning: severityAssessment.reasoning };
    }

    if (intentAnalysis.isMultiIntent && intentAnalysis.intents.length > 1) {
      const messageParts = this.splitMultiIntentMessage(sanitizedQuestion);
      return { content: this.generateMultiIntentResponse(intentAnalysis.intents, messageParts, detectedSymptoms), confidence: 0.88, isMultiIntent: true, detectedIntents: intentAnalysis.intents, severity: severityAssessment.severity, reasoning: severityAssessment.reasoning };
    }

    const sortedIntents = intentAnalysis.intents.sort((a, b) => (INTENT_PRIORITY[b] || 0) - (INTENT_PRIORITY[a] || 0));

    // 检查常见问题
    for (const [keyword, synonyms] of Object.entries(questionSynonyms)) {
      if (this.matchesSynonym(intentAnalysis.processedMessage, synonyms)) {
        const answer = healthKnowledgeBase.commonQuestions[keyword];
        if (answer) {
          let response = answer.answer;
          const reasoning: string[] = [`识别到问题类型：${keyword}`];
          if (intentAnalysis.detectedSlang.length > 0) { response += `\n\n💡 检测到网络用语：${intentAnalysis.detectedSlang.join('、')}`; reasoning.push(`网络用语转换：${intentAnalysis.detectedSlang.join('、')}`); }
          if (intentAnalysis.detectedDialect.length > 0) { response += `\n\n🌐 检测到方言表达：${intentAnalysis.detectedDialect.join('、')}`; reasoning.push(`方言转换：${intentAnalysis.detectedDialect.join('、')}`); }
          if (petType && healthKnowledgeBase.petTypeAdvice[petType]) {
            const petAdvice = healthKnowledgeBase.petTypeAdvice[petType];
            const relevantAdvice = Object.entries(petAdvice).filter(([key]) => intentAnalysis.processedMessage.includes(key) || keyword.includes(key)).map(([, value]) => value);
            if (relevantAdvice.length > 0) { response += `\n\n🐱 针对${petType === 'cat' ? '猫咪' : '狗狗'}的建议：\n${relevantAdvice.map(a => `• ${a}`).join('\n')}`; reasoning.push(`应用${petType === 'cat' ? '猫咪' : '狗狗'}特定建议`); }
          }
          return { content: response, confidence: answer.confidence, detectedIntents: sortedIntents, severity: severityAssessment.severity, reasoning: [...reasoning, ...severityAssessment.reasoning] };
        }
      }
    }

    // 检查症状
    for (const [symptom, synonyms] of Object.entries(symptomSynonyms)) {
      if (this.matchesSynonym(intentAnalysis.processedMessage, synonyms)) {
        const data = healthKnowledgeBase.symptoms[symptom];
        if (data) {
          const conditionsStr = data.conditions.map(c => `- ${c.name}（概率: ${Math.round(c.probability * 100)}%）\n  💡 建议: ${c.recommendation}`).join('\n\n');
          const adviceStr = data.generalAdvice.map(a => `• ${a}`).join('\n');
          let petAdvice = '';
          if (petType && healthKnowledgeBase.petTypeAdvice[petType]) {
            petAdvice = `\n\n🐱 针对${petType === 'cat' ? '猫咪' : '狗狗'}的特别建议:\n${Object.values(healthKnowledgeBase.petTypeAdvice[petType]).map(a => `• ${a}`).join('\n')}`;
          }
          const highSeverity = data.conditions.find(c => c.severity === 'high' && c.probability > 0.15);
          const severityEmoji = highSeverity ? '⚠️' : 'ℹ️';
          let slangNote = intentAnalysis.detectedSlang.length > 0 ? `\n\n💡 检测到网络用语：${intentAnalysis.detectedSlang.join('、')}` : '';
          let dialectNote = intentAnalysis.detectedDialect.length > 0 ? `\n\n🌐 检测到方言表达：${intentAnalysis.detectedDialect.join('、')}` : '';
          let content = `${severityEmoji} 根据您描述的「${symptom}」症状，可能的原因和建议如下：\n\n${conditionsStr}\n\n📝 日常护理建议:\n${adviceStr}${petAdvice}${slangNote}${dialectNote}`;
          const reasoning: string[] = [`识别到症状：${symptom}`, `可能原因：${data.conditions.slice(0, 3).map(c => c.name).join('、')}`];
          if (context) content = this.buildContextualResponse(intentAnalysis.processedMessage, context, content, [symptom]);
          if (intentAnalysis.isAmbiguous) content += `\n\n🔍 补充提示：${intentAnalysis.ambiguityReason}`;
          if (severityAssessment.severity === 'high' || severityAssessment.severity === 'urgent') content = SEVERITY_ASSESSMENT[severityAssessment.severity].response + '\n\n---\n\n' + content;
          return { content, confidence: 0.92, detectedIntents: sortedIntents, needsClarification: intentAnalysis.isAmbiguous, severity: severityAssessment.severity, reasoning: [...reasoning, ...severityAssessment.reasoning] };
        }
      }
    }

    // 生成上下文感知响应
    const contextAwareResponses = this.generateContextAwareResponse(intentAnalysis.processedMessage, context, detectedSymptoms, sortedIntents.length > 0 ? sortedIntents[0] : null);
    const reasoning: string[] = [];
    if (sortedIntents.length > 0) reasoning.push(`识别到意图：${sortedIntents.join('、')}`);
    if (detectedSymptoms.length > 0) reasoning.push(`检测到症状：${detectedSymptoms.join('、')}`);
    if (intentAnalysis.detectedSlang.length > 0 || intentAnalysis.detectedDialect.length > 0) {
      contextAwareResponses.content += '\n\n';
      if (intentAnalysis.detectedSlang.length > 0) { contextAwareResponses.content += `💡 检测到网络用语：${intentAnalysis.detectedSlang.join('、')}\n`; reasoning.push(`网络用语转换：${intentAnalysis.detectedSlang.join('、')}`); }
      if (intentAnalysis.detectedDialect.length > 0) { contextAwareResponses.content += `🌐 检测到方言表达：${intentAnalysis.detectedDialect.join('、')}`; reasoning.push(`方言转换：${intentAnalysis.detectedDialect.join('、')}`); }
    }
    contextAwareResponses.detectedIntents = sortedIntents;
    contextAwareResponses.needsClarification = intentAnalysis.isAmbiguous;
    contextAwareResponses.severity = severityAssessment.severity;
    contextAwareResponses.reasoning = [...reasoning, ...severityAssessment.reasoning];
    return contextAwareResponses;
  }

  // ─── 真实 LLM API 调用（SSE 流式响应） ─────────────────────

  /**
   * 发送消息到后端 LLM API，支持 SSE 流式响应
   * @param onChunk 流式回调，每收到一段文本就调用
   */
  async sendMessageStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    petId: string,
    context?: ConversationContext,
    onChunk?: (text: string) => void,
  ): Promise<string> {
    // 先做本地紧急关键词预筛
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
    const severeCheck = this.checkSevereSymptoms(lastUserMsg);
    if (severeCheck.hasSevereSymptoms && severeCheck.severity === 'urgent') {
      // 紧急情况立即返回本地响应，不等网络
      if (onChunk) onChunk(severeCheck.response);
      return severeCheck.response;
    }

    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, petId, context, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`AI chat API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No readable stream available');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              onChunk?.(content);
            }
          } catch {
            // 非 JSON 行，可能是纯文本
            const text = trimmed.slice(6);
            fullText += text;
            onChunk?.(text);
          }
        }
      }
    }

    // 持久化对话到 databaseService
    await this.persistConversation(petId, messages, fullText);

    return fullText;
  }

  /**
   * 非流式发送消息（兼容旧接口）
   */
  async sendMessage(consultationId: string, content: string, petType?: string): Promise<AIMessage> {
    // 本地紧急预筛
    const severeCheck = this.checkSevereSymptoms(content);
    if (severeCheck.hasSevereSymptoms && severeCheck.severity === 'urgent') {
      return { id: Date.now().toString(), role: 'assistant', content: severeCheck.response, messageType: 'text', createdAt: new Date().toISOString() };
    }

    try {
      const messages = [{ role: 'user' as const, content }];
      const fullText = await this.sendMessageStream(messages, consultationId);
      return { id: Date.now().toString(), role: 'assistant', content: fullText, messageType: 'text', createdAt: new Date().toISOString() };
    } catch {
      // 网络失败时降级到本地分析
      const userMessage: AIMessage = { id: Date.now().toString(), role: 'user', content, messageType: 'text', createdAt: new Date().toISOString() };
      return this.generateResponse(userMessage, petType);
    }
  }

  async sendMessageWithContext(
    content: string,
    contextMessages: AIMessage[],
    context: ConversationContext,
    petType?: string,
  ): Promise<AIMessage> {
    // 本地紧急预筛
    const severeCheck = this.checkSevereSymptoms(content);
    if (severeCheck.hasSevereSymptoms && severeCheck.severity === 'urgent') {
      return { id: Date.now().toString(), role: 'assistant', content: severeCheck.response, messageType: 'text', createdAt: new Date().toISOString() };
    }

    try {
      const messages = contextMessages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));
      messages.push({ role: 'user', content });
      const petId = context.petInfo?.type || 'unknown';
      const fullText = await this.sendMessageStream(messages, petId, context);
      return { id: Date.now().toString(), role: 'assistant', content: fullText, messageType: 'text', createdAt: new Date().toISOString() };
    } catch {
      // 网络失败降级到本地
      const analysis = this.analyzeQuestion(content, petType, context);
      let responseContent = analysis.content;
      if (contextMessages.length > 0) {
        const lastMessage = contextMessages[contextMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          const isFollowUp = content.length < 20 || content.includes('还有') || content.includes('然后') || content.includes('另外') || content.includes('那');
          if (isFollowUp && context.mentionedSymptoms.length > 0) {
            responseContent = `好的，关于您之前提到的「${context.mentionedSymptoms.join('、')}」问题：\n\n${analysis.content}`;
          }
        }
      }
      if (analysis.confidence < 0.8) responseContent += '\n\n💡 *以上建议基于有限信息，如有疑问请咨询专业兽医。*';
      return { id: Date.now().toString(), role: 'assistant', content: responseContent, messageType: 'text', createdAt: new Date().toISOString() };
    }
  }

  generateResponse(message: AIMessage, petType?: string, context?: ConversationContext): AIMessage {
    const analysis = this.analyzeQuestion(message.content, petType, context);
    let responseContent = analysis.content;
    if (analysis.confidence < 0.8) responseContent += '\n\n💡 *以上建议基于有限信息，如有疑问请咨询专业兽医。*';
    return { id: Date.now().toString(), role: 'assistant', content: responseContent, messageType: 'text', createdAt: new Date().toISOString() };
  }

  // ─── 图片分析 API ──────────────────────────────────────────

  async uploadAndAnalyzeImage(
    imageBase64: string,
    petId: string,
    analysisType: 'symptom' | 'general' | 'food' | 'environment' | 'behavior' = 'general',
    userDescription?: string,
  ): Promise<ImageAnalysisResult> {
    const response = await fetch(`${API_BASE_URL}/ai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, petId, analysisType, userDescription }),
    });

    if (!response.ok) {
      throw new Error(`Image analysis API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as ImageAnalysisResult;

    // 持久化到 databaseService
    await databaseService.put(STORE_NAMES.EMOTION_ANALYSES, {
      ...result,
      petId,
      source: 'image_analysis',
    });

    return result;
  }

  // 兼容旧接口
  async analyzeImage(imageUrl: string, petType?: string, userDescription?: string): Promise<ImageAnalysisResult> {
    try {
      return await this.uploadAndAnalyzeImage(imageUrl, petType || 'unknown', 'general', userDescription);
    } catch {
      // 降级到本地关键词分析
      return this.localImageAnalysis(imageUrl, petType, userDescription);
    }
  }

  private localImageAnalysis(imageUrl: string, petType?: string, userDescription?: string): ImageAnalysisResult {
    const detectedIssues: string[] = [];
    let analysisType: ImageAnalysisResult['analysisType'] = 'general';
    let severityLevel: ImageAnalysisResult['severityLevel'] = 'low';
    let confidence = 0.78;
    const descriptionLower = (userDescription || '').toLowerCase();

    for (const [category, keywords] of Object.entries(imageAnalysisPatterns)) {
      for (const keyword of keywords) {
        if (descriptionLower.includes(keyword)) {
          detectedIssues.push(keyword);
          if (category === 'skinIssues' || category === 'bodyIssues') { analysisType = 'symptom'; severityLevel = 'medium'; }
          else if (category === 'eyeIssues' || category === 'earIssues' || category === 'mouthIssues') { analysisType = 'symptom'; severityLevel = 'medium'; }
          else if (category === 'foodIssues') { analysisType = 'food'; severityLevel = 'low'; }
          else if (category === 'environmentIssues') { analysisType = 'environment'; severityLevel = 'medium'; }
          else if (category === 'behaviorIssues') { analysisType = 'behavior'; severityLevel = 'low'; }
        }
      }
    }

    if (detectedIssues.length === 0) detectedIssues.push('需要进一步观察');
    confidence += Math.min(detectedIssues.length * 0.03, 0.12);

    const urgentKeywords = ['出血', '血', '严重', '紧急', '危险', '骨折', '昏迷', '抽搐'];
    for (const keyword of urgentKeywords) {
      if (descriptionLower.includes(keyword)) { severityLevel = 'urgent'; confidence = Math.min(confidence + 0.1, 0.95); break; }
    }

    const recommendations: string[] = [];
    if (severityLevel === 'urgent') { recommendations.push('🚨 建议立即就医'); recommendations.push('在前往医院途中保持宠物安静和温暖'); }
    else if (severityLevel === 'high') { recommendations.push('⚠️ 建议尽快就医检查'); recommendations.push('观察症状变化，记录详细情况'); }
    else if (severityLevel === 'medium') { recommendations.push('建议24小时内就医检查'); recommendations.push('继续观察症状是否有加重趋势'); }
    else { recommendations.push('可以继续观察1-2天'); recommendations.push('如症状加重请及时就医'); }

    const description = detectedIssues.length > 0 ? `图片分析结果显示：检测到「${detectedIssues.join('、')}」等问题。` : '图片分析结果：未检测到明显的健康问题，但建议继续观察。';

    return { id: `img-analysis-${Date.now()}`, imageUrl, analysisType, detectedIssues, confidence, description, recommendations, severityLevel, petType, analyzedAt: new Date().toISOString() };
  }

  // ─── 语音识别 API ──────────────────────────────────────────

  async transcribeVoice(audioBlob: Blob, petId: string, language?: string): Promise<VoiceRecognitionResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('petId', petId);
    if (language) formData.append('language', language);

    const response = await fetch(`${API_BASE_URL}/ai/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Voice transcription API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as VoiceRecognitionResult;

    // 持久化
    await databaseService.put(STORE_NAMES.AI_CONVERSATIONS, {
      id: result.id,
      petId,
      type: 'voice_input',
      result,
      createdAt: new Date().toISOString(),
    });

    return result;
  }

  // 兼容旧接口
  async processVoiceInput(audioUrl: string, transcript?: string): Promise<VoiceRecognitionResult> {
    try {
      // 如果有音频URL，尝试通过API转录
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      return await this.transcribeVoice(audioBlob, 'unknown');
    } catch {
      // 降级到本地关键词提取
      const mockTranscript = transcript || '我的宠物最近不太舒服，有点担心';
      const confidence = Math.min(0.85 + (mockTranscript.length > 20 ? 0.1 : 0), 0.95);
      const detectedKeywords: string[] = [];
      const transcriptLower = mockTranscript.toLowerCase();
      for (const [, keywords] of Object.entries(voiceKeywordPatterns)) {
        for (const keyword of keywords) {
          if (transcriptLower.includes(keyword)) detectedKeywords.push(keyword);
        }
      }
      return { id: `voice-${Date.now()}`, audioUrl, transcript: mockTranscript, confidence, language: 'zh-CN', duration: Math.max(2, Math.min(mockTranscript.length * 0.3, 10)), detectedKeywords, processedAt: new Date().toISOString() };
    }
  }

  // ─── 对话历史持久化 ────────────────────────────────────────

  private async persistConversation(petId: string, messages: Array<{ role: string; content: string }>, assistantReply: string): Promise<void> {
    try {
      const conversationId = `conv-${petId}-${Date.now()}`;
      await databaseService.put(STORE_NAMES.AI_CONVERSATIONS, {
        id: conversationId,
        petId,
        messages: [...messages, { role: 'assistant', content: assistantReply }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // 持久化失败不影响主流程
    }
  }

  async getConversationHistory(petId: string, limit: number = 20): Promise<AIMessage[]> {
    try {
      const conversations = await databaseService.getByIndex<{ id: string; petId: string; messages: AIMessage[]; createdAt: string }>(STORE_NAMES.AI_CONVERSATIONS, 'petId', petId);
      const allMessages: AIMessage[] = [];
      for (const conv of conversations) {
        if (conv.messages) allMessages.push(...conv.messages);
      }
      return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-limit);
    } catch {
      return [];
    }
  }

  // ─── 辅助方法 ──────────────────────────────────────────────

  handleEmptyInput(): AIResponse {
    return { content: '您好！请描述您想咨询的宠物健康问题，我会尽力为您提供帮助。\n\n您可以：\n• 描述宠物的症状或异常表现\n• 上传相关图片进行分析\n• 使用语音输入功能\n• 选择下方的快捷问题', confidence: 0.95, detectedIntents: ['consultation'] };
  }

  handleInvalidInput(validationResult: InputValidationResult): AIResponse {
    let content = '⚠️ 您的输入存在问题，请检查后重新提交：\n\n';
    for (const error of validationResult.errors) content += `❌ ${error}\n`;
    for (const warning of validationResult.warnings) content += `⚠️ ${warning}\n`;
    if (validationResult.hasProhibitedContent) content += '\n🚫 您的内容包含敏感信息，已被系统拦截。请使用文明、健康的语言描述宠物健康问题。\n';
    content += '\n请重新输入您的问题，或选择快捷问题开始咨询。';
    return { content, confidence: 0.99, needsClarification: true };
  }

  handleLongInput(content: string): AIResponse {
    const truncatedContent = content.substring(0, 500);
    const intentAnalysis = this.analyzeIntent(truncatedContent);
    const detectedSymptoms = this.extractSymptoms(intentAnalysis.processedMessage);
    let response = '📝 您的输入内容较长，我已提取关键信息进行分析：\n\n';
    response += `**提取的关键内容**：\n${truncatedContent.substring(0, 200)}...\n\n`;
    if (detectedSymptoms.length > 0) response += `**检测到的症状**：${detectedSymptoms.join('、')}\n\n`;
    if (intentAnalysis.intents.length > 0) response += `**识别到的意图**：${intentAnalysis.intents.join('、')}\n\n`;
    response += '如果需要更详细的分析，请将问题分成几个部分分别提问。';
    const analysisResponse = this.analyzeQuestion(truncatedContent);
    response += '\n\n---\n\n' + analysisResponse.content;
    return { content: response, confidence: 0.85, detectedIntents: intentAnalysis.intents };
  }

  handleMixedLanguageInput(content: string): AIResponse {
    const detectedLanguage = this.detectLanguage(content);
    const intentAnalysis = this.analyzeIntent(content);
    let response = '';
    if (detectedLanguage.startsWith('zh')) response = '🌐 检测到您的输入包含中文内容。\n\n';
    else if (detectedLanguage.startsWith('en')) response = '🌐 Detected English content.\n\n';
    const analysisResponse = this.analyzeQuestion(content);
    response += analysisResponse.content;
    return { content: response, confidence: 0.88, detectedIntents: intentAnalysis.intents };
  }

  processColloquialExpression(message: string): { processed: string; detected: string[]; categories: Record<string, string[]> } {
    const detected: string[] = [];
    const categories: Record<string, string[]> = { slang: [], dialect: [], abbreviation: [], emotional: [], internet: [] };
    let processed = message;
    for (const pattern of colloquialPatterns) {
      if (pattern.pattern.test(message)) {
        detected.push(`${pattern.pattern.source}→${pattern.standardForm}`);
        categories[pattern.category].push(pattern.standardForm);
        processed = processed.replace(pattern.pattern, pattern.standardForm);
      }
    }
    return { processed, detected, categories };
  }

  private generateClarificationResponse(ambiguityReason: string, detectedSymptoms: string[]): string {
    const symptomContext = detectedSymptoms.length > 0 ? `您提到了「${detectedSymptoms.join('、')}」的症状。` : '';
    const questionTemplates = ['症状持续多长时间了？', '症状的严重程度如何？', '是否有其他伴随症状？', '宠物最近是否有环境或饮食变化？', '精神状态和食欲怎么样？'];
    const selectedQuestions = questionTemplates.sort(() => Math.random() - 0.5).slice(0, 3);
    return `🔍 ${ambiguityReason}\n\n${symptomContext}\n\n为了更准确地帮助您，请告诉我：\n${selectedQuestions.map(q => `• ${q}`).join('\n')}\n\n请提供更多信息，我会给出更精准的建议。`;
  }

  private splitMultiIntentMessage(message: string): string[] {
    const splitPatterns = [/[，,；;]/, /\s+(?:和|并且|同时|另外|还有|也|又|以及)\s+/, /\s+(?:一方面|另一方面)\s+/, /\s+(?:首先|其次|再次|最后)\s+/, /\s+(?:第一|第二|第三)\s+/];
    const parts: string[] = [];
    let remaining = message;
    for (const pattern of splitPatterns) {
      const matches = remaining.split(pattern).filter(p => p.trim().length > 0);
      if (matches.length > 1) { parts.push(...matches.map(p => p.trim())); remaining = ''; break; }
    }
    if (parts.length === 0 && message.trim().length > 0) parts.push(message.trim());
    return parts.filter(p => p.length >= 3);
  }

  private generateMultiIntentResponse(intents: string[], _messageParts: string[], detectedSymptoms: string[]): string {
    const intentLabels: Record<string, string> = { diagnosis: '🔍 病情诊断', treatment: '💊 治疗建议', prevention: '🛡️ 预防措施', nutrition: '🥗 饮食营养', behavior: '🎯 行为训练', emergency: '⚠️ 紧急处理', consultation: '📋 咨询解答', confirmation: '✅ 确认核实', comparison: '⚖️ 对比分析', followup: '➡️ 后续问题', clarification: '📖 详细解释', cost: '💰 费用相关', time: '⏰ 时间相关', quantity: '📊 数量相关' };
    let response = '📋 您的问题涉及多个方面，我来逐一为您解答：\n\n';
    intents.forEach((intent, index) => { response += `**${index + 1}. ${intentLabels[intent] || '📌 其他问题'}**${detectedSymptoms.length > 0 ? `（涉及症状：${detectedSymptoms.join('、')}）` : ''}\n\n`; });
    response += '\n---\n\n';
    if (detectedSymptoms.length > 0) {
      const primarySymptom = detectedSymptoms[0];
      const symptomData = healthKnowledgeBase.symptoms[primarySymptom];
      if (symptomData) {
        response += `关于您提到的「${primarySymptom}」症状：\n\n`;
        symptomData.conditions.slice(0, 2).forEach(c => { response += `• ${c.name}（概率: ${Math.round(c.probability * 100)}%）\n  建议: ${c.recommendation}\n\n`; });
      }
    }
    response += '请问您想先了解哪个方面的详细信息？';
    return response;
  }

  private checkOutOfScope(message: string): { isOutOfScope: boolean; response: string } {
    const outOfScopePatterns = [
      { pattern: /天气|股票|新闻|政治|体育|电影|音乐|游戏|旅游|美食推荐|餐厅|酒店|航班|火车票|购物|衣服|鞋子|包包|化妆品|手机|电脑|汽车|房子|装修|理财|投资|贷款|信用卡|保险(?!宠物)|法律|诉讼|离婚|结婚|恋爱|相亲|求职|招聘|考试|学校|大学|留学|签证|移民|护照|税务|报税|社保|公积金|医保(?!宠物)/gi, category: '生活其他' },
      { pattern: /做饭|菜谱|食谱|烹饪|烘焙|健身|瑜伽|跑步|减肥(?!宠物)|美容(?!宠物)|化妆|穿搭|发型|护肤(?!宠物)/gi, category: '个人生活' },
      { pattern: /编程|代码|软件|开发|设计|营销|运营|产品|项目管理|数据分析|人工智能(?!宠物)|机器学习(?!宠物)/gi, category: '工作技术' },
      { pattern: /娱乐|明星|八卦|综艺|电视剧|小说|漫画|动漫|偶像|粉丝|演唱会|音乐节|酒吧|夜店|派对|聚会|喝酒|吸烟|赌博|彩票/gi, category: '娱乐休闲' },
    ];
    const petRelatedKeywords = ['猫', '狗', '宠物', '毛孩子', '猫咪', '狗狗', '小狗', '大狗', '小猫', '大猫', '兽医', '医院', '疫苗', '驱虫', '体检', '症状', '生病', '健康', '食欲', '呕吐', '腹泻', '咳嗽', '发烧', '皮肤', '耳朵', '眼睛', '牙齿', '关节', '行为', '训练', '喂养', '饮食', '洗澡', '美容', '绝育', '配种', '怀孕', '生产'];
    const hasPetKeyword = petRelatedKeywords.some(keyword => message.includes(keyword));
    if (!hasPetKeyword) {
      for (const pattern of outOfScopePatterns) {
        if (pattern.pattern.test(message)) {
          const response = `📌 **服务范围提示**\n\n您好！我是**宠物健康顾问**，专门解答宠物健康相关问题。\n\n您的问题似乎超出了我的服务范围（${pattern.category}）。\n\n**我可以帮助您解答：**\n• 🐾 宠物健康症状分析\n• 💊 护理和喂养建议\n• 🏥 就医判断和紧急情况处理\n• 💉 疫苗、驱虫、体检等预防保健\n\n**请描述您的宠物健康问题，我会尽力提供专业建议。**`;
          return { isOutOfScope: true, response };
        }
      }
    }
    return { isOutOfScope: false, response: '' };
  }

  private buildContextualResponse(message: string, context: ConversationContext, baseResponse: string, detectedSymptoms: string[]): string {
    let response = baseResponse;
    if (context.mentionedSymptoms.length > 1 && detectedSymptoms.length > 0) {
      response += `\n\n📋 您之前还提到了「${context.mentionedSymptoms.filter(s => !detectedSymptoms.includes(s)).join('、')}」的症状，这些症状可能与当前情况相关，建议一并关注。`;
    }
    if (detectedSymptoms.length > 0 && healthKnowledgeBase.followUpQuestions[detectedSymptoms[0]]) {
      const questions = healthKnowledgeBase.followUpQuestions[detectedSymptoms[0]];
      response += `\n\n❓ ${questions[0]}`;
    }
    if (context.lastIntent === 'emergency') response = '⚠️ **紧急提示**\n\n' + response;
    return response;
  }

  private generateContextAwareResponse(question: string, context?: ConversationContext, detectedSymptoms?: string[], intent?: string | null): AIResponse {
    const reasoning: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'urgent' = 'low';
    if (context && context.mentionedSymptoms.length > 0 && detectedSymptoms && detectedSymptoms.length === 0) {
      const previousSymptoms = context.mentionedSymptoms;
      reasoning.push(`上下文关联：之前提到的症状「${previousSymptoms.join('、')}」`);
      return { content: `您之前提到了「${previousSymptoms.join('、')}」的症状，请问现在这些症状有好转吗？还是出现了新的问题？\n\n请详细描述一下当前的情况，我会为您提供更准确的建议。`, confidence: 0.88, reasoning, severity };
    }
    if (intent === 'emergency') { severity = 'urgent'; reasoning.push('识别到紧急意图'); return { content: '⚠️ **紧急情况提示**\n\n根据您的描述，这可能是一个需要紧急处理的情况。建议您：\n\n1. 立即联系最近的宠物医院\n2. 在前往医院的路上保持宠物安静和温暖\n3. 如果可能，记录症状发生的时间和表现\n4. 不要自行用药，以免掩盖症状\n\n需要我帮您查找附近的宠物医院吗？', confidence: 0.95, reasoning, severity }; }
    if (intent === 'diagnosis') { reasoning.push('识别到诊断意图'); if (detectedSymptoms && detectedSymptoms.length > 0) severity = 'medium'; return { content: '根据您的描述，我需要更多信息来帮助分析可能的原因：\n\n1. 📅 这种症状持续多久了？\n2. 🐾 宠物的年龄和品种？\n3. 📊 症状的频率和严重程度？\n4. 🔍 是否有其他伴随症状？\n\n请提供这些信息，我会给出更准确的判断。', confidence: 0.85, reasoning, severity }; }
    if (intent === 'treatment') { reasoning.push('识别到治疗意图'); return { content: '关于治疗建议，我需要先了解具体情况：\n\n1. 宠物目前的主要症状是什么？\n2. 症状持续多长时间了？\n3. 是否已经看过兽医？\n4. 是否有用药史或过敏史？\n\n⚠️ 请注意：对于严重症状，建议先就医确诊，不要自行用药治疗。', confidence: 0.86, reasoning, severity }; }
    if (intent === 'prevention') { reasoning.push('识别到预防意图'); return { content: '预防措施建议：\n\n🏥 **定期体检**：每年至少一次全面体检\n💉 **疫苗接种**：按时完成疫苗接种\n🐛 **定期驱虫**：体内驱虫每3-6个月，体外驱虫每月\n🥗 **均衡饮食**：选择优质宠物食品\n🏃 **适量运动**：保持适当运动量\n🧼 **卫生管理**：定期清洁和梳理\n\n请问您想了解哪个方面的具体预防措施？', confidence: 0.90, reasoning, severity }; }
    if (intent === 'nutrition') { reasoning.push('识别到营养意图'); return { content: '关于宠物饮食营养建议：\n\n🍖 **主食选择**：选择符合AAFCO标准的优质商业粮\n🚫 **禁忌食物**：巧克力、洋葱、葡萄、木糖醇\n💧 **饮水建议**：保持充足的清洁饮水\n\n请问您想了解哪种宠物或哪个年龄段的具体饮食建议？', confidence: 0.91, reasoning, severity }; }
    if (intent === 'behavior') { reasoning.push('识别到行为意图'); return { content: '关于宠物行为训练建议：\n\n🎯 **基础训练原则**：使用正向强化方法\n📚 **基础指令**：坐下、趴下、等待、过来\n⚠️ **常见问题**：分离焦虑、攻击行为、破坏行为\n\n请问您遇到了什么具体的行为问题？', confidence: 0.89, reasoning, severity }; }
    reasoning.push('生成通用响应');
    if (question.length < 10) return { content: '您好！我是您的AI健康顾问。我可以帮助您：\n\n🔍 分析宠物症状和可能原因\n💊 提供护理和治疗建议\n📋 解答日常养护问题\n⚠️ 判断是否需要紧急就医\n\n请详细描述您的问题，我会尽力为您提供专业建议。', confidence: 0.88, reasoning, severity };
    return { content: '感谢您的咨询！为了更好地帮助您，请告诉我：\n\n1. 🐾 您的宠物是什么品种？多大了？\n2. 📋 具体有什么症状或问题？\n3. ⏰ 这种情况持续多久了？\n4. 🔍 是否有其他伴随症状？\n\n提供这些信息后，我可以给您更准确的建议。', confidence: 0.85, reasoning, severity };
  }

  generateImageAnalysisResponse(analysis: ImageAnalysisResult): string {
    const severityEmoji = { low: 'ℹ️', medium: '⚠️', high: '🚨', urgent: '🔴' };
    let response = `${severityEmoji[analysis.severityLevel]} **图片分析结果**\n\n`;
    response += `**分析类型**: ${analysis.analysisType}\n`;
    response += `**置信度**: ${Math.round(analysis.confidence * 100)}%\n`;
    response += `**严重程度**: ${analysis.severityLevel}\n\n`;
    response += `**检测到的问题**:\n`;
    for (const issue of analysis.detectedIssues) response += `• ${issue}\n`;
    response += `\n**建议措施**:\n`;
    for (const rec of analysis.recommendations) response += `• ${rec}\n`;
    return response;
  }

  generateVoiceInputResponse(voiceResult: VoiceRecognitionResult): string {
    let response = `🎤 **语音输入已识别**\n\n`;
    response += `**识别内容**: "${voiceResult.transcript}"\n`;
    response += `**置信度**: ${Math.round(voiceResult.confidence * 100)}%\n`;
    response += `**语言**: ${voiceResult.language}\n`;
    response += `**时长**: ${Math.round(voiceResult.duration)}秒\n\n`;
    if (voiceResult.detectedKeywords.length > 0) {
      response += `**检测到的关键词**:\n`;
      for (const keyword of voiceResult.detectedKeywords) response += `• ${keyword}\n`;
      response += '\n';
    }
    const intentAnalysis = this.analyzeIntent(voiceResult.transcript);
    if (intentAnalysis.intents.length > 0) response += `**识别到的意图**: ${intentAnalysis.intents.join('、')}\n\n`;
    response += '正在为您分析问题...\n\n';
    const analysisResponse = this.analyzeQuestion(voiceResult.transcript);
    response += analysisResponse.content;
    return response;
  }

  async sendMessageWithImage(consultationId: string, content: string, imageUrl: string, petType?: string): Promise<AIMessage> {
    try {
      const imageAnalysis = await this.uploadAndAnalyzeImage(imageUrl, consultationId, 'general', content);
      const analysisResponse = this.generateImageAnalysisResponse(imageAnalysis);
      let fullResponse = '';
      if (content && content.trim().length > 0) {
        const textAnalysis = this.analyzeQuestion(content, petType);
        fullResponse = `📝 **您描述的问题**:\n${content}\n\n`;
        fullResponse += textAnalysis.content + '\n\n---\n\n';
      }
      fullResponse += analysisResponse;
      return { id: Date.now().toString(), role: 'assistant', content: fullResponse, messageType: 'image', createdAt: new Date().toISOString() };
    } catch {
      // 降级到本地
      const imageAnalysis = await this.localImageAnalysis(imageUrl, petType, content);
      const analysisResponse = this.generateImageAnalysisResponse(imageAnalysis);
      return { id: Date.now().toString(), role: 'assistant', content: analysisResponse, messageType: 'image', createdAt: new Date().toISOString() };
    }
  }

  async sendMessageWithVoice(consultationId: string, audioUrl: string, transcript?: string, _petType?: string): Promise<AIMessage> {
    try {
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      const voiceResult = await this.transcribeVoice(audioBlob, consultationId);
      const voiceResponse = this.generateVoiceInputResponse(voiceResult);
      return { id: Date.now().toString(), role: 'assistant', content: voiceResponse, messageType: 'voice', createdAt: new Date().toISOString() };
    } catch {
      const voiceResult = await this.processVoiceInput(audioUrl, transcript);
      const voiceResponse = this.generateVoiceInputResponse(voiceResult);
      return { id: Date.now().toString(), role: 'assistant', content: voiceResponse, messageType: 'voice', createdAt: new Date().toISOString() };
    }
  }
}

export const aiConsultationService = new AIConsultationService();
