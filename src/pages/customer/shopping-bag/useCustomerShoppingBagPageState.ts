import { ref } from 'vue'
import {
  createCustomerShoppingBagFailureView,
  createCustomerShoppingBagLoadingView,
  createCustomerShoppingBagView,
  submitSelectedCustomerShoppingBagItemsToCheckout,
  type CustomerShoppingBagCheckoutResult,
  type CustomerShoppingBagViewModel,
} from '../../../features/customer-shopping-bag/customer-shopping-bag'
import {
  clearUnavailableCloudBaseCustomerShoppingBagItems,
  getCloudBaseCustomerShoppingBagView,
  removeCloudBaseCustomerShoppingBagItem,
  selectCloudBaseCustomerShoppingBagItem,
  updateCloudBaseCustomerShoppingBagItemQuantity,
  type CloudBaseCustomerShoppingBagCommandResult,
} from '../../../features/cloudbase-mall/customer-shopping-bag'
import {
  logCustomerRuntimeRequest,
  type CustomerRuntimeRequestLogger,
  type CustomerRuntimeRequestSource,
} from '../../../services/performance/customer-runtime-request-log'

type LoadSnapshotOptions = {
  showLoading: boolean
  source?: CustomerRuntimeRequestSource
}

type CustomerShoppingBagPageStateDependencies = {
  loadView?: () => Promise<CustomerShoppingBagViewModel>
  updateQuantity?: (
    itemId: string,
    quantity: number,
    previousView: CustomerShoppingBagViewModel,
  ) => Promise<CloudBaseCustomerShoppingBagCommandResult>
  selectItem?: (
    itemId: string,
    isSelected: boolean,
    previousView: CustomerShoppingBagViewModel,
  ) => Promise<CloudBaseCustomerShoppingBagCommandResult>
  removeItem?: (
    itemId: string,
    previousView: CustomerShoppingBagViewModel,
  ) => Promise<CloudBaseCustomerShoppingBagCommandResult>
  clearUnavailable?: (
    previousView: CustomerShoppingBagViewModel,
  ) => Promise<CloudBaseCustomerShoppingBagCommandResult>
  now?: () => number
  cacheTtlMs?: number
  requestLogger?: CustomerRuntimeRequestLogger
}

const createInitialView = () =>
  createCustomerShoppingBagView({
    customerId: '',
    items: [],
    totalQuantity: 0,
    selectedQuantity: 0,
    selectedSubtotal: 0,
    unavailableCount: 0,
    serverTime: '',
  })

const defaultDependencies = {
  loadView: getCloudBaseCustomerShoppingBagView,
  updateQuantity: (itemId: string, quantity: number, previousView: CustomerShoppingBagViewModel) =>
    updateCloudBaseCustomerShoppingBagItemQuantity(itemId, quantity, undefined, previousView),
  selectItem: (itemId: string, isSelected: boolean, previousView: CustomerShoppingBagViewModel) =>
    selectCloudBaseCustomerShoppingBagItem(itemId, isSelected, undefined, previousView),
  removeItem: (itemId: string, previousView: CustomerShoppingBagViewModel) =>
    removeCloudBaseCustomerShoppingBagItem(itemId, undefined, previousView),
  clearUnavailable: (previousView: CustomerShoppingBagViewModel) =>
    clearUnavailableCloudBaseCustomerShoppingBagItems(undefined, previousView),
  now: () => Date.now(),
  cacheTtlMs: 3000,
  requestLogger: undefined,
}

