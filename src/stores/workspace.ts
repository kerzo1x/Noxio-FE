import { defineStore } from 'pinia'
import {
  createInvitation as createInvitationApi,
  createWorkspace as createWorkspaceApi,
  listWorkspaces,
  type Workspace,
} from '@/api/workspaces'
import type { WorkspaceMemberRole } from '@/composables/useWorkspaceMembers'
import { useFoldersStore } from '@/stores/folders'
import { useNotificationsStore } from '@/stores/notifications'
import { useNotesStore } from '@/stores/notes'
import { useTodoListsStore } from '@/stores/todoLists'

export type { Workspace }

const ACTIVE_WORKSPACE_LS_KEY = 'notion_fe_active_workspace'

function readCachedWorkspaceMeta(): { id: string; name: string } | null {
  try {
    const json = localStorage.getItem(ACTIVE_WORKSPACE_LS_KEY)
    if (json) {
      const p = JSON.parse(json) as { id?: unknown; name?: unknown }
      if (typeof p?.id === 'string' && p.id) {
        return {
          id: p.id,
          name: typeof p.name === 'string' ? p.name : '',
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

function stubWorkspace(meta: { id: string; name: string }): Workspace {
  return {
    id: meta.id,
    name: meta.name || 'Workspace',
    ownerId: '',
    role: '',
    memberCount: 0,
    createdAt: '',
    updatedAt: '',
  }
}

function persistActiveWorkspace(workspace: Workspace) {
  try {
    localStorage.setItem(
      ACTIVE_WORKSPACE_LS_KEY,
      JSON.stringify({ id: workspace.id, name: workspace.name }),
    )
  } catch {
    /* ignore */
  }
}

function clearActiveWorkspaceStorage() {
  try {
    localStorage.removeItem(ACTIVE_WORKSPACE_LS_KEY)
  } catch {
    /* ignore */
  }
}

export type WorkspaceLoadScope = 'dashboard'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    workspaces: [] as Workspace[],
    activeWorkspace: null as Workspace | null,
    isLoading: false,
    showCreateWorkspacePopup: false,
    workspacesLoaded: false,
  }),

  actions: {
    openCreateWorkspacePopup() {
      this.showCreateWorkspacePopup = true
    },

    closeCreateWorkspacePopup() {
      this.showCreateWorkspacePopup = false
    },

    hydrateActiveWorkspaceFromLocalStorage() {
      const meta = readCachedWorkspaceMeta()
      if (!meta) return
      this.activeWorkspace = stubWorkspace(meta)
    },

    async fetchWorkspaces(opts?: { force?: boolean }) {
      if (!opts?.force && this.workspacesLoaded && this.workspaces.length > 0) {
        return
      }

      this.hydrateActiveWorkspaceFromLocalStorage()

      this.isLoading = true
      try {
        const response = await listWorkspaces()

        if (response.data.success) {
          this.workspaces = response.data.data
          this.workspacesLoaded = true

          if (this.workspaces.length === 0) {
            this.activeWorkspace = null
            clearActiveWorkspaceStorage()
            return
          }

          const cached = readCachedWorkspaceMeta()
          const savedId = cached?.id ?? this.activeWorkspace?.id ?? null

          const bySaved =
            savedId != null
              ? this.workspaces.find((w) => w.id === savedId)
              : undefined
          const byActive =
            this.activeWorkspace?.id != null
              ? this.workspaces.find((w) => w.id === this.activeWorkspace!.id)
              : undefined

          const next = bySaved ?? byActive ?? this.workspaces[0]
          this.selectWorkspace(next)
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
      } finally {
        this.isLoading = false
      }
    },

    selectWorkspace(workspace: Workspace) {
      this.activeWorkspace = workspace
      persistActiveWorkspace(workspace)
    },

    async loadWorkspaceContext(
      workspaceId: string | null,
      opts?: { force?: boolean; scope?: WorkspaceLoadScope },
    ) {
      const foldersStore = useFoldersStore()
      const todoListsStore = useTodoListsStore()
      const notificationsStore = useNotificationsStore()
      const notesStore = useNotesStore()

      if (!workspaceId) {
        foldersStore.reset()
        todoListsStore.reset()
        notificationsStore.reset()
        notesStore.reset()
        return
      }

      if (opts?.force) {
        foldersStore.reset()
        todoListsStore.reset()
        notificationsStore.reset()
        notesStore.reset()
      }

      const force = opts?.force ?? false
      const scope = opts?.scope ?? 'dashboard'

      if (scope === 'dashboard') {
        await Promise.all([
          foldersStore.fetchFolders(workspaceId, {}, { force }),
          todoListsStore.fetchTodoLists(workspaceId, {}, { force }),
          notificationsStore.fetchNotifications(workspaceId, { force }),
        ])
      }
    },

    async createWorkspace(name: string) {
      const trimmed = name.trim()
      if (!trimmed) return null

      const response = await createWorkspaceApi(trimmed)
      const payload = response.data
      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to create workspace')
      }

      const created = payload.data
      await this.fetchWorkspaces({ force: true })

      const byId =
        created?.id != null
          ? this.workspaces.find((w) => w.id === created.id)
          : undefined
      const byName = this.workspaces.find((w) => w.name === trimmed)
      const next = byId ?? byName ?? (created?.id ? created : null)
      if (next) this.selectWorkspace(next)

      return created ?? next
    },

    async createInvitation(
      workspaceId: string,
      email: string,
      role: WorkspaceMemberRole,
    ) {
      const response = await createInvitationApi(workspaceId, email.trim(), role)
      const payload = response.data
      if (!payload?.success && response.status !== 201) {
        throw new Error(payload?.message || 'Failed to send invitation')
      }
      return payload
    },
  },
})
