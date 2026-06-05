import { ref } from 'vue'

import { getCloudBaseCustomerOrdersView } from '../../../features/cloudbase-mall/customer-orders'
import {
  createCustomerOrdersFailureView,
  createCustomerOrdersLoadingView,
  type CustomerOrdersView,
} from '../../../features/customer-orders/customer-orders'

type LoadOptions = {
  showLoading: boolean
}

type CustomerOrdersPageStateDependencies = {
  loadView?: () => Promise<CustomerOrdersView>
  now?: () => number
  cacheTtlMs?: number
}

export const createCustomerOrdersPageState = (
  dependencies: CustomerOrdersPageStateDependencies = {},
) => {
  const deps = {
    loadView: getCloudBaseCustomerOrdersView,
    now: () => Date.now(),
    cacheTtlMs: 3000,
    ...dependencies,
  }
  const viewModel = ref<CustomerOrdersView>(createCustomerOrdersLoadingView())
  const message = ref('')
  let pendingSnapshot: Promise<void> | null = null
  let hasLoadedSnapshot = false
  let lastLoadedAt = 0

  const loadSnapshot = (options: LoadOptions): Promise<void> => {
    if (pendingSnapshot) return pendingSnapshot
    if (!options.showLoading && hasLoadedSnapshot && deps.now() - lastLoadedAt < deps.cacheTtlMs) {
      return Promise.resolve()
    }

    const previousView = viewModel.value
    if (options.showLoading || hasLoadedSnapshot) {
      viewModel.value = createCustomerOrdersLoadingView(hasLoadedSnapshot ? previousView : undefined)
    }

    pendingSnapshot = deps.loadView()
      .then((view) => {
        viewModel.value = view
        hasLoadedSnapshot = true
        lastLoadedAt = deps.now()
        message.value = ''
      })
      .catch((error) => {
        viewModel.value = createCustomerOrdersFailureView(error, hasLoadedSnapshot ? previousView : undefined)
        message.value = viewModel.value.failureMessage
      })
      .finally(() => {
        pendingSnapshot = null
      })

    return pendingSnapshot
  }

  const handlePageShow = () => loadSnapshot({ showLoading: !hasLoadedSnapshot })
  const reload = () => loadSnapshot({ showLoading: true })

  return {
    viewModel,
    message,
    loadSnapshot,
    handlePageShow,
    reload,
  }
}
