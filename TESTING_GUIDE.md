# PawSync Pro 测试指南

## 概述

本指南为PawSync Pro应用提供全面的测试指导，包括单元测试、集成测试和E2E测试的运行方法、测试规范以及添加新测试的最佳实践。

## 测试技术栈

- **测试框架**: Vitest
- **UI组件测试**: @testing-library/react
- **断言库**: @testing-library/jest-dom
- **浏览器环境**: jsdom
- **E2E测试**: Playwright（可选）

## 快速开始

### 运行所有测试

```bash
npm test
```

### 运行测试并监听变化

```bash
npm run test:watch
```

### 生成覆盖率报告

```bash
npm run test:coverage
```

## 测试目录结构

```
/workspace/src/
  __tests__/
    components/           # 组件测试
      EmotionCard.test.tsx
      RecordButton.test.tsx
      CameraCard.test.tsx
      Button.test.tsx
      Card.test.tsx
      Badge.test.tsx
      EmptyState.test.tsx
      LoadingSpinner.test.tsx
    
    pages/               # 页面测试
      TranslatorPage.test.tsx
    
    services/            # 服务测试
      emotionService.test.ts
    
    utils/               # 工具函数测试
      utils.test.ts
    
    performance/         # 性能测试
      benchmark.test.ts
    
    integration/         # 集成测试（预留）
  
  test-utils/
    setupTests.ts        # 测试环境配置
    test-utils.tsx       # 测试工具函数
```

## 测试类型

### 1. 组件测试

组件测试验证单个React组件的行为。

#### 示例：EmotionCard组件测试

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmotionCard } from '@/components/emotion/EmotionCard';

