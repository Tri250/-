import {
  SymptomNode,
  SymptomSession,
  SymptomHistoryItem,
  SymptomResult,
  SYMPTOM_TREE_DATA,
} from '../types/symptom-checker';

class SymptomCheckerService {
  private sessions: Map<string, SymptomSession> = new Map();

  /**
   * 开始一个新的症状自查会话
   */
  startSession(petId: string, petType: 'dog' | 'cat'): SymptomSession {
    const session: SymptomSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      petId,
      petType,
      currentNodeId: 'start',
      history: [],
      startedAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * 获取当前节点信息
   */
  getCurrentNode(sessionId: string): SymptomNode | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    return SYMPTOM_TREE_DATA[session.currentNodeId] || null;
  }

  /**
   * 选择选项并前进到下一个节点
   */
  selectOption(sessionId: string, optionId: string): {
    node: SymptomNode | null;
    completed: boolean;
    result?: SymptomResult;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { node: null, completed: false };
    }

    const currentNode = SYMPTOM_TREE_DATA[session.currentNodeId];
    if (!currentNode || !currentNode.options) {
      return { node: null, completed: false };
    }

    const selectedOption = currentNode.options.find(opt => opt.id === optionId);
    if (!selectedOption) {
      return { node: null, completed: false };
    }

    // 记录历史
    const historyItem: SymptomHistoryItem = {
      nodeId: session.currentNodeId,
      question: currentNode.question || '',
      answer: selectedOption.label,
      timestamp: new Date().toISOString(),
    };
    session.history.push(historyItem);

    // 移动到下一个节点
    session.currentNodeId = selectedOption.nextNodeId;
    const nextNode = SYMPTOM_TREE_DATA[session.currentNodeId];

    // 检查是否到达结果节点
    if (nextNode && nextNode.type === 'result' && nextNode.result) {
      session.completed = true;
      session.result = nextNode.result;
      return {
        node: nextNode,
        completed: true,
        result: nextNode.result,
      };
    }

    return {
      node: nextNode || null,
      completed: false,
    };
  }

  /**
   * 返回到上一个节点
   */
  goBack(sessionId: string): SymptomNode | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.history.length === 0) {
      return null;
    }

    // 移除最后一步历史
    session.history.pop();

    if (session.history.length === 0) {
      // 没有历史了，回到开始
      session.currentNodeId = 'start';
    } else {
      // 回到上一个问题节点
      session.currentNodeId = session.history[session.history.length - 1].nodeId;
    }

    session.completed = false;
    session.result = undefined;

    return SYMPTOM_TREE_DATA[session.currentNodeId] || null;
  }

  /**
   * 重置会话到开始
   */
  resetSession(sessionId: string): SymptomNode | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.currentNodeId = 'start';
    session.history = [];
    session.completed = false;
    session.result = undefined;

    return SYMPTOM_TREE_DATA['start'] || null;
  }

  /**
   * 获取会话历史
   */
  getHistory(sessionId: string): SymptomHistoryItem[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.history] : [];
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): SymptomSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 删除会话
   */
  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * 快速检查常见紧急症状
   */
  checkEmergencySymptoms(symptoms: string[]): {
    isEmergency: boolean;
    urgency: 'low' | 'moderate' | 'high' | 'critical';
    recommendations: string[];
  } {
    const emergencyKeywords = [
      '呼吸困难', '窒息', '无法呼吸',
      '持续呕吐', '吐血',
      '严重腹泻', '血便',
      '抽搐', '癫痫', '昏迷',
      '严重外伤', '大出血',
      '中毒', '误食毒物',
      '无法站立', '瘫痪',
      '体温过高', '中暑',
    ];

    const hasEmergency = symptoms.some(symptom =>
      emergencyKeywords.some(keyword => symptom.includes(keyword))
    );

    if (hasEmergency) {
      return {
        isEmergency: true,
        urgency: 'critical',
        recommendations: [
          '立即就医！不要拖延！',
          '保持宠物安静和温暖',
          '如果可能，带疑似中毒物样本',
          '记录症状出现时间',
        ],
      };
    }

    return {
      isEmergency: false,
      urgency: 'low',
      recommendations: [],
    };
  }
}

export const symptomCheckerService = new SymptomCheckerService();
