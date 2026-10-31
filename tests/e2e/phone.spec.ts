import { expect, test } from '@playwright/test'

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  test('shows the Best on laptop card and no video', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Best on laptop')).toBeVisible()
    await expect(page.locator('video')).toHaveCount(0)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the hub is reachable and a panel opens without video', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Put it on' }).click()
    await page.getByRole('button', { name: 'Into the city' }).click()
    await page.getByTestId('hotspots').getByRole('button', { name: 'CET Campus Circle' }).click()
    await expect(page.getByText('Back to the city')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('video')).toHaveCount(0)
  })
})
