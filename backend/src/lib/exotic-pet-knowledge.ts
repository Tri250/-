import { TokenCounter } from './ai-service';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'symptom' | 'disease' | 'nutrition' | 'vaccine' | 'emergency' | 'care' | 'behavior';
  keywords: string[];
  source: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  petType: string[];
}

class ExoticPetKnowledgeBase {
  private knowledge: KnowledgeItem[] = [];
  
  constructor() {
    this.initializeHamsterKnowledge();
    this.initializeRabbitKnowledge();
    this.initializeBirdKnowledge();
    this.initializeReptileKnowledge();
    this.initializeFishKnowledge();
  }
  
  private initializeHamsterKnowledge() {
    // 仓鼠知识库
    this.knowledge.push(
      {
        id: 'hamster-001',
        title: '仓鼠保暖指南',
        category: 'care',
        keywords: ['仓鼠', '保暖', '冬天', '加热', '温度', 'hamster', 'winter', 'warm'],
        content: `仓鼠冬季保暖指南：

**适宜温度**：20-25°C
**危险温度**：低于10°C可能导致冬眠，低于5°C有生命危险

**保暖措施**：
1. 多铺木屑（至少10cm厚）
2. 提供纸棉或棉花（自制窝）
3. 将笼子放在避风处
4. 可使用加热垫（需设置低温档）
5. 避免直接吹空调/暖气

**禁止事项**：
- 禁止使用棉纤维（会缠脚）
- 禁止使用电热毯直接接触笼子
- 禁止放在暖气片旁边（温度过高）

**健康观察**：
- 检查是否有打喷嚏、流鼻涕
- 观察进食量和活动量
- 仓鼠可能假冬眠（需立即加温）`,
        source: '小宠物养护指南',
        urgency: 'high',
        petType: ['仓鼠', 'hamster', '金丝熊', '侏儒仓鼠'],
      },
      {
        id: 'hamster-002',
        title: '仓鼠饮食指南',
        category: 'nutrition',
        keywords: ['仓鼠', '饮食', '喂食', '食物', '营养', 'diet', 'food'],
        content: `仓鼠饮食指南：

**主食**：
- 专业仓鼠粮（每天约10-15g）
- 禁止喂食人的加工食品

**可以喂食**：
- 🥬 蔬菜：西兰花、胡萝卜、黄瓜（少量）
- 🍎 水果：苹果（去核）、香蕉（少量）
- 🥕 蛋白质：水煮蛋（少量）、鸡胸肉（去骨无盐）
- 🌰 坚果：瓜子、花生（适量）

**禁止喂食**：
- ❌ 巧克力（致命）
- ❌ 洋葱、大葱、蒜（有毒）
- ❌ 柑橘类水果
- ❌ 生土豆
- ❌ 杏仁（有毒）
- ❌ 人类零食（薯片、饼干等）

**注意事项**：
- 仓鼠有颊囊，不要喂黏糊糊的食物
- 食物需新鲜，及时清理未吃完的蔬果
- 瓜子等高脂肪食物需限量（易上火）`,
        source: '仓鼠营养学',
        urgency: 'high',
        petType: ['仓鼠', 'hamster', '金丝熊', '侏儒仓鼠'],
      },
      {
        id: 'hamster-003',
        title: '仓鼠常见疾病',
        category: 'symptom',
        keywords: ['仓鼠', '生病', '疾病', '症状', '湿尾', '肿瘤', 'sick', 'disease'],
        content: `仓鼠常见疾病识别：

**🚨 紧急情况（立即就医）**：
1. **湿尾症**
   - 症状：尾巴潮湿、腹泻、精神萎靡
   - 致死率高，需立即就医
   - 隔离病鼠，消毒笼具

2. **肿瘤/肿块**
   - 仓鼠常见肿瘤
   - 发现肿块尽快就医
   - 良性切除后可治愈

3. **中暑**
   - 温度超过28°C易中暑
   - 症状：呼吸急促、虚弱、昏迷
   - 立即转移到阴凉处

**⚠️ 需关注的情况**：
- 打喷嚏/流鼻涕（可能是感冒）
- 眼睛发红/流脓
- 脱毛/皮肤问题
- 食欲下降
- 行动迟缓

**预防措施**：
- 保持笼子清洁干燥
- 合理饮食，避免肥胖
- 定期检查身体
- 避免温差过大`,
        source: '仓鼠医学手册',
        urgency: 'critical',
        petType: ['仓鼠', 'hamster', '金丝熊', '侏儒仓鼠'],
      }
    );
  }
  
