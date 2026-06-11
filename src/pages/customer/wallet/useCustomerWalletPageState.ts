import { ref } from 'vue'

import { getCloudBaseCustomerWalletView } from '../../../features/cloudbase-mall/customer-wallet'
import {
  createCustomerWalletFailureView,
  createCustomerWalletLoadingView,
  type CustomerWalletView,
} from '../../../features/customer-wallet/customer-wallet'

type LoadOptions = {
  showLoading: boolean
}

type CustomerWalletPageStateDependencies = {
  loadView?: () => Promise<CustomerWalletView>
}

export const createCustomerWalletPageState = (
  dependencies: CustomerWalletPageStateDependencies = {},
) => {
  const deps = {
    loadView: getCloudBaseCustomerWalletView,
    ...dependencies,
  }
  const viewModel = ref<CustomerWalletView>(createCustomerWalletLoadingView())
  const message = ref('')
  let pendingSnapshot: Promise<void> | null = null
  let hasLoadedSnapshot = false

  const loadSnapshot = (options: LoadOptions): Promise<void> => {
    if (pendingSnapshot) return pendingSnapshot

    const previousView = viewModel.value
    if (options.showLoading || hasLoadedSnapshot) {
      viewModel.value = createCustomerWalletLoadingView(hasLoadedSnapshot ? previousView : undefined)
    }

    pendingSnapshot = deps.loadView()
      .then((view) => {
        viewModel.value = view
        hasLoadedSnapshot = true
        message.value = ''
      })
      .catch((error) => {
        viewModel.value = createCustomerWalletFailureView(error, hasLoadedSnapshot ? previousView : undefined)
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
