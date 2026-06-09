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
                component: () => import('../pages/dashboard/SettingsPage.vue'),
                redirect: { name: 'SettingsProfile' },
                children: [
                    {
                        path: 'profile',
                        name: 'SettingsProfile',
                        component: () => import('../pages/dashboard/settings/SettingsProfilePage.vue'),
                    },
                    {
                        path: 'security',
                        name: 'SettingsSecurity',
                        component: () => import('../pages/dashboard/settings/SettingsSecurityPage.vue'),
                    },
                    {
                        path: 'workspace',
                        name: 'SettingsWorkspace',
                        component: () => import('../pages/dashboard/settings/SettingsWorkspacePage.vue'),
                    },
                    {
                        path: 'edupage',
                        name: 'SettingsEdupage',
                        component: () => import('../pages/dashboard/settings/SettingsEdupagePage.vue'),
                    },
                ],
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

function hasAccessToken(): boolean {
    return localStorage.getItem('access_token') != null
}

router.beforeEach((to, _from, next) => {
    const token = hasAccessToken()
    const isDashboardRoute = to.path.startsWith('/dashboard')
    const isLoginRoute = to.name === 'Login'

    if (!token && isDashboardRoute) {
        next({ name: 'Login' })
        return
    }

    if (token && isLoginRoute) {
        next({ path: '/dashboard' })
        return
    }

    next()
})

export default router