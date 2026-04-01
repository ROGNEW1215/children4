<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { RoleId, getRoleId } from '../../services/auth'
import { getSettings, saveAiThresholds, saveNotification, saveProfile } from '../../services/settings'
import type { SettingsBundle, SettingsTabKey } from '../../types/settings'

const loading = ref(true)
const activeTab = ref<SettingsTabKey>('profile')
const isDirty = ref(false)
const pendingTab = ref<SettingsTabKey | null>(null)
const leaveConfirmed = ref(false)

const settings = ref<SettingsBundle | null>(null)
const initialSnapshot = ref<string>('')

const playingSound = ref(false)
const savingProfile = ref(false)
const savingNotification = ref(false)
const savingAi = ref(false)

const showUnsavedModal = ref(false)
const showRiskConfirmModal = ref(false)
const riskConfirmMessage = ref('')
const toast = ref<{ visible: boolean; message: string; tone: 'success' | 'error' }>({
  visible: false,
  message: '',
  tone: 'success',
})

let toastTimer: ReturnType<typeof setTimeout> | null = null
let proceedRouteLeave: (() => void) | null = null

const roleId = computed(() => getRoleId())
const isOrgAdmin = computed(() => roleId.value === RoleId.org)

const tabs = computed(() => {
  const base: Array<{ key: SettingsTabKey; label: string; icon: string }> = [
    { key: 'profile', label: '个人资料与安全', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: 'notification', label: '偏好与通知', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0' },
  ]
  if (isOrgAdmin.value) {
    base.push({
      key: 'ai',
      label: 'AI 算法与阈值',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    })
  }
  return base
})

const soundTypeText = computed(() => {
  if (!settings.value) return ''
  if (settings.value.notification.soundType === 'siren') return '尖锐警报音 (Siren)'
  if (settings.value.notification.soundType === 'ding') return '清脆提示音 (Ding-dong)'
  return '温和语音播报'
})

function showToast(message: string, tone: 'success' | 'error' = 'success') {
  toast.value = { visible: true, message, tone }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 2800)
}

function computeSnapshot() {
  if (!settings.value) return ''
  return JSON.stringify(settings.value)
}

function resetDirtySnapshot() {
  initialSnapshot.value = computeSnapshot()
  isDirty.value = false
}

watch(
  settings,
  () => {
    if (!settings.value || !initialSnapshot.value) return
    isDirty.value = computeSnapshot() !== initialSnapshot.value
  },
  { deep: true },
)

watch(
  isOrgAdmin,
  (next) => {
    if (!next && activeTab.value === 'ai') activeTab.value = 'profile'
  },
  { immediate: true },
)

async function loadSettings() {
  loading.value = true
  try {
    settings.value = await getSettings()
    if (!isOrgAdmin.value) {
      settings.value.profile.roleLabel = '普通教师 / 家长'
    }
    resetDirtySnapshot()
  } finally {
    loading.value = false
  }
}

function requestTabSwitch(tab: SettingsTabKey) {
  if (tab === activeTab.value) return
  if (isDirty.value) {
    pendingTab.value = tab
    showUnsavedModal.value = true
    return
  }
  activeTab.value = tab
}

function confirmSwitchTab() {
  if (proceedRouteLeave) {
    const next = proceedRouteLeave
    proceedRouteLeave = null
    showUnsavedModal.value = false
    resetDirtySnapshot()
    next()
    return
  }
  if (pendingTab.value) {
    activeTab.value = pendingTab.value
  }
  pendingTab.value = null
  showUnsavedModal.value = false
  isDirty.value = false
  resetDirtySnapshot()
}

function cancelSwitchTab() {
  pendingTab.value = null
  showUnsavedModal.value = false
  proceedRouteLeave = null
}

function previewSound() {
  if (playingSound.value) return
  playingSound.value = true
  setTimeout(() => {
    playingSound.value = false
  }, 2000)
}

