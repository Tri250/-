/**
 * PawSync Pro - AI Agent工具调用服务
 * 实现add_vaccine_record、create_reminder等工具
 * 作者: 带娃的小陈工
 */

import { AI_TOOLS, ToolCall, ToolResult, AIAgentContext } from '../types/ai-agent';
import { petService } from './petService';
import { healthService } from './healthService';
import { ragKnowledgeBase } from './ragKnowledgeBase';

class AIAgentToolService {
  private context: AIAgentContext = {
    conversationHistory: [],
    toolsUsed: [],
  };

  /**
   * 解析工具调用
   */
  parseToolCalls(response: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    
    // 简单的JSON格式解析
    const jsonMatch = response.match(/\{[\s\S]*?"tool_calls"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
          parsed.tool_calls.forEach((call: any, index: number) => {
            if (call.name && AI_TOOLS.find(t => t.name === call.name)) {
              toolCalls.push({
                id: `call_${Date.now()}_${index}`,
                name: call.name,
                arguments: call.arguments || {},
              });
            }
          });
        }
      } catch (error) {
        console.error('解析工具调用失败:', error);
      }
    }

    // 文本格式解析
    const textPatterns = [
      /添加疫苗记录[:：]\s*疫苗：(.+?)，日期：(.+?)(?，|$)/,
      /创建提醒[:：]\s*(.+?)，时间：(.+?)(?，|$)/,
    ];

