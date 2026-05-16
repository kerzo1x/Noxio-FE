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
    ref="inputRef"
    type="text"
    :value="modelValue"
    placeholder="Untitled"
    class="w-full shrink-0 border-none bg-transparent text-4xl font-semibold leading-tight tracking-tight text-white outline-none placeholder:text-white/30"
    @input="onInput"
  />
</template>
