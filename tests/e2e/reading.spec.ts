import { expect, test } from '@playwright/test';

test('reading page: big comfortable text, verse keeps lines, lục bát indented', async ({ page }) => {
  await page.goto('/bai/kieu-o-lau-ngung-bich');
  await expect(page.locator('h1')).toHaveText('Kiều ở lầu Ngưng Bích');
  await expect(page.getByText('Nguyễn Du (1765–1820)')).toBeVisible();
  const body = page.locator('.reading-body');
  const size = await body.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const lh = await body.evaluate((e) => parseFloat(getComputedStyle(e).lineHeight) / parseFloat(getComputedStyle(e).fontSize));
  expect(size).toBeGreaterThanOrEqual(18);
  expect(lh).toBeGreaterThanOrEqual(1.7);
  expect(await page.locator('.verse-line').count()).toBeGreaterThanOrEqual(20);
  await expect(page.locator('.verse-line').nth(0)).toHaveClass(/is-indented/);
  await expect(page.locator('.verse-line').nth(1)).not.toHaveClass(/is-indented/);
  await expect(page.getByRole('link', { name: 'Nguồn & bản quyền' }).first()).toBeVisible();
  await expect(page.getByText('BẢN NHÁP')).toBeVisible();
});

test('dark mode follows the phone setting', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/bai/thu-dieu');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(19, 21, 26)');
  await context.close();
});

test('sources page lists every reading and the removal promise', async ({ page }) => {
  await page.goto('/nguon-va-ban-quyen');
  await expect(page.getByRole('heading', { name: 'Nguồn & bản quyền' })).toBeVisible();
  await expect(page.getByText('7 ngày')).toBeVisible();
  const rows = await page.locator('tbody').last().locator('tr').count();
  await page.goto('/');
  expect(rows).toBe(await page.locator('.inventory-grid .card').count());
});

test('no sideways scrolling on a small phone', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  for (const path of ['/', '/bai/day-thon-vi-da', '/nguon-va-ban-quyen']) {
    await page.goto(`http://127.0.0.1:4321${path}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
  await context.close();
});

test('poem lines never wrap on a small phone, so they stay aligned', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  for (const slug of ['kieu-o-lau-ngung-bich', 'ca-dao-non-song', 'day-thon-vi-da', 'thu-dieu']) {
    await page.goto(`http://127.0.0.1:4321/bai/${slug}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const result = await page.evaluate(() => {
      const lines = [...document.querySelectorAll<HTMLElement>('.verse-line')];
      const lh = parseFloat(getComputedStyle(lines[0]!).lineHeight);
      return {
        wrapped: lines.filter((l) => l.getBoundingClientRect().height > lh * 1.5).map((l) => l.textContent),
        size: parseFloat(getComputedStyle(lines[0]!).fontSize),
      };
    });
    expect(result.wrapped, slug).toEqual([]);
    expect(result.size, slug).toBeGreaterThanOrEqual(15);
  }
  await context.close();
});
