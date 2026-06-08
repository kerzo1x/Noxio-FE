<script setup lang="ts">
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const handleSkip = () => {
    router.push({ name: 'DashboardLayout' })
}

const handleSignIn = () => {
    router.push({ name: 'EdupageLogin' })
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-panel-bg">
        <div class="text-center space-y-10 px-8 w-full max-w-lg">

            <div class="space-y-3">
                <h1 class="text-4xl font-bold text-panel-text">Sign in to EduPage</h1>
                <p class="text-panel-label text-sm tracking-wide">so you can see your timetable</p>
            </div>
            <base-button 
              text="Sign In"
              @click="handleSignIn"
            />

            <button type="button" class="skip-link" @click="handleSkip">
                skip step
            </button>

        </div>
    </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";
.skip-link {
    @apply text-sm text-panel-label underline underline-offset-2 hover:text-panel-text transition-colors duration-200 cursor-pointer;
}
</style>