  private initializeRabbitKnowledge() {
    // 兔子知识库
    this.knowledge.push(
      {
        id: 'rabbit-001',
        title: '兔子饲养环境指南',
        category: 'care',
        keywords: ['兔子', '饲养', '环境', '笼子', '卫生', 'rabbit', 'housing'],
        content: `兔子饲养环境指南：

**居住环境要求**：
- 笼子尺寸：至少兔子的4倍大小
- 温度：15-25°C为宜
- 湿度：40-60%
- 通风良好，避免直吹风

**垫料选择**：
- ✅ 推荐：木屑粒、纸粒
- ❌ 不推荐：报纸（油墨有毒）、猫砂（粉尘大）

**日常清洁**：
- 每天清理厕所
- 每周更换垫料
- 每月彻底消毒笼具
- 保持干燥，防止细菌滋生

**放风区域**：
- 安全的围栏空间
- 检查有无电线、有毒植物
- 避免地毯（可能啃食）
- 禁止放养在阳台（温差大、有天敌风险）

**环境丰容**：
- 提供躲藏屋
- 设置跑道/玩具
- 定期更换玩具位置`,
        source: '兔子福利指南',
        urgency: 'medium',
        petType: ['兔子', 'rabbit', '垂耳兔', '侏儒兔'],
      },
      {
        id: 'rabbit-002',
        title: '兔子饮食完全指南',
        category: 'nutrition',
        keywords: ['兔子', '饮食', '牧草', '兔粮', '蔬菜', 'rabbit', 'diet', 'hay'],
        content: `兔子饮食金字塔：

**🥇 基础（占饮食80%+）**：
- 提摩西草：无限量供应
- 苜蓿草：幼兔可适量，成兔少喂（钙含量高）

**🥈 辅助（占饮食10-15%）**：
- 专用兔粮：每天体重3-5%
- 新鲜蔬菜：每天约一杯量

**推荐蔬菜**：
- ✅ 绿叶菜：生菜、罗勒、香菜
- ✅ 根茎类：胡萝卜（少量）、甜菜根
- ✅ 其他：西兰花（少量）、黄瓜

**🚫 禁止喂食**：
- ❌ 所有人类零食
- ❌ 面包、面粉制品
- ❌ 土豆、豆类
- ❌ 洋葱、大蒜
- ❌ 巧克力（致命）
- ❌ 生豆角

**⚠️ 注意事项**：
- 必须无限量吃草（磨牙+消化）
- 兔子不吃草会导致牙齿过长
- 换粮需循序渐进
- 蔬菜需洗净晾干`,
        source: '兔子营养学',
        urgency: 'high',
        petType: ['兔子', 'rabbit', '垂耳兔', '侏儒兔'],
      },
      {
        id: 'rabbit-003',
        title: '兔子消化系统疾病',
        category: 'symptom',
        keywords: ['兔子', '消化', '拉稀', '便秘', '胀气', 'GI', 'stasis'],
        content: `兔子消化系统疾病：

**🚨 胃肠道停滞（最常见）**
- 症状：不吃不拉、肚子硬、精神差
- 原因：毛球、饮食不当、运动不足
- 处理：立即就医，可能需要强制喂食
- 预防：多吃草、适当运动、定期化毛

**🚨 胀气**
- 症状：肚子鼓胀、轻拍有鼓声、疼痛
- 原因：吃太多易产气食物
- 处理：就医，可按摩腹部（顺时针）
- 预防：避免豆类、薯类等易胀气食物

**⚠️ 拉稀**
- 症状：软便、水便、屁股脏
- 原因：饮食问题、应激、寄生虫
- 处理：调整饮食，严重就就医
- 预防：稳定饮食、保证卫生

**⚠️ 便秘**
- 症状：排便减少、粪便干小
- 原因：缺水、缺纤维、运动不足
- 处理：多喂草、可喂少量菠萝汁
- 预防：无限量提草、大量饮水

**⚠️ 球虫病（幼兔高发）**
- 症状：消瘦、拉稀、精神差
- 预防：定期驱虫、笼具消毒
- 治疗：需就医，使用驱虫药`,
        source: '兔子医学指南',
        urgency: 'critical',
        petType: ['兔子', 'rabbit', '垂耳兔', '侏儒兔'],
      }
    );
  }
  
