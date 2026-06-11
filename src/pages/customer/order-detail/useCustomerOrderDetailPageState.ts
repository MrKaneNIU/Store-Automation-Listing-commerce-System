import { ref } from 'vue'

import { getCloudBaseCustomerOrderDetailView } from '../../../features/cloudbase-mall/customer-orders'
import {
  createCustomerOrderDetailFailureView,
  createCustomerOrderDetailLoadingView,
  type CustomerOrderDetailPageView,
} from '../../../features/customer-orders/customer-orders'

type LoadOptions = {
  showLoading: boolean
}

type CustomerOrderDetailPageStateDependencies = {
  loadView?: (orderId: string) => Promise<CustomerOrderDetailPageView>
}

export const createCustomerOrderDetailPageState = (
  dependencies: CustomerOrderDetailPageStateDependencies = {},
) => {
  const deps = {
    loadView: getCloudBaseCustomerOrderDetailView,
    ...dependencies,
  }
  const viewModel = ref<CustomerOrderDetailPageView>(createCustomerOrderDetailLoadingView())
  const orderId = ref('')
  const message = ref('')
  let pendingSnapshot: Promise<void> | null = null
  let hasLoadedSnapshot = false

  const loadSnapshot = (options: LoadOptions): Promise<void> => {
    if (pendingSnapshot) return pendingSnapshot

    const normalizedOrderId = orderId.value.trim()
    const previousView = viewModel.value
    if (!normalizedOrderId) {
      viewModel.value = createCustomerOrderDetailFailureView(new Error('订单编号缺失'), previousView)
      message.value = viewModel.value.failureMessage

      return Promise.resolve()
    }

    if (options.showLoading || hasLoadedSnapshot) {
      viewModel.value = createCustomerOrderDetailLoadingView(hasLoadedSnapshot ? previousView : undefined)
    }

    pendingSnapshot = deps.loadView(normalizedOrderId)
      .then((view) => {
        viewModel.value = view
        hasLoadedSnapshot = true
        message.value = ''
      })
      .catch((error) => {
        viewModel.value = createCustomerOrderDetailFailureView(error, hasLoadedSnapshot ? previousView : undefined)
        message.value = viewModel.value.failureMessage
      })
      .finally(() => {
        pendingSnapshot = null
      })

    return pendingSnapshot
  }

  const setOrderId = (value: string) => {
    const nextOrderId = value.trim()
    if (orderId.value === nextOrderId) return
    orderId.value = nextOrderId
    hasLoadedSnapshot = false
  }

  const loadOrder = (value: string, options: LoadOptions): Promise<void> => {
    setOrderId(value)

    return loadSnapshot(options)
  }

  const handlePageLoad = (value: string) => loadOrder(value, { showLoading: true })
  const reload = () => loadSnapshot({ showLoading: true })

  return {
    viewModel,
    orderId,
    message,
    setOrderId,
    loadOrder,
    loadSnapshot,
    handlePageLoad,
    reload,
  }
}
