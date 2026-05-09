import { runMallRepositoryContract } from './mall-repository-contract'
import { createMemoryMallRepository } from './memory-mall-repository'
import { resetMockDb } from './mock-db'

runMallRepositoryContract('memory', {
  createRepository: createMemoryMallRepository,
  reset: resetMockDb,
})