function requestResetAiDefaults() {
  riskConfirmMessage.value = '恢复默认将覆盖当前 AI 阈值并立即生效，确认继续吗？'
  showRiskConfirmModal.value = true
}

function confirmResetAiDefaults() {
  if (!settings.value) return
  settings.value.ai.fallConfidence = 80
  settings.value.ai.climbConfidence = 75
  settings.value.ai.lowLightAdaptive = true
  settings.value.ai.debounceSeconds = 1.5
  showRiskConfirmModal.value = false
  showToast('AI 参数已恢复默认，请记得保存。')
}

function cancelRiskAction() {
  showRiskConfirmModal.value = false
}

async function saveProfileSection() {
  if (!settings.value) return
  savingProfile.value = true
  try {
    await saveProfile(settings.value.profile)
    resetDirtySnapshot()
    showToast('个人资料与安全设置保存成功')
  } catch {
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    savingProfile.value = false
  }
}

async function saveNotificationSection() {
  if (!settings.value) return
  savingNotification.value = true
  try {
    await saveNotification(settings.value.notification)
    resetDirtySnapshot()
    showToast('偏好与通知设置保存成功')
  } catch {
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    savingNotification.value = false
  }
}

async function saveAiSection() {
  if (!settings.value || !isOrgAdmin.value) return
  savingAi.value = true
  try {
    await saveAiThresholds(settings.value.ai)
    resetDirtySnapshot()
    showToast('参数已保存并热下发至边缘节点')
  } catch {
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    savingAi.value = false
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (!isDirty.value || leaveConfirmed.value) {
    leaveConfirmed.value = false
    next()
    return
  }
  showUnsavedModal.value = true
  pendingTab.value = null
  proceedRouteLeave = () => {
    leaveConfirmed.value = true
    next()
  }
  next(false)
})

onMounted(loadSettings)
</script>

