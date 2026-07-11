import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page.
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)

  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL(`${serverURL}/admin`)

  // The theme replaces the default dashboard (and hides the breadcrumb the
  // old `span[title="Dashboard"]` check relied on) — wait for the themed
  // dashboard grid instead.
  const dashboardArtifact = page.locator('.pt-dash__grid')
  await expect(dashboardArtifact).toBeVisible()
}
