import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const draftReviewPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('owner draft review next-step contract', () => {
  it('offers a direct path to staff image tasks after batch confirmation succeeds', () => {
    const source = draftReviewPageSource()

    expect(source).toContain("import { navigateTo } from '../../../app/navigation'")
    expect(source).toContain("import { routes } from '../../../app/routes'")
    expect(source).toContain('navigateTo(routes.staffImageTasks')
    expect(source).toContain('goStaffImageTasks')
  })
})