  private initializeBirdKnowledge() {
    // 鸟类知识库
    this.knowledge.push(
      {
        id: 'bird-001',
        title: '鸟类饲养温度指南',
        category: 'care',
        keywords: ['鸟类', '鹦鹉', '温度', '保暖', 'bird', 'parrot', 'temperature'],
        content: `鸟类温度管理指南：

**适宜温度**：
- 大多数鸟类：20-25°C
- 雏鸟需保温箱：28-32°C
- 病鸟：25-30°C

**温度调节**：
1. **保暖措施**：
   - 笼子远离窗户和风口
   - 使用保温灯（距离笼子30cm以上）
   - 冬季可使用加热垫

2. **防暑措施**：
   - 夏季保持通风
   - 禁止空调直吹
   - 提供清凉饮水

**危险信号**：
- 炸毛（可能失温或生病）
- 缩成一团
- 颤抖
- 呼吸急促（可能中暑）

**品种差异**：
- 虎皮鹦鹉：较耐寒，15°C以上
- 牡丹鹦鹉：15-25°C
- 玄凤鹦鹉：18-26°C
- 金刚鹦鹉：20-30°C

**注意事项**：
- 禁止骤变温度
- 雨季注意保暖
- 换羽期适当提高温度`,
        source: '鸟类福利指南',
        urgency: 'high',
        petType: ['鹦鹉', '鸟', 'bird', 'parrot', '虎皮鹦鹉', '玄凤', '牡丹鹦鹉'],
      },
      {
        id: 'bird-002',
        title: '鹦鹉饮食完全指南',
        category: 'nutrition',
        keywords: ['鹦鹉', '饮食', '种子粮', '水果', 'nutrition', 'diet', 'parrot'],
        content: `鹦鹉饮食完全指南：

**🌾 种子粮（适量）**：
- 混合种子粮作为基础
- 每天约1-2汤匙
- 注意种子粮新鲜度

**🥬 新鲜蔬果（重要）**：
- ✅ 蔬菜：西兰花、胡萝卜、甜椒、菠菜
- ✅ 水果：苹果（去核）、香蕉、蓝莓、芒果
- ✅ 其他：煮熟的米饭、全麦面包

**🚫 禁止喂食**：
- ❌ 牛油果（对鸟有毒）
- ❌ 巧克力（致命）
- ❌ 咖啡因（咖啡、茶、可乐）
- ❌ 洋葱、大蒜
- ❌ 盐和糖
- ❌ 酒精
- ❌ 苹果核（氰化物）

**💊 营养补充**：
- 墨鱼骨（补钙）
- 保健砂（助消化）
- 定期补充维生素

**喂食技巧**：
- 每天更换食物
- 多样化饮食
- 水果切小块
- 禁止喂食人的加工食品

**断食管理**：
- 健康鸟不建议断食
- 病鸟断食需遵医嘱`,
        source: '鹦鹉营养学',
        urgency: 'high',
        petType: ['鹦鹉', '鸟', 'bird', 'parrot', '虎皮鹦鹉', '玄凤', '金刚鹦鹉'],
      },
      {
        id: 'bird-003',
        title: '鸟类常见疾病识别',
        category: 'symptom',
        keywords: ['鹦鹉', '生病', '症状', '感冒', '单眼伤风', 'sick', 'disease', 'parrot'],
        content: `鸟类常见疾病识别：

**🚨 呼吸道感染**
- 症状：打喷嚏、流鼻涕、呼吸困难、张嘴呼吸
- 原因：温差大、细菌/病毒感染
- 处理：保温28°C、隔离、就医
- 预防：保持通风但避免直吹

**🚨 单眼伤风（衣原体感染）**
- 症状：单眼红肿、流泪、有分泌物
- 传染性：强，可传染人
- 处理：隔离、就医、使用抗生素
- 预防：定期消毒笼具

**🚨 嗉囊炎**
- 症状：嗉囊胀气、不消化、有异味
- 原因：细菌感染、食物不洁
- 处理：禁食、就医、补充益生菌
- 预防：食物新鲜、器具清洁

**⚠️ 啄羽症**
- 症状：拔自己羽毛、皮肤破损
- 原因：无聊、营养不良、寄生虫、心理问题
- 处理：环境丰容、营养补充、就医
- 预防：陪伴互动、提供玩具

**⚠️ 寄生虫**
- 体外：羽虱、螨虫
  - 症状：羽毛异常、瘙痒
  - 处理：驱虫药洗澡
- 体内：球虫、毛滴虫
  - 症状：消瘦、腹泻
  - 处理：驱虫药`,
        source: '鸟类医学手册',
        urgency: 'critical',
        petType: ['鹦鹉', '鸟', 'bird', 'parrot', '虎皮鹦鹉', '玄凤'],
      }
    );
  }
  
