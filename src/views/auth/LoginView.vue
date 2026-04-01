<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { login, RoleId, type RoleIdType, homePathForRole } from '../../services/auth'
import { useAuth } from '../../composables/useAuth'

type Tab = 'parent' | 'org'

const router = useRouter()
const { syncFromStorage } = useAuth()

const tab = ref<Tab>('parent')
const account = ref('')
const password = ref('')
const agreed = ref(false)
const showPassword = ref(false)
const accountError = ref('')
const passwordError = ref('')
const submitError = ref('')
const loading = ref(false)

const phoneRe = /^1[3-9]\d{9}$/
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function roleId(): RoleIdType {
  return tab.value === 'parent' ? RoleId.parent : RoleId.org
}

watch(tab, () => {
  account.value = ''
  password.value = ''
  accountError.value = ''
  passwordError.value = ''
  submitError.value = ''
})

function validateAccount(): boolean {
  const v = account.value.trim()
  if (!v) {
    accountError.value =
      tab.value === 'parent' ? '请输入注册手机号' : '请输入机构备案邮箱'
    return false
  }
  if (tab.value === 'parent') {
    if (!phoneRe.test(v)) {
      accountError.value = '手机号格式不正确'
      return false
    }
  } else if (!emailRe.test(v)) {
    accountError.value = '邮箱格式不正确'
    return false
  }
  accountError.value = ''
  return true
}

function onAccountBlur() {
  if (!account.value.trim()) {
    accountError.value = ''
    return
  }
  validateAccount()
}

function onPasswordBlur() {
  const v = password.value
  if (!v) {
    passwordError.value = ''
    return
  }
  if (v.length < 8) {
    passwordError.value = '请输入密码（至少8位）'
    return
  }
  passwordError.value = ''
}

async function onSubmit() {
  submitError.value = ''
  if (!agreed.value) {
    submitError.value = '请先阅读并同意隐私保护协议'
    return
  }
  const okAcc = validateAccount()
  onPasswordBlur()
  if (!okAcc || passwordError.value) return
  if (!password.value) {
    passwordError.value = '请输入密码（至少8位）'
    return
  }

  loading.value = true
  try {
    const res = await login({
      account: account.value.trim(),
      password: password.value,
      roleId: roleId(),
    })
    if (res.error) {
      submitError.value = res.error
      return
    }
    if (res.requires2FA) {
      syncFromStorage()
      await router.push('/verify')
      return
    }
    syncFromStorage()
    await router.replace(homePathForRole(roleId()))
  } finally {
    loading.value = false
  }
}

function clearAccount() {
  account.value = ''
  accountError.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="text-center">
      <div class="text-lg font-semibold tracking-tight text-slate-900">
        SecureGuard
      </div>
      <p class="mt-1 text-sm text-slate-500">科技守护童年</p>
    </div>

    <div
      class="flex rounded-lg bg-slate-100 p-0.5"
      role="tablist"
      aria-label="角色切换"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'parent'"
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="
          tab === 'parent'
            ? 'bg-white text-sky-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
        "
        @click="tab = 'parent'"
      >
        家长端
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'org'"
        class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
        :class="
          tab === 'org'
            ? 'bg-white text-sky-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
        "
        @click="tab = 'org'"
      >
        机构端
      </button>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <div>
        <label class="mb-1 block text-xs font-medium text-slate-600">账号</label>
        <div class="relative">
          <span
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </span>
          <input
            v-model="account"
            type="text"
            autocomplete="username"
            class="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-slate-900 outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
            :placeholder="
              tab === 'parent' ? '请输入注册手机号' : '请输入机构备案邮箱'
            "
            :disabled="loading"
            @blur="onAccountBlur"
          />
          <button
            v-if="account"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="清除"
            :disabled="loading"
            @click="clearAccount"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p v-if="accountError" class="mt-1 text-sm text-red-600">{{ accountError }}</p>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-600">密码</label>
        <div class="relative">
          <span
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </span>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-slate-900 outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
            placeholder="请输入密码（至少8位）"
            :disabled="loading"
            @blur="onPasswordBlur"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            :disabled="loading"
            @click="showPassword = !showPassword"
          >
            <svg
              v-if="!showPassword"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <svg
              v-else
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          </button>
        </div>
        <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
      </div>

      <p
        v-if="tab === 'org'"
        class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
      >
        机构账号需绑定办学资质，如需接入请联系平台管理员。
      </p>

      <label class="flex items-start gap-2 text-sm text-slate-600">
        <input
          v-model="agreed"
          type="checkbox"
          class="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          :disabled="loading"
        />
        <span>我已阅读并同意《隐私政策》与《服务协议》</span>
      </label>

      <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>

      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-3 text-sm font-medium text-white transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-60"
        :disabled="loading"
      >
        <svg
          v-if="loading"
          class="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>

    <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
      <router-link
        to="/register"
        class="text-sky-600 hover:underline"
        :class="{ 'pointer-events-none opacity-50': loading }"
      >
        去注册
      </router-link>
      <a href="#" class="text-slate-500 hover:text-sky-600" @click.prevent>忘记密码</a>
    </div>
  </div>
</template>
