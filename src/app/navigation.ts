import type { AppRoute } from './routes'

export const navigateTo = (url: AppRoute) => {
  uni.navigateTo({ url })
}