<template>
  <div class="relative min-h-[calc(100svh-140px)] bg-[#f5f7fa] p-4 text-left md:p-6">
    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      正在加载系统设置...
    </div>

    <div v-else-if="settings" class="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:flex-row">
      <aside class="w-full shrink-0 border-b border-slate-200 bg-white md:w-64 md:border-b-0 md:border-r">
        <div class="border-b border-slate-100 px-4 py-5 md:px-5">
          <h1 class="text-lg font-bold text-slate-900">系统与账户设置</h1>
          <p class="mt-1 text-xs text-slate-500">全局参数与个人偏好</p>
        </div>
        <nav class="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-2 md:p-4">
          <button
            v-for="item in tabs"
            :key="item.key"
            type="button"
            class="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap md:w-full"
            :class="activeTab === item.key ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'"
            @click="requestTabSwitch(item.key)"
          >
            <svg class="mr-2 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            {{ item.label }}
          </button>
        </nav>
      </aside>

      <main class="flex-1 space-y-5 overflow-y-auto bg-[#f5f7fa] p-4 md:p-6">
        <section v-show="activeTab === 'profile'" class="mx-auto max-w-4xl space-y-5">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 class="text-base font-bold text-slate-900">基础信息</h2>
            <div class="mt-5 flex flex-col gap-6 md:flex-row">
              <div class="flex flex-col items-center">
                <img :src="settings.profile.avatarUrl" alt="用户头像" class="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm" />
                <button type="button" class="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                  上传头像
                </button>
                <span class="mt-2 rounded bg-blue-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-blue-700">
                  {{ isOrgAdmin ? '系统管理员' : '普通教师 / 家长' }}
                </span>
              </div>
              <div class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                <label class="block">
                  <span class="mb-1 block text-xs font-bold text-slate-500">真实姓名 / 昵称</span>
                  <input
                    v-model="settings.profile.displayName"
                    type="text"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    aria-label="真实姓名或昵称"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-bold text-slate-500">绑定手机号</span>
                  <div class="flex">
                    <input
                      :value="settings.profile.maskedPhone"
                      disabled
                      type="text"
                      class="w-full rounded-l-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />
                    <button type="button" class="rounded-r-lg border border-l-0 border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
                      更换
                    </button>
                  </div>
                </label>
                <label class="block md:col-span-2">
                  <span class="mb-1 block text-xs font-bold text-slate-500">绑定邮箱</span>
                  <div class="flex">
                    <input
                      :value="settings.profile.maskedEmail"
                      disabled
                      type="text"
                      class="w-full rounded-l-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />
                    <button type="button" class="rounded-r-lg border border-l-0 border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
                      更换
                    </button>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 class="text-base font-bold text-slate-900">账号安全</h2>
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p class="text-sm font-semibold text-slate-800">登录密码</p>
                  <p class="mt-1 text-xs text-slate-500">修改密码需通过原密码或手机验证码二次验证</p>
                </div>
                <button type="button" class="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">
                  修改密码
                </button>
              </div>
              <div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p class="mb-2 text-sm font-semibold text-slate-800">近期登录设备</p>
                <ul class="space-y-1 text-xs text-slate-500">
                  <li v-for="log in settings.securityLogs" :key="log.id">
                    {{ log.loginAt }} · {{ log.device }} · IP: {{ log.ipMasked }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                class="inline-flex min-w-[108px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="savingProfile"
                @click="saveProfileSection"
              >
                <span v-if="savingProfile" class="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                <span v-else>保存配置</span>
              </button>
            </div>
          </div>
        </section>

        <section v-show="activeTab === 'notification'" class="mx-auto max-w-4xl space-y-5">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 class="text-base font-bold text-slate-900">接收渠道与声音</h2>
            <div class="mt-5 space-y-5">
              <label class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-800">浏览器弹窗通知 (Web Push)</p>
                  <p class="text-xs text-slate-500">在系统后台运行时，通过系统级横幅推送告警</p>
                </div>
                <input v-model="settings.notification.webPushEnabled" type="checkbox" class="h-5 w-5 accent-blue-600" aria-label="浏览器弹窗通知开关" />
              </label>

              <label class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-800">声音警报</p>
                  <p class="text-xs text-slate-500">高危事件触发时播放本地提示音</p>
                </div>
                <input v-model="settings.notification.soundAlertEnabled" type="checkbox" class="h-5 w-5 accent-blue-600" aria-label="声音警报开关" />
              </label>

              <label class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-800">移动端 App / 微信模板消息</p>
                  <p class="text-xs text-slate-500">同步推送至绑定手机客户端</p>
                </div>
                <input v-model="settings.notification.appPushEnabled" type="checkbox" class="h-5 w-5 accent-blue-600" aria-label="移动端推送开关" />
              </label>

              <div class="border-t border-slate-100 pt-4">
                <label class="mb-1 block text-sm font-semibold text-slate-800">声音类型</label>
                <p class="mb-2 text-xs text-slate-500">当前：{{ soundTypeText }}</p>
                <div class="flex flex-wrap items-center gap-3">
                  <select
                    v-model="settings.notification.soundType"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:w-72"
                    aria-label="提示音类型"
                  >
                    <option value="voice">温和语音播报</option>
                    <option value="siren">尖锐警报音 (Siren)</option>
                    <option value="ding">清脆提示音 (Ding-dong)</option>
                  </select>
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                    :aria-label="playingSound ? '正在试听' : '试听提示音'"
                    @click="previewSound"
                  >
                    <svg v-if="!playingSound" class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="h-5 w-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between">
                  <label class="text-sm font-semibold text-slate-800">提示音量</label>
                  <span class="font-mono text-sm font-semibold text-blue-700">{{ settings.notification.volume }}%</span>
                </div>
                <input v-model.number="settings.notification.volume" type="range" min="0" max="100" class="w-full accent-blue-600" aria-label="音量滑块" />
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-slate-900">免打扰模式 (DND)</h2>
                <p class="mt-1 text-xs text-slate-500">开启期间仅记录日志，不触发强提醒（高危事件除外）</p>
              </div>
              <input v-model="settings.notification.dndEnabled" type="checkbox" class="h-5 w-5 accent-blue-600" aria-label="免打扰开关" />
            </div>
            <div class="mt-4 flex items-center gap-2">
              <input v-model="settings.notification.dndStart" type="time" class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <span class="text-sm text-slate-400">至</span>
              <input v-model="settings.notification.dndEnd" type="time" class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div class="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                class="inline-flex min-w-[108px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="savingNotification"
                @click="saveNotificationSection"
              >
                <span v-if="savingNotification" class="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                <span v-else>保存配置</span>
              </button>
            </div>
          </div>
        </section>

        <section v-show="activeTab === 'ai'" class="mx-auto max-w-4xl space-y-5">
          <div class="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p class="text-sm font-semibold text-orange-800">系统级配置修改警告</p>
            <p class="mt-1 text-xs leading-relaxed text-orange-700">
              调低阈值将更敏锐地捕捉动作，但可能增加误报率；调高阈值将减少干扰但存在漏报风险。
              阈值判定以后端/边缘端规则为准，前端不存储核心策略明文。
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 class="text-base font-bold text-slate-900">置信度阈值调节</h2>
            <div class="mt-5 space-y-6">
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <label class="text-sm font-semibold text-slate-800">跌倒识别灵敏度</label>
                  <span class="rounded bg-blue-50 px-2 py-0.5 font-mono text-sm font-semibold text-blue-700">{{ settings.ai.fallConfidence }}%</span>
                </div>
                <input v-model.number="settings.ai.fallConfidence" type="range" min="50" max="99" class="w-full accent-blue-600" />
              </div>
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <label class="text-sm font-semibold text-slate-800">攀爬/越界识别灵敏度</label>
                  <span class="rounded bg-blue-50 px-2 py-0.5 font-mono text-sm font-semibold text-blue-700">{{ settings.ai.climbConfidence }}%</span>
                </div>
                <input v-model.number="settings.ai.climbConfidence" type="range" min="50" max="99" class="w-full accent-blue-600" />
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 class="text-base font-bold text-slate-900">高级环境策略</h2>
            <div class="mt-5 space-y-4">
              <label class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-800">环境光线自适应</p>
                  <p class="text-xs text-slate-500">弱光环境下自动微调对比度参数</p>
                </div>
                <input v-model="settings.ai.lowLightAdaptive" type="checkbox" class="h-5 w-5 accent-blue-600" />
              </label>
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-800">防抖动过滤时间 (Seconds)</label>
                <input
                  v-model.number="settings.ai.debounceSeconds"
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.1"
                  class="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50" @click="requestResetAiDefaults">
                恢复出厂默认
              </button>
              <button
                type="button"
                class="inline-flex min-w-[120px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="savingAi"
                @click="saveAiSection"
              >
                <span v-if="savingAi" class="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                <span v-else>保存并热重载</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>

    <div v-if="showUnsavedModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900">您有未保存的更改</h3>
        <p class="mt-2 text-xs leading-relaxed text-slate-500">如果现在离开，当前修改将丢失。确认继续吗？</p>
        <div class="mt-5 flex gap-3">
          <button type="button" class="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200" @click="cancelSwitchTab">
            取消
          </button>
          <button type="button" class="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700" @click="confirmSwitchTab">
            确认离开
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRiskConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-sm rounded-2xl border-t-4 border-red-500 bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900">高风险操作确认</h3>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ riskConfirmMessage }}</p>
        <div class="mt-5 flex gap-3">
          <button type="button" class="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200" @click="cancelRiskAction">
            放弃更改
          </button>
          <button type="button" class="flex-1 rounded-lg border border-red-300 bg-white py-2 text-sm font-semibold text-red-700 hover:bg-red-50" @click="confirmResetAiDefaults">
            继续
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast.visible" class="fixed left-1/2 top-8 z-50 -translate-x-1/2">
      <div
        class="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg"
        :class="toast.tone === 'success' ? 'bg-emerald-500' : 'bg-rose-600'"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>
