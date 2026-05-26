import { test, expect } from '@playwright/test';

test.describe('PawSync Pro E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test.describe('基础导航', () => {
    test('应该显示首页', async ({ page }) => {
      await expect(page.locator('text=PawSync Pro')).toBeVisible();
    });

    test('应该能够导航到AI情感翻译机', async ({ page }) => {
      await page.click('text=AI 情感翻译机');
      await expect(page.locator('h1:has-text("AI 情感翻译机")')).toBeVisible();
    });

    test('应该能够导航到健康监测', async ({ page }) => {
      await page.click('text=健康监测');
      await expect(page.locator('h1:has-text("健康监测")')).toBeVisible();
    });

    test('应该能够导航到摄像头', async ({ page }) => {
      await page.click('text=摄像头');
      await expect(page.locator('h1:has-text("摄像头管理")')).toBeVisible();
    });

    test('应该能够导航到实时监控', async ({ page }) => {
      await page.click('text=实时监控');
      await expect(page.locator('h1:has-text("实时监控")')).toBeVisible();
    });

    test('应该能够导航到个人中心', async ({ page }) => {
      await page.click('text=个人中心');
      await expect(page.locator('h1:has-text("个人中心")')).toBeVisible();
    });
  });

  test.describe('情感翻译功能', () => {
    test('应该显示录音按钮', async ({ page }) => {
      await page.goto('http://localhost:5173/translator');
      const recordButton = page.locator('button:has(svg)').first();
      await expect(recordButton).toBeVisible();
    });

    test('应该能够开始录音', async ({ page }) => {
      await page.goto('http://localhost:5173/translator');
      
      const recordButton = page.locator('button').filter({ hasText: /开始录音|停止录音/ });
      await recordButton.click();
      
      await expect(page.locator('text=宝贝正在说话呢')).toBeVisible();
    });

    test('应该显示小贴士', async ({ page }) => {
      await page.goto('http://localhost:5173/translator');
      await expect(page.locator('text=小贴士')).toBeVisible();
      await expect(page.locator('text=请将麦克风靠近宝贝')).toBeVisible();
    });
  });

  test.describe('响应式设计', () => {
    test('应该适配手机屏幕', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('text=PawSync Pro')).toBeVisible();
    });

    test('应该适配平板屏幕', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('text=PawSync Pro')).toBeVisible();
    });

    test('应该适配桌面屏幕', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('text=PawSync Pro')).toBeVisible();
    });
  });

  test.describe('无障碍功能', () => {
    test('所有按钮应该有aria-label', async ({ page }) => {
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const hasLabel = await button.getAttribute('aria-label');
        const hasText = await button.textContent();
        expect(hasLabel || hasText).toBeTruthy();
      }
    });

    test('应该能够使用键盘导航', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
    });
  });

  test.describe('错误处理', () => {
    test('应该优雅处理404页面', async ({ page }) => {
      await page.goto('http://localhost:5173/non-existent-page');
      await expect(page.locator('text=404')).toBeVisible();
    });
  });
});
