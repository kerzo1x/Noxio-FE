<script setup lang="ts">
import { useFoldersStore } from '@/stores/folders'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import bigFolder from '@/assets/img/big-folder.svg'

const foldersStore = useFoldersStore()

const handleAddFolder = () => {
}
</script>

<template>
  <section class="max-w-[858px]">
    <div class="flex items-center justify-between">
      <h1 class="text-[20px] font-medium tracking-[-0.011em] text-white">Folders</h1>
      <div class="w-[203px] h-[29px]">
        <BaseButton
          text="Add folder"
          class="!h-[29px] !rounded-[10px] !px-[10px] !py-0 !font-medium !text-[12px] !leading-[150%]"
          @click="handleAddFolder"
        />
      </div>
    </div>

    <div class="grid grid-cols-4 gap-[34px] mt-12">
      <div
        v-for="folder in foldersStore.folders"
        :key="folder.id"
        class="relative aspect-[186/146] cursor-pointer transition-transform duration-200 hover:scale-[1.02] w-[186px] h-[146px]"
      >
        <img
          :src="bigFolder"
          :alt="folder.name"
          class="absolute inset-0 w-full h-full flex-grow-1 flex-shrink-1"
        />
        <div class="absolute inset-0 flex items-start justify-between">
          <div class="mt-[31px] ml-[12px]">
            <h3 class=" text-white text-sm font-medium">{{ folder.name }}</h3>
            <p class="text-white/40 text-[11px] mt-[0.94px]">{{ folder.noteCount }} files</p>
          </div>
          <button
            type="button"
            class="cursor-pointer w-[19.55px] h-[19.55px] mt-[13px] mr-[12px] flex items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/70 hover:text-white transition-colors"
            @click.stop
          >
            <img src="../../assets/img/dots.svg" alt="dots" class="w-[9px] h-[2px]">
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
