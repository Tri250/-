/**
 * PawSync Pro - AI Agent工具调用类型定义
 * 支持add_vaccine_record、create_reminder等工具
 * 作者: 带娃的小陈工
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AIAgentContext {
  petId?: string;
  petName?: string;
  petType?: 'dog' | 'cat';
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  toolsUsed: string[];
  lastToolCall?: ToolCall;
}

export const AI_TOOLS: ToolDefinition[] = [
  {
    name: 'add_vaccine_record',
    description: '添加疫苗接种记录到宠物健康档案中',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string', description: '宠物ID' },
        vaccineName: { type: 'string', description: '疫苗名称，如"犬五联"、"狂犬病疫苗"' },
        vaccineDate: { type: 'string', description: '接种日期，格式：YYYY-MM-DD' },
        nextDueDate: { type: 'string', description: '下次接种日期，格式：YYYY-MM-DD' },
        veterinarian: { type: 'string', description: '接种兽医姓名（可选）' },
        hospital: { type: 'string', description: '接种医院名称（可选）' },
        notes: { type: 'string', description: '备注信息（可选）' },
      },
      required: ['petId', 'vaccineName', 'vaccineDate'],
    },
  },
  {
    name: 'create_reminder',
    description: '创建智能提醒，如疫苗接种提醒、体检提醒、用药提醒等',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string', description: '宠物ID' },
        reminderType: { 
          type: 'string', 
          enum: ['vaccine', 'checkup', 'medication', 'grooming', 'exercise', 'custom'],
          description: '提醒类型' 
        },
        title: { type: 'string', description: '提醒标题' },
        description: { type: 'string', description: '提醒描述' },
        dueDate: { type: 'string', description: '提醒日期，格式：YYYY-MM-DD' },
        dueTime: { type: 'string', description: '提醒时间，格式：HH:mm（可选）' },
        repeat: { 
          type: 'string', 
          enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
          description: '重复频率（可选）' 
        },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high', 'urgent'],
          description: '优先级（可选）' 
        },
      },
      required: ['petId', 'reminderType', 'title', 'dueDate'],
    },
  },
  {
    name: 'search_health_manual',
    description: '搜索宠物健康手册内容，获取专业知识和建议',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
        category: { 
          type: 'string', 
          enum: ['nutrition', 'care', 'behavior', 'emergency', 'all'],
          description: '手册分类（可选）' 
        },
        petType: { 
          type: 'string', 
          enum: ['dog', 'cat', 'both'],
          description: '宠物类型（可选）' 
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'book_vet_appointment',
    description: '预约宠物医院门诊',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string', description: '宠物ID' },
        hospitalId: { type: 'string', description: '医院ID' },
        appointmentDate: { type: 'string', description: '预约日期，格式：YYYY-MM-DD' },
        appointmentTime: { type: 'string', description: '预约时间，格式：HH:mm' },
        department: { type: 'string', description: '科室，如"内科"、"外科"、"皮肤科"' },
        reason: { type: 'string', description: '就诊原因' },
        notes: { type: 'string', description: '补充说明（可选）' },
      },
      required: ['petId', 'hospitalId', 'appointmentDate', 'appointmentTime', 'department', 'reason'],
    },
  },
  {
    name: 'add_health_record',
    description: '添加宠物健康记录，如体重、体温、活动量等',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string', description: '宠物ID' },
        recordType: { 
          type: 'string', 
          enum: ['weight', 'temperature', 'activity', 'food', 'water', 'symptom'],
          description: '记录类型' 
        },
        value: { type: 'number', description: '数值（如体重kg、体温℃）' },
        unit: { type: 'string', description: '单位，如"kg"、"℃"、"分钟"' },
        notes: { type: 'string', description: '备注信息（可选）' },
      },
      required: ['petId', 'recordType', 'value'],
    },
  },
  {
    name: 'get_pet_info',
    description: '获取宠物基本信息，用于了解宠物状态',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string', description: '宠物ID' },
        includeHealth: { type: 'boolean', description: '是否包含健康信息（可选）' },
      },
      required: ['petId'],
    },
  },
];
