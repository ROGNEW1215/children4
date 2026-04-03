<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type TimeRange = 'today' | '7days' | '30days'
type AlertRisk = 'high' | 'medium' | 'low'
type AlertStatus = 'pending' | 'confirmed' | 'false_alarm'

interface AlertEvent {
  id: string
  time: string
  date: string
  location: string
  risk: AlertRisk
  type: string
  status: AlertStatus
  aiResult: string
  confidence: number
  thumbnail: string
  envTag: string
  reviewNote: string
}

const timeRange = ref<TimeRange>('today')
const riskFilter = ref<'all' | AlertRisk>('all')
const typeFilter = ref<'all' | string>('all')
const loading = ref(false)
const drawerOpen = ref(false)
const selectedEvent = ref<AlertEvent | null>(null)
const reviewDraft = ref('')
const toast = ref<{ show: boolean; text: string }>({ show: false, text: '' })
const loadingTimer = ref<number | null>(null)
const toastTimer = ref<number | null>(null)

const events = ref<AlertEvent[]>([
  {
    id: 'EVT-001',
    time: '14:23:05',
    date: '2026-03-29',
    location: '大二班 - 窗户区',
    risk: 'high',
    type: '攀爬',
    status: 'pending',
    aiResult: '高坠风险',
    confidence: 96,
    thumbnail:
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=900&q=80',
    envTag: '未发现护栏防护',
    reviewNote: '',
  },
  {
    id: 'EVT-002',
    time: '13:10:22',
    date: '2026-03-29',
    location: '室外操场 - 滑梯区',
    risk: 'medium',
    type: '跌倒',
    status: 'confirmed',
    aiResult: '异常跌倒',
    confidence: 88,
    thumbnail:
      'https://images.unsplash.com/photo-1544776193-352d25ca82cd?auto=format&fit=crop&w=900&q=80',
    envTag: '地面湿滑概率较高',
    reviewNote: '已通知老师加强该区域看护。',
  },
  {
    id: 'EVT-003',
    time: '11:45:10',
    date: '2026-03-29',
    location: '小一班 - 洗手间',
    risk: 'medium',
    type: '越界',
    status: 'false_alarm',
    aiResult: '靠近湿滑区域',
    confidence: 72,
    thumbnail:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80',
    envTag: '环境反光干扰',
    reviewNote: '已标记为系统误报。',
  },
  {
    id: 'EVT-004',
    time: '09:15:30',
    date: '2026-03-29',
    location: '园区大门',
    risk: 'low',
    type: '越界',
    status: 'pending',
    aiResult: '人员徘徊',
    confidence: 65,
    thumbnail:
      'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80',
    envTag: '未检出伴随风险',
    reviewNote: '',
  },
])

const alertTypes = computed(() => {
  const set = new Set(events.value.map((item) => item.type))
  return Array.from(set)
})

const filteredEvents = computed(() =>
  events.value.filter((item) => {
    const matchesRisk = riskFilter.value === 'all' || item.risk === riskFilter.value
    const matchesType = typeFilter.value === 'all' || item.type === typeFilter.value
    return matchesRisk && matchesType
  }),
)

const selectedRiskLabel = computed(() => riskLabel(selectedEvent.value?.risk ?? 'high'))

watch(drawerOpen, (open) => {
  document.body.classList.toggle('overflow-hidden', open)
})

function setTimeRange(range: TimeRange) {
  timeRange.value = range
  runFilterLoading()
}

function runFilterLoading() {
  loading.value = true
  if (loadingTimer.value) {
    window.clearTimeout(loadingTimer.value)
  }
  loadingTimer.value = window.setTimeout(() => {
    loading.value = false
  }, 350)
}

function applyFilters() {
  runFilterLoading()
}

function resetFilters() {
  timeRange.value = 'today'
  riskFilter.value = 'all'
  typeFilter.value = 'all'
  runFilterLoading()
}

