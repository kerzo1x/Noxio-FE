export type SearchResultType = 'note' | 'folder'

export interface WorkspaceSearchResult {
  type: SearchResultType
  id: string
  title: string
  folderId: string | null
}

export interface WorkspaceSearchResponse {
  success: boolean
  message: string
  data: WorkspaceSearchResult[]
}
