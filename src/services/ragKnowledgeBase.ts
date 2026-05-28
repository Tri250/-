/**
 * PawSync Pro - RAG知识库服务
 * 集成LangChain.js实现宠物医学知识检索增强生成
 * 作者: 带娃的小陈工
 */

import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { HealthManual } from '../types/health-manual';

interface KnowledgeEntry {
  id: string;
  content: string;
  metadata: {
    title: string;
    category: string;
    petType: 'dog' | 'cat' | 'both';
    tags: string[];
  };
}

interface RAGQueryResult {
  answer: string;
  sourceDocuments: Array<{
    title: string;
    content: string;
    url?: string;
  }>;
  confidence: number;
}

class RAGKnowledgeBase {
  private vectorStore: HNSWLib | null = null;
  private chain: RetrievalQAChain | null = null;
  private isInitialized: boolean = false;
  private knowledgeBase: KnowledgeEntry[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * 初始化知识库 - 将健康手册内容向量化
   */
  private async initializeKnowledgeBase() {
    try {
      const documents = await this.loadHealthManuals();
      this.knowledgeBase = documents;
      
      // 使用本地向量存储（不需要额外的向量数据库）
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });

      const docs = await splitter.createDocuments(
        documents.map(doc => doc.content),
        documents.map(doc => ({
          title: doc.metadata.title,
          category: doc.metadata.category,
          petType: doc.metadata.petType,
          tags: doc.metadata.tags,
        }))
      );

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY || 'mock-key',
      });

      this.vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
      this.isInitialized = true;
      console.log('RAG知识库初始化完成，共加载', documents.length, '条知识');
    } catch (error) {
      console.error('RAG知识库初始化失败:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 加载健康手册内容
   */
  private async loadHealthManuals(): Promise<KnowledgeEntry[]> {
    const entries: KnowledgeEntry[] = [
      {
        id: 'manual-1',
        content: '猫咪科学喂养指南：幼猫期（0-6个月）需要更多蛋白质和热量，选择高品质幼猫粮，每天3-4次。成年猫每天2次定时定量。老年猫消化功能下降，选择专用老年猫粮。',
        metadata: {
          title: '猫咪科学喂养指南',
          category: 'nutrition',
          petType: 'cat',
          tags: ['猫粮', '营养', '喂养', '幼猫', '老年猫'],
        },
      },
      {
        id: 'manual-2',
        content: '狗狗异常行为识别：过度舔舐可能是皮肤问题或焦虑。超过24小时食欲不振需重视。突然攻击性可能是疼痛或疾病信号。分离焦虑表现为独处时吠叫、破坏物品。',
        metadata: {
          title: '狗狗异常行为识别',
          category: 'behavior',
          petType: 'dog',
          tags: ['行为', '健康信号', '训练', '焦虑'],
        },
      },
      {
        id: 'manual-3',
        content: '宠物急救常识：中毒立即催吐（2小时内），带可疑物就医。外伤出血用干净纱布按压止血。中暑转移到阴凉处，用凉水擦拭身体。窒息检查口腔异物，严重立即送医。',
        metadata: {
          title: '宠物急救常识',
          category: 'emergency',
          petType: 'both',
          tags: ['急救', '安全', '中毒', '外伤'],
        },
      },
      {
        id: 'manual-4',
        content: '宠物口腔护理：80%的3岁以上宠物有口腔问题。每天刷牙使用宠物专用牙膏。提供洁牙零食和玩具。定期口腔检查。异常信号包括口臭、牙龈红肿、牙齿松动。',
        metadata: {
          title: '宠物口腔护理全攻略',
          category: 'care',
          petType: 'both',
          tags: ['口腔', '护理', '牙齿', '牙周病'],
        },
      },
      {
        id: 'manual-5',
        content: '狗狗营养需求：成年犬蛋白质18-25%，幼犬22-30%。脂肪需求10-15%。维生素A保护视力，维生素D促进钙吸收。Omega-3/6改善皮肤毛发。',
        metadata: {
          title: '狗狗营养需求全解析',
          category: 'nutrition',
          petType: 'dog',
          tags: ['营养', '狗粮', '蛋白质', '幼犬'],
        },
      },
      {
        id: 'manual-6',
        content: '猫咪行为解读：尾巴高高竖起表示自信友好。耳朵向后贴头表示害怕。身体压低准备攻击或逃跑。缓慢眨眼表达爱意。短促喵声是打招呼，拉长喵声是有需求。',
        metadata: {
          title: '猫咪行为解读',
          category: 'behavior',
          petType: 'cat',
          tags: ['行为', '猫咪', '身体语言', '沟通'],
        },
      },
      {
        id: 'manual-7',
        content: '宠物毛发护理：短毛猫每周1-2次，长毛猫每天梳毛。洗澡每月1-2次，使用宠物专用沐浴露。换毛季增加梳毛频率，补充Omega-3。异常掉毛需就医检查。',
        metadata: {
          title: '宠物毛发护理指南',
          category: 'care',
          petType: 'both',
          tags: ['毛发', '护理', '梳毛', '洗澡'],
        },
      },
      {
        id: 'manual-8',
        content: '常见疾病症状识别：消化系统问题包括呕吐、腹泻、便秘。呼吸系统问题包括咳嗽、打喷嚏、呼吸困难。泌尿系统问题包括频繁排尿、尿液带血。皮肤问题包括红肿、瘙痒、脱毛。',
        metadata: {
          title: '常见疾病症状识别',
          category: 'emergency',
          petType: 'both',
          tags: ['疾病', '症状', '急救', '健康'],
        },
      },
      {
        id: 'manual-13',
        content: '猫咪泌尿道健康：猫咪泌尿系统疾病常见，尤其是公猫。尿结石可能导致尿道阻塞。关键饮食原则：充足水分、高品质湿粮、控制镁和磷。预防措施：提供多个饮水点、鼓励运动、保持猫砂盆清洁。',
        metadata: {
          title: '猫咪泌尿道健康饮食',
          category: 'nutrition',
          petType: 'cat',
          tags: ['泌尿道', '猫粮', '尿结石', '肾脏'],
        },
      },
      {
        id: 'manual-14',
        content: '老年宠物护理：小型犬8-9岁算老年，中型犬7-8岁，大型犬6-7岁，猫咪8岁以上。健康检查频率应为每年两次。常见老年问题：关节保健、体重控制、牙齿护理、定期体检筛查肿瘤。',
        metadata: {
          title: '老年宠物护理指南',
          category: 'care',
          petType: 'both',
          tags: ['老年', '护理', '关节', '体检'],
        },
      },
      {
        id: 'manual-15',
        content: '猫咪应激反应：应激源包括环境变化、新成员、噪音刺激、外出旅行。表现包括过度理毛、不规律饮食、在猫砂盆外排泄、躲藏或攻击。缓解方法：提供安全躲藏空间、使用安抚信息素、保持稳定作息。',
        metadata: {
          title: '猫咪应激反应处理',
          category: 'behavior',
          petType: 'cat',
          tags: ['应激', '猫咪', '压力', '行为'],
        },
      },
      {
        id: 'manual-16',
        content: '狗狗关节保护：好发于大型犬、老年犬、肥胖犬。预防措施：控制体重、适量运动、补充软骨素和葡萄糖胺、提供防滑垫。早期信号：起床困难、不愿上下楼梯、跳跃能力下降。',
        metadata: {
          title: '狗狗关节保护指南',
          category: 'care',
          petType: 'dog',
          tags: ['关节', '狗狗', '保护', '运动'],
        },
      },
      {
        id: 'manual-17',
        content: '中暑预防与急救：短头犬猫、肥胖、老年宠物容易中暑。早期症状：呼吸急促、流口水增多、虚弱无力、体温升高。急救：转移到阴凉处、用凉水擦拭、补充水分、立即就医。',
        metadata: {
          title: '中暑预防与急救',
          category: 'emergency',
          petType: 'both',
          tags: ['中暑', '夏季', '急救', '安全'],
        },
      },
      {
        id: 'manual-18',
        content: '宠物减肥：判断肥胖标准：肋骨看不见但能摸到有腰身为理想。健康危害包括糖尿病、关节病、心脏病。减重原则：循序渐进、不要禁食、低热量高纤维、增加运动、坚持3个月。',
        metadata: {
          title: '宠物减肥健康方案',
          category: 'nutrition',
          petType: 'both',
          tags: ['减肥', '体重', '健康', '运动'],
        },
      },
    ];

    return entries;
  }

  /**
   * 查询知识库
   */
  async query(question: string, petType?: 'dog' | 'cat'): Promise<RAGQueryResult> {
    if (!this.isInitialized || !this.vectorStore) {
      return {
        answer: this.generateFallbackAnswer(question),
        sourceDocuments: [],
        confidence: 0.3,
      };
    }

    try {
      const retriever = this.vectorStore.asRetriever({
        k: 3,
        filter: petType ? { petType } : undefined,
      });

      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY || 'mock-key',
        temperature: 0.7,
        modelName: 'gpt-3.5-turbo',
      });

      this.chain = RetrievalQAChain.fromLLMAndRetriever(llm, retriever);

      const result = await this.chain.invoke({
        query: question,
      });

      const sourceDocuments = (result.sourceDocuments || []).map((doc: any) => ({
        title: doc.metadata?.title || '未知来源',
        content: doc.pageContent,
        url: this.generateSourceUrl(doc.metadata?.category),
      }));

      return {
        answer: result.text || '抱歉，我无法找到相关信息。',
        sourceDocuments,
        confidence: sourceDocuments.length > 0 ? 0.85 : 0.5,
      };
    } catch (error) {
      console.error('RAG查询失败:', error);
      return {
        answer: this.generateFallbackAnswer(question),
        sourceDocuments: [],
        confidence: 0.3,
      };
    }
  }

  /**
   * 生成来源URL
   */
  private generateSourceUrl(category: string): string {
    const urls: Record<string, string> = {
      nutrition: '/health-manual?category=nutrition',
      care: '/health-manual?category=care',
      behavior: '/health-manual?category=behavior',
      emergency: '/health-manual?category=emergency',
    };
    return urls[category] || '/health-manual';
  }

  /**
   * 生成备用答案（当知识库不可用时）
   */
  private generateFallbackAnswer(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('呕吐') || lowerQuestion.includes('vomit')) {
      return '根据宠物医学知识，呕吐可能由多种原因引起，包括饮食不当、消化不良、感染等。建议先禁食12-24小时观察，如持续呕吐超过24小时或伴有血丝，请立即就医。';
    }
    
    if (lowerQuestion.includes('腹泻') || lowerQuestion.includes('diarrhea')) {
      return '腹泻可能是饮食问题、感染或应激反应。轻度腹泻可先调整饮食，如持续超过24小时、带有血丝或伴随呕吐，请咨询兽医。';
    }
    
    if (lowerQuestion.includes('皮肤') || lowerQuestion.includes('掉毛') || lowerQuestion.includes('skin')) {
      return '皮肤问题可能由过敏、寄生虫或感染引起。建议检查皮肤是否有红肿、皮屑或寄生虫。保持皮肤清洁，严重时需就医。';
    }
    
    if (lowerQuestion.includes('疫苗') || lowerQuestion.includes('vaccine')) {
      return '疫苗接种是宠物健康管理的重要部分。幼猫/犬在6-8周开始接种基础疫苗，每年加强免疫。具体时间表请咨询兽医。';
    }

    return '我理解您的问题。为了提供更准确的建议，请咨询专业兽医。您也可以查看我们的健康手册获取更多宠物护理知识。';
  }

  /**
   * 检查问题是否涉及人类用药或剂量
   */
  checkForHumanMedication(question: string): boolean {
    const humanMedKeywords = [
      '人用药', '人类用药', '人的药', '布洛芬', '阿司匹林',
      '对乙酰氨基酚', '扑热息痛', '感冒药', '消炎药'
    ];
    
    return humanMedKeywords.some(keyword => 
      question.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 生成咨询兽医提示
   */
  generateVetConsultationReminder(): string {
    return '⚠️ 请注意：宠物用药需要专业指导。人类药物可能对宠物有毒或剂量不当。请务必咨询兽医后再给宠物用药。您可以通过我们的AI问诊功能联系专业兽医。';
  }

  /**
   * 获取知识库统计
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      knowledgeCount: this.knowledgeBase.length,
      categories: [...new Set(this.knowledgeBase.map(k => k.metadata.category))],
      petTypes: [...new Set(this.knowledgeBase.map(k => k.metadata.petType))],
    };
  }
}

export const ragKnowledgeBase = new RAGKnowledgeBase();
