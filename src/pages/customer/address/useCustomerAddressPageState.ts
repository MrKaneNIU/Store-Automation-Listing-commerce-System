import { ref } from 'vue'

import {
  createCloudBaseCustomerAddress,
  deleteCloudBaseCustomerAddress,
  getCloudBaseCustomerAddressBookView,
  setDefaultCloudBaseCustomerAddress,
  updateCloudBaseCustomerAddress,
  type CustomerAddressPatchInput,
  type CustomerAddressSaveInput,
} from '../../../features/cloudbase-mall/customer-address'
import {
  createCustomerAddressBookFailureView,
  createCustomerAddressBookLoadingView,
  type CustomerAddressBookView,
} from '../../../features/customer-address/customer-address'

type LoadOptions = {
  showLoading: boolean
}

export type CustomerAddressFieldErrors = Record<keyof CustomerAddressSaveInput, string>

type CustomerAddressPageStateDependencies = {
  loadView?: () => Promise<CustomerAddressBookView>
  createAddress?: (
    input: CustomerAddressSaveInput,
    previousView: CustomerAddressBookView,
  ) => ReturnType<typeof createCloudBaseCustomerAddress>
  updateAddress?: (
    addressId: string,
    input: CustomerAddressPatchInput,
    previousView: CustomerAddressBookView,
  ) => ReturnType<typeof updateCloudBaseCustomerAddress>
  deleteAddress?: (
    addressId: string,
    previousView: CustomerAddressBookView,
  ) => ReturnType<typeof deleteCloudBaseCustomerAddress>
  setDefaultAddress?: (
    addressId: string,
    previousView: CustomerAddressBookView,
  ) => ReturnType<typeof setDefaultCloudBaseCustomerAddress>
}

const emptyForm = (): CustomerAddressSaveInput => ({
  contactName: '',
  phoneNumber: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
})

const emptyErrors = (): CustomerAddressFieldErrors => ({
  contactName: '',
  phoneNumber: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: '',
})

