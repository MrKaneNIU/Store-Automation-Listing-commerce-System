import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetNavigationStateForTests, navigateTo, redirectTo } from './navigation'
import { routes } from './routes'

type UniNavigationOptions = {
  url: string
  success?: () => void
  fail?: (error: { errMsg?: string }) => void
  complete?: () => void
}

const installUniMock = () => {
  const uniMock = {
    navigateTo: vi.fn((options: UniNavigationOptions) => {
      options.complete?.()
    }),
    redirectTo: vi.fn((options: UniNavigationOptions) => {
      options.complete?.()
    }),
  }

  vi.stubGlobal('uni', uniMock)

  return uniMock
}

describe('navigation responsiveness guard', () => {
  let uniMock: ReturnType<typeof installUniMock>

  beforeEach(() => {
    vi.unstubAllGlobals()
    uniMock = installUniMock()
    vi.stubGlobal('getCurrentPages', () => [{ route: 'pages/index/index' }])
    __resetNavigationStateForTests()
  })

  it('ignores repeated navigation to the same target while the first request is pending', () => {
    uniMock.navigateTo.mockImplementation(() => undefined)

    navigateTo(routes.customerProductList)
    navigateTo(routes.customerProductList)

    expect(uniMock.navigateTo).toHaveBeenCalledTimes(1)
    expect(uniMock.redirectTo).not.toHaveBeenCalled()
  })

  it('ignores competing targets while one navigation request is pending', () => {
    uniMock.navigateTo.mockImplementation(() => undefined)

    navigateTo(routes.customerProductList)
    navigateTo(routes.ownerDashboard)

    expect(uniMock.navigateTo).toHaveBeenCalledTimes(1)
    expect(uniMock.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ url: routes.customerProductList }),
    )
  })

  it('allows redirect replacements to override stale pending navigation targets', () => {
    uniMock.navigateTo.mockImplementation(() => undefined)

    navigateTo(routes.ownerDashboard)
    redirectTo(routes.ownerProducts)

    expect(uniMock.redirectTo).toHaveBeenCalledTimes(1)
    expect(uniMock.redirectTo).toHaveBeenCalledWith(
      expect.objectContaining({ url: routes.ownerProducts }),
    )
  })

  it('does not duplicate a redirect while the same target is already pending', () => {
    uniMock.redirectTo.mockImplementation(() => undefined)

    redirectTo(routes.ownerProducts)
    redirectTo(routes.ownerProducts)

    expect(uniMock.redirectTo).toHaveBeenCalledTimes(1)
  })

  it('releases stale pending navigation when the platform never completes the route call', () => {
    vi.useFakeTimers()
    uniMock.navigateTo.mockImplementation(() => undefined)

    navigateTo(routes.customerProductList)
    navigateTo(routes.ownerDashboard)
    vi.advanceTimersByTime(1200)
    navigateTo(routes.ownerDashboard)

    expect(uniMock.navigateTo).toHaveBeenCalledTimes(2)
    expect(uniMock.navigateTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: routes.ownerDashboard }),
    )

    vi.useRealTimers()
  })

  it('allows the same target again after the prior navigation completes', () => {
    navigateTo(routes.customerProductList)
    navigateTo(routes.customerProductList)

    expect(uniMock.navigateTo).toHaveBeenCalledTimes(2)
  })

  it('notifies callers when navigation completes so page-local locks can reset', () => {
    const onComplete = vi.fn()

    navigateTo(routes.ownerImportUpload, { onComplete })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('notifies redirected callers when the same redirect target is already pending', () => {
    const onComplete = vi.fn()

    uniMock.redirectTo.mockImplementation(() => undefined)

    redirectTo(routes.customerHome)
    redirectTo(routes.customerHome, { onComplete })

    expect(uniMock.redirectTo).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('keeps stack-safe redirect behavior for deep page stacks', () => {
    vi.stubGlobal('getCurrentPages', () =>
      Array.from({ length: 8 }, (_, index) => ({
        route: `pages/mock/page-${index}`,
      })),
    )

    navigateTo(routes.customerProductDetail)

    expect(uniMock.redirectTo).toHaveBeenCalledWith(
      expect.objectContaining({ url: routes.customerProductDetail }),
    )
    expect(uniMock.navigateTo).not.toHaveBeenCalled()
  })
})
