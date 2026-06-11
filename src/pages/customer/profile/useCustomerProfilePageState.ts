import { ref } from 'vue'

import {
  getCloudBaseCustomerProfileView,
  saveCloudBaseCustomerProfile,
  type CustomerProfileSaveInput,
} from '../../../features/cloudbase-mall/customer-profile'
import {
  createCustomerProfileFailureView,
  createCustomerProfileLoadingView,
  type CustomerProfileView,
} from '../../../features/customer-profile/customer-profile'

type LoadOptions = {
  showLoading: boolean
}

type CustomerProfilePageStateDependencies = {
  loadView?: () => Promise<CustomerProfileView>
  saveProfile?: (input: CustomerProfileSaveInput) => Promise<CustomerProfileView>
}

type CustomerProfileFieldErrors = {
  nickname: string
  avatarUrl: string
}

const EMPTY_FIELD_ERRORS: CustomerProfileFieldErrors = {
  nickname: '',
  avatarUrl: '',
}

const toEditableFields = (view: CustomerProfileView) => ({
  nickname: view.nickname,
  avatarUrl: view.avatarUrl,
})

export const createCustomerProfilePageState = (
  dependencies: CustomerProfilePageStateDependencies = {},
) => {
  const deps = {
    loadView: getCloudBaseCustomerProfileView,
    saveProfile: saveCloudBaseCustomerProfile,
    ...dependencies,
  }
  const viewModel = ref<CustomerProfileView>(createCustomerProfileLoadingView())
  const nickname = ref('')
  const avatarUrl = ref('')
  const fieldErrors = ref<CustomerProfileFieldErrors>({ ...EMPTY_FIELD_ERRORS })
  const message = ref('')
  const isSaving = ref(false)
  let pendingSnapshot: Promise<void> | null = null
  let hasLoadedSnapshot = false

  const syncEditableFields = (view: CustomerProfileView) => {
    const fields = toEditableFields(view)
    nickname.value = fields.nickname
    avatarUrl.value = fields.avatarUrl
  }

  const loadSnapshot = (options: LoadOptions): Promise<void> => {
    if (pendingSnapshot) return pendingSnapshot

    const previousView = viewModel.value
    if (options.showLoading || hasLoadedSnapshot) {
      viewModel.value = createCustomerProfileLoadingView(hasLoadedSnapshot ? previousView : undefined)
    }

    pendingSnapshot = deps.loadView()
      .then((view) => {
        viewModel.value = view
        syncEditableFields(view)
        hasLoadedSnapshot = true
        fieldErrors.value = { ...EMPTY_FIELD_ERRORS }
        message.value = ''
      })
      .catch((error) => {
        viewModel.value = createCustomerProfileFailureView(error, hasLoadedSnapshot ? previousView : undefined)
        message.value = viewModel.value.failureMessage
      })
      .finally(() => {
        pendingSnapshot = null
      })

    return pendingSnapshot
  }

  const validate = () => {
    const nextErrors = { ...EMPTY_FIELD_ERRORS }
    const normalizedNickname = nickname.value.trim()
    const normalizedAvatarUrl = avatarUrl.value.trim()

    if (!normalizedNickname) {
      nextErrors.nickname = '请输入昵称'
    }
    if (normalizedAvatarUrl && !/^(cloud|https?):\/\//i.test(normalizedAvatarUrl)) {
      nextErrors.avatarUrl = '头像地址需使用 cloud://、https:// 或 http://'
    }

    fieldErrors.value = nextErrors

    return !nextErrors.nickname && !nextErrors.avatarUrl
  }

  const save = async () => {
    if (isSaving.value) return
    if (!validate()) {
      message.value = '请先修正表单内容'

      return
    }

    isSaving.value = true
    message.value = ''

    try {
      const input: CustomerProfileSaveInput = {
        nickname: nickname.value.trim(),
        ...(avatarUrl.value.trim() ? { avatarUrl: avatarUrl.value.trim() } : {}),
      }
      const view = await deps.saveProfile(input)
      viewModel.value = view
      syncEditableFields(view)
      fieldErrors.value = { ...EMPTY_FIELD_ERRORS }
      message.value = '个人信息已保存'
      hasLoadedSnapshot = true
    } catch (error) {
      viewModel.value = createCustomerProfileFailureView(error, viewModel.value)
      message.value = viewModel.value.failureMessage
    } finally {
      isSaving.value = false
    }
  }

  const updateNickname = (value: string) => {
    nickname.value = value
    if (fieldErrors.value.nickname) {
      fieldErrors.value = {
        ...fieldErrors.value,
        nickname: '',
      }
    }
  }

  const updateAvatarUrl = (value: string) => {
    avatarUrl.value = value
    if (fieldErrors.value.avatarUrl) {
      fieldErrors.value = {
        ...fieldErrors.value,
        avatarUrl: '',
      }
    }
  }

  const handlePageShow = () => loadSnapshot({ showLoading: !hasLoadedSnapshot })
  const reload = () => loadSnapshot({ showLoading: true })

  return {
    viewModel,
    nickname,
    avatarUrl,
    fieldErrors,
    message,
    isSaving,
    loadSnapshot,
    handlePageShow,
    reload,
    save,
    updateNickname,
    updateAvatarUrl,
  }
}