function openDrawer(item: AlertEvent) {
  selectedEvent.value = item
  reviewDraft.value = item.reviewNote
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

function markFalseAlarm(id: string) {
  const target = events.value.find((item) => item.id === id)
  if (!target) return
  target.status = 'false_alarm'
  target.reviewNote = target.reviewNote || '已标记为系统误报。'
  showToast(`已将 ${id} 标记为系统误报，并提交模型难例素材`)

  if (selectedEvent.value?.id === id) {
    selectedEvent.value = { ...target }
    reviewDraft.value = target.reviewNote
  }
}

function saveReview() {
  if (!selectedEvent.value) return
  const content = reviewDraft.value.trim()
  const target = events.value.find((item) => item.id === selectedEvent.value?.id)
  if (!target) return
  target.reviewNote = content
  if (target.status === 'pending') {
    target.status = 'confirmed'
  }
  selectedEvent.value = { ...target }
  showToast('复核记录已保存并归档')
}

function archiveAccident() {
  if (!selectedEvent.value) return
  showToast('已标记为事故记录，进入加密锁存队列（180天）')
}

function exportLogs() {
  showToast('导出功能将在后续版本接入（CSV/PDF）')
}

function showToast(text: string) {
  toast.value = { show: true, text }
  if (toastTimer.value) {
    window.clearTimeout(toastTimer.value)
  }
  toastTimer.value = window.setTimeout(() => {
    toast.value.show = false
  }, 3200)
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && drawerOpen.value) {
    closeDrawer()
  }
}

function riskLabel(risk: AlertRisk) {
  if (risk === 'high') return '高危'
  if (risk === 'medium') return '中危'
  return '低危'
}

function statusLabel(status: AlertStatus) {
  if (status === 'pending') return '未处理'
  if (status === 'confirmed') return '已确认'
  return '系统误报'
}

function riskClass(risk: AlertRisk) {
  if (risk === 'high') return 'border-red-500 text-red-600 bg-red-50'
  if (risk === 'medium') return 'border-amber-500 text-amber-600 bg-amber-50'
  return 'border-sky-500 text-sky-600 bg-sky-50'
}

