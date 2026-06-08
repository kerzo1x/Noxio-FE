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
                path: 'folders/:folderId/notes/:noteId?',
                name: 'DashboardFolderNotes',
                component: () => import('../pages/dashboard/NotesPage.vue'),
                props: true
            },
            {
                path: 'todo',
                name: 'DashboardTodo',
                component: () => import('../pages/dashboard/TodoPage.vue')
            },
            {
                path: 'todo/:todoListId',
                name: 'DashboardTodoList',
                component: () => import('../pages/dashboard/TodoListPage.vue'),
                props: true
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

// TODO: ten router nema ziadny guard na FE. to ze to overuje BE (API) je super, ale aj frontend by mal mat guard, ktory ked napr. nemas access token a ides na dashboard, tak uz frontend by ta mal dat na login a nie az BE

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router