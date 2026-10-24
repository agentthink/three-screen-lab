import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const registry = JSON.parse(readFileSync(new URL('../../config/screens.json', import.meta.url)));
const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const list = [];
  errors.set(page, list);
  page.on('pageerror', (e) => list.push(e.message));
});
test.afterEach(async ({ page }, info) => {
  expect(errors.get(page)).toEqual([]);
  if (!page.isClosed())
    await page.screenshot({ path: info.outputPath('review.png'), fullPage: true });
});
test('Home: registry cards, filters, one live scene and mobile layout', async ({ page }) => {
  await page.goto('/home.html');
  await expect(page.locator('.screen-card')).toHaveCount(registry.length);
  await expect(page.locator('.hero')).toHaveCount(0);
  await page.locator('[data-filter="geo"]').click();
  await expect(page.locator('.screen-card:visible')).toHaveCount(2);
  await page.locator('[data-filter="operations"]').click();
  await expect(page.locator('.screen-card:visible')).toHaveCount(3);
  await page.locator('[data-filter="all"]').click();
  await page.locator('[data-page="wind.html"] .live-toggle').click();
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect(page.locator('.screen-card.loading')).toHaveCount(0);
  await page.locator('[data-page="factory.html"] .live-toggle').click();
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect(page.locator('iframe')).toHaveAttribute('src', 'factory.html');
  await page.locator('[data-filter="geo"]').click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
test('wind: render, reduced draw calls, stop, explode, wire and flow', async ({ page }) => {
  await page.goto('/wind.html');
  const canvas = page.locator('#wind-3d-canvas');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  expect(Number(await canvas.getAttribute('data-draw-calls'))).toBeLessThan(300);
  await page.locator('#wind-running').click();
  await expect(canvas).toHaveAttribute('data-running', 'false');
  await page.locator('#wind-explode').click();
  await expect(canvas).toHaveAttribute('data-exploded', 'true');
  await page.locator('#wind-wire').click();
  await expect(canvas).toHaveAttribute('data-wire', 'true');
  await page.locator('#wind-wire').click();
  await page.locator('#wind-flow').click();
  await expect(canvas).toHaveAttribute('data-flow', 'true');
  await page.locator('#unit-select').selectOption('G1030');
  await expect(page.locator('#unit-name')).toHaveText('G1030');
});
test('factory: WebGL and day/night sweep', async ({ page }) => {
  await page.goto('/factory.html');
  const canvas = page.locator('#factory-3d-canvas');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await page.locator('#factory-theme-toggle').click();
  await expect(canvas).toHaveAttribute('data-theme-progress', '1.000');
});
test('population: globe renders and keyboard changes view', async ({ page }) => {
  await page.goto('/population.html');
  const canvas = page.locator('#earth-canvas');
  await expect(page.locator('#earth-stage')).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('#earth-stage')).toHaveAttribute('data-texture-ready', 'true');
  await expect(canvas).toBeVisible();
  const stage = page.locator('#earth-stage');
  const before = Number(await stage.getAttribute('data-view-longitude'));
  await canvas.focus();
  await canvas.press('ArrowLeft');
  await expect
    .poll(async () => Number(await stage.getAttribute('data-view-longitude')))
    .not.toBe(before);
});
test('inspection: province hover exposes tooltip without a dialog', async ({ page }) => {
  await page.goto('/inspection.html');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: /^查看.+巡检数据$/ })).toHaveCount(34);
  const province = page.getByRole('button', { name: '查看四川省巡检数据' });
  await province.hover();
  await expect(page.locator('#tooltip')).toBeVisible();
  await expect(page.locator('#modal-backdrop')).not.toHaveClass(/open/);
});

