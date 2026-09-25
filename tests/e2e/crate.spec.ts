import { expect, test, type Page } from '@playwright/test';


async function seed(page: Page, opts: { opened?: string[]; todayOpens?: number }) {
  await page.addInitScript((o) => {
    const d = new Date();
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    if (o.opened) localStorage.setItem('ketsach:v1:opened', JSON.stringify(o.opened));
    if (o.todayOpens) localStorage.setItem('ketsach:v1:daily', JSON.stringify({ day, opens: Array.from({ length: o.todayOpens }, () => 'thu-dieu') }));
  }, opts);
}

test.describe('home + crate', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows tabs, the crate button with 10 left, and a locked inventory', async ({ page }) => {
    await page.goto('/');
    const POOL = await page.locator('.inventory-grid .card').count();
    expect(POOL).toBeGreaterThan(0);
    await expect(page.getByRole('tab', { name: 'Tất cả' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab')).toHaveCount(6);
    await expect(page.getByRole('button', { name: /KHAI MỞ KÉT · Còn 10 lượt/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: `Đã mở 0 / ${POOL}` })).toBeVisible();
    await expect(page.locator('.inventory-grid a.card')).toHaveCount(0);
  });

  test('reduced motion: result shows at once, can be read, and unlocks in the inventory', async ({ page }) => {
    await page.goto('/');
    const POOL = await page.locator('.inventory-grid .card').count();
    await page.getByRole('button', { name: /KHAI MỞ KÉT/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('ĐÃ KHAI MỞ');
    await expect(page.getByRole('status').filter({ hasText: 'Bạn mở được' })).toContainText(/Độ hiếm [1-5]\/5/);
    await dialog.getByRole('button', { name: 'Tiếp tục' }).click();
    await expect(page.getByRole('button', { name: /KHAI MỞ LẦN NỮA · Còn 9 lượt/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: `Đã mở 1 / ${POOL}` })).toBeVisible();
    await expect(page.locator('.inventory-grid a.card')).toHaveCount(1);
    await expect(page.locator('#hom-nay li')).toHaveCount(1);

    await page.getByRole('button', { name: /KHAI MỞ LẦN NỮA/ }).click();
    await page.getByRole('link', { name: 'Đọc ngay' }).click();
    await expect(page).toHaveURL(/\/bai\/[a-z0-9-]+$/);
    await expect(page.locator('h1')).toBeVisible();
    // Poem lines or prose paragraphs, depending on the reading.
    await expect(page.locator('.reading-body .verse-line, .reading-body > p:not(.end-mark)').first()).toBeVisible();
  });

  test('after 10 crates today: "Mai mở tiếp" and a link to today\'s readings', async ({ page }) => {
    await seed(page, { todayOpens: 10, opened: ['thu-dieu'] });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Mai mở tiếp' })).toBeDisabled();
    await page.getByRole('link', { name: 'Xem các bài đã mở hôm nay' }).click();
    await expect(page.locator('#hom-nay')).toBeInViewport();
  });

  test('theme fully opened: message and a suggested theme', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Thiên nhiên' }).click();
    const slugs = await page.locator('.inventory-grid .card').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.slug));
    await page.evaluate((s) => localStorage.setItem('ketsach:v1:opened', JSON.stringify(s)), slugs);
    await page.reload();
    await page.getByRole('tab', { name: 'Thiên nhiên' }).click();
    await expect(page.getByText('Bạn đã mở hết chủ đề này.')).toBeVisible();
    await page.getByRole('button', { name: /Thử chủ đề/ }).click();
    await expect(page.getByRole('button', { name: /KHAI MỞ/ })).toBeEnabled();
  });

  test('whole pool opened: crate still works and says "Đã mở trước đây"', async ({ page }) => {
    await page.goto('/');
    const slugs = await page.locator('.inventory-grid .card').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.slug));
    await page.evaluate((s) => localStorage.setItem('ketsach:v1:opened', JSON.stringify(s)), slugs);
    await page.reload();
    await page.getByRole('button', { name: /KHAI MỞ/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Đã mở trước đây');
  });
});

test.describe('spin animation', () => {
  test('spins for about 5 s, then shows the result', async ({ page }) => {
    await page.goto('/');
    const POOL = await page.locator('.inventory-grid .card').count();
    const started = Date.now();
    await page.getByRole('button', { name: /KHAI MỞ KÉT/ }).click();
    await expect(page.getByRole('button', { name: 'ĐANG MỞ KHÓA...' })).toBeVisible();
    // No spoilers while the reel is moving: today's list and the inventory wait for the stop.
    await expect(page.locator('#hom-nay')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: `Đã mở 0 / ${POOL}` })).toBeVisible();
    await expect(page.locator('.inventory-grid a.card')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Tiếng cười' })).toBeDisabled();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    const took = Date.now() - started;
    expect(took).toBeGreaterThan(4000);
    expect(took).toBeLessThan(8000);
    await expect(page.locator('#hom-nay li')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: `Đã mở 1 / ${POOL}` })).toBeVisible();
    // The winner in the popup is the card under the centre line.
    const winner = await page.getByRole('dialog').locator('.card').getAttribute('data-slug');
    const centred = await page.evaluate(() => {
      const line = document.querySelector('.centre-line')!.getBoundingClientRect();
      const x = line.left + line.width / 2;
      const card = [...document.querySelectorAll('.reel-track .card')].find((c) => {
        const r = c.getBoundingClientRect();
        return r.left <= x && r.right >= x;
      });
      return (card as HTMLElement | undefined)?.dataset.slug;
    });
    expect(centred).toBe(winner);
  });
});

test.describe('counter (§6.3)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the real count and adds 1 after your own spin', async ({ page }) => {
    let posts = 0;
    await page.route('**/api/counter', (route) => {
      if (route.request().method() === 'POST') posts++;
      return route.fulfill({ json: { count: 43 } });
    });
    await page.goto('/');
    await expect(page.getByTestId('counter')).toContainText('43');
    await page.getByRole('button', { name: /KHAI MỞ KÉT/ }).click();
    await expect(page.getByTestId('counter')).toContainText('44');
    expect(posts).toBe(1);
  });

  test('is hidden when the service is down, and the crate still works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('counter')).toHaveCount(0);
    await page.getByRole('button', { name: /KHAI MỞ KÉT/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
