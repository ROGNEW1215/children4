import { computed, ref } from 'vue'
import {
  clearSession,
  getAccount,
  getRoleId,
  getToken,
  homePathForRole,
  isAuthenticated as checkAuth,
  RoleId,
  type RoleIdType,
} from '../services/auth'

const tokenRef = ref<string | null>(getToken())

export function useAuth() {
  function syncFromStorage() {
    tokenRef.value = getToken()
  }

  function logout() {
    clearSession()
    tokenRef.value = null
  }

  const isLoggedIn = computed(() => checkAuth())
  const roleId = computed<RoleIdType | null>(() => getRoleId())

  const accountLabel = computed(() => {
    void tokenRef.value
    return getAccount()
  })

  const roleLabel = computed(() => {
    void tokenRef.value
    const r = getRoleId()
    if (r === RoleId.parent) return '家长'
    if (r === RoleId.org) return '机构管理员'
    return ''
  })

  return {
    token: tokenRef,
    isLoggedIn,
    roleId,
    accountLabel,
    roleLabel,
    syncFromStorage,
    logout,
    homePath: computed(() => {
      const r = getRoleId()
      return r != null ? homePathForRole(r) : '/live-monitoring'
    }),
  }
}
