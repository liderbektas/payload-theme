import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedTestUser()

    // Wide enough for the always-on desktop sidebar (drawer mode starts ≤1440px).
    const context = await browser.newContext({ viewport: { height: 1000, width: 1600 } })
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('.pt-dash__grid').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('renders no widget area or recent activity feed by default', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page.locator('.pt-dash__grid')).toBeVisible()
    await expect(page.locator('.pt-dash__widgets')).toHaveCount(0)
    await expect(page.getByText('Recent activity')).toHaveCount(0)
  })

  test('sidebar user menu replaces the header account button and locale switcher', async () => {
    await page.goto('http://localhost:3000/admin')

    // trigger at the bottom of the sidebar
    const trigger = page.locator('.pt-nav__user-trigger')
    await expect(trigger).toBeVisible()
    await expect(trigger.locator('.pt-nav__user-email')).toHaveText(testUser.email)

    // the header is empty: account button and locale switcher both hidden
    await expect(page.locator('.app-header__account')).toBeHidden()
    await expect(page.locator('.app-header .localizer')).toBeHidden()

    // the greeting block is gone — the dashboard starts with the cards
    await expect(page.locator('.pt-dash__welcome')).toHaveCount(0)

    // open the menu: user header, Account link, Log out link
    await trigger.click()
    const menu = page.locator('.pt-nav__user-menu')
    await expect(menu).toBeVisible()
    await expect(menu.locator('.pt-nav__user-menu-header')).toContainText(testUser.email)
    await expect(menu.locator('a[href="/admin/account"]')).toContainText('Account')
    await expect(menu.locator('a[href="/admin/logout"]')).toContainText('Log out')
    // localization is disabled in this config → no Locale section
    await expect(menu.locator('.pt-nav__user-menu-label')).toHaveCount(0)

    // ESC closes the menu
    await page.keyboard.press('Escape')
    await expect(page.locator('.pt-nav__user-menu')).toHaveCount(0)

    // outside click closes the menu too
    await trigger.click()
    await expect(page.locator('.pt-nav__user-menu')).toBeVisible()
    await page.locator('.pt-dash__grid').click()
    await expect(page.locator('.pt-nav__user-menu')).toHaveCount(0)
  })

  test('empty-state stays centered after client-side navigation', async () => {
    // Load a doc view first so Payload's list-chunk CSS is injected late —
    // the repro for the "empty state slides left after navigating back" bug.
    await page.goto('http://localhost:3000/admin/collections/posts')
    await page.locator('.table a').first().click()
    await page.waitForURL(/\/admin\/collections\/posts\/.+/)

    await page.locator('.pt-nav a[href="/admin/collections/tags"]').click()
    const emptyState = page.locator('.no-results')
    await expect(emptyState).toBeVisible()
    const align = await emptyState.evaluate((el) => getComputedStyle(el).alignItems)
    expect(align).toBe('center')
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    // Payload may normalize the list URL with default query params
    await expect(page).toHaveURL(/\/admin\/collections\/users(\?.*)?$/)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
