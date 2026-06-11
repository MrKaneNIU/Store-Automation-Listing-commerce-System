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
  checkoutCloudBaseCustomerShoppingBag,
  clearUnavailableCloudBaseCustomerShoppingBagItems,
  getCloudBaseCustomerShoppingBagView,
  removeCloudBaseCustomerShoppingBagItem,
  selectCloudBaseCustomerShoppingBagItem,
  updateCloudBaseCustomerShoppingBagItemQuantity,
  type CloudBaseCustomerShoppingBagCheckoutResult,
  type CloudBaseCustomerShoppingBagCommandResult,
} from '../../../features/cloudbase-mall/customer-shopping-bag'
import { getCloudBaseCustomerAddressBookView } from '../../../features/cloudbase-mall/customer-address'
import {
  createCustomerAddressBookFailureView,
  createCustomerAddressBookLoadingView,
  type CustomerAddressBookView,
} from '../../../features/customer-address/customer-address'
import {
  logCustomerRuntimeRequest,
  type CustomerRuntimeRequestLogger,
  type CustomerRuntimeRequestSource,
} from '../../../services/performance/customer-runtime-request-log'

type LoadSnapshotOptions = {
  showLoading: boolean
  source?: CustomerRuntimeRequestSource
}

type LoadAddressBookOptions = {
  showLoading: boolean
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
  loadAddressView?: () => Promise<CustomerAddressBookView>
  checkoutSelectedItems?: (
    addressId: string,
    previousView: CustomerShoppingBagViewModel,
  ) => Promise<CloudBaseCustomerShoppingBagCheckoutResult>
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
  loadAddressView: getCloudBaseCustomerAddressBookView,
  checkoutSelectedItems: (addressId: string, previousView: CustomerShoppingBagViewModel) =>
    checkoutCloudBaseCustomerShoppingBag(addressId, undefined, previousView),
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
  const addressBookView = ref<CustomerAddressBookView>(createCustomerAddressBookLoadingView())
  const selectedAddressId = ref('')
  const message = ref('')
  const invalidatedSnapshotKeys = ref<string[]>([])
  let hasLoadedSnapshot = false
  let hasLoadedAddressBook = false
  let pendingSnapshot: Promise<void> | null = null
  let pendingAddressBook: Promise<void> | null = null
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

  const loadAddressBook = (options: LoadAddressBookOptions): Promise<void> => {
    if (pendingAddressBook) return pendingAddressBook

    const previousView = addressBookView.value
    if (options.showLoading || hasLoadedAddressBook) {
      addressBookView.value = createCustomerAddressBookLoadingView(hasLoadedAddressBook ? previousView : undefined)
    }

    pendingAddressBook = deps.loadAddressView()
      .then((view) => {
        addressBookView.value = view
        selectedAddressId.value = selectedAddressId.value || view.defaultAddressId || view.items[0]?.id || ''
        hasLoadedAddressBook = true
      })
      .catch((error) => {
        addressBookView.value = createCustomerAddressBookFailureView(
          error,
          hasLoadedAddressBook ? previousView : undefined,
        )
      })
      .finally(() => {
        pendingAddressBook = null
      })

    return pendingAddressBook
  }

  const applyCommand = async <TCommandResult extends CloudBaseCustomerShoppingBagCommandResult>(
    command: (previousView: CustomerShoppingBagViewModel) => Promise<TCommandResult>,
  ): Promise<TCommandResult> => {
    const previousView = viewModel.value
    mutationVersion += 1
    const result = await command(previousView)

    viewModel.value = result.view
    message.value = result.message
    invalidatedSnapshotKeys.value = result.invalidatedSnapshotKeys
    hasLoadedSnapshot = true
    lastLoadedAt = deps.now()

    return result
  }

  const updateQuantity = (itemId: string, quantity: number) =>
    applyCommand((previousView) => deps.updateQuantity(itemId, quantity, previousView))

  const selectItem = (itemId: string, isSelected: boolean) =>
    applyCommand((previousView) => deps.selectItem(itemId, isSelected, previousView))

  const removeItem = (itemId: string) =>
    applyCommand((previousView) => deps.removeItem(itemId, previousView))

  const clearUnavailable = () =>
    applyCommand((previousView) => deps.clearUnavailable(previousView))

  const selectAddress = (addressId: string) => {
    selectedAddressId.value = addressId
  }

  const submitSelectedItems = async (): Promise<CustomerShoppingBagCheckoutResult | CloudBaseCustomerShoppingBagCheckoutResult> => {
    if (!selectedAddressId.value) {
      message.value = '请选择收货地址'

      return {
        status: 'blocked',
        checkoutItems: [],
        message: message.value,
      }
    }
    const localResult = submitSelectedCustomerShoppingBagItemsToCheckout(viewModel.value)
    if (localResult.status === 'blocked') {
      message.value = localResult.message

      return localResult
    }

    return applyCommand((previousView) => deps.checkoutSelectedItems(selectedAddressId.value, previousView))
  }

  return {
    viewModel,
    addressBookView,
    selectedAddressId,
    message,
    invalidatedSnapshotKeys,
    loadSnapshot,
    loadAddressBook,
    handlePageShow,
    updateQuantity,
    selectItem,
    removeItem,
    clearUnavailable,
    selectAddress,
    submitSelectedItems,
  }
}
