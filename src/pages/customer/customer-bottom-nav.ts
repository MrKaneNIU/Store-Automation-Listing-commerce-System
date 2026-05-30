import { routes } from '../../app/routes'

export const customerBottomNavRoutes = {
  home: routes.customerHome,
  catalog: routes.customerProductList,
  favorites: routes.customerFavorites,
  shoppingBag: routes.customerShoppingBag,
} as const

export const CUSTOMER_MINE_PLACEHOLDER = '我的页面暂未开放'
