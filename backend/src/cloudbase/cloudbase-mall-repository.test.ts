import { describe, expect, it } from 'vitest'

import {
  repositoryContractFixtures,
  runMallRepositoryContract,
} from '../../../src/services/repositories/mall-repository-contract'
import { createCloudBaseMallRepository } from './cloudbase-mall-repository'
import { createMemoryCloudBaseDocumentStore } from './memory-cloudbase-document-store'

const store = createMemoryCloudBaseDocumentStore()

runMallRepositoryContract('cloudbase', {
  createRepository: () => createCloudBaseMallRepository(store),
  reset: () => store.reset(),
})

describe('CloudBase mall repository transaction boundary', () => {
  it('rolls back product writes when SKU validation fails', async () => {
    await store.reset()
    const repository = createCloudBaseMallRepository(store)
    const { batch, product, sku } = repositoryContractFixtures

    await repository.saveBatch(batch)

    await expect(
      repository.saveProducts([product], [{ ...sku, stock: -1 }]),
    ).rejects.toThrow('CloudBase SKU stock must not be negative')

    expect(await repository.listProducts()).toEqual([])
    expect(await repository.listSkus()).toEqual([])
  })
})
