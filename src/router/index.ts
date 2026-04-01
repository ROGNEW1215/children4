import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import MainLayout from '../layouts/MainLayout.vue'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import VerifyView from '../views/auth/VerifyView.vue'
import LiveMonitoringView from '../views/LiveMonitoringView.vue'
import DashboardView from '../views/DashboardView.vue'
import AlertsView from '../views/AlertsView.vue'
import DevicesView from '../views/DevicesView.vue'
import EnvironmentView from '../views/EnvironmentView.vue'
import SettingsPrivacyView from '../views/settings/SettingsPrivacyView.vue'
import SettingsSystemView from '../views/settings/SettingsSystemView.vue'
import {
  getRoleId,
  getVerifyRoleId,
  homePathForRole,
  isAuthenticated,
  isPending2FA,
} from '../services/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: () => {
            const r = getRoleId()
            return r != null ? homePathForRole(r) : '/login'
          },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: '概览数据大屏' },
        },
        {
          path: 'live-monitoring',
          name: 'live-monitoring',
          component: LiveMonitoringView,
          meta: { title: '实时监控中心' },
        },
        {
          path: 'alerts',
          name: 'alerts',
          component: AlertsView,
          meta: { title: '预警事件与回放' },
        },
        {
          path: 'devices',
          name: 'devices',
          component: DevicesView,
          meta: { title: '设备与节点状态' },
        },
        {
          path: 'environment',
          name: 'environment',
          component: EnvironmentView,
          meta: { title: '环境感知配置' },
        },
        {
          path: 'settings/privacy',
          name: 'settings-privacy',
          component: SettingsPrivacyView,
          meta: { title: '隐私与授权控制' },
        },
        {
          path: 'settings/system',
          name: 'settings-system',
          component: SettingsSystemView,
          meta: { title: '系统与账户设置' },
        },
      ],
    },
    {
      path: '/login',
      component: AuthLayout,
      children: [
        { path: '', name: 'login', component: LoginView, meta: { guest: true } },
      ],
    },
    {
      path: '/register',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'register',
          component: RegisterView,
          meta: { guest: true },
        },
      ],
    },
    {
      path: '/verify',
      component: AuthLayout,
      beforeEnter: (_to, _from, next) => {
        if (isAuthenticated()) {
          const r = getRoleId()
          next(r != null ? homePathForRole(r) : '/live-monitoring')
          return
        }
        if (!isPending2FA() || !getVerifyRoleId()) {
          next('/login')
          return
        }
        next()
      },
      children: [{ path: '', name: 'verify', component: VerifyView }],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/login' || to.path === '/register') {
    if (isAuthenticated()) {
      const r = getRoleId()
      next(r != null ? homePathForRole(r) : '/live-monitoring')
      return
    }
    if (isPending2FA() && getVerifyRoleId()) {
      next('/verify')
      return
    }
  }
  if (to.matched.some((record) => record.meta.requiresAuth) && !isAuthenticated()) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
