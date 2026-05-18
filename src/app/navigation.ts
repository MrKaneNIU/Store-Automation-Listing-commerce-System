import type { AppRoute } from './routes'

type NavigationUrl = AppRoute | string

type NavigationFailure = {
  errMsg?: string
}

type NavigateOptions = {
  onFail?: (error: NavigationFailure) => void
}

type MiniProgramPage = {
  route?: string
}

const NAVIGATE_STACK_SAFE_DEPTH = 8

const normalizeRoute = (url: string) => {
  const route = url.split('?')[0] ?? ''
  return route.startsWith('/') ? route : `/${route}`
}

const getPageStack = (): MiniProgramPage[] => {
  try {
    return typeof getCurrentPages === 'function' ? getCurrentPages() : []
  } catch {
    return []
  }
}

const shouldReplaceCurrentPage = (url: NavigationUrl) => {
  const pages = getPageStack()
  const currentRoute = pages.length > 0 ? normalizeRoute(pages[pages.length - 1]?.route ?? '') : ''
  const targetRoute = normalizeRoute(url)

  return currentRoute === targetRoute || pages.length >= NAVIGATE_STACK_SAFE_DEPTH
}

export const navigateTo = (url: NavigationUrl, options: NavigateOptions = {}) => {
  if (shouldReplaceCurrentPage(url)) {
    uni.redirectTo({ url })

    return
  }

  uni.navigateTo({
    url,
    fail: (error) => {
      const errMsg = String(error?.errMsg ?? '')

      if (errMsg.includes('webview count limit exceed')) {
        uni.redirectTo({ url })

        return
      }

      options.onFail?.(error)
    },
  })
}

export const redirectTo = (url: NavigationUrl) => {
  uni.redirectTo({ url })
}

export const relaunchTo = (url: NavigationUrl) => {
  uni.reLaunch({ url })
}
