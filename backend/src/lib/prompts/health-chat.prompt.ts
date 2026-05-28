import { formatSystemPrompt } from './system.prompt';

export const HEALTH_CHAT_RULES = `
## 对话规则
1. ✅ 结合宠物的过敏史、既往病史、疫苗情况等核心数据给出建议
2. ✅ 如果问题涉及食物禁忌，严格检查宠物是否有相关过敏史
3. ✅ 所有健康建议必须基于提供的宠物数据，禁止泛泛而谈
4. ✅ 如提供的宠物数据不足以回答，明确告知用户需要补充哪些信息
5. ✅ 症状严重时必须标注"🚨请立即就医"
6. ✅ 回答要专业、友好、有帮助，使用易于理解的语言
`;

export const formatHealthChatPrompt = (
  petInfo: string,
  conversationHistory: { role: string; content: string; timestamp?: string }[]
): { system: string; history: Array<{ role: string; content: string }> } => {
  const systemPrompt = formatSystemPrompt(petInfo, HEALTH_CHAT_RULES);
  
  const recentHistory = conversationHistory.slice(-10).map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  return {
    system: systemPrompt,
    history: recentHistory,
  };
};

export const buildHealthChatMessages = (
  petInfo: string,
  userQuestion: string,
  conversationHistory: { role: string; content: string }[] = []
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  const { system, history } = formatHealthChatPrompt(petInfo, conversationHistory);
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: system },
  ];

  history.forEach(msg => {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  });

  messages.push({ role: 'user', content: userQuestion });

  return messages;
};
