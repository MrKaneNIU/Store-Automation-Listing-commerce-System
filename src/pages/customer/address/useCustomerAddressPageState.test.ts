import { describe, expect, it, vi } from 'vitest'
import type { CustomerAddressInput } from '../../../services/cloudbase/mall-api-client'
import {
  createCustomerAddressBookView,
  type CustomerAddressBookView,
} from '../../../features/customer-address/customer-address'
import {
  createCustomerAddressPageState,
  type CustomerAddressFieldErrors,
} from './useCustomerAddressPageState'

const address = {
  id: 'address-1',
  customerId: 'customer-1',
  contactName: 'Ada',
  phoneNumber: '13800000000',
  province: '上海',
  city: '上海市',
  district: '静安区',
  detail: '南京西路 1 号',
  isDefault: true,
  createdAt: '2026-06-11T00:00:00.000Z',
  updatedAt: '2026-06-11T00:00:00.000Z',
}

const createView = (overrides: Partial<typeof address> = {}): CustomerAddressBookView =>
  createCustomerAddressBookView({
    customerId: 'customer-1',
    addresses: [{ ...address, ...overrides }],
    defaultAddressId: overrides.id ?? address.id,
    serverTime: '2026-06-11T00:00:00.000Z',
  })

const createEmptyView = (): CustomerAddressBookView =>
  createCustomerAddressBookView({
    customerId: 'customer-1',
    addresses: [],
    defaultAddressId: null,
    serverTime: '2026-06-11T00:00:00.000Z',
  })

describe('customer address page state', () => {
  it('loads addresses and seeds the form from the selected edit item', async () => {
    const state = createCustomerAddressPageState({
      loadView: vi.fn(async () => createView()),
    })

    await state.handlePageShow()
    state.startEdit('address-1')

    expect(state.viewModel.value.items).toHaveLength(1)
    expect(state.editingAddressId.value).toBe('address-1')
    expect(state.form.value.contactName).toBe('Ada')
    expect(state.form.value.detail).toBe('南京西路 1 号')
  })

  it('validates required fields locally with field-level errors before saving', async () => {
    const saveAddress = vi.fn()
    const state = createCustomerAddressPageState({
      loadView: vi.fn(async () => createEmptyView()),
      createAddress: saveAddress,
    })

    await state.handlePageShow()
    await state.save()

    expect(saveAddress).not.toHaveBeenCalled()
    expect(state.message.value).toBe('请先修正地址信息')
    expect(state.fieldErrors.value).toMatchObject<Partial<CustomerAddressFieldErrors>>({
      contactName: '请输入收货人',
      phoneNumber: '请输入 11 位手机号',
      province: '请输入省份',
      city: '请输入城市',
      district: '请输入区县',
      detail: '请输入详细地址',
    })
  })

  it('creates updates deletes and sets default through injected page-facing commands', async () => {
    const createdView = createView({ id: 'address-created', contactName: 'Lin' })
    const updatedView = createView({ contactName: 'Ada Lovelace' })
    const deletedView = createEmptyView()
    const defaultView = createView({ id: 'address-2', contactName: 'Grace' })
    const createAddress = vi.fn(async (_input: CustomerAddressInput, previousView: CustomerAddressBookView) => ({
      status: 'succeeded' as const,
      message: '地址已保存',
      invalidatedSnapshotKeys: ['customer-addresses:customer-1:v1'],
      view: previousView.items.length ? previousView : createdView,
    }))
    const updateAddress = vi.fn(async () => ({
      status: 'succeeded' as const,
      message: '地址已更新',
      invalidatedSnapshotKeys: ['customer-addresses:customer-1:v1'],
      view: updatedView,
    }))
    const deleteAddress = vi.fn(async () => ({
      status: 'succeeded' as const,
      message: '地址已删除',
      invalidatedSnapshotKeys: ['customer-addresses:customer-1:v1'],
      view: deletedView,
    }))
    const setDefault = vi.fn(async () => ({
      status: 'succeeded' as const,
      message: '默认地址已更新',
      invalidatedSnapshotKeys: ['customer-addresses:customer-1:v1'],
      view: defaultView,
    }))
    const state = createCustomerAddressPageState({
      loadView: vi.fn(async () => createEmptyView()),
      createAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress: setDefault,
    })

    await state.handlePageShow()
    state.updateField('contactName', ' Lin ')
    state.updateField('phoneNumber', '13800000000')
    state.updateField('province', '上海')
    state.updateField('city', '上海市')
    state.updateField('district', '静安区')
    state.updateField('detail', '南京西路 2 号')
    await state.save()

    expect(createAddress).toHaveBeenCalledWith(expect.objectContaining({
      contactName: 'Lin',
      phoneNumber: '13800000000',
      isDefault: false,
    }), expect.any(Object))

    state.startEdit('address-created')
    state.updateField('contactName', 'Ada Lovelace')
    await state.save()
    await state.deleteAddress('address-1')
    await state.setDefault('address-2')

    expect(updateAddress).toHaveBeenCalledWith('address-created', expect.objectContaining({
      contactName: 'Ada Lovelace',
    }), expect.any(Object))
    expect(deleteAddress).toHaveBeenCalledWith('address-1', expect.any(Object))
    expect(setDefault).toHaveBeenCalledWith('address-2', expect.any(Object))
    expect(state.message.value).toBe('默认地址已更新')
  })
})
