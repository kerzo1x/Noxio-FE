import type { Router } from 'vue-router'
import type { WorkspaceSearchResult } from '@/types/search'

export function navigateToSearchResult(
  router: Router,
  item: WorkspaceSearchResult,
) {
  if (item.type === 'folder') {
    router.push({ name: 'DashboardFolderNotes', params: { folderId: item.id } })
    return
  }

  if (item.type === 'todo_list') {
    router.push({
      name: 'DashboardTodoList',
      params: { todoListId: item.id },
    })
    return
  }

  if (item.folderId) {
    router.push({
      name: 'DashboardFolderNotes',
      params: { folderId: item.folderId, noteId: item.id },
    })
  }
}
