import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

/**
 * The two-column form grid must leave Payload `row` fields alone — their
 * children are sized by `admin.width` (#9).
 */
test.describe('Form grid', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()
    const context = await browser.newContext({ viewport: { height: 1000, width: 1600 } })
    page = await context.newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('row fields keep their admin.width', async () => {
    await page.goto('http://localhost:3000/admin/collections/projects/create')
    await page.locator('.tabs-field__tab-button', { hasText: 'Delivery' }).click()

    const names = ['ownerName', 'ownerEmail', 'ownerRole', 'ownerPhone']
    const widths = [20, 25, 35, 20]
    const boxes = await Promise.all(
      names.map(async (name) => {
        const field = page.locator(`.row__fields > .field-type:has(#field-${name})`)
        await expect(field).toBeVisible()
        return (await field.boundingBox())!
      }),
    )

    // one line, not wrapped into a 2-column grid
    for (const box of boxes) expect(Math.abs(box.y - boxes[0].y)).toBeLessThan(1)

    // each field takes its configured share (minus the 20px gutter)
    const row = (await page.locator('.row__fields:has(#field-ownerName)').boundingBox())!
    // (the row's box already includes its 10px bleed on either side)
    boxes.forEach((box, i) => {
      expect(Math.abs(box.width - (row.width * widths[i]) / 100 + 20)).toBeLessThan(1)
    })
  })

  test('rows without admin.width still share one line', async () => {
    await page.goto('http://localhost:3000/admin/collections/projects/create')
    const name = (await page.locator('.row__fields > .field-type:has(#field-name)').boundingBox())!
    const client = (await page
      .locator('.row__fields > .field-type:has(#field-client)')
      .boundingBox())!
    expect(Math.abs(name.y - client.y)).toBeLessThan(1)
    expect(client.x).toBeGreaterThan(name.x + name.width)
  })

  test('a multi-select keeps its clear / chevron icons beside the chips', async () => {
    await page.goto('http://localhost:3000/admin/collections/projects/create')
    const field = page.locator('.field-type.select', { hasText: 'Services' })
    const control = field.locator('.rs__control')
    // fill the half-width cell: chips wrap, and the icons used to wrap with them
    for (const label of ['Design', 'Development', 'Branding', 'SEO']) {
      await field.locator('.rs__control input').focus()
      await page.keyboard.press('ArrowDown')
      await field.locator('.rs__option', { hasText: label }).click()
    }
    await expect(field.locator('.rs__multi-value')).toHaveCount(4)

    const values = (await field.locator('.rs__value-container').boundingBox())!
    const icons = (await field.locator('.rs__indicators').boundingBox())!
    const box = (await control.boundingBox())!
    // the icons sit to the right of the chips, not underneath them...
    expect(icons.x).toBeGreaterThanOrEqual(values.x + values.width - 1)
    // ...and the control is as wide as its cell (nothing spilled out)
    expect(icons.x + icons.width).toBeLessThanOrEqual(box.x + box.width)
  })
})
