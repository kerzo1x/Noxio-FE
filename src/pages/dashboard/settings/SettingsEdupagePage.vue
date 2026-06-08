<script setup lang="ts">
// TODO: backend — подключить PATCH /integrations/edupage, GET credentials, disconnect

import { ref } from 'vue'
import SettingsField from '@/components/settings/SettingsField.vue'
import eyeIcon from '@/assets/img/eye.svg'
import eyeClosedIcon from '@/assets/img/eye-closed.svg'

const username = ref('Tomerko123')
const showPassword = ref(false)
</script>

<template>
  <div class="settings-section max-w-[425px]">
    <h2 class="settings-section-title settings-section-title--lg">
      Edupage settings
    </h2>

    <!-- TODO: backend — поле username: GET credentials endpoint -->
    <SettingsField
      v-model="username"
      label="Username"
      disabled
    />

    <!-- TODO: backend — поле password: PATCH /integrations/edupage -->
    <div class="settings-field mt-[60px]">
      <label class="settings-field__label">Password</label>
      <div class="settings-field__input settings-field__input--masked relative pr-12">
        <span class="settings-field__dot" />
        <span class="settings-field__dot" />
        <span class="settings-field__dot settings-field__dot--dim" />
        <span class="settings-field__dot" />
        <span class="settings-field__dot" />
        <span class="settings-field__dot" />
        <span class="settings-field__dot" />
        <span class="settings-field__dot" />
        <span class="settings-field__dot settings-field__dot--dim" />
        <button
          type="button"
          class="absolute right-4 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 opacity-50"
          aria-label="Toggle password visibility"
          @click="showPassword = !showPassword"
        >
          <img
            :src="showPassword ? eyeClosedIcon : eyeIcon"
            alt=""
            class="size-5"
          />
        </button>
      </div>
    </div>

    <!-- TODO: backend — кнопка Change credentials: PATCH /integrations/edupage -->
    <button
      type="button"
      class="settings-btn settings-btn--primary mt-[60px] h-12 w-full text-base"
      disabled
    >
      Change credentials
    </button>
  </div>
</template>
