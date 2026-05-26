<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.modelValue,
  async (value) => {
    await nextTick()
    if (inputRef.value && inputRef.value.value !== value) {
      inputRef.value.value = value
    }
  },
)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    id="note-title"
    name="note-title"
    ref="inputRef"
    type="text"
    :value="modelValue"
    placeholder="Untitled"
    autocomplete="off"
    aria-label="Note title"
    class="w-full shrink-0 border-none bg-transparent text-4xl font-semibold leading-tight tracking-tight text-white outline-none placeholder:text-white/30"
    @input="onInput"
  />
</template>
