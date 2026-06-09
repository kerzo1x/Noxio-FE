import { defineStore } from 'pinia'
import {
  fetchMe,
  updateProfile,
  enable2fa,
  disable2fa,
  setUserAvatar,
  removeUserAvatar,
  type AuthUser,
} from '@/api/user'
import { logout as logoutApi } from '@/api/auth'
import { useNotesStore } from '@/stores/notes'

export type User = AuthUser

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    loading: false,
    loaded: false,
  }),

  actions: {
    async fetchUser(opts?: { force?: boolean }) {
      if (!opts?.force && this.loaded && this.user) {
        return
      }

      this.loading = true
      try {
        const { data } = await fetchMe()
        if (data.success) {
          this.user = data.data
          this.loaded = true
        }
      } catch (err) {
        console.error('Error loading user:', err)
        this.user = null
        this.loaded = false
      } finally {
        this.loading = false
      }
    },

    async updateProfile(body: { name?: string; surname?: string }) {
      const { data } = await updateProfile(body)
      if (data.success) {
        this.user = data.data
      }
      return data
    },

    async setAvatar(mediaId: string) {
      const { data } = await setUserAvatar(mediaId)
      if (data.success && this.user) {
        await this.fetchUser({ force: true })
      }
      return data
    },

    async removeAvatar() {
      const { data } = await removeUserAvatar()
      if (data.success && this.user) {
        await this.fetchUser({ force: true })
      }
      return data
    },

    async enable2fa() {
      return enable2fa()
    },

    async disable2fa() {
      const { data } = await disable2fa()
      if (data.success) {
        await this.fetchUser({ force: true })
      }
      return data
    },

    async logout() {
      try {
        await logoutApi()
      } catch (error) {
        console.error('Logout request failed:', error)
      } finally {
        localStorage.clear()
        this.user = null
        this.loaded = false
        useNotesStore().reset()
      }
    },
  },
})