  private initializeReptileKnowledge() {
    // 爬行动物知识库
    this.knowledge.push(
      {
        id: 'reptile-001',
        title: '爬行动物饲养温湿度指南',
        category: 'care',
        keywords: ['爬虫', '蜥蜴', '龟', '守宫', '温度', '湿度', 'reptile', 'temperature', 'humidity'],
        content: `爬行动物温湿度管理：

**为什么温湿度重要**：
- 爬行动物是变温动物
- 需要外部热源调节体温
- 湿度影响蜕皮和健康

**常见品种温湿度要求**：

**🦎 豹纹守宫**：
- 热区温度：28-32°C
- 冷区温度：24-28°C
- 湿度：40-60%
- 蜕皮期：提高湿度至70-80%

**🦎 鬃狮蜥**：
- 晒点温度：35-40°C
- 热区温度：28-32°C
- 冷区温度：24-28°C
- 湿度：30-40%
- 晒灯每天10-12小时

**🐢 陆龟**：
- 热区温度：30-35°C
- 冷区温度：22-26°C
- 湿度：50-70%
- 需要 UVB 照射

**🐍 玉米蛇**：
- 热区温度：28-30°C
- 冷区温度：24-26°C
- 湿度：50-60%
- 蜕皮期提高湿度

**设备推荐**：
- 陶瓷加热灯（不发光）
- 加热垫（配合温控）
- 湿度计+温度计
- UVB灯（部分品种必需）`,
        source: '爬行动物福利指南',
        urgency: 'high',
        petType: ['蜥蜴', '龟', '守宫', '鬃狮蜥', '蛇', 'reptile', 'gecko', 'lizard'],
      },
      {
        id: 'reptile-002',
        title: '爬行动物饮食完全指南',
        category: 'nutrition',
        keywords: ['爬虫', '饮食', '喂食', '虫子', '杜比亚', 'reptile', 'diet', 'feeder'],
        content: `爬行动物饮食完全指南：

**🦎 守宫类（昆虫食性）**：
- 主食：蟋蟀、杜比亚蟑螂、面包虫
- 补品：大麦虫（脂肪高，少喂）
- 喂食频率：成体2-3天一次
- 注意事项：
  - 虫子大小不超过头部1/3
  - 喂前虫子需吃饱（营养更好）
  - 定期补钙和维生素

**🦎 鬃狮蜥（杂食性）**：
- 昆虫：蟋蟀、杜比亚（幼体为主）
- 蔬菜：苦荬菜、蒲公英、紫甘蓝
- 水果：蓝莓、香蕉（少量）
- 喂食频率：
  - 幼体：每天昆虫
  - 成体：昆虫+蔬菜，每天或隔天

**🐢 陆龟（草食性）**：
- 主食：各种牧草和绿叶蔬菜
- 推荐：提摩西草、黑麦草
- 蔬菜：蒲公英、苦荬菜、菜心
- 禁止：肉类、高蛋白食物

**🐍 蛇类**：
- 主食：老鼠（小蛇）、大鼠（成蛇）
- 喂食频率：
  - 幼体：5-7天一次
  - 成体：10-14天一次
- 注意事项：
  - 禁止喂活食（可能咬伤）
  - 冻鼠需完全解冻
  - 喂食后48小时内不打扰`,
        source: '爬行动物营养学',
        urgency: 'high',
        petType: ['蜥蜴', '龟', '守宫', '鬃狮蜥', '蛇', 'reptile', 'gecko', 'lizard'],
      }
    );
  }
  
