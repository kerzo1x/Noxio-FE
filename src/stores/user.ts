import { defineStore } from 'pinia'
import { fetchMe, type AuthUser } from '@/api/user'
import { logout as logoutApi } from '@/api/auth'

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
        this.user = data.data
        this.loaded = true
      } catch (err) {
        console.error('Error loading user:', err)
        this.user = null
        this.loaded = false
      } finally {
        this.loading = false
      }
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
      }
    },
  },
})
