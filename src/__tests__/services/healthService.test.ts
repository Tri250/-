import { describe, it,import { describe, it, expect, vi, beforeEach } from 'vitestimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService',import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overallimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expectimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqualimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () =>import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatusimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthServiceimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1;import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord -import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () =>import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        dateimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisitimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('idimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.dateimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    itimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisitimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        valueimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHavePropertyimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expectimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expectimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () =>import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts =import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expectimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expectimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = awaitimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBeimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('pet-1import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('pet-1');
        const updatedAlert = updatedAlerts.find(a => a.id === unacknowledgedimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('pet-1');
        const updatedAlert = updatedAlerts.find(a => a.id === unacknowledgedAlert.id);
        expect(updatedAlert?.acknowledged).toBe(true);
      }import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('pet-1');
        const updatedAlert = updatedAlerts.find(a => a.id === unacknowledgedAlert.id);
        expect(updatedAlert?.acknowledged).toBe(true);
      }
    });

    it('确认不存在的告警应该返回false', async () => {
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('pet-1');
        const updatedAlert = updatedAlerts.find(a => a.id === unacknowledgedAlert.id);
        expect(updatedAlert?.acknowledged).toBe(true);
      }
    });

    it('确认不存在的告警应该返回false', async () => {
      const result = await healthService.acknowledgeAlert('non-existent-id');
      expectimport { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('pet-1');
        const updatedAlert = updatedAlerts.find(a => a.id === unacknowledgedAlert.id);
        expect(updatedAlert?.acknowledged).toBe(true);
      }
    });

    it('确认不存在的告警应该返回false', async () => {
      const result = await healthService.acknowledgeAlert('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getHealthTrends -import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康分数', () => {
    it('应该返回有效的健康分数', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('分数应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1', 7);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('记录应该包含必要属性', async () => {
      const records = await healthService.getHealthRecords('pet-1', 1);
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该限制返回的记录数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('记录应该按日期倒序排列', async () => {
      const records = await healthService.getHealthRecords('pet-1', 5);
      
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.date).toBe('2024-01-16');
    });

    it('新记录应该包含ID', async () => {
      const record = {
        petId: 'pet-1',
        date: '2024-01-17',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      };
      
      const result = await healthService.addHealthRecord(record);
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const metric = {
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };
      
      const result = await healthService.addHealthMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.petId).toBe('pet-1');
      expect(result.type).toBe('weight');
      expect(result.value).toBe(4.5);
    });
  });

  describe('getHealthAlerts - 获取健康告警', () => {
    it('应该返回健康告警列表', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('告警应该包含必要属性', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });
  });

  describe('acknowledgeAlert - 确认告警', () => {
    it('应该成功确认告警', async () => {
      const alerts = await healthService.getHealthAlerts('pet-1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('pet-1');
        const updatedAlert = updatedAlerts.find(a => a.id === unacknowledgedAlert.id);
        expect(updatedAlert?.acknowledged).toBe(true);
      }
    });

    it('确认不存在的告警应该返回false', async () => {
      const result = await healthService.acknowledgeAlert('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getHealthTrends - 获取健康趋势', () => {
    it('应该返回有效的趋势数据', async () =>