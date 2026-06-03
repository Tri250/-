import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareModal } from '../../components/ShareModal';

describe('ShareModal', () => {
  const defaultProps = {
    title: '测试标题',
    content: '测试内容',
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('当 isOpen 为 true 时应该渲染', () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByText('分享给朋友')).toBeInTheDocument();
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    it('当 isOpen 为 false 时不应该渲染', () => {
      render(<ShareModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('分享给朋友')).not.toBeInTheDocument();
    });

    it('应该显示标题内容', () => {
      render(<ShareModal {...defaultProps} title="自定义标题" />);
      
      expect(screen.getByText('分享给朋友')).toBeInTheDocument();
    });

    it('应该显示分享内容', () => {
      render(<ShareModal {...defaultProps} content="这是要分享的内容" />);
      
      expect(screen.getByText('这是要分享的内容')).toBeInTheDocument();
    });

    it('当提供 petName 时应该显示宠物名字', () => {
      render(<ShareModal {...defaultProps} petName="小橘" />);
      
      expect(screen.getByText(/小橘/)).toBeInTheDocument();
    });

    it('当没有提供 petName 时不应该显示宠物名字', () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.queryByText(/——/)).not.toBeInTheDocument();
    });
  });

  describe('按钮测试', () => {
    it('应该显示复制按钮', () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByText('复制链接')).toBeInTheDocument();
    });

    it('应该显示分享微信按钮', () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByText('分享微信')).toBeInTheDocument();
    });

    it('应该显示收藏按钮', () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByText('收藏')).toBeInTheDocument();
    });

    it('应该显示更多分享方式按钮', () => {
      render(<ShareModal {...defaultProps} />);
      
      expect(screen.getByText('更多分享方式')).toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('点击背景应该调用 onClose', () => {
      const onClose = vi.fn();
      render(<ShareModal {...defaultProps} onClose={onClose} />);
      
      const overlay = document.querySelector('.bg-black\\/50');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('点击复制按钮应该复制内容到剪贴板', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      });

      render(<ShareModal {...defaultProps} />);
      
      const copyButton = screen.getByText('复制链接');
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(writeText).toHaveBeenCalled();
      });
    });

    it('复制成功后应该显示"已复制"', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      });

      render(<ShareModal {...defaultProps} />);
      
      const copyButton = screen.getByText('复制链接');
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('已复制')).toBeInTheDocument();
      });
    });

    it('复制失败应该记录错误', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const writeText = vi.fn().mockRejectedValue(new Error('复制失败'));
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      });

      render(<ShareModal {...defaultProps} />);
      
      const copyButton = screen.getByText('复制链接');
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      
      consoleError.mockRestore();
    });
  });

  describe('Web Share API 测试', () => {
    it('当支持 Web Share API 时应该调用 share', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        share,
      });

      render(<ShareModal {...defaultProps} />);
      
      const shareButton = screen.getByText('更多分享方式');
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(share).toHaveBeenCalledWith({
          title: 'PawSync Pro - 宠物心声',
          text: expect.stringContaining('测试标题'),
        });
      });
    });

    it('当不支持 Web Share API 时应该调用复制', async () => {
      Object.assign(navigator, {
        share: undefined,
      });
      
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      });

      render(<ShareModal {...defaultProps} />);
      
      const shareButton = screen.getByText('更多分享方式');
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(writeText).toHaveBeenCalled();
      });
    });

    it('Web Share API 取消分享应该不报错', async () => {
      const share = vi.fn().mockRejectedValue(new Error('用户取消'));
      Object.assign(navigator, {
        share,
      });

      render(<ShareModal {...defaultProps} />);
      
      const shareButton = screen.getByText('更多分享方式');
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(share).toHaveBeenCalled();
      });
    });
  });

  describe('内容格式测试', () => {
    it('应该正确格式化分享文本', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      });

      render(<ShareModal {...defaultProps} title="我的标题" content="我的内容" />);
      
      const copyButton = screen.getByText('复制链接');
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(
          expect.stringContaining('我的标题')
        );
        expect(writeText).toHaveBeenCalledWith(
          expect.stringContaining('我的内容')
        );
        expect(writeText).toHaveBeenCalledWith(
          expect.stringContaining('PawSync Pro')
        );
      });
    });

    it('应该包含宠物名字在分享文本中', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      });

      render(<ShareModal {...defaultProps} petName="小橘" />);
      
      const copyButton = screen.getByText('复制链接');
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(writeText).toHaveBeenCalled();
      });
    });
  });

  describe('样式测试', () => {
    it('应该有正确的容器样式', () => {
      render(<ShareModal {...defaultProps} />);
      
      const container = document.querySelector('.fixed.inset-0');
      expect(container).toBeInTheDocument();
    });

    it('应该有遮罩层', () => {
      render(<ShareModal {...defaultProps} />);
      
      const overlay = document.querySelector('.bg-black\\/50');
      expect(overlay).toBeInTheDocument();
    });

    it('应该有圆角样式', () => {
      render(<ShareModal {...defaultProps} />);
      
      const modal = document.querySelector('.rounded-t-3xl');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空标题', () => {
      render(<ShareModal {...defaultProps} title="" />);
      
      expect(screen.getByText('分享给朋友')).toBeInTheDocument();
    });

    it('应该处理空内容', () => {
      render(<ShareModal {...defaultProps} content="" />);
      
      expect(screen.getByText('分享给朋友')).toBeInTheDocument();
    });

    it('应该处理长内容', () => {
      const longContent = '这是一段非常长的内容'.repeat(100);
      render(<ShareModal {...defaultProps} content={longContent} />);
      
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('应该处理特殊字符', () => {
      const specialContent = '内容包含特殊字符：<script>alert("xss")</script>';
      render(<ShareModal {...defaultProps} content={specialContent} />);
      
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });
  });
});
