<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardBehaviorPie from '../components/dashboard/DashboardBehaviorPie.vue'
import DashboardEventTimeline from '../components/dashboard/DashboardEventTimeline.vue'
import DashboardHighAlertToast from '../components/dashboard/DashboardHighAlertToast.vue'
import DashboardKpiRow from '../components/dashboard/DashboardKpiRow.vue'
import DashboardSnapshotCarousel from '../components/dashboard/DashboardSnapshotCarousel.vue'
import DashboardTrendChart from '../components/dashboard/DashboardTrendChart.vue'
import { useAuth } from '../composables/useAuth'
import { useDashboardRealtime } from '../composables/useDashboardRealtime'
import {
  getDashboardDataset,
  type DashboardLogEntry,
} from '../data/dashboardDataset'
import { RoleId, type RoleIdType } from '../services/auth'

const router = useRouter()
const { roleId } = useAuth()
const realtime = useDashboardRealtime()

const logFilterType = ref<string | 'all'>('all')
const logs = ref<DashboardLogEntry[]>([])

const snapshotLockIndex = ref<number | null>(null)
const snapshotDanger = ref(false)
const toastShow = ref(false)
const toastMessage = ref('')
let emergencyTimer: ReturnType<typeof setTimeout> | null = null

function effectiveRole(): RoleIdType {
  return roleId.value ?? RoleId.org
}

const dataset = computed(() => getDashboardDataset(effectiveRole()))

function syncLogsFromDataset() {
  logs.value = [...dataset.value.logs]
}

function onAppendLog(entry: DashboardLogEntry) {
  logs.value = [entry, ...logs.value]
}

function connectRealtime() {
  realtime.disconnect()
  realtime.connect({
    scope: effectiveRole() === RoleId.parent ? 'parent' : 'org',
    onAppendLog,
    intervalMs: 12000,
  })
}

watch(
  () => roleId.value,
  () => {
    syncLogsFromDataset()
    logFilterType.value = 'all'
    connectRealtime()
  },
)

onMounted(() => {
  syncLogsFromDataset()
  connectRealtime()
})

onBeforeUnmount(() => {
  clearEmergencyTimers()
  realtime.disconnect()
})

function onPieSelect(filter: string | 'all') {
  logFilterType.value = filter
}

function goWarningsDetail() {
  logFilterType.value = 'all'
  void router.push({ name: 'alerts', query: { scope: 'today' } })
}

function clearEmergencyTimers() {
  if (emergencyTimer != null) {
    clearTimeout(emergencyTimer)
    emergencyTimer = null
  }
}

function triggerEmergencyDemo() {
  clearEmergencyTimers()
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  toastMessage.value = `检测到高危：幼儿攀爬窗台 (${time})`
  toastShow.value = true
  snapshotLockIndex.value = 0
  snapshotDanger.value = true

  const entry: DashboardLogEntry = {
    id: `em-${Date.now()}`,
    time,
    level: 'high',
    type: '攀爬高处',
    loc: effectiveRole() === RoleId.parent ? '客厅窗边' : '午休室窗边',
    msg: '紧急！监控锁定：幼儿试图攀爬窗台',
  }
  logs.value = [entry, ...logs.value]

  emergencyTimer = setTimeout(() => {
    toastShow.value = false
    snapshotLockIndex.value = null
    snapshotDanger.value = false
    emergencyTimer = null
  }, 4000)
}
</script>

<template>
  <div class="relative text-left">
    <DashboardHighAlertToast :show="toastShow" :message="toastMessage" />

    <div class="mb-4 flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        class="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
        @click="triggerEmergencyDemo"
      >
        模拟高危触发
      </button>
    </div>

    <DashboardKpiRow :kpi="dataset.kpi" @click-warnings="goWarningsDetail" />

    <div class="mb-6 mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 class="mb-4 flex items-center text-sm font-bold text-slate-800">
          <svg
            class="mr-2 h-4 w-4 text-sky-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          24小时安全趋势
        </h3>
        <DashboardTrendChart
          :labels="dataset.trendLabels"
          :values="dataset.trendValues"
        />
      </div>

      <div class="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 class="mb-4 flex items-center justify-between text-sm font-bold text-slate-800">
          <span class="flex items-center">
            <svg
              class="mr-2 h-4 w-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            实时监控快照
          </span>
          <span class="relative flex h-2 w-2">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
            />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </h3>
        <DashboardSnapshotCarousel
          :cameras="dataset.snapshotCams"
          :lock-index="snapshotLockIndex"
          :danger-highlight="snapshotDanger"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-bold text-slate-800">
          行为类型分布（点击分类过滤日志）
        </h3>
        <DashboardBehaviorPie
          :labels="dataset.pieLabels"
          :values="dataset.pieValues"
          @select="onPieSelect"
        />
      </div>

      <div
        class="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2"
      >
        <h3 class="mb-4 flex items-center text-sm font-bold text-slate-800">
          <svg
            class="mr-2 h-4 w-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          异常事件滚动播报
        </h3>
        <DashboardEventTimeline
          :entries="logs"
          :filter-type="logFilterType"
        />
      </div>
    </div>
  </div>
</template>
