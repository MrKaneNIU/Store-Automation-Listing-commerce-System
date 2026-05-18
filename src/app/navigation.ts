import type { AppRoute } from './routes'

type NavigationUrl = AppRoute | string

type NavigationFailure = {
  errMsg?: string
}

type NavigateOptions = {
  onFail?: (error: NavigationFailure) => void
  onComplete?: () => void
}

type MiniProgramPage = {
  route?: string
}

const NAVIGATE_STACK_SAFE_DEPTH = 8
const NAVIGATION_PENDING_TIMEOUT_MS = 1200
let pendingNavigationRoute = ''
let pendingNavigationTimer: ReturnType<typeof setTimeout> | null = null

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

const beginNavigation = (url: NavigationUrl) => {
  const targetRoute = normalizeRoute(url)

  if (pendingNavigationRoute) {
    return false
  }

  pendingNavigationRoute = targetRoute
  pendingNavigationTimer = setTimeout(() => {
    if (pendingNavigationRoute === targetRoute) {
      pendingNavigationRoute = ''
    }

    pendingNavigationTimer = null
  }, NAVIGATION_PENDING_TIMEOUT_MS)
  ;(pendingNavigationTimer as { unref?: () => void }).unref?.()

  return true
}

const clearPendingNavigationTimer = () => {
  if (pendingNavigationTimer) {
    clearTimeout(pendingNavigationTimer)
    pendingNavigationTimer = null
  }
}

const completeNavigation = (url: NavigationUrl) => {
  const targetRoute = normalizeRoute(url)

  if (pendingNavigationRoute === targetRoute) {
    pendingNavigationRoute = ''
    clearPendingNavigationTimer()
  }
}

export const __resetNavigationStateForTests = () => {
  pendingNavigationRoute = ''
  clearPendingNavigationTimer()
}

export const navigateTo = (url: NavigationUrl, options: NavigateOptions = {}) => {
  if (!beginNavigation(url)) {
    options.onComplete?.()

    return
  }

  if (shouldReplaceCurrentPage(url)) {
    uni.redirectTo({
      url,
      complete: () => {
        completeNavigation(url)
        options.onComplete?.()
      },
    })

    return
  }

  uni.navigateTo({
    url,
    fail: (error) => {
      const errMsg = String(error?.errMsg ?? '')

      if (errMsg.includes('webview count limit exceed')) {
        uni.redirectTo({
          url,
          complete: () => {
            completeNavigation(url)
            options.onComplete?.()
          },
        })

        return
      }

      options.onFail?.(error)
    },
    complete: () => {
      completeNavigation(url)
      options.onComplete?.()
    },
  })
}

export const redirectTo = (url: NavigationUrl, options: NavigateOptions = {}) => {
  if (!beginNavigation(url)) {
    options.onComplete?.()

    return
  }

  uni.redirectTo({
    url,
    fail: (error) => {
      options.onFail?.(error)
    },
    complete: () => {
      completeNavigation(url)
      options.onComplete?.()
    },
  })
}

export const relaunchTo = (url: NavigationUrl, options: NavigateOptions = {}) => {
  if (!beginNavigation(url)) {
    options.onComplete?.()

    return
  }

  uni.reLaunch({
    url,
    fail: (error) => {
      options.onFail?.(error)
    },
    complete: () => {
      completeNavigation(url)
      options.onComplete?.()
    },
  })
}
