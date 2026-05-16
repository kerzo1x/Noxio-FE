<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFoldersStore } from '@/stores/folders'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AddFolderPopup from '@/components/dashboard/AddFolderPopup.vue'
import bigFolder from '@/assets/img/big-folder.svg'

const router = useRouter()
const foldersStore = useFoldersStore()
const showAddFolderPopup = ref(false)

const handleAddFolder = () => {
  showAddFolderPopup.value = true
}

function openFolderNotes(folderId: string) {
  router.push({
    name: 'DashboardFolderNotes',
    params: { folderId },
  })
}
</script>

<template>
  <section class="isolate flex h-full min-h-0 w-full max-w-[858px] flex-col">
    <header
      class="sticky mb-5 top-0 z-10 shrink-0 -mx-1 bg-black px-1 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45)]"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-[20px] font-medium tracking-[-0.011em] text-white">
          Folders
        </h1>
        <div class="h-[29px] w-[203px]">
          <BaseButton
            text="Add folder"
            class="!h-[29px] !rounded-[10px] !px-[10px] !py-0 !font-medium !text-[12px] !leading-[150%]"
            @click="handleAddFolder"
          />
        </div>
      </div>
    </header>

    <div
      class="relative pt-[74px] min-h-0 flex-1 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="grid grid-cols-4 gap-[34px]">
        <div
          v-for="folder in foldersStore.folders"
          :key="folder.id"
          role="button"
          tabindex="0"
          class="relative aspect-[186/146] h-[146px] w-[186px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
          @click="openFolderNotes(folder.id)"
          @keydown.enter="openFolderNotes(folder.id)"
        >
          <img
            :src="bigFolder"
            :alt="folder.name"
            class="absolute inset-0 h-full w-full"
          />
          <div class="absolute inset-0 flex items-start justify-between">
            <div class="ml-[12px] mt-[31px]">
              <h3 class="text-sm font-medium text-white">{{ folder.name }}</h3>
              <p class="mt-[0.94px] text-[11px] text-white/40">
                {{ folder.noteCount }} files
              </p>
            </div>
            <button
              type="button"
              class="mt-[13px] mr-[12px] flex h-[19.55px] w-[19.55px] cursor-pointer items-center justify-center rounded-full bg-black/30 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
              @click.stop
            >
              <img
                src="../../assets/img/dots.svg"
                alt=""
                class="h-[2px] w-[9px]"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      class="pointer-events-none sticky bottom-0 z-[1px] h-[2px] w-full bg-black shadow-[0_-3px_10px_-1px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    />

    <AddFolderPopup v-model="showAddFolderPopup" />
  </section>
</template>
