<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import dotsIcon from '@/assets/img/dots.svg'
import editIcon from '@/assets/img/edit.svg'
import deleteIcon from '@/assets/img/delete.svg'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const rootRef = ref<HTMLElement | null>(null)

const toggleMenu = (e: MouseEvent) => {
  e.stopPropagation()
  open.value = !open.value
}

const closeMenu = () => {
  open.value = false
}

const onEdit = (e: MouseEvent) => {
  e.stopPropagation()
  closeMenu()
  emit('edit')
}

const onDelete = (e: MouseEvent) => {
  e.stopPropagation()
  closeMenu()
  emit('delete')
}

const onDocumentClick = (e: MouseEvent) => {
  if (!open.value || !rootRef.value) return
  if (rootRef.value.contains(e.target as Node)) return
  closeMenu()
}

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open.value) closeMenu()
}

watch(open, (isOpen) => {
  if (isOpen) {
    requestAnimationFrame(() => {
      document.addEventListener('click', onDocumentClick)
    })
    return
  }
  document.removeEventListener('click', onDocumentClick)
})

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div ref="rootRef" class="folder-card-menu">
    <button
      type="button"
      class="folder-card-menu__trigger"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggleMenu"
    >
      <img :src="dotsIcon" alt="" class="h-[2px] w-[9px]" />
    </button>

    <div
      v-show="open"
      class="folder-card-menu__dropdown"
      role="menu"
      @click.stop
    >
      <button
        type="button"
        class="folder-card-menu__item folder-card-menu__item--edit"
        role="menuitem"
        @click="onEdit"
      >
        <span class="folder-card-menu__label">Edit</span>
        <img :src="editIcon" alt="" class="folder-card-menu__icon" />
      </button>
      <button
        type="button"
        class="folder-card-menu__item folder-card-menu__item--delete"
        role="menuitem"
        @click="onDelete"
      >
        <span class="folder-card-menu__label">Delete</span>
        <img :src="deleteIcon" alt="" class="folder-card-menu__icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.folder-card-menu {
  position: relative;
  z-index: 10;
  margin-top: 13px;
  margin-right: 12px;
  flex-shrink: 0;
}

.folder-card-menu__trigger {
  display: flex;
  height: 19.55px;
  width: 19.55px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9999px;
  background: rgb(0 0 0 / 0.3);
  color: rgb(255 255 255 / 0.7);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.folder-card-menu__trigger:hover {
  background: rgb(0 0 0 / 0.7);
  color: #fff;
}

.folder-card-menu__dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 20;
  display: flex;
  min-width: 93px;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background: #000;
  padding: 14px 16px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.45);
}

.folder-card-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 0;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 150%;
  letter-spacing: -0.011em;
  text-align: left;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.folder-card-menu__label {
  display: inline-flex;
  align-items: center;
}

.folder-card-menu__icon {
  height: 16px;
  width: 16px;
  flex-shrink: 0;
}

.folder-card-menu__item:hover {
  opacity: 0.85;
}

.folder-card-menu__item--edit {
  color: #fff;
}

.folder-card-menu__item--delete {
  color: #ad2222;
}
</style>