export const createCustomerAddressPageState = (
  dependencies: CustomerAddressPageStateDependencies = {},
) => {
  const deps = {
    loadView: getCloudBaseCustomerAddressBookView,
    createAddress: createCloudBaseCustomerAddress,
    updateAddress: updateCloudBaseCustomerAddress,
    deleteAddress: deleteCloudBaseCustomerAddress,
    setDefaultAddress: setDefaultCloudBaseCustomerAddress,
    ...dependencies,
  }
  const viewModel = ref<CustomerAddressBookView>(createCustomerAddressBookLoadingView())
  const form = ref<CustomerAddressSaveInput>(emptyForm())
  const fieldErrors = ref<CustomerAddressFieldErrors>(emptyErrors())
  const selectedAddressId = ref('')
  const editingAddressId = ref('')
  const message = ref('')
  const isSaving = ref(false)
  const processingAddressId = ref('')
  let hasLoadedSnapshot = false
  let pendingSnapshot: Promise<void> | null = null

  const loadSnapshot = (options: LoadOptions): Promise<void> => {
    if (pendingSnapshot) return pendingSnapshot

    const previousView = viewModel.value
    if (options.showLoading || hasLoadedSnapshot) {
      viewModel.value = createCustomerAddressBookLoadingView(hasLoadedSnapshot ? previousView : undefined)
    }

    pendingSnapshot = deps.loadView()
      .then((view) => {
        viewModel.value = view
        selectedAddressId.value = selectedAddressId.value || view.defaultAddressId || view.items[0]?.id || ''
        hasLoadedSnapshot = true
        message.value = ''
      })
      .catch((error) => {
        viewModel.value = createCustomerAddressBookFailureView(error, hasLoadedSnapshot ? previousView : undefined)
        message.value = viewModel.value.failureMessage
      })
      .finally(() => {
        pendingSnapshot = null
      })

    return pendingSnapshot
  }

  const updateField = <TField extends keyof CustomerAddressSaveInput>(
    field: TField,
    value: CustomerAddressSaveInput[TField],
  ) => {
    form.value = {
      ...form.value,
      [field]: value,
    }
    if (fieldErrors.value[field]) {
      fieldErrors.value = {
        ...fieldErrors.value,
        [field]: '',
      }
    }
  }

  const validate = () => {
    const errors = emptyErrors()
    if (!form.value.contactName.trim()) errors.contactName = '请输入收货人'
    if (!/^1\d{10}$/.test(form.value.phoneNumber.trim())) errors.phoneNumber = '请输入 11 位手机号'
    if (!form.value.province.trim()) errors.province = '请输入省份'
    if (!form.value.city.trim()) errors.city = '请输入城市'
    if (!form.value.district.trim()) errors.district = '请输入区县'
    if (!form.value.detail.trim()) errors.detail = '请输入详细地址'
    fieldErrors.value = errors

    return Object.values(errors).every((value) => !value)
  }

  const resetForm = () => {
    form.value = emptyForm()
    fieldErrors.value = emptyErrors()
    editingAddressId.value = ''
  }

  const editAddress = (addressId: string) => {
    const address = viewModel.value.items.find((item) => item.id === addressId)
    if (!address) return
    editingAddressId.value = address.id
    form.value = {
      contactName: address.contactName,
      phoneNumber: address.phoneNumber,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
      isDefault: address.isDefault,
    }
    fieldErrors.value = emptyErrors()
  }

  const saveAddress = async () => {
    if (isSaving.value) return
    if (!validate()) {
      message.value = '请先修正地址信息'
      return
    }

    isSaving.value = true
    const input = {
      ...form.value,
      contactName: form.value.contactName.trim(),
      phoneNumber: form.value.phoneNumber.trim(),
      province: form.value.province.trim(),
      city: form.value.city.trim(),
      district: form.value.district.trim(),
      detail: form.value.detail.trim(),
    }

    try {
      const result = editingAddressId.value
        ? await deps.updateAddress(editingAddressId.value, input, viewModel.value)
        : await deps.createAddress(input, viewModel.value)
      viewModel.value = result.view
      message.value = result.message
      selectedAddressId.value = result.view.defaultAddressId || selectedAddressId.value || result.view.items[0]?.id || ''
      resetForm()
      hasLoadedSnapshot = true
    } finally {
      isSaving.value = false
    }
  }

  const deleteAddress = async (addressId: string) => {
    if (processingAddressId.value) return
    processingAddressId.value = addressId
    try {
      const result = await deps.deleteAddress(addressId, viewModel.value)
      viewModel.value = result.view
      message.value = result.message
      selectedAddressId.value = result.view.defaultAddressId || result.view.items[0]?.id || ''
      if (editingAddressId.value === addressId) resetForm()
    } finally {
      processingAddressId.value = ''
    }
  }

  const setDefaultAddress = async (addressId: string) => {
    if (processingAddressId.value) return
    processingAddressId.value = addressId
    try {
      const result = await deps.setDefaultAddress(addressId, viewModel.value)
      viewModel.value = result.view
      selectedAddressId.value = addressId
      message.value = result.message
    } finally {
      processingAddressId.value = ''
    }
  }

  const selectAddress = (addressId: string) => {
    selectedAddressId.value = addressId
  }

  const handlePageShow = () => loadSnapshot({ showLoading: !hasLoadedSnapshot })
  const reload = () => loadSnapshot({ showLoading: true })

  return {
    viewModel,
    form,
    fieldErrors,
    selectedAddressId,
    editingAddressId,
    message,
    isSaving,
    processingAddressId,
    loadSnapshot,
    handlePageShow,
    reload,
    updateField,
    resetForm,
    startEdit: editAddress,
    editAddress,
    save: saveAddress,
    saveAddress,
    deleteAddress,
    setDefault: setDefaultAddress,
    setDefaultAddress,
    selectAddress,
  }
}
