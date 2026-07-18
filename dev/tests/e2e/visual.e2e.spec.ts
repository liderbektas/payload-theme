import { execSync } from 'node:child_process'

import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

/**
 * Screenshot regression suite for the themed admin panel.
 *
 * Baselines live in tests/e2e/__screenshots__/<platform>/ and are
 * rendering-platform specific (font rasterization differs per OS), so the
 * suite only runs where baselines exist. CI (Linux) skips it; run locally:
 *
 *   pnpm --filter dev test:visual
 *   pnpm --filter dev test:visual --update-snapshots   # intentional changes
 *
 * Determinism: the demo seed is re-run first (fixed content, fixed publish
 * dates), the context pins light color-scheme + reduced motion, and the
 * created/updated timestamp cells — the only content that changes per seed —
 * are masked.
 */
test.skip(!!process.env.CI, 'visual baselines are per-platform — run locally with test:visual')

test.describe('visual regression', () => {
  test.describe.configure({ timeout: 90_000 })

  let page: Page

  const timestampMasks = () => [page.locator('.cell-updatedAt'), page.locator('.cell-createdAt')]

  test.beforeAll(async ({ browser }) => {
    execSync('pnpm seed', { stdio: 'inherit' })
    await seedTestUser()

    const context = await browser.newContext({
      colorScheme: 'light',
      reducedMotion: 'reduce',
      viewport: { height: 1000, width: 1600 },
    })
    page = await context.newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('login screen', async ({ browser }) => {
    const context = await browser.newContext({
      colorScheme: 'light',
      reducedMotion: 'reduce',
      viewport: { height: 1000, width: 1600 },
    })
    const loginPage = await context.newPage()
    await loginPage.goto('http://localhost:3000/admin/login')
    await loginPage.waitForSelector('#field-email')
    await expect(loginPage).toHaveScreenshot('login.png')
    await context.close()
  })

  test('dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page.locator('.pt-dash__grid')).toBeVisible()
    await expect(page).toHaveScreenshot('dashboard.png')
  })

  test('posts list', async () => {
    await page.goto('http://localhost:3000/admin/collections/posts')
    await expect(page.locator('.table tbody tr').first()).toBeVisible()
    // wait for the injected row-actions cells so the shot is stable
    await expect(page.locator('td.pt-actions-cell').first()).toBeVisible()
    await expect(page).toHaveScreenshot('posts-list.png', { mask: timestampMasks() })
  })

  test('media grid', async () => {
    await page.goto('http://localhost:3000/admin/collections/media')
    await expect(page.locator('.pt-media-toggle')).toBeVisible()
    await expect(page.locator('.table tbody tr').first()).toBeVisible()
    // let the thumbnails paint
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('media-grid.png', { mask: timestampMasks() })
  })

  test('dashboard (dark)', async () => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('http://localhost:3000/admin')
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
    await expect(page.locator('.pt-dash__grid')).toBeVisible()
    await expect(page).toHaveScreenshot('dashboard-dark.png')
    await page.emulateMedia({ colorScheme: 'light' })
  })
})
