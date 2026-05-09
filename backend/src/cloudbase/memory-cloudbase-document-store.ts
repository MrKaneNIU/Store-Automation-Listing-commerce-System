export type CloudBaseCollectionName =
  | 'ocr_batches'
  | 'product_drafts'
  | 'products'
  | 'skus'
  | 'orders'
  | 'order_items'

export type CloudBaseDocument = Record<string, unknown> & {
  _id: string
}

export type MemoryCloudBaseDocumentStore = {
  insert: <TDocument extends CloudBaseDocument>(
    collection: CloudBaseCollectionName,
    document: TDocument,
  ) => Promise<TDocument>
  replace: <TDocument extends CloudBaseDocument>(
    collection: CloudBaseCollectionName,
    document: TDocument,
  ) => Promise<TDocument>
  deleteWhere: (
    collection: CloudBaseCollectionName,
    predicate: (document: CloudBaseDocument) => boolean,
  ) => Promise<void>
  list: <TDocument extends CloudBaseDocument>(collection: CloudBaseCollectionName) => Promise<TDocument[]>
  transaction: <TResult>(work: () => Promise<TResult>) => Promise<TResult>
  reset: () => Promise<void>
}

type StoreState = Record<CloudBaseCollectionName, CloudBaseDocument[]>

const collectionNames: CloudBaseCollectionName[] = [
  'ocr_batches',
  'product_drafts',
  'products',
  'skus',
  'orders',
  'order_items',
]

const createEmptyState = (): StoreState => ({
  ocr_batches: [],
  product_drafts: [],
  products: [],
  skus: [],
  orders: [],
  order_items: [],
})

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const createMemoryCloudBaseDocumentStore = (): MemoryCloudBaseDocumentStore => {
  let state = createEmptyState()

  return {
    async insert(collection, document) {
      state = {
        ...state,
        [collection]: [...state[collection], clone(document)],
      }
      return clone(document)
    },
    async replace(collection, document) {
      state = {
        ...state,
        [collection]: state[collection].map((item) => (item._id === document._id ? clone(document) : item)),
      }
      return clone(document)
    },
    async deleteWhere(collection, predicate) {
      state = {
        ...state,
        [collection]: state[collection].filter((document) => !predicate(clone(document))),
      }
    },
    async list<TDocument extends CloudBaseDocument>(collection: CloudBaseCollectionName): Promise<TDocument[]> {
      return clone(state[collection]) as TDocument[]
    },
    async transaction(work) {
      const snapshot = clone(state)
      try {
        return await work()
      } catch (error) {
        state = snapshot
        throw error
      }
    },
    async reset() {
      state = createEmptyState()
    },
  }
}
