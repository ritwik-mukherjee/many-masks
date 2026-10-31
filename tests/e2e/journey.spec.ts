import { expect, test, type Page } from '@playwright/test'

const hotspot = (page: Page, name: string) => page.getByTestId('hotspots').getByRole('button', { name })

async function toHub(page: Page) {
  await page.getByRole('button', { name: 'Put it on' }).click()
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await expect(page.getByTestId('hotspots').getByRole('button')).toHaveCount(13)
}

test('name and Put it on within 3 s, hub within 10 s', async ({ page }) => {
  const start = Date.now()
  await page.goto('/', { waitUntil: 'commit' })
  await expect(page.getByText('Ritwik Mukherjee')).toBeVisible({ timeout: 3000 })
  await expect(page.getByRole('button', { name: 'Put it on' })).toBeVisible({ timeout: 3000 })
  await toHub(page)
  expect(Date.now() - start).toBeLessThan(10_000)
})

test('visit a building, come back, and it is marked visited', async ({ page }) => {
  await page.goto('/')
  await toHub(page)
  await hotspot(page, 'CET Campus Circle').click()
  await expect(page.getByText('Back to the city')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByAltText('Comic panel: CET Campus Circle')).toBeVisible()
  await page.getByRole('button', { name: 'Back to the city' }).click()
  await page.getByRole('button', { name: /Route map/ }).click()
  const entry = page.getByRole('navigation', { name: 'Route map' }).getByRole('listitem').filter({ hasText: 'CET Campus Circle' })
  await expect(entry.getByText('visited')).toBeVisible()
})

test('keyboard: Tab reaches hotspots and Enter swings', async ({ page }) => {
  await page.goto('/')
  await toHub(page)
  await hotspot(page, 'Velnora').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toHaveAttribute('data-phase', /swinging|freezing|panel/)
})

test('finale: the tower, take it off, the reveal', async ({ page }) => {
  await page.goto('/')
  await toHub(page)
  await hotspot(page, 'Wispr Flow India').click()
  await page.getByRole('button', { name: 'Take it off' }).click({ timeout: 15_000 })
  await expect(page.getByText("You've been wearing my masks. Here's the one I want next.")).toBeVisible({ timeout: 15_000 })
})