export const createCustomerShoppingBagPageState = (
  dependencies: CustomerShoppingBagPageStateDependencies = {},
) => {
  const deps = {
    ...defaultDependencies,
    ...dependencies,
  }
  const viewModel = ref<CustomerShoppingBagViewModel>(createInitialView())
  const message = ref('')
  const invalidatedSnapshotKeys = ref<string[]>([])
  let hasLoadedSnapshot = false
  let pendingSnapshot: Promise<void> | null = null
  let lastLoadedAt = 0
  let mutationVersion = 0

  const loadSnapshot = (options: LoadSnapshotOptions): Promise<void> => {
    if (pendingSnapshot) {
      const timestamp = deps.now()
      logCustomerRuntimeRequest({
        action: 'getCustomerShoppingBagSnapshot',
        source: options.source ?? 'onShow',
        startedAt: timestamp,
        endedAt: timestamp,
        status: 'success',
        deduped: true,
        logger: deps.requestLogger,
      })
      return pendingSnapshot
    }
    if (!options.showLoading && hasLoadedSnapshot && deps.now() - lastLoadedAt < deps.cacheTtlMs) {
      const timestamp = deps.now()
      logCustomerRuntimeRequest({
        action: 'getCustomerShoppingBagSnapshot',
        source: options.source ?? 'cache',
        startedAt: timestamp,
        endedAt: timestamp,
        status: 'success',
        deduped: true,
        logger: deps.requestLogger,
      })
      return Promise.resolve()
    }

    const previousView = viewModel.value
    const loadVersion = mutationVersion
    const startedAt = deps.now()
    if (options.showLoading || hasLoadedSnapshot) {
      viewModel.value = createCustomerShoppingBagLoadingView(hasLoadedSnapshot ? previousView : undefined)
    }

    pendingSnapshot = deps.loadView()
      .then((view) => {
        if (loadVersion !== mutationVersion) return
        viewModel.value = view
        hasLoadedSnapshot = true
        lastLoadedAt = deps.now()
        message.value = ''
        logCustomerRuntimeRequest({
          action: 'getCustomerShoppingBagSnapshot',
          source: options.source ?? 'onShow',
          startedAt,
          endedAt: deps.now(),
          status: 'success',
          deduped: false,
          logger: deps.requestLogger,
        })
      })
      .catch((error) => {
        if (loadVersion !== mutationVersion) return
        viewModel.value = createCustomerShoppingBagFailureView(error, hasLoadedSnapshot ? previousView : undefined)
        message.value = viewModel.value.failureMessage
        logCustomerRuntimeRequest({
          action: 'getCustomerShoppingBagSnapshot',
          source: options.source ?? 'onShow',
          startedAt,
          endedAt: deps.now(),
          status: 'failed',
          deduped: false,
          logger: deps.requestLogger,
        })
      })
      .finally(() => {
        pendingSnapshot = null
      })

    return pendingSnapshot
  }

  const handlePageShow = () => loadSnapshot({ showLoading: !hasLoadedSnapshot, source: 'onShow' })

  const applyCommand = async (
    command: (previousView: CustomerShoppingBagViewModel) => Promise<CloudBaseCustomerShoppingBagCommandResult>,
  ) => {
    const previousView = viewModel.value
    mutationVersion += 1
    const result = await command(previousView)

    viewModel.value = result.view
    message.value = result.message
    invalidatedSnapshotKeys.value = result.invalidatedSnapshotKeys
    hasLoadedSnapshot = true
    lastLoadedAt = deps.now()
  }

  const updateQuantity = (itemId: string, quantity: number) =>
    applyCommand((previousView) => deps.updateQuantity(itemId, quantity, previousView))

  const selectItem = (itemId: string, isSelected: boolean) =>
    applyCommand((previousView) => deps.selectItem(itemId, isSelected, previousView))

  const removeItem = (itemId: string) =>
    applyCommand((previousView) => deps.removeItem(itemId, previousView))

  const clearUnavailable = () =>
    applyCommand((previousView) => deps.clearUnavailable(previousView))

  const submitSelectedItems = (): CustomerShoppingBagCheckoutResult => {
    const result = submitSelectedCustomerShoppingBagItemsToCheckout(viewModel.value)
    message.value = result.message

    return result
  }

  return {
    viewModel,
    message,
    invalidatedSnapshotKeys,
    loadSnapshot,
    handlePageShow,
    updateQuantity,
    selectItem,
    removeItem,
    clearUnavailable,
    submitSelectedItems,
  }
}
