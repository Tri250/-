import { test, expect } from '@playwright/test';

test.describe('情感翻译完整流程', () => {
  test('用户应该能够完成从录音到分享的完整流程', async ({ page }) => {
    await page.goto('http://localhost:5173/translator');

    await expect(page.locator('h1:has-text("AI 情感翻译机")')).toBeVisible();

    const recordButton = page.locator('button').filter({ hasText: /开始录音|停止录音/ });
    await expect(recordButton).toBeVisible();

    await recordButton.click();

    await expect(page.locator('text=宝贝正在说话呢')).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(2000);

    await recordButton.click();

    await expect(page.locator('text=AI正在倾听')).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(2000);

    const resultCard = page.locator('text=/开心|焦虑|生气|有需求|平静/');
    await expect(resultCard).toBeVisible({ timeout: 10000 });

    const shareButton = page.locator('button:has-text("分享心情")');
    await expect(shareButton).toBeVisible();
  });

  test('应该支持重试功能', async ({ page }) => {
    await page.goto('http://localhost:5173/translator');

    const recordButton = page.locator('button').filter({ hasText: /开始录音|停止录音/ });
    await recordButton.click();

    await page.waitForTimeout(1000);
    await recordButton.click();

    await page.waitForTimeout(3000);

    const retryButton = page.locator('button:has-text("再听一次")');
    await expect(retryButton).toBeVisible({ timeout: 10000 });

    await retryButton.click();

    await expect(page.locator('text=宝贝正在说话呢')).not.toBeVisible();
  });

  test('录音状态UI应该正确显示', async ({ page }) => {
    await page.goto('http://localhost:5173/translator');

    const recordButton = page.locator('button').filter({ hasText: /开始录音|停止录音/ });
    await recordButton.click();

    await expect(page.locator('text=00:00')).toBeVisible();
    await expect(page.locator('text=点击按钮结束录音')).toBeVisible();

    const recordButtonText = await recordButton.textContent();
    expect(recordButtonText).toMatch(/停止录音/);
  });

  test('分析状态UI应该正确显示', async ({ page }) => {
    await page.goto('http://localhost:5173/translator');

    const recordButton = page.locator('button').filter({ hasText: /开始录音|停止录音/ });
    await recordButton.click();

    await page.waitForTimeout(1000);
    await recordButton.click();

    await expect(page.locator('text=AI正在倾听')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=正在分析宝贝的情绪')).toBeVisible();
  });
});
