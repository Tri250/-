interface HealthRecord {
  id: string;
  type: string;
  title: string;
  content?: string;
  recordDate: Date | string;
  isImportant?: boolean;
}

interface Vaccine {
  id: string;
  name: string;
  date: Date | string;
  nextDate?: Date | string;
  vet?: string;
}

interface Checkup {
  id: string;
  date: Date | string;
  weight?: number;
  vet?: string;
  notes?: string;
}

interface GrowthRecord {
  id: string;
  date: Date | string;
  weight?: number;
  height?: number;
  notes?: string;
}

interface HealthAnalysis {
  anomalies: Anomaly[];
  warnings: Warning[];
  recommendations: Recommendation[];
  statistics: HealthStatistics;
}

interface Anomaly {
  type: 'weight' | 'vaccine' | 'checkup' | 'health_record';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data?: any;
  suggestions: string[];
}

interface Warning {
  type: 'upcoming' | 'overdue' | 'abnormal';
  title: string;
  description: string;
  date?: Date | string;
  priority: 'low' | 'medium' | 'high';
}

interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface HealthStatistics {
  totalHealthRecords: number;
  totalVaccines: number;
  totalCheckups: number;
  totalGrowthRecords: number;
  averageWeight?: number;
  weightTrend?: 'increasing' | 'decreasing' | 'stable';
  weightChangePercent?: number;
  lastCheckupDays?: number;
  lastVaccineDays?: number;
  overdueVaccines: number;
  upcomingVaccines: number;
}

export class HealthAnalyzer {
  private petType: string;
  private breed?: string;

  constructor(petType: string, breed?: string) {
    this.petType = petType;
    this.breed = breed;
  }

  analyze(
    healthRecords: HealthRecord[],
    vaccines: Vaccine[],
    checkups: Checkup[],
    growthRecords: GrowthRecord[]
  ): HealthAnalysis {
    const anomalies: Anomaly[] = [];
    const warnings: Warning[] = [];
    const recommendations: Recommendation[] = [];
    const statistics = this.calculateStatistics(healthRecords, vaccines, checkups, growthRecords);

    // 体重异常检测
    const weightAnomalies = this.detectWeightAnomalies(growthRecords);
    anomalies.push(...weightAnomalies);

    // 疫苗异常检测
    const vaccineAnomalies = this.detectVaccineAnomalies(vaccines);
    anomalies.push(...vaccineAnomalies);

    // 体检异常检测
    const checkupAnomalies = this.detectCheckupAnomalies(checkups);
    anomalies.push(...checkupAnomalies);

    // 健康记录异常检测
    const healthAnomalies = this.detectHealthRecordAnomalies(healthRecords);
    anomalies.push(...healthAnomalies);

    // 生成警告
    const generatedWarnings = this.generateWarnings(vaccines, checkups, anomalies);
    warnings.push(...generatedWarnings);

    // 生成建议
    const generatedRecommendations = this.generateRecommendations(
      statistics,
      anomalies,
      this.petType,
      this.breed
    );
    recommendations.push(...generatedRecommendations);

    return {
      anomalies,
      warnings,
      recommendations,
      statistics,
    };
  }

