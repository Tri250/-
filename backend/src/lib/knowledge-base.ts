import { TokenCounter } from './ai-service';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'symptom' | 'disease' | 'nutrition' | 'vaccine' | 'emergency' | 'care';
  keywords: string[];
  source: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

class PetHealthKnowledgeBase {
  private knowledge: KnowledgeItem[] = [];
  private tokenizer: TokenCounter;
  
  constructor() {
    this.tokenizer = new TokenCounter();
    this.initializeBaseKnowledge();
  }
  
  private initializeBaseKnowledge() {
    this.knowledge = [
      {
        id: 'diarrhea-001',
        title: '宠物腹泻诊治指南',
        category: 'symptom',
        keywords: ['拉稀', '腹泻', '软便', '大便稀', '肠胃炎', 'diarrhea'],
        content: `宠物腹泻常见原因及处理：

**常见原因：**
1. 饮食问题（换粮、吃了不洁食物）
2. 感染（病毒、细菌、寄生虫）
3. 应激反应（环境变化）
4. 慢性疾病（胰腺炎、肠道肿瘤）

**处理原则：**
1. 禁食 12-24 小时（仅供水）
2. 补充益生菌
3. 逐步恢复饮食
4. 观察粪便情况

**🚨 立即就医：**
- 血便或黑色粪便
- 伴随呕吐、发热
- 持续超过 24 小时
- 幼年或老年宠物
- 精神萎靡不振`,
        source: '临床经验总结',
        urgency: 'high',
      },
      {
        id: 'vomit-001',
        title: '宠物呕吐处理指南',
        category: 'symptom',
        keywords: ['呕吐', '吐了', '反胃', '干呕', 'vomit'],
        content: `宠物呕吐常见原因及处理：

**常见原因：**
1. 毛球症（猫常见）
2. 进食过快
3. 空腹太久
4. 中毒
5. 消化系统疾病

**处理原则：**
1. 禁食 6-12 小时
2. 提供少量清水
3. 观察呕吐物
4. 逐步恢复进食

**🚨 立即就医：**
- 频繁呕吐（超过 3 次）
- 呕吐物带血
- 伴随腹泻、发热
- 疑似中毒
- 幼年宠物`,
        source: '临床经验总结',
        urgency: 'high',
      },
      {
        id: 'emergency-001',
        title: '宠物紧急情况判断标准',
        category: 'emergency',
        keywords: ['紧急', '急诊', '危险', '中毒', '呼吸困难', '休克'],
        content: `需要立即就医的紧急情况：

**🚨 危急症状：**
1. 呼吸困难、喘息
2. 严重出血
3. 抽搐、癫痫
4. 昏迷、意识丧失
5. 严重创伤（骨折、出血）
6. 中毒（老鼠药、巧克力等）
7. 难产
8. 腹部膨胀（疑似胃扭转）

**紧急处理：**
1. 保持冷静
2. 尽快联系最近的宠物医院
3. 不要自行处理伤口
4. 携带宠物以往的病历和用药记录
5. 途中保持宠物安静`,
        source: '急诊医学指南',
        urgency: 'critical',
      },
      {
        id: 'vaccine-001',
        title: '犬猫疫苗接种指南',
        category: 'vaccine',
        keywords: ['疫苗', '打针', '预防针', '免疫', 'vaccine', '传染病'],
        content: `宠物疫苗接种指南：

**狗狗必打疫苗：**
1. 狂犬疫苗（法定）
2. 犬瘟热
3. 犬细小病毒
4. 犬腺病毒
5. 犬副流感

**猫咪必打疫苗：**
1. 狂犬疫苗（法定）
2. 猫瘟热
3. 猫杯状病毒
4. 猫疱疹病毒

**接种时间表：**
- 首免：6-8 周龄
- 加强：首免后 3-4 周
- 成年后：每年加强

**注意事项：**
1. 接种前后避免洗澡
2. 观察过敏反应
3. 保持接种记录`,
        source: '疫苗接种指南',
        urgency: 'medium',
      },
      {
        id: 'nutrition-001',
        title: '宠物营养饮食指南',
        category: 'nutrition',
        keywords: ['饮食', '营养', '喂食', '食物', '过敏', '禁忌'],
        content: `宠物饮食营养指南：

**猫咪营养需求：**
1. 蛋白质：30-40%
2. 脂肪：15-20%
3. 牛磺酸（必需）
4. 猫咪是肉食动物

**狗狗营养需求：**
1. 蛋白质：18-25%
2. 脂肪：10-15%
3. 碳水化合物：适量
4. 狗狗是杂食动物

**🚨 宠物不能吃的食物：**
1. 巧克力（致命）
2. 洋葱、大葱（溶血）
3. 葡萄、葡萄干（肾衰）
4. 木糖醇（低血糖）
5. 酒精（中毒）
6. 咖啡因（兴奋）
7. 夏威夷果（神经毒性）

**过敏食物：**
- 牛奶（乳糖不耐受）
- 鸡蛋（部分宠物过敏）
- 鸡肉（常见过敏原）`,
        source: '宠物营养学',
        urgency: 'high',
      },
      {
        id: 'skin-001',
        title: '宠物皮肤问题识别',
        category: 'symptom',
        keywords: ['皮肤', '瘙痒', '脱毛', '红肿', '皮屑', '皮肤病'],
        content: `常见宠物皮肤问题：

**常见症状：**
1. 瘙痒、舔舐
2. 脱毛、斑秃
3. 皮肤红肿、发炎
4. 皮屑增多
5. 脓疱、溃烂

**常见原因：**
1. 寄生虫（跳蚤、螨虫）
2. 真菌感染（癣）
3. 过敏（食物、环境）
4. 内分泌疾病
5. 细菌感染

**家庭护理：**
1. 佩戴伊丽莎白圈防止舔咬
2. 保持皮肤干燥清洁
3. 使用专用洗护产品
4. 补充必需脂肪酸

**🚨 就医指征：**
- 皮肤溃烂流脓
- 全身性脱毛
- 剧烈瘙痒影响生活
- 伴随精神食欲下降`,
        source: '皮肤病学指南',
        urgency: 'medium',
      },
    ];
  }
  
  search(query: string, topK: number = 3): KnowledgeItem[] {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);
    
    const scored = this.knowledge.map(item => {
      let score = 0;
      
      for (const word of queryWords) {
        if (item.keywords.some(k => k.toLowerCase().includes(word))) {
          score += 3;
        }
        if (item.title.toLowerCase().includes(word)) {
          score += 2;
        }
        if (item.content.toLowerCase().includes(word)) {
          score += 1;
        }
        if (item.category.toLowerCase().includes(word)) {
          score += 1;
        }
      }
      
      return { item, score };
    });
    
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.item);
  }
  
  getRelatedKnowledge(category: string): KnowledgeItem[] {
    return this.knowledge.filter(item => item.category === category);
  }
  
  getEmergencyKnowledge(): KnowledgeItem[] {
    return this.knowledge.filter(item => item.urgency === 'critical');
  }
  
  formatAsContext(items: KnowledgeItem[]): string {
    return items.map(item => 
      `【${item.title}】（来源：${item.source}）
${item.content}`
    ).join('\n\n---\n\n');
  }
}

export const knowledgeBase = new PetHealthKnowledgeBase();
export default knowledgeBase;