for (const id of ['agriculture', 'industry', 'park']) {
  test(
    id + ': real scene, contextual metrics, object details and mobile layout',
    async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/' + id + '.html');
      const canvas = page.locator('#observatory-canvas');
      await expect(page.locator('#observatory')).toHaveAttribute('data-renderer', 'webgl');
      await expect(canvas).toHaveAttribute('data-ready', 'true');
      const header = page.locator('.ob-header-art');
      await expect(header).toHaveAttribute('data-header-kind', id);
      const imageUrl = await header.locator('image').getAttribute('href');
      expect((await page.request.get(imageUrl)).ok()).toBe(true);
      const beam = header.locator('.ob-flow-segment').last();
      const initialOffset = await beam.evaluate((el) => getComputedStyle(el).strokeDashoffset);
      await expect
        .poll(() => beam.evaluate((el) => getComputedStyle(el).strokeDashoffset))
        .not.toBe(initialOffset);
      expect(Number(await canvas.getAttribute('data-draw-calls'))).toBeLessThan(180);
      await page.locator('[data-action="orbit"]').click();
      await expect(page.locator('[data-action="orbit"]')).toHaveAttribute('aria-pressed', 'true');
      await canvas.focus();
      await canvas.press('ArrowLeft');
      await expect(page.locator('[data-action="orbit"]')).toHaveAttribute('aria-pressed', 'false');
      await page.locator('[data-action="running"]').click();
      await expect(canvas).toHaveAttribute('data-running', 'false');
      await expect(page.locator('#observatory')).toHaveAttribute('data-header-motion', 'paused');
      expect(await beam.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
      await page.locator('[data-action="top"]').click();
      await expect(canvas).toHaveAttribute('data-view', 'top');
      const object = page.locator('.ob-object').first();
      await object.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(object).toBeFocused();
      if (id === 'agriculture') {
        await page.locator('#irrigation-action').click();
        await page.getByRole('button', { name: '开始模拟灌溉', exact: true }).click();
        await expect(page.locator('#irrigation-action')).toHaveAttribute('data-active', 'true');
        await page.locator('#ob-scope').selectOption('greenhouse');
        await expect(page.locator('.ob-metric').first()).toContainText('680');
        await page.locator('button[data-period="1"]').click();
        await expect(page.locator('#ob-trend-metric')).toContainText('14.2');
      }
      if (id === 'industry') {
        await page.locator('#ob-scope').selectOption('night');
        await expect(page.locator('.ob-metric').first()).toContainText('26,368');
        await expect(page.locator('[data-bind="completion"]')).toHaveText('82.4');
        await page.locator('#industry-alert').click();
        await expect(page.locator('#industry-alert')).toHaveAttribute('data-resolved', 'true');
      }
      if (id === 'park') {
        await page.getByRole('tab', { name: /安防态势/ }).click();
        await expect(canvas).toHaveAttribute('data-focus', 'security');
        await page.locator('#park-alert').click();
        await expect(page.locator('.ob-metric').last()).toContainText('0');
        await expect(page.locator('#park-alert')).toHaveAttribute('data-resolved', 'true');
      }
      const overflow = await page
        .locator('.ob-panel')
        .evaluateAll((panels) =>
          panels
            .filter((panel) => panel.scrollHeight > panel.clientHeight + 2)
            .map((panel) => panel.querySelector('h2').textContent),
        );
      expect(overflow).toEqual([]);
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
      await page.locator('.ob-object').last().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: '关闭详情', exact: true }).click();
    },
  );
}
test('new dashboards: lightweight fallback keeps data and object details usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return /webgl/i.test(kind) ? null : original.call(this, kind, ...args);
    };
  });
  await page.goto('/agriculture.html');
  await expect(page.locator('#observatory')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('.ob-empty')).toBeVisible();
  await page.locator('.ob-object').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
test('new dashboards: reduced motion and keyboard topic navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/industry.html');
  await expect(page.locator('#observatory-canvas')).toHaveAttribute('data-running', 'false');
  expect(
    await page
      .locator('.ob-flow-segment')
      .last()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.locator('#ob-tab-0').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#ob-tab-1')).toBeFocused();
  await expect(page.locator('#observatory')).toHaveAttribute('data-topic', '1');
});
