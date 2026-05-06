import DashboardLayout from '../layouts/DashboardLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    // main page
    {
        path: '/dashboard',
        name: 'DashboardLayout',
        component: DashboardLayout,
        redirect: '/dashboard/home',
        children: [
            {
                path: 'home',
                name: 'DashboardHome',
                component: () => import('../pages/dashboard/HomePage.vue')
            },
            {
                path: 'folders',
                name: 'DashboardFolders',
                component: () => import('../pages/dashboard/FolderPage.vue')
            },
            {
                path: 'todo',
                name: 'DashboardTodo',
                component: () => import('../pages/dashboard/TodoPage.vue')
            },
            {
                path: 'noxio-ai',
                name: 'DashboardNoxioAi',
                component: () => import('../pages/dashboard/NoxioaiPage.vue')
            },
            {
                path: 'settings',
                name: 'DashboardSettings',
                component: () => import('../pages/dashboard/SettingsPage.vue')
            }
        ]
    },

    // /auth
    {
        path: '/auth/register',
        name: 'Register',
        component: () => import('../pages/auth/RegisterPage.vue')
    },
    {
        path: '/auth/login',
        name: 'Login',
        component: () => import('../pages/auth/LoginPage.vue')
    },
    {
        path: '/auth/verify',
        name: 'Verify',
        component: () => import('../pages/auth/VerifyPassword.vue')
    },
    {
        path: '/auth/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../pages/auth/ForgotPassword.vue')
    },
    {
        path: '/auth/reset-password',
        name: 'ResetPassword',
        component: () => import('../pages/auth/ResetPassword.vue')
    },

    // edupage
    {
        path: '/auth/edupage',
        name: 'EdupageConnect',
        component: () => import('../pages/edupage/EdupageConnect.vue')
    },
    {
        path: '/auth/edupage/login',
        name: 'EdupageLogin',
        component: () => import('../pages/edupage/EdupageLogin.vue')
    },
    // system
    {
        path: '/',
        redirect: '/auth/login'
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/auth/login'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router