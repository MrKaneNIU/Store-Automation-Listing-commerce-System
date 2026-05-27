import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const imageTasksPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('staff image tasks page data-loading contract', () => {
  it('filters keyword and batch changes locally after the snapshot is loaded', () => {
    const source = imageTasksPageSource()

    expect(source).toContain('filterCloudBaseStaffImageTasksView')
    expect(source).toContain('const sourceViewModel = ref<StaffImageTasksViewModel>')
    expect(source).toContain('viewModel.value = filterCloudBaseStaffImageTasksView(sourceViewModel.value, {')
    expect(source).not.toContain('watch([keyword, selectedBatchId], () => {\n  void refreshView')
  })
})
