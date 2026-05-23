import { describe, expect, it } from 'vitest'
import { routes } from './routes'

describe('admin workbench more route', () => {
  it('exposes the more page route for the bottom navigation', () => {
    expect(routes.ownerMore).toBe('/pages/owner/more/index')
  })

  it('exposes the permission management route from the more page', () => {
    expect(routes.ownerPermissions).toBe('/pages/owner/permissions/index')
  })

  it('exposes the no-permission state route for blocked admin modules', () => {
    expect(routes.ownerNoPermission).toBe('/pages/owner/no-permission/index')
  })

  it('exposes the homepage settings route from the more page', () => {
    expect(routes.ownerHomepageSettings).toBe('/pages/owner/homepage-settings/index')
  })

  it('exposes the account management route from the more page', () => {
    expect(routes.ownerAccountManagement).toBe('/pages/owner/account-management/index')
  })
})
