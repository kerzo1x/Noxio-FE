<script setup lang="ts">
import { ref } from 'vue'
import router from '@/router'
import { RouterLink } from 'vue-router'
import BaseInput from '@/components/ui/inputs/BaseInput.vue'
import BaseButton from '@/components/ui/buttons/BaseButton.vue'
import AuthBannerComponent from '@/components/auth/AuthBannerComponent.vue'


const isLoading = ref(false)
const email = ref('')
const password = ref('')
const message = ref('')
const isError = ref(false)

const handleLogin = async () => {
    if (!email.value || !password.value) {
        message.value = 'Please fill in all fields.'
        isError.value = true
        return
    }

    isLoading.value = false
    message.value = ''
    isError.value = false

    try {
        const response = await fetch('https://hrica.skyro.dev/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.value,
                password: password.value
            })
        })

        const result = await response.json()

        if (result.success) {
            // no 2fa
            if (result.data.requires2fa === false && result.data.accessToken) {
                localStorage.setItem('access_token', result.data.accessToken)
                isError.value = false
                message.value = result.message

                setTimeout(() => router.push({name: 'DashboardLayout'}), 1500)
            }
            // 2fa
            else if (result.data.requires2fa === true) {
                localStorage.setItem('session_token', result.data.sessionToken);
                isError.value = false
                message.value = result.message
                setTimeout(() => router.push({name: 'Verify', query: {from: "login"}}), 1500)

            }
        } else {
            isError.value = true
            message.value = result.message || 'Login failed.'
        }
    } catch (error) {
        isError.value = true
        message.value = 'Network error. Please check your connection.'
    } finally {
        isLoading.value = false
    }
}

const handleGoogleLogin = () => {
    // TODO: implement Google OAuth
}

const prefill = () => {
    email.value = 'myronsnikers@gmail.com';
    password.value = 'password1234';
    handleLogin()
}

</script>

<template>
    <div class="min-h-screen flex bg-surface text-text-main">

        <AuthBannerComponent mode="login" />

        <div class="w-full lg:w-1/2 flex items-center justify-center p-10 bg-panel-bg">
            <div class="auth-form-panel w-full max-w-md space-y-6">

                <h1 class="text-4xl font-bold text-panel-text">Log In</h1>
                <base-button text="autologin" @click="prefill"/>
                <form @submit.prevent="handleLogin" class="space-y-4">
                    <div class="flex flex-col gap-4">
                        <!-- <base-input></base-input>
                        <base-input></base-input> -->
                        <base-input
                            v-model="email"
                            type="username"
                            label="Email"
                            name="email"
                            place-holder="Placeholder" 
                            autocomplete="email"
                            :is-error="isError"
                            @clear-error="isError = false; message=''" 
                        />
                        <base-input
                            v-model="password"
                            name="password"
                            type="password"
                            label="Password"
                            place-holder="Placeholder"
                            :is-error="isError"
                            @clear-error="isError = false; message=''"
                        />
                    </div>

                    <div class="flex justify-end">
                        <router-link to="/auth/forgot-password" class="text-sm text-panel-label hover:text-panel-text transition-colors duration-200">
                            Forgot Password?
                        </router-link>
                    </div>

                    <base-button 
                        :is-loading="isLoading"
                        text="Log in"
                    />
                </form>

                <div class="text-center text-sm text-panel-label tracking-wider">or</div>

                <button type="button" class="google-btn" @click="handleGoogleLogin">
                    <img src="../../assets/img/google.png" class="w-5 h-5" alt="Google" />
                    Log in with Google
                </button>

                <p class="text-center text-sm">
                    <span class="text-panel-label">Don't have an account? </span>
                    <router-link to="/auth/register"
                        class="text-panel-text font-semibold hover:underline transition-all">
                        Sign up
                    </router-link>
                </p>

                <div class="h-6 flex items-center justify-center mt-2">
                    <p v-show="message" class="text-sm font-medium transition-opacity duration-300"
                        :class="isError ? 'text-error' : 'text-green-400'">
                        {{ message }}
                    </p>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.google-btn {
    @apply w-full flex items-center justify-center gap-3 px-4 py-3 rounded-auth font-semibold text-panel-text border border-panel-input-border hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer;
}
</style>