  private calculateStatistics(
    healthRecords: HealthRecord[],
    vaccines: Vaccine[],
    checkups: Checkup[],
    growthRecords: GrowthRecord[]
  ): HealthStatistics {
    const now = new Date();
    
    // 计算平均体重和趋势
    const weightRecords = growthRecords
      .filter(g => g.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let averageWeight: number | undefined;
    let weightTrend: 'increasing' | 'decreasing' | 'stable' | undefined;
    let weightChangePercent: number | undefined;

    if (weightRecords.length > 0) {
      const totalWeight = weightRecords.reduce((sum, r) => sum + (r.weight || 0), 0);
      averageWeight = Math.round((totalWeight / weightRecords.length) * 100) / 100;

      if (weightRecords.length >= 2) {
        const firstWeight = weightRecords[0].weight || 0;
        const lastWeight = weightRecords[weightRecords.length - 1].weight || 0;
        weightChangePercent = Math.round(((lastWeight - firstWeight) / firstWeight * 100) * 10) / 10;

        if (weightChangePercent > 5) {
          weightTrend = 'increasing';
        } else if (weightChangePercent < -5) {
          weightTrend = 'decreasing';
        } else {
          weightTrend = 'stable';
        }
      }
    }

    // 计算疫苗过期和即将到期
    let overdueVaccines = 0;
    let upcomingVaccines = 0;
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    vaccines.forEach(v => {
      if (v.nextDate) {
        const nextDate = new Date(v.nextDate);
        if (nextDate < now) {
          overdueVaccines++;
        } else if (nextDate <= thirtyDaysFromNow) {
          upcomingVaccines++;
        }
      }
    });

    // 计算最后体检和疫苗天数
    let lastCheckupDays: number | undefined;
    let lastVaccineDays: number | undefined;

    if (checkups.length > 0) {
      const lastCheckup = checkups.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      lastCheckupDays = Math.floor(
        (now.getTime() - new Date(lastCheckup.date).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    if (vaccines.length > 0) {
      const lastVaccine = vaccines.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      lastVaccineDays = Math.floor(
        (now.getTime() - new Date(lastVaccine.date).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      totalHealthRecords: healthRecords.length,
      totalVaccines: vaccines.length,
      totalCheckups: checkups.length,
      totalGrowthRecords: growthRecords.length,
      averageWeight,
      weightTrend,
      weightChangePercent,
      lastCheckupDays,
      lastVaccineDays,
      overdueVaccines,
      upcomingVaccines,
    };
  }

  private detectWeightAnomalies(growthRecords: GrowthRecord[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const weightRecords = growthRecords
      .filter(g => g.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (weightRecords.length < 2) {
      return anomalies;
    }

    // 检测体重骤降（超过10%）
    for (let i = 1; i < weightRecords.length; i++) {
      const prevWeight = weightRecords[i - 1].weight || 0;
      const currWeight = weightRecords[i].weight || 0;
      
      if (prevWeight > 0) {
        const changePercent = ((currWeight - prevWeight) / prevWeight) * 100;

        if (changePercent < -10) {
          anomalies.push({
            type: 'weight',
            severity: 'critical',
            title: '体重骤降预警',
            description: `${weightRecords[i].date}体重为${currWeight}kg，较前一次（${prevWeight}kg）下降${Math.abs(changePercent).toFixed(1)}%，可能存在健康问题`,
            data: {
              current: currWeight,
              previous: prevWeight,
              changePercent: changePercent.toFixed(1),
              date: weightRecords[i].date,
            },
            suggestions: [
              '建议尽快带宠物就医检查',
              '排查消化系统疾病',
              '排查寄生虫感染',
              '排查代谢性疾病（如甲状腺功能亢进）',
            ],
          });
        } else if (changePercent < -5) {
          anomalies.push({
            type: 'weight',
            severity: 'medium',
            title: '体重异常下降',
            description: `体重下降${Math.abs(changePercent).toFixed(1)}%，需要关注`,
            data: {
              current: currWeight,
              previous: prevWeight,
              changePercent: changePercent.toFixed(1),
              date: weightRecords[i].date,
            },
            suggestions: [
              '增加营养摄入',
              '观察食欲和精神状态',
              '如持续下降建议就医',
            ],
          });
        }
      }
    }

    // 检测体重快速增长（超过20%）
    if (weightRecords.length >= 2) {
      const firstWeight = weightRecords[0].weight || 0;
      const lastWeight = weightRecords[weightRecords.length - 1].weight || 0;
      
      if (firstWeight > 0) {
        const totalChange = ((lastWeight - firstWeight) / firstWeight) * 100;
        
        if (totalChange > 20) {
          anomalies.push({
            type: 'weight',
            severity: 'medium',
            title: '体重快速增长预警',
            description: `近期体重增长${totalChange.toFixed(1)}%，需关注是否为异常增长`,
            data: {
              startWeight: firstWeight,
              currentWeight: lastWeight,
              totalChangePercent: totalChange.toFixed(1),
            },
            suggestions: [
              '调整饮食结构',
              '增加运动量',
              '排查内分泌疾病',
            ],
          });
        }
      }
    }

    return anomalies;
  }

  private detectVaccineAnomalies(vaccines: Vaccine[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const now = new Date();

    vaccines.forEach(vaccine => {
      if (vaccine.nextDate) {
        const nextDate = new Date(vaccine.nextDate);
        const daysUntil = Math.floor((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
          // 疫苗已过期
          const overdueDays = Math.abs(daysUntil);
          anomalies.push({
            type: 'vaccine',
            severity: overdueDays > 30 ? 'critical' : 'high',
            title: '疫苗已过期',
            description: `${vaccine.name}应于${this.formatDate(nextDate)}接种，已过期${overdueDays}天`,
            data: {
              vaccineName: vaccine.name,
              overdueDays,
              nextDate: vaccine.nextDate,
            },
            suggestions: [
              '立即预约兽医补种疫苗',
              '补种前避免接触其他动物',
              '注意观察宠物健康状态',
            ],
          });
        }
      }
    });

    return anomalies;
  }

  private detectCheckupAnomalies(checkups: Checkup[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const now = new Date();

    // 检测体检间隔过长
    if (checkups.length > 0) {
      const lastCheckup = checkups.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      const daysSinceLastCheckup = Math.floor(
        (now.getTime() - new Date(lastCheckup.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastCheckup > 365) {
        anomalies.push({
          type: 'checkup',
          severity: 'medium',
          title: '体检间隔过长',
          description: `上次体检为${this.formatDate(lastCheckup.date)}，已超过一年未体检`,
          data: {
            lastCheckupDate: lastCheckup.date,
            daysSinceLastCheckup,
          },
          suggestions: [
            '建议安排年度体检',
            '老年宠物建议每半年体检一次',
          ],
        });
      }
    }

    return anomalies;
  }

  private detectHealthRecordAnomalies(healthRecords: HealthRecord[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // 检测标记为重要的健康记录
    const importantRecords = healthRecords.filter(r => r.isImportant);
    if (importantRecords.length > 0) {
      anomalies.push({
        type: 'health_record',
        severity: 'medium',
        title: '存在重要健康记录',
        description: `宠物有${importantRecords.length}条标记为重要的健康记录，需要关注`,
        data: {
          count: importantRecords.length,
          records: importantRecords.map(r => ({
            type: r.type,
            title: r.title,
            date: r.recordDate,
          })),
        },
        suggestions: [
          '回顾重要健康记录内容',
          '如有异常持续观察或就医',
        ],
      });
    }

    // 检测近期异常记录
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAbnormalRecords = healthRecords.filter(r => {
      const recordDate = new Date(r.recordDate);
      return recordDate >= thirtyDaysAgo && 
             (r.title.includes('异常') || r.title.includes('呕吐') || r.title.includes('腹泻'));
    });

    if (recentAbnormalRecords.length > 0) {
      anomalies.push({
        type: 'health_record',
        severity: 'medium',
        title: '近期存在异常症状',
        description: `最近30天内有${recentAbnormalRecords.length}条异常相关记录`,
        data: {
          count: recentAbnormalRecords.length,
          records: recentAbnormalRecords.map(r => ({
            title: r.title,
            date: r.recordDate,
          })),
        },
        suggestions: [
          '关注异常症状是否持续',
          '如症状反复出现建议就医检查',
        ],
      });
    }

    return anomalies;
  }

  private generateWarnings(
    vaccines: Vaccine[],
    checkups: Checkup[],
    anomalies: Anomaly[]
  ): Warning[] {
    const warnings: Warning[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 疫苗即将到期警告
    vaccines.forEach(vaccine => {
      if (vaccine.nextDate) {
        const nextDate = new Date(vaccine.nextDate);
        if (nextDate > now && nextDate <= thirtyDaysFromNow) {
          const daysUntil = Math.floor(
            (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          warnings.push({
            type: 'upcoming',
            title: '疫苗即将到期',
            description: `${vaccine.name}将于${daysUntil}天后（即${this.formatDate(nextDate)}）到期，请提前预约`,
            date: nextDate,
            priority: daysUntil <= 7 ? 'high' : 'medium',
          });
        }
      }
    });

    // 过期疫苗警告
    vaccines.forEach(vaccine => {
      if (vaccine.nextDate) {
        const nextDate = new Date(vaccine.nextDate);
        if (nextDate < now) {
          warnings.push({
            type: 'overdue',
            title: '疫苗已过期',
            description: `${vaccine.name}已过期，请尽快补种`,
            date: nextDate,
            priority: 'high',
          });
        }
      }
    });

    // 基于异常的警告
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    criticalAnomalies.forEach(anomaly => {
      warnings.push({
        type: 'abnormal',
        title: anomaly.title,
        description: anomaly.description,
        priority: 'high',
      });
    });

    return warnings;
  }

  private generateRecommendations(
    statistics: HealthStatistics,
    anomalies: Anomaly[],
    petType: string,
    breed?: string
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 基于统计数据的建议
    if (statistics.overdueVaccines > 0) {
      recommendations.push({
        category: '疫苗',
        title: '尽快补种过期疫苗',
        description: `有${statistics.overdueVaccines}种疫苗已过期，请尽快预约兽医补种`,
        priority: 'high',
      });
    }

    if (statistics.upcomingVaccines > 0) {
      recommendations.push({
        category: '疫苗',
        title: '关注即将到期的疫苗',
        description: `有${statistics.upcomingVaccines}种疫苗即将到期，建议提前预约`,
        priority: 'medium',
      });
    }

    if (statistics.lastCheckupDays && statistics.lastCheckupDays > 180) {
      recommendations.push({
        category: '体检',
        title: '建议安排体检',
        description: `上次体检已过去${statistics.lastCheckupDays}天，建议进行年度体检`,
        priority: statistics.lastCheckupDays > 365 ? 'high' : 'medium',
      });
    }

    // 基于品种的建议
    if (petType === 'DOG' || petType === '狗') {
      recommendations.push({
        category: '日常护理',
        title: '定期运动和体重管理',
        description: '保持适量运动，定期监测体重，避免肥胖',
        priority: 'medium',
      });
    } else if (petType === 'CAT' || petType === '猫') {
      recommendations.push({
        category: '日常护理',
        title: '关注毛发和牙齿健康',
        description: '定期梳毛，清洁牙齿，预防毛球症',
        priority: 'medium',
      });
    }

    // 基于异常的建议
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push({
        category: '紧急关注',
        title: '存在需要关注的健康问题',
        description: `检测到${criticalAnomalies.length}项需要紧急关注的健康问题，请及时就医`,
        priority: 'high',
      });
    }

    return recommendations;
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
}

export function formatHealthAnalysisReport(analysis: HealthAnalysis): string {
  let report = '\n【健康数据分析结果】\n\n';

  // 统计概览
  report += '## 健康数据统计\n';
  report += `- 健康记录：${analysis.statistics.totalHealthRecords}条\n`;
  report += `- 疫苗记录：${analysis.statistics.totalVaccines}条\n`;
  report += `- 体检记录：${analysis.statistics.totalCheckups}条\n`;
  report += `- 成长记录：${analysis.statistics.totalGrowthRecords}条\n`;

  if (analysis.statistics.averageWeight) {
    report += `- 平均体重：${analysis.statistics.averageWeight}kg\n`;
  }
  if (analysis.statistics.weightTrend) {
    const trendText = {
      increasing: '增长',
      decreasing: '下降',
      stable: '稳定',
    }[analysis.statistics.weightTrend];
    report += `- 体重趋势：${trendText}`;
    if (analysis.statistics.weightChangePercent !== undefined) {
      report += `（${analysis.statistics.weightChangePercent > 0 ? '+' : ''}${analysis.statistics.weightChangePercent}%）`;
    }
    report += '\n';
  }

  // 异常预警
  if (analysis.anomalies.length > 0) {
    report += '\n## 🚨 异常预警\n';
    analysis.anomalies.forEach((anomaly, index) => {
      const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }[anomaly.severity];
      
      report += `\n${severityIcon} ${anomaly.title}\n`;
      report += `   ${anomaly.description}\n`;
    });
  }

  // 警告提示
  if (analysis.warnings.length > 0) {
    report += '\n## ⚠️ 待办提醒\n';
    analysis.warnings.forEach((warning, index) => {
      const priorityIcon = {
        high: '🔴',
        medium: '🟠',
        low: '🟡',
      }[warning.priority];
      
      report += `\n${priorityIcon} ${warning.title}\n`;
      report += `   ${warning.description}\n`;
    });
  }

  // 健康建议
  if (analysis.recommendations.length > 0) {
    report += '\n## 💡 健康建议\n';
    analysis.recommendations.forEach((rec, index) => {
      report += `\n${index + 1}. 【${rec.category}】${rec.title}\n`;
      report += `   ${rec.description}\n`;
    });
  }

  return report;
}

export default HealthAnalyzer;
