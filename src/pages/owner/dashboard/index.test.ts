import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ownerDashboardPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('owner dashboard page state contract', () => {
  it('loads dashboard counts through one CloudBase snapshot facade instead of hard-coded page counts', () => {
    const source = ownerDashboardPageSource()

    expect(source).toContain('getCloudBaseOwnerDashboardView')
    expect(source).toContain('pendingRefresh')
    expect(source).toContain('refreshView')
    expect(source).not.toContain('const pendingDraftCount = 6')
    expect(source).not.toContain('const pendingImageTaskCount = 4')
  })

  it('keeps dashboard entry navigation separate from low-frequency snapshot loading state', () => {
    const source = ownerDashboardPageSource()

    expect(source).toContain('isLoadingDashboard')
    expect(source).toContain('loadError')
    expect(source).toContain('navigatingRoute.value = route')
    expect(source).not.toContain('mallRepository')
  })

  it('refreshes the server admin session before loading the dashboard after token restore', () => {
    const source = ownerDashboardPageSource()

    expect(source).toContain('ensureAdminWorkbenchSessionFromServer')
    expect(source).toContain("await ensureAdminWorkbenchSessionFromServer('workbenchAccess')")
    expect(source).not.toContain("ensureAdminWorkbenchSession('workbenchAccess')")
  })
})
