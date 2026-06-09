import {
  ref,
  watch,
  onUnmounted,
  type Ref,
} from 'vue'

export type HeaderMenuKey = 'profile' | 'notifications' | 'share' | 'search'

export function useHeaderMenus() {
  const isProfileMenuOpen = ref(false)
  const isNotificationsMenuOpen = ref(false)
  const isShareMenuOpen = ref(false)
  const isSearchFocused = ref(false)

  const profileMenuRef = ref<HTMLElement | null>(null)
  const notificationsMenuRef = ref<HTMLElement | null>(null)
  const shareMenuRef = ref<HTMLElement | null>(null)
  const searchRef = ref<HTMLElement | null>(null)

  function closeProfileMenu() {
    isProfileMenuOpen.value = false
  }

  function closeNotificationsMenu() {
    isNotificationsMenuOpen.value = false
  }

  function closeShareMenu() {
    isShareMenuOpen.value = false
  }

  function closeSearch() {
    isSearchFocused.value = false
  }

  function closeAllExcept(except?: HeaderMenuKey) {
    if (except !== 'profile') closeProfileMenu()
    if (except !== 'notifications') closeNotificationsMenu()
    if (except !== 'share') closeShareMenu()
    if (except !== 'search') closeSearch()
  }

  function toggleProfileMenu() {
    if (isProfileMenuOpen.value) {
      closeProfileMenu()
      return
    }
    closeAllExcept('profile')
    isProfileMenuOpen.value = true
  }

  function toggleNotificationsMenu() {
    if (isNotificationsMenuOpen.value) {
      closeNotificationsMenu()
      return
    }
    closeAllExcept('notifications')
    isNotificationsMenuOpen.value = true
  }

  function openShareMenu() {
    closeAllExcept('share')
    isShareMenuOpen.value = true
  }

  function toggleShareMenu() {
    if (isShareMenuOpen.value) {
      closeShareMenu()
      return
    }
    openShareMenu()
  }

  function focusSearch() {
    closeAllExcept('search')
    isSearchFocused.value = true
  }

  function bindOutsideClick(
    isOpen: Ref<boolean>,
    rootRef: Ref<HTMLElement | null>,
    close: () => void,
  ) {
    function onPointerDown(event: PointerEvent) {
      if (!isOpen.value) return
      if (rootRef.value?.contains(event.target as Node)) return
      close()
    }

    watch(isOpen, (open) => {
      if (open) {
        requestAnimationFrame(() => {
          document.addEventListener('pointerdown', onPointerDown)
        })
        return
      }
      document.removeEventListener('pointerdown', onPointerDown)
    })

    onUnmounted(() => {
      document.removeEventListener('pointerdown', onPointerDown)
    })
  }

  bindOutsideClick(isProfileMenuOpen, profileMenuRef, closeProfileMenu)
  bindOutsideClick(
    isNotificationsMenuOpen,
    notificationsMenuRef,
    closeNotificationsMenu,
  )
  bindOutsideClick(isShareMenuOpen, shareMenuRef, closeShareMenu)
  bindOutsideClick(isSearchFocused, searchRef, closeSearch)

  return {
    isProfileMenuOpen,
    isNotificationsMenuOpen,
    isShareMenuOpen,
    isSearchFocused,
    profileMenuRef,
    notificationsMenuRef,
    shareMenuRef,
    searchRef,
    closeProfileMenu,
    closeNotificationsMenu,
    closeShareMenu,
    closeSearch,
    toggleProfileMenu,
    toggleNotificationsMenu,
    openShareMenu,
    toggleShareMenu,
    focusSearch,
  }
}
