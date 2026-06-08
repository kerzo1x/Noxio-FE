export type SearchResultType = 'note' | 'folder' | 'todo_list'

export type SearchMatchedOn = 'name' | 'title' | 'content'

export interface WorkspaceSearchResult {
  type: SearchResultType
  id: string
  title: string
  workspaceId: string
  folderId: string | null
  snippet: string | null
  matchedOn: SearchMatchedOn
}

export interface WorkspaceSearchResponse {
  success: boolean
  message: string
  data: WorkspaceSearchResult[]
}
