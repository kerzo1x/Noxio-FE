export type NoteBlockSize = 'small' | 'medium' | 'large'

export interface NoteSpan {
  text: string
  bold?: boolean
}

export interface NoteParagraphBlock {
  type: 'paragraph'
  size: NoteBlockSize
  spans: NoteSpan[]
}

export interface NoteListItemNode {
  id: string
  size: NoteBlockSize
  spans: NoteSpan[]
  children: NoteListItemNode[]
}

export interface NoteBulletedListBlock {
  type: 'bulleted-list'
  items: NoteListItemNode[]
}

export type NoteBlock = NoteParagraphBlock | NoteBulletedListBlock | Record<string, unknown>

export interface NoteEditor {
  userId: string
  avatarUrl: string | null
}

export interface NoteListItem {
  id: string
  title: string
  folderId: string
  lastEditedById: string
  createdAt: string
  updatedAt: string
  isPinned: boolean
  pinnedAt: string | null
  lastInteractedAt: string | null
  recentEditors: NoteEditor[]
  totalEditorCount: number
}

export interface NoteDetail extends NoteListItem {
  content: NoteBlock[]
  contentVersion: number
  coverMediaId: string | null
}

export interface NotePatchBody {
  title?: string
  content?: NoteBlock[]
}
