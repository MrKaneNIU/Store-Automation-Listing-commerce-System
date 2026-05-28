import { describe, expect, it } from 'vitest'
import pagesConfig from '../pages.json'
import { routes } from './routes'

describe('customer shopping bag route registration', () => {
  it('exposes the customer shopping bag route', () => {
    expect(routes.customerShoppingBag).toBe('/pages/customer/shopping-bag/index')
  })

  it('registers the customer shopping bag page with custom navigation', () => {
    expect(pagesConfig.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'pages/customer/shopping-bag/index',
          style: expect.objectContaining({ navigationStyle: 'custom' }),
        }),
      ]),
    )
  })
})
