export type AppRole = 'owner' | 'staff' | 'customer'

export const roleLabels: Record<AppRole, string> = {
  owner: '老板端',
  staff: '店员端',
  customer: '客户侧',
}
