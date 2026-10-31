import { expect, test } from '@playwright/test'

test('title loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Ritwik Mukherjee · Many Masks')
})
