export type InventoryLedgerAction = 'reserve' | 'release' | 'confirm' | 'adjust'

export type InventoryLedgerSourceType = 'order' | 'manual'

export type InventoryLedgerEntry = {
  id: string
  skuId: string
  orderId?: string
  action: InventoryLedgerAction
  quantityDelta: number
  sourceType: InventoryLedgerSourceType
  sourceId: string
  note: string
  createdAt: string
}