    return toolCalls;
  }

  /**
   * 执行工具调用
   */
  async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    try {
      switch (toolCall.name) {
        case 'add_vaccine_record':
          return await this.addVaccineRecord(toolCall.arguments);
        
        case 'create_reminder':
          return await this.createReminder(toolCall.arguments);
        
        case 'search_health_manual':
          return await this.searchHealthManual(toolCall.arguments);
        
        case 'book_vet_appointment':
          return await this.bookVetAppointment(toolCall.arguments);
        
        case 'add_health_record':
          return await this.addHealthRecord(toolCall.arguments);
        
        case 'get_pet_info':
          return await this.getPetInfo(toolCall.arguments);
        
        default:
          return {
            success: false,
            error: `未知工具: ${toolCall.name}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '工具执行失败',
      };
    }
  }

  /**
   * 添加疫苗记录
   */
  private async addVaccineRecord(args: any): Promise<ToolResult> {
    try {
      const { petId, vaccineName, vaccineDate, nextDueDate, veterinarian, hospital, notes } = args;

      if (!petId || !vaccineName || !vaccineDate) {
        return {
          success: false,
          error: '缺少必需参数：petId, vaccineName, vaccineDate',
        };
      }

      // 模拟添加疫苗记录
      const record = {
        id: `vaccine_${Date.now()}`,
        petId,
        vaccineName,
        vaccineDate,
        nextDueDate,
        veterinarian,
        hospital,
        notes,
        createdAt: new Date().toISOString(),
      };

      console.log('添加疫苗记录成功:', record);

      // 生成确认消息
      let message = `✅ 已成功添加疫苗记录！\n\n`;
      message += `📋 疫苗名称: ${vaccineName}\n`;
      message += `📅 接种日期: ${vaccineDate}\n`;
      
      if (nextDueDate) {
        message += `⏰ 下次接种: ${nextDueDate}\n`;
        
        // 自动创建下次接种提醒
        await this.createReminder({
          petId,
          reminderType: 'vaccine',
          title: `疫苗接种提醒 - ${vaccineName}`,
          description: `宠物 ${petId} 需要接种 ${vaccineName}`,
          dueDate: nextDueDate,
          repeat: 'none',
          priority: 'high',
        });
        
        message += `\n💡 已自动创建下次接种提醒！`;
      }

      return {
        success: true,
        data: { record, message },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建提醒
   */
  private async createReminder(args: any): Promise<ToolResult> {
    try {
      const { 
        petId, reminderType, title, description, 
        dueDate, dueTime, repeat, priority 
      } = args;

      if (!petId || !reminderType || !title || !dueDate) {
        return {
          success: false,
          error: '缺少必需参数：petId, reminderType, title, dueDate',
        };
      }

      const reminder = {
        id: `reminder_${Date.now()}`,
        petId,
        reminderType,
        title,
        description: description || '',
        dueDate,
        dueTime: dueTime || '09:00',
        repeat: repeat || 'none',
        priority: priority || 'medium',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      console.log('创建提醒成功:', reminder);

      let message = `✅ 已成功创建提醒！\n\n`;
      message += `📝 提醒标题: ${title}\n`;
      message += `📅 提醒日期: ${dueDate}`;
      if (dueTime) message += ` ${dueTime}`;
      message += `\n🏷️ 类型: ${this.getReminderTypeName(reminderType)}\n`;
      message += `⭐ 优先级: ${this.getPriorityName(priority)}\n`;
      
      if (repeat && repeat !== 'none') {
        message += `🔄 重复: ${this.getRepeatName(repeat)}\n`;
      }

      message += `\n💡 您将在提醒时间收到通知！`;

      return {
        success: true,
        data: { reminder, message },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 搜索健康手册
   */
  private async searchHealthManual(args: any): Promise<ToolResult> {
    try {
      const { query, category, petType } = args;

      if (!query) {
        return {
          success: false,
          error: '缺少必需参数：query',
        };
      }

      const result = await ragKnowledgeBase.query(query, petType);

      let message = `🔍 为您搜索到以下健康知识：\n\n`;
      message += `${result.answer}\n\n`;
      
      if (result.sourceDocuments.length > 0) {
        message += `📚 参考来源：\n`;
        result.sourceDocuments.forEach((doc, index) => {
          message += `${index + 1}. ${doc.title} ${doc.url ? `(查看详情)` : ''}\n`;
        });
        message += `\n⚠️ 以上内容仅供参考，如有疑问请咨询兽医。`;
      }

      return {
        success: true,
        data: { result, message },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 预约兽医门诊
   */
  private async bookVetAppointment(args: any): Promise<ToolResult> {
    try {
      const { 
        petId, hospitalId, appointmentDate, 
        appointmentTime, department, reason, notes 
      } = args;

      if (!petId || !hospitalId || !appointmentDate || !appointmentTime || !department || !reason) {
        return {
          success: false,
          error: '缺少必需参数',
        };
      }

      const appointment = {
        id: `appointment_${Date.now()}`,
        petId,
        hospitalId,
        appointmentDate,
        appointmentTime,
        department,
        reason,
        notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      console.log('预约成功:', appointment);

      let message = `✅ 门诊预约成功！\n\n`;
      message += `📅 预约日期: ${appointmentDate} ${appointmentTime}\n`;
      message += `🏥 科室: ${department}\n`;
      message += `📝 就诊原因: ${reason}\n`;
      message += `\n💡 请按时带宠物前往就诊！`;

      // 自动创建就诊提醒
      await this.createReminder({
        petId,
        reminderType: 'checkup',
        title: `门诊提醒 - ${department}`,
        description: `带宠物前往就诊：${reason}`,
        dueDate: appointmentDate,
        dueTime: appointmentTime,
        priority: 'high',
      });

      return {
        success: true,
        data: { appointment, message },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 添加健康记录
   */
  private async addHealthRecord(args: any): Promise<ToolResult> {
    try {
      const { petId, recordType, value, unit, notes } = args;

      if (!petId || !recordType || value === undefined) {
        return {
          success: false,
          error: '缺少必需参数：petId, recordType, value',
        };
      }

      const record = {
        id: `health_${Date.now()}`,
        petId,
        recordType,
        value,
        unit: unit || this.getDefaultUnit(recordType),
        notes,
        createdAt: new Date().toISOString(),
      };

      console.log('添加健康记录成功:', record);

      let message = `✅ 已成功记录！\n\n`;
      message += `📊 记录类型: ${this.getRecordTypeName(recordType)}\n`;
      message += `📈 数值: ${value} ${record.unit}\n`;
      
      // 根据记录类型给出建议
      message += `\n💡 ${this.generateRecordAdvice(recordType, value)}`;

      return {
        success: true,
        data: { record, message },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取宠物信息
   */
  private async getPetInfo(args: any): Promise<ToolResult> {
    try {
      const { petId, includeHealth } = args;

      if (!petId) {
        return {
          success: false,
          error: '缺少必需参数：petId',
        };
      }

      // 模拟获取宠物信息
      const petInfo = {
        id: petId,
        name: '毛球',
        type: 'dog',
        breed: '金毛',
        age: 36, // 月龄
        weight: 12.5,
        lastCheckup: '2026-05-01',
        vaccines: [
          { name: '犬五联', date: '2026-01-15', nextDue: '2027-01-15' },
          { name: '狂犬病疫苗', date: '2026-01-15', nextDue: '2027-01-15' },
        ],
        healthStatus: 'good',
      };

      let message = `🐾 宠物信息：\n\n`;
      message += `名字: ${petInfo.name}\n`;
      message += `品种: ${petInfo.breed}\n`;
      message += `年龄: ${Math.floor(petInfo.age / 12)}岁${petInfo.age % 12}月\n`;
      message += `体重: ${petInfo.weight}kg\n`;
      message += `健康状态: ${petInfo.healthStatus === 'good' ? '✅ 良好' : '⚠️ 需关注'}\n`;

      if (includeHealth) {
        message += `\n💉 最近疫苗:\n`;
        petInfo.vaccines.forEach(v => {
          message += `- ${v.name}: ${v.date}\n`;
        });
      }

      return {
        success: true,
        data: { pet: petInfo, message },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 辅助方法
  private getReminderTypeName(type: string): string {
    const names: Record<string, string> = {
      vaccine: '疫苗接种',
      checkup: '体检',
      medication: '用药',
      grooming: '美容',
      exercise: '运动',
      custom: '自定义',
    };
    return names[type] || type;
  }

  private getPriorityName(priority: string): string {
    const names: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急',
    };
    return names[priority] || priority;
  }

  private getRepeatName(repeat: string): string {
    const names: Record<string, string> = {
      daily: '每天',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年',
    };
    return names[repeat] || repeat;
  }

  private getRecordTypeName(type: string): string {
    const names: Record<string, string> = {
      weight: '体重',
      temperature: '体温',
      activity: '活动量',
      food: '进食量',
      water: '饮水量',
      symptom: '症状',
    };
    return names[type] || type;
  }

  private getDefaultUnit(type: string): string {
    const units: Record<string, string> = {
      weight: 'kg',
      temperature: '℃',
      activity: '分钟',
      food: 'g',
      water: 'ml',
    };
    return units[type] || '';
  }

  private generateRecordAdvice(type: string, value: number): string {
    switch (type) {
      case 'weight':
        if (value > 15) return '体重偏重，建议适当增加运动，减少零食摄入。';
        if (value < 10) return '体重偏低，建议增加营养摄入。';
        return '体重正常，继续保持！';
      case 'temperature':
        if (value > 39.5) return '体温偏高，可能有发热，建议观察或就医。';
        if (value < 37.5) return '体温偏低，需要注意保暖。';
        return '体温正常！';
      case 'activity':
        if (value < 30) return '活动量偏低，建议增加户外活动时间。';
        return '活动量充足，很棒！';
      default:
        return '已记录，继续观察。';
    }
  }

  /**
   * 获取可用工具列表
   */
  getAvailableTools() {
    return AI_TOOLS;
  }

  /**
   * 更新上下文
   */
  updateContext(role: 'user' | 'assistant' | 'system', content: string) {
    this.context.conversationHistory.push({ role, content });
  }

  /**
   * 获取上下文
   */
  getContext() {
    return this.context;
  }

  /**
   * 重置上下文
   */
  resetContext() {
    this.context = {
      conversationHistory: [],
      toolsUsed: [],
    };
  }
}

export const aiAgentToolService = new AIAgentToolService();