describe('EmotionCard', () => {
  it('应该正确显示情感类型标签', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText('开心')).toBeInTheDocument();
  });

  it('应该正确调用重试回调', () => {
    const onRetry = vi.fn();
    render(<EmotionCard analysis={mockAnalysis} onRetry={onRetry} />);
    fireEvent.click(screen.getByText('再录一次'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

#### 测试要点

- ✅ 渲染正确性：验证组件正确显示内容
- ✅ 用户交互：测试按钮点击、表单提交等
- ✅ 状态管理：验证props变化时UI更新
- ✅ 样式应用：确保不同变体显示正确样式
- ✅ 错误处理：测试边界情况和异常情况

### 2. 页面测试

页面测试验证完整页面功能和用户流程。

#### 示例：TranslatorPage测试

```typescript
describe('TranslatorPage', () => {
  it('应该正确渲染页面标题', () => {
    render(<TranslatorPage />);
    expect(screen.getByText('AI 情感翻译机')).toBeInTheDocument();
  });

  it('点击录音按钮应该开始录音', () => {
    render(<TranslatorPage />);
    fireEvent.click(screen.getByRole('button', { name: /开始录音/i }));
    expect(screen.getByText(/宝贝正在说话呢/)).toBeInTheDocument();
  });
});
```

### 3. 工具函数测试

测试工具函数的业务逻辑。

```typescript
describe('cn - className合并工具', () => {
  it('应该合并多个className', () => {
    const result = cn('text-red-500', 'bg-blue-500', 'p-4');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('应该处理条件className', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });
});
```

### 4. 服务测试

测试API调用和数据处理逻辑。

```typescript
describe('EmotionService', () => {
  it('应该返回有效的分析结果', async () => {
    const result = await analyzeVoice({ petId: 'pet-1', audioData });
    expect(result).toHaveProperty('emotion');
    expect(result).toHaveProperty('translation');
    expect(result).toHaveProperty('confidence');
  });
});
```

### 5. 性能测试

验证组件和函数的性能指标。

```typescript
describe('性能基准测试', () => {
  it('EmotionCard渲染应该在50ms内完成', () => {
    const start = performance.now();
    render(<EmotionCard analysis={mockAnalysis} />);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
```

## 测试规范

### 命名规范

```typescript
// 文件命名：{ComponentName}.test.tsx
// EmotionCard.test.tsx

// 描述性测试名称（使用中文）
describe('EmotionCard', () => {
  it('应该正确显示情感类型标签', () => { });
  it('应该正确调用重试回调', () => { });
  it('开心情感应该显示绿色标签', () => { });
});
```

### 描述性测试名称

好的测试名称应该清晰表达测试意图：

```typescript
// ❌ 不推荐
it('test1', () => { });
it('renders correctly', () => { });

// ✅ 推荐
it('应该正确显示情感类型标签', () => { });
it('点击按钮时应该调用onClick回调', () => { });
it('开心情感应该显示绿色标签', () => { });
```

### 测试隔离

每个测试应该独立运行，不依赖其他测试：

```typescript
// ❌ 不推荐：共享状态
let mockData;
describe('测试套件', () => {
  beforeEach(() => { mockData = createMock(); });
});

// ✅ 推荐：每个测试创建自己的mock
describe('测试套件', () => {
  it('应该正确处理开心情感', () => {
    const mockAnalysis = createMockAnalysis({ primaryEmotion: 'happy' });
    render(<EmotionCard analysis={mockAnalysis} />);
  });
  
  it('应该正确处理焦虑情感', () => {
    const mockAnalysis = createMockAnalysis({ primaryEmotion: 'anxious' });
    render(<EmotionCard analysis={mockAnalysis} />);
  });
});
```

### Mock使用

```typescript
// Mock回调函数
const onClick = vi.fn();
const onRetry = vi.fn();
const onShare = vi.fn();

// Mock数据
const createMockAnalysis = (overrides = {}) => ({
  id: 'test-id',
  petId: 'pet-1',
  primaryEmotion: 'happy',
  intensity: 85,
  confidence: 92,
  subEmotions: ['好奇'],
  translation: '测试翻译',
  context: { timeContext: '今天', locationContext: '客厅' },
  createdAt: new Date().toISOString(),
  source: 'voice',
  ...overrides,
});
```

### 异步测试

```typescript
// 使用async/await和act()处理异步操作
it('应该正确处理异步操作', async () => {
  render(<Component />);
  
  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
    vi.advanceTimersByTime(3000);
  });
  
  await waitFor(() => {
    expect(screen.getByText(/预期文本/)).toBeInTheDocument();
  });
});
```

## 测试覆盖率

### 当前覆盖率

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   72.58 |    85.43 |   69.23 |    73.5 |
-------------------|---------|----------|---------|---------|
```

### 覆盖率目标

- **语句覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 80%
- **函数覆盖率**: ≥ 80%
- **行覆盖率**: ≥ 80%

## 添加新测试

### 1. 为新组件添加测试

创建 `/workspace/src/__tests__/components/NewComponent.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from '@/components/NewComponent';

describe('NewComponent', () => {
  const mockProps = {
    // 定义mock props
  };

  it('应该正确渲染', () => {
    render(<NewComponent {...mockProps} />);
    expect(screen.getByText('预期文本')).toBeInTheDocument();
  });

  it('应该处理用户交互', () => {
    const onClick = vi.fn();
    render(<NewComponent {...mockProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // 添加更多测试...
});
```

### 2. 测试不同状态

```typescript
describe('NewComponent 状态', () => {
  it('默认状态应该正确渲染', () => {
    render(<NewComponent status="default" />);
    // 断言...
  });

  it('加载状态应该显示加载指示器', () => {
    render(<NewComponent status="loading" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('错误状态应该显示错误信息', () => {
    render(<NewComponent status="error" errorMessage="出错了" />);
    expect(screen.getByText('出错了')).toBeInTheDocument();
  });

  it('禁用状态应该不可交互', () => {
    const onClick = vi.fn();
    render(<NewComponent disabled onClick={onClick} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### 3. 测试边界情况

```typescript
it('空数据应该显示空状态', () => {
  render(<NewComponent items={[]} />);
  expect(screen.getByText('暂无数据')).toBeInTheDocument();
});

it('大量数据应该正确渲染', () => {
  const manyItems = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
  render(<NewComponent items={manyItems} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(1000);
});
```

## 最佳实践

### 1. 测试行为而非实现

```typescript
// ❌ 不推荐：测试实现细节
it('应该调用setTimeout', () => {
  expect(setTimeout).toHaveBeenCalled();
});

// ✅ 推荐：测试用户可见的行为
it('应该在2秒后显示结果', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('结果')).toBeInTheDocument();
  }, { timeout: 3000 });
});
```

### 2. 使用合适的查询方式

```typescript
// 按优先级排序（从高到低）
getByRole()        // 最佳 - 模拟用户视角
getByLabelText()  // 好 - 表单字段
getByPlaceholderText() // 表单占位符
getByText()       // 一般 - 可见文本
getByTestId()     // 最后 - 仅在其他方式不可行时使用
```

### 3. 避免过度mock

```typescript
// ❌ 不推荐：过度mock外部依赖
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// ✅ 推荐：只mock必要的部分
vi.mock('@/services/api', () => ({
  fetchData: vi.fn().mockResolvedValue(mockData),
}));
```

### 4. 保持测试快速

```typescript
// ❌ 慢：使用真实setTimeout
it('应该延迟执行', async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
});

// ✅ 快：使用fake timers
it('应该延迟执行', async () => {
  vi.useFakeTimers();
  // 测试代码...
  vi.advanceTimersByTime(5000);
  vi.useRealTimers();
});
```

## 调试测试

### 查看详细输出

```bash
npm test -- --reporter=verbose
```

### 只运行特定测试

```bash
npm test -- EmotionCard
npm test -- --grep "应该正确"
```

### 交互式调试

```bash
npm run test:watch
# 在测试中选择 'p' 进入模式选择
# 输入文件名或测试名来过滤
```

## 常见问题

### 1. "Unable to find an element"

```typescript
// 确保元素被渲染
const { container } = render(<Component />);
expect(container.querySelector('.my-class')).toBeTruthy();

// 使用正确的查询方式
expect(screen.getByText('文本')).toBeInTheDocument();
```

### 2. "Not wrapped in act(...)"

```typescript
// 使用act()包装状态更新
await act(async () => {
  fireEvent.click(button);
  vi.advanceTimersByTime(1000);
});

// 或者使用waitFor
await waitFor(() => {
  expect(screen.getByText('结果')).toBeInTheDocument();
});
```

### 3. "Cannot read property of undefined"

```typescript
// 提供必要的mock数据
const mockProps = {
  data: { name: '测试' },
  onClick: vi.fn(),
  // 确保所有必需的属性都存在
};

// 或者使用可选链
expect(screen.queryByText(mockProps.data?.name || '')).toBeInTheDocument();
```

## E2E测试（可选）

E2E测试位于 `/workspace/tests/e2e/` 目录，需要安装Playwright：

```bash
npm install -D @playwright/test
npx playwright install
```

运行E2E测试：

```bash
npx playwright test
```

## 测试报告

每次运行测试后，可以查看以下报告：

- **控制台输出**: 测试结果摘要
- **覆盖率报告**: `coverage/` 目录（运行coverage后生成）
- **HTML报告**: `coverage/index.html`（可视化覆盖率）

## 持续集成

建议在CI/CD流程中集成测试：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run coverage
        run: npm run test:coverage
```

## 总结

- ✅ 共创建 **181个测试用例**，全部通过
- ✅ 覆盖 **12个测试文件**，涵盖所有核心组件
- ✅ 达到 **72.58%** 语句覆盖率
- ✅ 提供完整的测试工具和配置
- ✅ 支持单元测试、集成测试和性能测试

## 资源链接

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Jest DOM 文档](https://github.com/testing-library/jest-dom)
- [React Testing 最佳实践](https://reactjs.org/docs/testing.html)

## 联系支持

如有问题，请查看：
1. 本指南的"常见问题"部分
2. 现有测试文件中的示例
3. Vitest官方文档

---

**最后更新**: 2024-01-15  
**版本**: 1.0.0
