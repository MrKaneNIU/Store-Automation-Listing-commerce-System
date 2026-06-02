import { ref } from 'vue'

import {
  getCloudBaseCustomerFavoriteProductsView,
  removeCloudBaseCustomerFavoriteProduct,
  retryCloudBaseCustomerFavoriteProductsSnapshot,
} from '../../../features/cloudbase-mall/customer-favorites'
import {
  createCustomerFavoriteProductsFailureView,
  createCustomerFavoriteProductsLoadingView,
  type CustomerFavoriteProductsView,
} from '../../../features/customer-favorites/customer-favorites'
import {
  logCustomerRuntimeRequest,
  type CustomerRuntimeRequestLogger,
  type CustomerRuntimeRequestSource,
} from '../../../services/performance/customer-runtime-request-log'

type LoadOptions = {
  showLoading: boolean
  source?: CustomerRuntimeRequestSource
}

type CustomerFavoritesPageStateDependencies = {
  loadView?: () => Promise<CustomerFavoriteProductsView>
  retryView?: () => Promise<CustomerFavoriteProductsView>
  removeFavorite?: (productId: string, previousView: CustomerFavoriteProductsView) => Promise<{
    view: CustomerFavoriteProductsView
    message: string
  }>
  now?: () => number
  cacheTtlMs?: number
  requestLogger?: CustomerRuntimeRequestLogger
}

const keepPreviousCardsOnFailure = (
  nextView: CustomerFavoriteProductsView,
  previousView: CustomerFavoriteProductsView,
): CustomerFavoriteProductsView => {
  if (nextView.loadingState === 'failed' && previousView.items.length > 0) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage: nextView.failureMessage,
    }
  }

  return nextView
}

export const createCustomerFavoritesPageState = (
  dependencies: CustomerFavoritesPageStateDependencies = {},
) => {
  const deps = {
    loadView: getCloudBaseCustomerFavoriteProductsView,
    retryView: retryCloudBaseCustomerFavoriteProductsSnapshot,
    removeFavorite: (productId: string, previousView: CustomerFavoriteProductsView) =>
      removeCloudBaseCustomerFavoriteProduct(productId, undefined, previousView),
    now: () => Date.now(),
    cacheTtlMs: 3000,
    requestLogger: undefined,
    ...dependencies,
  }
  const viewModel = ref<CustomerFavoriteProductsView>(createCustomerFavoriteProductsLoadingView())
  const removingProductIds = ref<string[]>([])
  const message = ref('')
  let pendingSnapshot: Promise<void> | null = null
  let hasLoadedSnapshot = false
  let lastLoadedAt = 0
  let snapshotVersion = 0

  const record = (
    source: CustomerRuntimeRequestSource,
    startedAt: number,
    status: 'success' | 'failed',
    deduped: boolean,
  ) => {
    logCustomerRuntimeRequest({
      action: 'getCustomerFavoriteProductsSnapshot',
      source,
      startedAt,
      endedAt: deps.now(),
      status,
      deduped,
      logger: deps.requestLogger,
    })
  }

  const loadSnapshot = (options: LoadOptions): Promise<void> => {
    const source = options.source ?? 'onShow'
    if (pendingSnapshot) {
      const timestamp = deps.now()
      record(source, timestamp, 'success', true)
      return pendingSnapshot
    }
    if (!options.showLoading && hasLoadedSnapshot && deps.now() - lastLoadedAt < deps.cacheTtlMs) {
      const timestamp = deps.now()
      record('cache', timestamp, 'success', true)
      return Promise.resolve()
    }

    const previousView = viewModel.value
    const startedAt = deps.now()
    const requestVersion = snapshotVersion

    if (options.showLoading) {
      viewModel.value = createCustomerFavoriteProductsLoadingView(previousView.items.length ? previousView : undefined)
    }

    message.value = ''
    const currentSnapshot = deps.loadView()
      .then((nextView) => {
        if (requestVersion === snapshotVersion) {
          viewModel.value = keepPreviousCardsOnFailure(nextView, previousView)
          hasLoadedSnapshot = true
          lastLoadedAt = deps.now()
        }
        record(source, startedAt, 'success', false)
      })
      .catch((error) => {
        if (requestVersion === snapshotVersion) {
          viewModel.value = keepPreviousCardsOnFailure(
            createCustomerFavoriteProductsFailureView(error, previousView.items.length ? previousView : undefined),
            previousView,
          )
          message.value = viewModel.value.failureMessage
        }
        record(source, startedAt, 'failed', false)
      })
      .finally(() => {
        if (pendingSnapshot === currentSnapshot) {
          pendingSnapshot = null
        }
      })
    pendingSnapshot = currentSnapshot

    return pendingSnapshot
  }

  const reload = (): Promise<void> => {
    if (pendingSnapshot) {
      const timestamp = deps.now()
      record('retry', timestamp, 'success', true)
      return pendingSnapshot
    }

    const previousView = viewModel.value
    const startedAt = deps.now()
    const requestVersion = snapshotVersion
    viewModel.value = createCustomerFavoriteProductsLoadingView(previousView)
    const currentSnapshot = deps.retryView()
      .then((view) => {
        if (requestVersion === snapshotVersion) {
          viewModel.value = keepPreviousCardsOnFailure(view, previousView)
          hasLoadedSnapshot = true
          lastLoadedAt = deps.now()
        }
        record('retry', startedAt, 'success', false)
      })
      .catch((error) => {
        if (requestVersion === snapshotVersion) {
          viewModel.value = keepPreviousCardsOnFailure(createCustomerFavoriteProductsFailureView(error, previousView), previousView)
          message.value = viewModel.value.failureMessage
        }
        record('retry', startedAt, 'failed', false)
      })
      .finally(() => {
        if (pendingSnapshot === currentSnapshot) {
          pendingSnapshot = null
        }
      })
    pendingSnapshot = currentSnapshot

    return pendingSnapshot
  }

  const removeFavorite = async (productId: string) => {
    if (removingProductIds.value.includes(productId)) return

    removingProductIds.value = [...removingProductIds.value, productId]

    try {
      const result = await deps.removeFavorite(productId, viewModel.value)
      snapshotVersion += 1
      pendingSnapshot = null
      viewModel.value = result.view
      message.value = result.message
      hasLoadedSnapshot = true
      lastLoadedAt = deps.now()
    } finally {
      removingProductIds.value = removingProductIds.value.filter((id) => id !== productId)
    }
  }

  return {
    viewModel,
    removingProductIds,
    message,
    loadSnapshot,
    reload,
    removeFavorite,
  }
}
