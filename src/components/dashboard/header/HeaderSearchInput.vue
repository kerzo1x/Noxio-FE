<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: string
  expanded: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  input: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
  emit('input')
}

function blur() {
  inputRef.value?.blur()
}

defineExpose({ blur })
</script>

<template>
  <div
    class="header-search__field"
    :class="{ 'header-search__field--expanded': expanded }"
  >
    <svg
      class="header-search__icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <input
      ref="inputRef"
      id="header-search"
      name="header-search"
      :value="modelValue"
      type="text"
      placeholder="Search items"
      autocomplete="off"
      aria-label="Search workspace"
      class="header-search__input"
      @focus="emit('focus')"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.header-search__field {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 37px;
  padding: 0 12px;
  border: 1.5px solid #212121;
  border-radius: 10px;
  background: #161616;
}

.header-search__field--expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: transparent;
}

.header-search__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transform: translateY(-50%);
  color: #ffffff;
  opacity: 0.85;
  pointer-events: none;
}

.header-search__input {
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 8px 0 8px 24px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.132px;
  color: #ffffff;
  outline: none;
}

.header-search__input::placeholder {
  color: var(--panel-placeholder);
}
</style>
