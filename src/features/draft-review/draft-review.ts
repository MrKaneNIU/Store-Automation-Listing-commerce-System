import type { ProductDraft } from '../../domain/draft/types'

export type DraftGroup = {
  productCode: string
  drafts: ProductDraft[]
}

export const groupDraftsByProductCode = (drafts: ProductDraft[]): DraftGroup[] => {
  const groups = new Map<string, ProductDraft[]>()

  drafts
    .filter((draft) => draft.status !== 'deleted')
    .forEach((draft) => {
      const key = draft.productCode.trim() || '未识别货号'
      groups.set(key, [...(groups.get(key) ?? []), draft])
    })

  return Array.from(groups.entries()).map(([productCode, groupDrafts]) => ({
    productCode,
    drafts: groupDrafts,
  }))
}

export const findPriceConflictCodes = (drafts: ProductDraft[]) => {
  const priceMap = new Map<string, Set<number>>()

  drafts
    .filter((draft) => draft.status !== 'deleted' && draft.productCode.trim())
    .forEach((draft) => {
      priceMap.set(draft.productCode, new Set([...(priceMap.get(draft.productCode) ?? []), draft.salePrice]))
    })

  return new Set(
    Array.from(priceMap.entries())
      .filter(([, prices]) => prices.size > 1)
      .map(([productCode]) => productCode),
  )
}
