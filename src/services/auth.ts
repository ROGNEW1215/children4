export const RoleId = {
  parent: 1,
  org: 2,
} as const

export type RoleIdType = (typeof RoleId)[keyof typeof RoleId]

const TOKEN = 'sg_token'
const ROLE_ID = 'sg_role_id'
const ACCOUNT = 'sg_account'
const PENDING_2FA = 'sg_pending_2fa'
const VERIFY_ROLE = 'sg_verify_role'
const PENDING_ACCOUNT = 'sg_pending_account'

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN)
}

export function getRoleId(): RoleIdType | null {
  const v = sessionStorage.getItem(ROLE_ID)
  if (v === '1') return RoleId.parent
  if (v === '2') return RoleId.org
  return null
}

export function isPending2FA(): boolean {
  return sessionStorage.getItem(PENDING_2FA) === '1'
}

export function getVerifyRoleId(): RoleIdType | null {
  const v = sessionStorage.getItem(VERIFY_ROLE)
  if (v === '1') return RoleId.parent
  if (v === '2') return RoleId.org
  return null
}

export function getAccount(): string | null {
  return sessionStorage.getItem(ACCOUNT)
}

export function getPendingAccount(): string | null {
  return sessionStorage.getItem(PENDING_ACCOUNT)
}

export function setSession(token: string, roleId: RoleIdType, account?: string) {
  sessionStorage.setItem(TOKEN, token)
  sessionStorage.setItem(ROLE_ID, String(roleId))
  sessionStorage.removeItem(PENDING_2FA)
  sessionStorage.removeItem(VERIFY_ROLE)
  sessionStorage.removeItem(PENDING_ACCOUNT)
  if (account != null && account !== '') {
    sessionStorage.setItem(ACCOUNT, account)
  } else {
    sessionStorage.removeItem(ACCOUNT)
  }
}

export function setPending2FARole(roleId: RoleIdType, account?: string) {
  sessionStorage.setItem(PENDING_2FA, '1')
  sessionStorage.setItem(VERIFY_ROLE, String(roleId))
  if (account != null && account !== '') {
    sessionStorage.setItem(PENDING_ACCOUNT, account)
  } else {
    sessionStorage.removeItem(PENDING_ACCOUNT)
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN)
  sessionStorage.removeItem(ROLE_ID)
  sessionStorage.removeItem(ACCOUNT)
  sessionStorage.removeItem(PENDING_2FA)
  sessionStorage.removeItem(VERIFY_ROLE)
  sessionStorage.removeItem(PENDING_ACCOUNT)
}

export interface LoginResult {
  token?: string
  requires2FA: boolean
  remainingAttempts?: number
  error?: string
}

export async function login(params: {
  account: string
  password: string
  roleId: RoleIdType
}): Promise<LoginResult> {
  await delay(400 + Math.random() * 400)

  if (params.password === 'wrong') {
    return {
      requires2FA: false,
      error: '密码错误，您还有3次尝试机会',
      remainingAttempts: 3,
    }
  }

  const requires2FA =
    params.account.toLowerCase().includes('risk') || params.password === '2fa'

  if (requires2FA) {
    setPending2FARole(params.roleId, params.account)
    return { requires2FA: true }
  }

  const token = `mock-token-${Date.now()}`
  setSession(token, params.roleId, params.account)
  return { token, requires2FA: false }
}

export async function complete2FA(): Promise<{ token: string; roleId: RoleIdType }> {
  await delay(400)
  const roleId = getVerifyRoleId() ?? RoleId.parent
  const token = `mock-token-${Date.now()}`
  const account = getPendingAccount() ?? undefined
  setSession(token, roleId, account)
  return { token, roleId }
}

export async function register(_params: {
  account: string
  password: string
  roleId: RoleIdType
}): Promise<{ ok: true }> {
  await delay(500)
  return { ok: true }
}

export function isAuthenticated(): boolean {
  return !!getToken() && !isPending2FA()
}

export function homePathForRole(roleId: RoleIdType): string {
  return roleId === RoleId.parent ? '/live-monitoring' : '/dashboard'
}
