import { formatSystemPrompt, HEALTH_REPORT_DISCLAIMER } from './system.prompt';

export const HEALTH_REPORT_STRUCTURE = `
报告必须包含以下 7 个部分：
1. 基础信息 - 宠物基本信息汇总
2. 健康总评 - 整体健康状况评估
3. 疫苗总结 - 疫苗接种情况及建议
4. 体检分析 - 体检结果解读
5. 成长趋势 - 体重、身高发育曲线分析
6. 风险提示 - 识别并提示健康风险
7. 养护建议 - 针对性的日常护理建议
`;

export const formatHealthReportPrompt = (
  petInfo: string,
  data: {
    healthRecords: any[];
    vaccines: any[];
    checkups: any[];
    growthRecords: any[];
  }
): { system: string; user: string } => {
  const { healthRecords, vaccines, checkups, growthRecords } = data;
  
  const systemPrompt = formatSystemPrompt(
    petInfo,
    `你是一位专业的宠物健康报告生成专家。
    
报告要求包含以下部分：
${HEALTH_REPORT_STRUCTURE}

重要规则：
- 必须基于真实数据，不要编造
- 数据缺失的部分要明确标注"暂无数据"，不要虚构
- 提供专业、实用的建议
- 语气友好、专业
- 所有结论和建议都必须基于提供的数据，禁止超出数据范围的分析`
  );

  const userPrompt = `请基于以下数据生成健康报告：

健康记录 (${healthRecords.length} 条):
${healthRecords.length > 0 ? JSON.stringify(healthRecords, null, 2) : '暂无数据'}

疫苗记录 (${vaccines.length} 条):
${vaccines.length > 0 ? JSON.stringify(vaccines, null, 2) : '暂无数据'}

体检记录 (${checkups.length} 条):
${checkups.length > 0 ? JSON.stringify(checkups, null, 2) : '暂无数据'}

成长记录 (${growthRecords.length} 条):
${growthRecords.length > 0 ? JSON.stringify(growthRecords, null, 2) : '暂无数据'}

请生成一份完整的健康报告，包含所有 7 个部分。报告末尾必须包含以下免责声明：
${HEALTH_REPORT_DISCLAIMER}`;

  return {
    system: systemPrompt,
    user: userPrompt,
  };
};

export const buildHealthReportMessages = (
  petInfo: string,
  data: {
    healthRecords: any[];
    vaccines: any[];
    checkups: any[];
    growthRecords: any[];
  }
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  const { system, user } = formatHealthReportPrompt(petInfo, data);
  
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
};
