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

type LoadSnapshotOptions = {
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

  const loadSnapshot = (options: LoadSnapshotOptions): Promise<void> => {
    if (pendingSnapshot) {
      return pendingSnapshot
    }

    const previousView = viewModel.value
    if (options.showLoading || hasLoadedSnapshot) {
      viewModel.value = createCustomerShoppingBagLoadingView(hasLoadedSnapshot ? previousView : undefined)
    }

    pendingSnapshot = deps.loadView()
      .then((view) => {
        viewModel.value = view
        hasLoadedSnapshot = true
        message.value = ''
      })
      .catch((error) => {
        viewModel.value = createCustomerShoppingBagFailureView(error, hasLoadedSnapshot ? previousView : undefined)
        message.value = viewModel.value.failureMessage
      })
      .finally(() => {
        pendingSnapshot = null
      })

    return pendingSnapshot
  }

  const handlePageShow = () => loadSnapshot({ showLoading: !hasLoadedSnapshot })

  const applyCommand = async (
    command: (previousView: CustomerShoppingBagViewModel) => Promise<CloudBaseCustomerShoppingBagCommandResult>,
  ) => {
    const previousView = viewModel.value
    const result = await command(previousView)

    viewModel.value = result.view
    message.value = result.message
    invalidatedSnapshotKeys.value = result.invalidatedSnapshotKeys
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
