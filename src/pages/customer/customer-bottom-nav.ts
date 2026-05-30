import { routes, type AppRoute } from '../../app/routes'

export const customerBottomNavRoutes = {
  home: routes.customerHome,
  catalog: routes.customerProductList,
  favorites: routes.customerFavorites,
  shoppingBag: routes.customerShoppingBag,
  mine: routes.customerMine,
} as const

export type CustomerBottomNavKey = keyof typeof customerBottomNavRoutes

export type CustomerBottomNavItem = {
  key: CustomerBottomNavKey
  label: string
  icon: string
  route: AppRoute
}

export const customerBottomNavItems: CustomerBottomNavItem[] = [
  { key: 'home', label: '首页', icon: '⌂', route: customerBottomNavRoutes.home },
  { key: 'catalog', label: '商品', icon: '◇', route: customerBottomNavRoutes.catalog },
  { key: 'shoppingBag', label: '购物袋', icon: '▢', route: customerBottomNavRoutes.shoppingBag },
  { key: 'favorites', label: '收藏', icon: '♡', route: customerBottomNavRoutes.favorites },
  { key: 'mine', label: '我的', icon: '○', route: customerBottomNavRoutes.mine },
]

export const shouldIgnoreCustomerBottomNavTap = (params: {
  pendingRoute: AppRoute | ''
  targetRoute: AppRoute
  currentRoute: AppRoute
}) => Boolean(params.pendingRoute) || params.targetRoute === params.currentRoute
