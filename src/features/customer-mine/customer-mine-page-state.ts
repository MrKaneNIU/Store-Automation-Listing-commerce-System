import { ref } from 'vue'

import {
  createCustomerMineFailureView,
  createCustomerMineLoadingView,
  type CustomerMineView,
} from './customer-mine'
import {
  logCustomerRuntimeRequest,
  type CustomerRuntimeRequestLogger,
  type CustomerRuntimeRequestSource,
} from '../../services/performance/customer-runtime-request-log'

type LoadCustomerMineSnapshotOptions = {
  showLoading?: boolean
  source?: CustomerRuntimeRequestSource
}

type CustomerMinePageStateOptions = {
  loadView: () => Promise<CustomerMineView>
  now?: () => number
  cacheTtlMs?: number
  requestLogger?: CustomerRuntimeRequestLogger
}

export const createCustomerMinePageState = ({
  loadView,
  now = () => Date.now(),
  cacheTtlMs = 3000,
  requestLogger,
}: CustomerMinePageStateOptions) => {
  const viewModel = ref<CustomerMineView>(createCustomerMineLoadingView())
  let pendingSnapshotLoad: Promise<CustomerMineView> | null = null
  let hasLoadedSnapshot = false
  let lastLoadedAt = 0

  const loadSnapshot = async (options: LoadCustomerMineSnapshotOptions = {}) => {
    if (pendingSnapshotLoad) {
      const timestamp = now()
      logCustomerRuntimeRequest({
        action: 'getCustomerMineSnapshot',
        source: options.source ?? 'onShow',
        startedAt: timestamp,
        endedAt: timestamp,
        status: 'success',
        deduped: true,
        logger: requestLogger,
      })
      return pendingSnapshotLoad
    }
    if (!options.showLoading && hasLoadedSnapshot && now() - lastLoadedAt < cacheTtlMs) {
      const timestamp = now()
      logCustomerRuntimeRequest({
        action: 'getCustomerMineSnapshot',
        source: options.source ?? 'cache',
        startedAt: timestamp,
        endedAt: timestamp,
        status: 'success',
        deduped: true,
        logger: requestLogger,
      })
      return viewModel.value
    }

    const previousView = viewModel.value
    const startedAt = now()
    if (options.showLoading) {
      viewModel.value = createCustomerMineLoadingView(previousView.loadingState === 'loading' ? undefined : previousView)
    }

    pendingSnapshotLoad = loadView()
      .then((view) => {
        viewModel.value = view
        hasLoadedSnapshot = true
        lastLoadedAt = now()
        logCustomerRuntimeRequest({
          action: 'getCustomerMineSnapshot',
          source: options.source ?? 'onShow',
          startedAt,
          endedAt: now(),
          status: 'success',
          deduped: false,
          logger: requestLogger,
        })
        return view
      })
      .catch((error) => {
        const usablePreviousView = previousView.loadingState === 'loading' ? undefined : previousView
        const failureView = createCustomerMineFailureView(error, usablePreviousView)
        viewModel.value = failureView
        logCustomerRuntimeRequest({
          action: 'getCustomerMineSnapshot',
          source: options.source ?? 'onShow',
          startedAt,
          endedAt: now(),
          status: 'failed',
          deduped: false,
          logger: requestLogger,
        })
        return failureView
      })
      .finally(() => {
        pendingSnapshotLoad = null
      })

    return pendingSnapshotLoad
  }

  const retry = () => loadSnapshot({ showLoading: true, source: 'retry' })

  return {
    viewModel,
    loadSnapshot,
    retry,
  }
}
