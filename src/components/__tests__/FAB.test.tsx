import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { FAB, LongPressMenu, GlobalSearch, PullToRefresh } from '../DesignSystem/FAB';
import { GlobalSearchModal } from '../GlobalSearchModal';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('FAB Component Tests', () => {
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('FAB renders correctly', () => {
    renderWithRouter(<FAB onAction={mockOnAction} />);
    const fabButton = screen.getByRole('button');
    expect(fabButton).toBeInTheDocument();
  });

  test('FAB opens menu on click', async () => {
    renderWithRouter(<FAB onAction={mockOnAction} />);
    const fabButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(fabButton);
    });

    await waitFor(() => {
      expect(screen.getByText('AI健康咨询')).toBeInTheDocument();
      expect(screen.getByText('查看提醒')).toBeInTheDocument();
      expect(screen.getByText('切换宠物')).toBeInTheDocument();
      expect(screen.getByText('搜索')).toBeInTheDocument();
    });
  });

  test('FAB menu contains quick actions', async () => {
    renderWithRouter(<FAB onAction={mockOnAction} />);
    const fabButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(fabButton);
    });

    await waitFor(() => {
      expect(screen.getByText('添加记录')).toBeInTheDocument();
      expect(screen.getByText('文字记录')).toBeInTheDocument();
      expect(screen.getByText('语音记录')).toBeInTheDocument();
      expect(screen.getByText('拍照记录')).toBeInTheDocument();
      expect(screen.getByText('视频记录')).toBeInTheDocument();
    });
  });

  test('FAB closes on second click', async () => {
    renderWithRouter(<FAB onAction={mockOnAction} />);
    const fabButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(fabButton);
    });

    await waitFor(() => {
      expect(screen.getByText('AI健康咨询')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(fabButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('AI健康咨询')).not.toBeInTheDocument();
    });
  });

  test('FAB callbacks work correctly', async () => {
    const mockOnAIClick = vi.fn();
    const mockOnReminderClick = vi.fn();
    const mockOnPetSwitch = vi.fn();
    const mockOnSearch = vi.fn();

    renderWithRouter(
      <FAB
        onAction={mockOnAction}
        onAIClick={mockOnAIClick}
        onReminderClick={mockOnReminderClick}
        onPetSwitch={mockOnPetSwitch}
        onSearch={mockOnSearch}
      />
    );

    const fabButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(fabButton);
    });

    await waitFor(() => {
      expect(screen.getByText('AI健康咨询')).toBeInTheDocument();
    });

    const aiButton = screen.getByText('AI健康咨询');
    await act(async () => {
      fireEvent.click(aiButton);
    });

    expect(mockOnAIClick).toHaveBeenCalled();
  });
});

describe('LongPressMenu Component Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnAction = vi.fn();
  const mockActions = [
    { id: 'edit', label: '编辑', icon: () => null },
    { id: 'delete', label: '删除', icon: () => null, variant: 'danger' as const },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('LongPressMenu renders when open', () => {
    renderWithRouter(
      <LongPressMenu
        isOpen={true}
        position={{ x: 100, y: 200 }}
        onClose={mockOnClose}
        actions={mockActions}
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
  });

  test('LongPressMenu action callback works', async () => {
    renderWithRouter(
      <LongPressMenu
        isOpen={true}
        position={{ x: 100, y: 200 }}
        onClose={mockOnClose}
        actions={mockActions}
        onAction={mockOnAction}
      />
    );

    const editButton = screen.getByText('编辑');
    await act(async () => {
      fireEvent.click(editButton);
    });

    expect(mockOnAction).toHaveBeenCalledWith('edit');
  });
});

describe('GlobalSearch Component Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('GlobalSearch renders when open', () => {
    renderWithRouter(
      <GlobalSearch isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} />
    );

    expect(screen.getByPlaceholderText('搜索宠物、健康记录、提醒...')).toBeInTheDocument();
  });

  test('GlobalSearch closes on close button click', async () => {
    renderWithRouter(
      <GlobalSearch isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} />
    );

    const closeButton = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('GlobalSearch closes on Escape key', async () => {
    renderWithRouter(
      <GlobalSearch isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} />
    );

    const input = screen.getByPlaceholderText('搜索宠物、健康记录、提醒...');
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Escape' });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('PullToRefresh Component Tests', () => {
  const mockOnRefresh = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('PullToRefresh renders children', () => {
    renderWithRouter(
      <PullToRefresh onRefresh={mockOnRefresh}>
        <div>Test Content</div>
      </PullToRefresh>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

describe('UI/UX Shortcuts Acceptance Criteria', () => {
  test('FAB contains all required quick actions per UX-GLOBAL-002', async () => {
    const mockOnAction = vi.fn();
    const mockOnAIClick = vi.fn();
    const mockOnReminderClick = vi.fn();
    const mockOnPetSwitch = vi.fn();
    const mockOnSearch = vi.fn();

    renderWithRouter(
      <FAB
        onAction={mockOnAction}
        onAIClick={mockOnAIClick}
        onReminderClick={mockOnReminderClick}
        onPetSwitch={mockOnPetSwitch}
        onSearch={mockOnSearch}
      />
    );

    const fabButton = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(fabButton);
    });

    const requiredActions = ['AI健康咨询', '查看提醒', '切换宠物', '搜索'];
    for (const action of requiredActions) {
      await waitFor(() => {
        expect(screen.getByText(action)).toBeInTheDocument();
      }, { timeout: 1000 });
    }
  });

  test('FAB record actions match UX-GLOBAL-002', async () => {
    const mockOnAction = vi.fn();

    renderWithRouter(<FAB onAction={mockOnAction} />);
    const fabButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(fabButton);
    });

    const recordActions = ['文字记录', '语音记录', '拍照记录', '视频记录'];
    for (const action of recordActions) {
      await waitFor(() => {
        expect(screen.getByText(action)).toBeInTheDocument();
      }, { timeout: 1000 });
    }
  });

  test('Global search supports keyboard navigation per UX-GESTURE-004', async () => {
    renderWithRouter(
      <GlobalSearchModal
        isOpen={true}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('搜索宠物、健康记录、提醒...');
    expect(input).toHaveFocus();

    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });

    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });
  });

  test('Empty state message shown per UX-EDGE-001', () => {
    renderWithRouter(
      <GlobalSearchModal
        isOpen={true}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('搜索宠物、健康记录、提醒...');
    fireEvent.change(input, { target: { value: 'xyznonexistent123' } });

    expect(screen.getByText('未找到相关结果')).toBeInTheDocument();
  });
});
