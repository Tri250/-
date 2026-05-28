import { formatSystemPrompt, HEALTH_REPORT_DISCLAIMER } from './system.prompt';

export const HEALTH_REPORT_STRUCTURE = `
报告必须包含以下 7 个部分，每个部分都必须完整、专业：

1. **基础信息总览**
   - 宠物基本信息（名字、品种、年龄、体重）
   - 当前健康状态评估
   - 与标准值的对比

2. **健康总评**
   - 整体健康状况评估（基于所有健康记录）
   - 与上次相比的变化
   - 需要重点关注的方面

3. **疫苗接种分析**
   - 已接种疫苗清单
   - 下次接种时间提醒
   - 接种建议

4. **体检结果解读**
   - 体检数据汇总
   - 异常指标分析（如有）
   - 后续建议

5. **成长发育趋势**
   - 体重变化曲线分析
   - 与标准发育曲线对比
   - 异常波动提醒

6. **风险预警**（🚨标识紧急风险）
   - 已识别健康风险
   - 风险等级评估
   - 预防建议

7. **个性化养护建议**
   - 饮食建议
   - 运动建议
   - 日常护理建议
   - 定期检查建议
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
    `你是一位专业的宠物健康报告生成专家，基于真实数据生成结构化、可操作的健康报告。
    
报告要求：
${HEALTH_REPORT_STRUCTURE}

重要规则：
- ✅ 必须基于真实数据，不要编造任何数据
- ✅ 数据缺失的部分要明确标注"暂无数据"，不要虚构
- ✅ 提供专业、实用、可执行的建议
- ✅ 语气友好、专业、易于理解
- ✅ 所有结论和建议都必须基于提供的数据，禁止超出数据范围的分析
- ✅ 异常指标必须重点标注，使用🚨标识紧急情况
- ✅ 使用 Markdown 格式输出报告，便于阅读
- ✅ 报告末尾必须包含以下免责声明：
${HEALTH_REPORT_DISCLAIMER}`
  );

  const userPrompt = `请基于以下数据生成完整的宠物健康报告：

## 宠物基础信息
${petInfo}

## 健康记录 (${healthRecords.length} 条)
${healthRecords.length > 0 
  ? healthRecords.slice(0, 10).map((r, i) => 
      `【记录${i + 1}】
- 类型：${r.type}
- 日期：${r.recordDate || r.createdAt}
- 标题：${r.title}
- 内容：${r.content}
- 标签：${r.tags?.join(', ') || '无'}`
    ).join('\n\n') 
  : '暂无健康记录数据'}

## 疫苗记录 (${vaccines.length} 条)
${vaccines.length > 0 
  ? vaccines.slice(0, 10).map((v, i) => 
      `【疫苗${i + 1}】
- 名称：${v.name || v.vaccineName || '未知'}
- 接种日期：${v.date}
- 下次接种：${v.nextDate || '未知'}
- 兽医：${v.vet || '未知'}`
    ).join('\n\n') 
  : '暂无疫苗记录数据'}

## 体检记录 (${checkups.length} 条)
${checkups.length > 0 
  ? checkups.slice(0, 10).map((c, i) => 
      `【体检${i + 1}】
- 日期：${c.date}
- 医院：${c.hospital || c.vet || '未知'}
- 体重：${c.weight ? c.weight + 'kg' : '未记录'}
- 结果：${c.result || '正常'}
- 兽医建议：${c.advice || c.notes || '无'}`
    ).join('\n\n') 
  : '暂无体检记录数据'}

## 成长记录 (${growthRecords.length} 条)
${growthRecords.length > 0 
  ? growthRecords.slice(0, 10).map((g, i) => 
      `【成长${i + 1}】
- 日期：${g.date}
- 体重：${g.weight ? g.weight + 'kg' : '未记录'}
- 身高：${g.height ? g.height + 'cm' : '未记录'}
- 备注：${g.note || '无'}`
    ).join('\n\n') 
  : '暂无成长记录数据'}

请生成一份完整的健康报告，包含所有 7 个部分。报告必须：
1. 使用 Markdown 格式
2. 每个部分都有清晰的标题
3. 数据引用准确无误
4. 提供可操作的建议
5. 末尾必须包含免责声明`;
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