  private initializeFishKnowledge() {
    // 鱼类知识库
    this.knowledge.push(
      {
        id: 'fish-001',
        title: '观赏鱼水质管理指南',
        category: 'care',
        keywords: ['鱼', '水质', '水温', '换水', '过滤', 'fish', 'water', 'aquarium'],
        content: `观赏鱼水质管理指南：

**水质核心参数**：

**🌡️ 水温**：
- 热带鱼：24-28°C
- 金鱼：18-24°C
- 冷水鱼：15-22°C
- 使用加热棒/冷水机恒温

**💧 换水原则**：
- 频率：每周换1/3到1/4
- 温差：不超过2°C
- 需除氯（晾晒或使用除氯剂）
- 使用水管抽出底部废物

**🧪 水质检测**：
- pH值：大多数鱼6.5-7.5
- 氨氮：应接近0
- 亚硝酸盐：应接近0
- 硝酸盐：应<40ppm

**🔧 过滤系统**：
- 物理过滤：去除残渣
- 生化过滤：培养有益菌
- 滤材需定期清洗（但不要用自来水）
- 过滤流量：每小时4-6倍水体

**⚠️ 常见问题**：
- 鱼浮头：缺氧或水质问题
- 鱼蹭身：可能有寄生虫
- 白点病：水温升至30°C+黄粉
- 烂尾烂鳍：水质问题+细菌感染

**新鱼入缸**：
- 需过温过水
- 隔离观察1-2周
- 禁止直接倒入新环境`,
        source: '水族养护指南',
        urgency: 'high',
        petType: ['鱼', '金鱼', '热带鱼', '观赏鱼', 'fish', 'aquarium'],
      }
    );
  }
  
  // 搜索相关知识
  search(query: string, petType?: string, topK: number = 3): KnowledgeItem[] {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/[\s,，,。]+/).filter(w => w.length > 1);
    
    let candidates = this.knowledge;
    
    // 如果指定了宠物类型，优先筛选
    if (petType) {
      const typeMatches = candidates.filter(k => 
        k.petType.some(t => t.toLowerCase().includes(petType.toLowerCase()))
      );
      if (typeMatches.length > 0) {
        candidates = typeMatches;
      }
    }
    
    // 关键词匹配评分
    const scored = candidates.map(item => {
      let score = 0;
      
      // 宠物类型匹配
      if (petType) {
        const hasMatch = item.petType.some(t => 
          t.toLowerCase().includes(petType.toLowerCase())
        );
        if (hasMatch) score += 5;
      }
      
      // 关键词匹配
      for (const word of queryWords) {
        // 标题匹配
        if (item.title.toLowerCase().includes(word)) {
          score += 3;
        }
        // 关键词匹配
        if (item.keywords.some(k => k.toLowerCase().includes(word))) {
          score += 2;
        }
        // 内容匹配
        if (item.content.toLowerCase().includes(word)) {
          score += 1;
        }
        // 分类匹配
        if (item.category.toLowerCase().includes(word)) {
          score += 1;
        }
      }
      
      return { item, score };
    });
    
    // 返回得分最高的项
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.item);
  }
  
  // 按宠物类型获取知识
  getKnowledgeByPetType(petType: string): KnowledgeItem[] {
    return this.knowledge.filter(item =>
      item.petType.some(t => t.toLowerCase().includes(petType.toLowerCase()))
    );
  }
  
  // 格式化知识为上下文
  formatAsContext(items: KnowledgeItem[]): string {
    if (items.length === 0) {
      return '';
    }
    
    return items.map(item => 
      `【${item.title}】（宠物类型：${item.petType.join('、')}）
${item.content}`
    ).join('\n\n---\n\n');
  }
}

export const exoticPetKnowledge = new ExoticPetKnowledgeBase();
export default exoticPetKnowledge;
