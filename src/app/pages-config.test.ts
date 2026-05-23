import { describe, expect, it } from 'vitest'
import pagesConfig from '../pages.json'

describe('mini program page config', () => {
  it('starts from the customer home page instead of the admin login page', () => {
    expect(pagesConfig.pages[0]?.path).toBe('pages/index/index')
  })

  it('keeps the admin login page registered but not as the launch page', () => {
    const loginIndex = pagesConfig.pages.findIndex((page) => page.path === 'pages/login/index')

    expect(loginIndex).toBeGreaterThan(0)
  })

  it('registers the admin no-permission state page', () => {
    expect(pagesConfig.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'pages/owner/no-permission/index' }),
      ]),
    )
  })

  it('hides native top-left navigation on owner main tab pages', () => {
    const ownerMainPages = [
      'pages/owner/dashboard/index',
      'pages/owner/products/index',
      'pages/owner/orders/index',
      'pages/owner/more/index',
    ]

    for (const pagePath of ownerMainPages) {
      const page = pagesConfig.pages.find((item) => item.path === pagePath)

      expect(page?.style?.navigationStyle).toBe('custom')
    }
  })

  it('keeps owner more child pages on native navigation so they can return to the parent page', () => {
    const ownerMoreChildPages = [
      'pages/owner/permissions/index',
      'pages/owner/homepage-settings/index',
      'pages/owner/account-management/index',
    ]

    for (const pagePath of ownerMoreChildPages) {
      const page = pagesConfig.pages.find((item) => item.path === pagePath)

      expect(page?.style?.navigationStyle).not.toBe('custom')
    }
  })
})
