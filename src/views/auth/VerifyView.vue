<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  complete2FA,
  getVerifyRoleId,
  homePathForRole,
  RoleId,
  type RoleIdType,
} from '../../services/auth'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { syncFromStorage } = useAuth()

const smsCode = ref('')
const smsError = ref('')
const faceDone = ref(false)
const sliderValue = ref(0)
const sliderDone = ref(false)
const loading = ref(false)
const submitError = ref('')
const codeSeconds = ref(0)
let codeTimer: ReturnType<typeof setInterval> | null = null

function currentRoleId(): RoleIdType {
  return getVerifyRoleId() ?? RoleId.parent
}

onUnmounted(() => {
  if (codeTimer) clearInterval(codeTimer)
})

function startSmsCountdown() {
  if (codeSeconds.value > 0) return
  codeSeconds.value = 60
  codeTimer = setInterval(() => {
    codeSeconds.value -= 1
    if (codeSeconds.value <= 0 && codeTimer) {
      clearInterval(codeTimer)
      codeTimer = null
    }
  }, 1000)
}

function onSliderInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  sliderValue.value = v
  sliderDone.value = v >= 95
}

function simulateFace() {
  faceDone.value = true
}

async function onSubmit() {
  submitError.value = ''
  smsError.value = ''
  if (!faceDone.value) {
    submitError.value = '请完成人脸识别验证'
    return
  }
  if (!sliderDone.value) {
    submitError.value = '请拖动滑块完成验证'
    return
  }
  if (!smsCode.value.trim() || smsCode.value.trim().length < 4) {
    smsError.value = '请输入短信验证码'
    return
  }

  loading.value = true
  try {
    await complete2FA()
    syncFromStorage()
    await router.replace(homePathForRole(currentRoleId()))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="text-center">
      <div class="text-lg font-semibold text-slate-900">二次验证</div>
      <p class="mt-1 text-sm text-slate-500">检测到异常登录环境，请完成以下验证</p>
    </div>

    <div class="rounded-xl border border-slate-200 p-4">
      <div class="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
        <svg
          class="h-5 w-5 text-sky-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
        人脸识别
      </div>
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 py-3 text-sm font-medium text-sky-700 hover:bg-sky-100"
        :class="{ 'border-emerald-300 bg-emerald-50 text-emerald-800': faceDone }"
        :disabled="loading"
        @click="simulateFace"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {{ faceDone ? '已完成面部扫描' : '唤起面部扫描' }}
      </button>
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium text-slate-600">短信验证码</label>
      <div class="flex gap-2">
        <input
          v-model="smsCode"
          type="text"
          inputmode="numeric"
          maxlength="6"
          class="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
          placeholder="请输入验证码"
          :disabled="loading"
        />
        <button
          type="button"
          class="shrink-0 rounded-lg border border-sky-600 px-3 text-sm font-medium text-sky-600 hover:bg-sky-50 disabled:border-slate-200 disabled:text-slate-400"
          :disabled="loading || codeSeconds > 0"
          @click="startSmsCountdown"
        >
          {{ codeSeconds > 0 ? `${codeSeconds}s` : '获取验证码' }}
        </button>
      </div>
      <p v-if="smsError" class="mt-1 text-sm text-red-600">{{ smsError }}</p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-medium text-slate-600">图形滑块验证</label>
      <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div class="mb-2 h-8 overflow-hidden rounded bg-slate-200">
          <div
            class="h-full bg-gradient-to-r from-sky-400 to-sky-600 transition-[width]"
            :style="{ width: `${sliderValue}%` }"
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          :value="sliderValue"
          class="w-full accent-sky-600"
          :disabled="loading"
          @input="onSliderInput"
        />
        <p class="mt-1 text-xs text-slate-500">
          {{ sliderDone ? '验证通过' : '拖动滑块至最右侧' }}
        </p>
      </div>
    </div>

    <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>

    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-3 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      :disabled="loading"
      @click="onSubmit"
    >
      <svg
        v-if="loading"
        class="h-5 w-5 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
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
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {{ loading ? '验证中…' : '完成验证' }}
    </button>

    <router-link
      to="/login"
      class="text-center text-sm text-slate-500 hover:text-sky-600"
    >
      返回登录
    </router-link>
  </div>
</template>
