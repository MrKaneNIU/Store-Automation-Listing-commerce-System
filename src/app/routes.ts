export const routes = {
  customerHome: '/pages/index/index',
  ownerDashboard: '/pages/owner/dashboard/index',
  ownerImportUpload: '/pages/owner/import-upload/index',
  ownerDraftReview: '/pages/owner/draft-review/index',
  ownerProducts: '/pages/owner/products/index',
  ownerOrders: '/pages/owner/orders/index',
  staffImageTasks: '/pages/staff/image-tasks/index',
  customerProductList: '/pages/customer/product-list/index',
  customerProductDetail: '/pages/customer/product-detail/index',
} as const

export type AppRoute = (typeof routes)[keyof typeof routes]
