import { test, expect, Browser, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

/**
 * `nav.dockedMinWidth: 1280` (dev/src/payload.config.ts). Payload force-closes
 * its nav at 1440px and below, so without the option a 1366px laptop gets only
 * the drawer toggle.
 */
test.describe('Docked sidebar on laptop widths', () => {
  const open = async (browser: Browser, width: number): Promise<Page> => {
    const context = await browser.newContext({ viewport: { height: 900, width } })
    const page = await context.newPage()
    await login({ page, user: testUser })
    return page
  }

  test.beforeAll(async () => {
    await seedTestUser()
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('is docked and open by default at 1366px, and collapses and re-opens', async ({
    browser,
  }) => {
    const page = await open(browser, 1366)
    const template = page.locator('.template-default')
    const nav = page.locator('aside.pt-nav')
    const chip = page.locator('.pt-nav-collapse')

    await expect(template).toHaveClass(/template-default--nav-open/)
    await expect(nav).not.toHaveAttribute('inert')
    await expect(nav).toHaveCSS('position', 'sticky')
    await expect(page.locator('.app-header__mobile-nav-toggler')).toBeHidden()
    await expect(chip).toBeVisible()
    // the content card sits right of the 276px column, as it does above 1440px
    // (polled: after the login redirect the column slides in)
    await expect
      .poll(async () => (await page.locator('.template-default__wrap').boundingBox())!.x)
      .toBe(276)

    await chip.click()
    await expect(template).not.toHaveClass(/template-default--nav-open/)
    await expect(nav).toHaveAttribute('inert')

    // an explicit collapse is kept across a reload (Payload's own close at
    // this width must not be mistaken for it, nor undone)
    await page.reload()
    await expect(page.locator('.pt-dash__grid').first()).toBeVisible()
    await expect(nav).toHaveAttribute('inert')
    await expect(template).not.toHaveClass(/template-default--nav-open/)

    // leaves the saved preference open for the other specs
    await chip.click()
    await expect(template).toHaveClass(/template-default--nav-open/)
    await page.context().close()
  })

  test('keeps the drawer below the option, and Escape closes it', async ({ browser }) => {
    const page = await open(browser, 1100)
    const template = page.locator('.template-default')
    const nav = page.locator('aside.pt-nav')

    await expect(page.locator('.pt-dash__grid').first()).toBeVisible()
    await expect(nav).toHaveCSS('position', 'fixed')
    await expect(template).not.toHaveClass(/template-default--nav-open/)
    await expect(page.locator('.pt-nav-collapse')).toBeHidden()

    await page.locator('.app-header__mobile-nav-toggler').click()
    await expect(template).toHaveClass(/template-default--nav-open/)
    await page.keyboard.press('Escape')
    await expect(template).not.toHaveClass(/template-default--nav-open/)
    await page.context().close()
  })
})