function statusClass(status: AlertStatus) {
  if (status === 'pending') return 'bg-red-50 text-red-600'
  if (status === 'confirmed') return 'bg-emerald-50 text-emerald-600'
  return 'bg-slate-100 text-slate-500'
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  if (loadingTimer.value) window.clearTimeout(loadingTimer.value)
  if (toastTimer.value) window.clearTimeout(toastTimer.value)
  window.removeEventListener('keydown', onKeyDown)
  document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <section class="relative min-h-[calc(100dvh-7rem)]">
    <header class="mb-4">
      <h1 class="text-2xl font-bold text-slate-800">预警事件与回放</h1>
      <p class="mt-1 text-sm text-slate-500">历史风险追溯与模型校准</p>
    </header>

    <section class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <div class="inline-flex rounded-lg border border-slate-100 bg-slate-50 p-1">
            <button
              v-for="item in [
                { key: 'today', label: '今日' },
                { key: '7days', label: '近7天' },
                { key: '30days', label: '近30天' },
              ]"
              :key="item.key"
              type="button"
              class="rounded-md px-4 py-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
              :class="{ 'bg-white text-blue-600 shadow-sm': timeRange === item.key }"
              @click="setTimeRange(item.key as TimeRange)"
            >
              {{ item.label }}
            </button>
          </div>

          <select
            v-model="riskFilter"
            class="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            @change="applyFilters"
          >
            <option value="all">所有危险等级</option>
            <option value="high">高危事件</option>
            <option value="medium">中危事件</option>
            <option value="low">低危事件</option>
          </select>

          <select
            v-model="typeFilter"
            class="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            @change="applyFilters"
          >
            <option value="all">所有行为类型</option>
            <option v-for="type in alertTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
            @click="resetFilters"
          >
            重置
          </button>
          <button
            type="button"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
            @click="exportLogs"
          >
            导出日志
          </button>
        </div>
      </div>
    </section>

    <section class="mt-4">
      <div v-if="loading" class="flex justify-center py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
      </div>

      <div
        v-else-if="filteredEvents.length === 0"
        class="rounded-2xl border border-slate-100 bg-white py-16 text-center shadow-sm"
      >
        <p class="text-base font-semibold text-slate-600">当前时段未检测到任何异常行为</p>
        <p class="mt-1 text-sm text-slate-400">孩子们都很安全</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        <article
          v-for="item in filteredEvents"
          :key="item.id"
          class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition"
          :class="{ 'grayscale opacity-[0.65]': item.status === 'false_alarm' }"
        >
          <button
            type="button"
            class="group relative block aspect-video w-full overflow-hidden rounded-xl"
            @click="openDrawer(item)"
          >
            <img :src="item.thumbnail" :alt="`${item.id} 缩略图`" class="h-full w-full object-cover transition group-hover:scale-105" />
            <span
              class="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100"
            >
              <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                预览 15s 回放
              </span>
            </span>
          </button>

          <div class="p-4">
            <div class="mb-3 flex items-start justify-between gap-2">
              <div class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold" :class="riskClass(item.risk)">
                {{ riskLabel(item.risk) }}
              </div>
              <span class="rounded-md px-2 py-0.5 text-xs font-medium" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <h3 class="text-sm font-bold text-slate-800">{{ item.aiResult }}（置信度 {{ item.confidence }}%）</h3>
            <p class="mt-2 text-xs text-slate-500">{{ item.date }} {{ item.time }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ item.location }}</p>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                class="rounded-md bg-slate-100 px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                @click="openDrawer(item)"
              >
                播放回放
              </button>
              <button
                type="button"
                class="rounded-md bg-slate-100 px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                @click="markFalseAlarm(item.id)"
              >
                标记误报
              </button>
              <button
                type="button"
                class="rounded-md bg-slate-100 px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                @click="showToast('该事件已忽略')"
              >
                忽略
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <Transition name="fade">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        aria-hidden="true"
        @click="closeDrawer"
      />
    </Transition>

    <aside
      class="drawer fixed inset-y-0 right-0 z-50 w-full max-w-[480px] overflow-auto bg-white shadow-2xl"
      :class="{ 'drawer-open': drawerOpen }"
      :aria-hidden="!drawerOpen"
    >
      <div v-if="selectedEvent" class="flex h-full flex-col">
        <header class="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 class="text-lg font-bold text-slate-800">
              事件回溯分析
              <span class="ml-2 rounded px-2 py-0.5 text-xs text-white" :class="selectedEvent.risk === 'high' ? 'bg-red-500' : selectedEvent.risk === 'medium' ? 'bg-amber-500' : 'bg-sky-500'">
                {{ selectedRiskLabel }}
              </span>
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ selectedEvent.date }} {{ selectedEvent.time }} · {{ selectedEvent.location }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:text-slate-700"
            aria-label="关闭详情抽屉"
            @click="closeDrawer"
          >
            ✕
          </button>
        </header>

        <div class="space-y-5 p-5">
          <section class="overflow-hidden rounded-xl bg-black">
            <div class="relative aspect-video">
              <img :src="selectedEvent.thumbnail" alt="回放缩略图" class="h-full w-full object-cover opacity-70" />
              <button
                type="button"
                class="absolute left-1/2 top-1/2 inline-flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:scale-105"
                aria-label="播放回放"
              >
                ▶
              </button>
            </div>
            <div class="bg-gradient-to-t from-black/80 to-black/30 px-3 pb-3 pt-2 text-xs text-white">
              <div class="mb-1 flex justify-between">
                <span>-00:05</span>
                <span class="font-semibold text-red-400">触发点</span>
                <span>+00:10</span>
              </div>
              <div class="relative h-1.5 rounded-full bg-slate-500">
                <div class="h-full w-1/3 rounded-full bg-blue-500" />
                <span class="absolute left-1/3 top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-red-500 shadow-[0_0_6px_#ef4444]" />
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 class="text-sm font-bold text-slate-800">模型研判报告</h3>
            <div class="mt-3 space-y-2 text-sm">
              <p class="flex justify-between text-slate-600">
                <span>主行为判定</span>
                <strong class="text-slate-800">{{ selectedEvent.aiResult }}</strong>
              </p>
              <p class="flex justify-between text-slate-600">
                <span>综合置信度</span>
                <span class="font-mono text-slate-800">{{ selectedEvent.confidence }}%</span>
              </p>
              <p class="flex justify-between text-slate-600">
                <span>检测算法</span>
                <span class="text-slate-800">YOLOv11-Pose</span>
              </p>
              <p class="mt-2 flex justify-between border-t border-slate-200 pt-2 text-slate-600">
                <span>环境感知</span>
                <span class="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{{ selectedEvent.envTag }}</span>
              </p>
            </div>
          </section>

          <section>
            <h3 class="text-sm font-bold text-slate-800">人工复核记录</h3>
            <textarea
              v-model="reviewDraft"
              class="mt-2 h-24 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="输入处理备注，形成闭环记录（例如：已通知当班老师移除危险物）..."
            />
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
                @click="saveReview"
              >
                保存并归档
              </button>
              <button
                type="button"
                class="w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                @click="archiveAccident"
              >
                标记为事故记录
              </button>
            </div>
            <p class="mt-2 text-[11px] text-slate-400">加密锁存后，数据将强制保留至少 180 天且无法删除</p>
          </section>
        </div>
      </div>
    </aside>

    <Transition name="fade">
      <div v-if="toast.show" class="fixed bottom-5 right-5 z-[60] rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
        {{ toast.text }}
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.drawer {
  transform: translateX(100%);
  transition: transform 0.25s ease;
}

.drawer-open {
  transform: translateX(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .drawer,
  .fade-enter-active,
  .fade-leave-active {
    transition: none !important;
  }
}
</style>
