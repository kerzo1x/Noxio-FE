<script setup lang="ts">
import { ref, useId, computed } from 'vue'
import eyeIcon from '@/assets/img/eye.svg'
import eyeClosedIcon from '@/assets/img/eye-closed.svg'

const model = defineModel<string>()

const props = defineProps({
    isError: Boolean,
    label: String,
    placeHolder: String,
    type: {
        type: String,
        default: 'text',
    },
    name: String,
    id: String,
    autocomplete: String,
})

const emit = defineEmits(['clear-error'])

const fallbackId = useId()
const inputId = computed(() => props.id ?? `base-input-${fallbackId}`)
const inputName = computed(() => props.name ?? inputId.value)

const showPassword = ref(false)

const inputType = computed(() => {
    if (props.type === 'password') {
        return showPassword.value ? 'text' : 'password'
    }
    return props.type
})
</script>
<template>
    <div class="flex-1 flex-col">
        <label
            v-if="label"
            :for="inputId"
            class="text-sm font-medium text-panel-label mb-12"
        >{{ label }}</label>
        <div class="field-input-wrap relative">
            <input
                :id="inputId"
                v-model="model"
                :type="inputType"
                :name="inputName"
                :autocomplete="autocomplete"
                :placeholder="placeHolder"
                class="field-input field-input--with-eye"
                :class="{ 'input-error': isError, 'pr-11': type === 'password' }"
                @input="emit('clear-error')"
            />
            <button
                v-if="type == 'password'"
                type="button"
                class="eye-btn"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
                <img
                    :src="showPassword ? eyeClosedIcon : eyeIcon"
                    alt=""
                    class="eye-icon"
                    width="20"
                    height="20"
                />
            </button>
        </div>
    </div>
</template>
<style>
@reference "@/assets/styles/main.css";
.field-input-wrap {
    @apply mt-1;
}

.field-input--with-eye {
    margin-top: 0;
}

.eye-btn {
    @apply absolute inset-y-0 right-3 flex w-6 items-center justify-center border-0 bg-transparent p-0 m-0 transition-opacity duration-200 cursor-pointer hover:opacity-80;
}

.eye-icon {
    @apply block h-5 w-5 shrink-0 object-contain object-center;
}

</style>