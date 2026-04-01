<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

type DeviceStatus = 'online' | 'offline' | 'alert'
type EventLevel = 'high' | 'warning' | 'info'

interface DeviceItem {
  id: string
  name: string
  group: string
  status: DeviceStatus
  fps: number
  latency: number
  image: string
  hasDanger: boolean
}

interface StreamEvent {
  id: string
  cameraId: string
  level: EventLevel
  title: string
  desc: string
  confidence: number
  time: string
  image: string
}

const deviceGroups = [
  { key: 'classA', label: '大一班' },
  { key: 'public', label: '公共区域' },
]

const devices = ref<DeviceItem[]>([
  {
    id: 'cam-1',
    name: '活动室 - 主摄',
    group: 'classA',
    status: 'online',
    fps: 30,
    latency: 12,
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80',
    hasDanger: false,
  },
  {
    id: 'cam-2',
    name: '午睡区 - 全景',
    group: 'classA',
    status: 'alert',
    fps: 28,
    latency: 15,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    hasDanger: true,
  },
  {
    id: 'cam-3',
    name: '走廊 - 北侧',
    group: 'public',
    status: 'online',
    fps: 26,
    latency: 18,
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80',
    hasDanger: false,
  },
  {
    id: 'cam-4',
    name: '室外操场',
    group: 'public',
    status: 'offline',
    fps: 0,
    latency: 0,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
    hasDanger: false,
  },
])

const eventSeed: StreamEvent[] = [
  {
    id: 'evt-1',
    cameraId: 'cam-2',
    level: 'high',
    title: '检测到攀爬行为',
    desc: '午睡区 - 可能性 94%，触及电源禁区。',
    confidence: 94,
    time: '14:30:12',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'evt-2',
    cameraId: 'cam-1',
    level: 'warning',
    title: '检测到快速奔跑',
    desc: '活动室 - 可能性 87%，建议老师关注。',
    confidence: 87,
    time: '14:28:03',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
  },
]

const events = ref<StreamEvent[]>([...eventSeed])
const gridMode = ref<1 | 2 | 3>(2)
const aiOverlayOn = ref(true)
const isMuted = ref(true)
const activeCameraId = ref('cam-2')
const zoomedCameraId = ref<string | null>(null)
const mobileTab = ref<'devices' | 'events'>('devices')
const isPipMode = ref(false)
const streamStrategy = ref('当前码流：4宫格子码流 (SD)')
const snapshotPreview = ref<string | null>(null)
const highlightedEventId = ref<string | null>(null)

let fakeEventTimer: number | null = null

const activeCamera = computed(
  () => devices.value.find((d) => d.id === activeCameraId.value) ?? devices.value[0],
)

const groupedDevices = computed(() =>
  deviceGroups.map((group) => ({
    ...group,
    items: devices.value.filter((d) => d.group === group.key),
  })),
)

const sortedEvents = computed(() => events.value)

const visibleCameraIds = computed(() => {
  if (zoomedCameraId.value) return [zoomedCameraId.value]
  if (gridMode.value === 1) return [activeCameraId.value]
  if (gridMode.value === 2) return devices.value.slice(0, 4).map((d) => d.id)
  return devices.value.map((d) => d.id)
})

const visibleDevices = computed(() =>
  visibleCameraIds.value
    .map((id) => devices.value.find((device) => device.id === id))
    .filter((item): item is DeviceItem => !!item),
)

function setGrid(mode: 1 | 2 | 3) {
  gridMode.value = mode
  zoomedCameraId.value = null
  streamStrategy.value =
    mode === 1 ? '当前码流：单画面主码流 (HD)' : mode === 2 ? '当前码流：4宫格子码流 (SD)' : '当前码流：9宫格低码流 (LD)'
}

function toggleZoom(cameraId: string) {
  zoomedCameraId.value = zoomedCameraId.value === cameraId ? null : cameraId
  if (zoomedCameraId.value) {
    activeCameraId.value = cameraId
    streamStrategy.value = '当前码流：聚焦画面主码流 (HD)'
  } else {
    setGrid(gridMode.value)
  }
}

function focusCamera(cameraId: string, eventId?: string) {
  activeCameraId.value = cameraId
  if (gridMode.value !== 1 && !visibleCameraIds.value.includes(cameraId)) {
    setGrid(1)
  }
  highlightedEventId.value = eventId ?? null
}

function toggleAiOverlay() {
  aiOverlayOn.value = !aiOverlayOn.value
}

function toggleMute() {
  isMuted.value = !isMuted.value
}

function togglePip() {
  isPipMode.value = !isPipMode.value
}

function markSafe(eventId: string) {
  highlightedEventId.value = eventId
}

function triggerAlert() {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  const newEvent: StreamEvent = {
    id: `evt-${Date.now()}`,
    cameraId: 'cam-2',
    level: 'high',
    title: '检测到异常跌倒',
    desc: '活动室 - 可能性 98%，姿态变化剧烈。',
    confidence: 98,
    time,
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
  }
  events.value = [newEvent, ...events.value]
  focusCamera('cam-2', newEvent.id)
}

function levelClass(level: EventLevel) {
  if (level === 'high') return 'bg-red-500 text-white'
  if (level === 'warning') return 'bg-amber-500 text-white'
  return 'bg-sky-500 text-white'
}

function statusDotClass(status: DeviceStatus) {
  if (status === 'online') return 'bg-emerald-500'
  if (status === 'alert') return 'bg-red-500 animate-pulse'
  return 'bg-slate-300'
}

function startFakeStream() {
  fakeEventTimer = window.setInterval(() => {
    if (Math.random() > 0.7) triggerAlert()
  }, 15000)
}

startFakeStream()
onBeforeUnmount(() => {
  if (fakeEventTimer) window.clearInterval(fakeEventTimer)
})
</script>

<template>
  <section class="relative h-full min-h-[calc(100dvh-7rem)]">
    <div class="hidden h-full gap-4 xl:grid xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      <aside class="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">设备管理树</header>
        <div class="min-h-0 flex-1 space-y-4 overflow-auto p-3">
          <div v-for="group in groupedDevices" :key="group.key">
            <p class="mb-2 px-2 text-xs font-semibold tracking-wide text-slate-400">{{ group.label }}</p>
            <button
              v-for="device in group.items"
              :key="device.id"
              type="button"
              class="group relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 transition hover:bg-slate-100"
              :class="{ 'bg-sky-50 text-sky-700 ring-1 ring-sky-200': activeCameraId === device.id }"
              @click="focusCamera(device.id)"
            >
              <span class="h-2 w-2 rounded-full" :class="statusDotClass(device.status)" />
              <span class="truncate">{{ device.name }}</span>
              <div
                class="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-1 shadow-md group-hover:block"
              >
                <img :src="device.image" :alt="device.name" class="h-20 w-28 rounded-md object-cover" />
              </div>
            </button>
          </div>
        </div>
      </aside>

      <main class="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div
          class="grid min-h-0 flex-1 gap-3 p-3"
          :class="{
            'grid-cols-1': zoomedCameraId || gridMode === 1,
            'grid-cols-2': !zoomedCameraId && gridMode === 2,
            'grid-cols-3': !zoomedCameraId && gridMode === 3,
          }"
        >
          <article
            v-for="camera in visibleDevices"
            :key="camera.id"
            class="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-sm"
            :class="{
              'cell-danger': camera.hasDanger,
              'cell-focus': activeCameraId === camera.id,
            }"
            @dblclick="toggleZoom(camera.id)"
          >
            <div class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-2">
              <span class="truncate text-xs font-semibold text-white">{{ camera.name }}</span>
              <span class="font-mono text-[11px] text-emerald-300">FPS {{ camera.fps }} | {{ camera.latency }}ms</span>
            </div>
            <img :src="camera.image" :alt="camera.name" class="h-full w-full object-cover" />
            <div v-if="aiOverlayOn" class="pointer-events-none absolute inset-0">
              <div class="bbox-ok" />
              <div class="bbox-danger" />
              <svg class="skeleton" viewBox="0 0 100 100" aria-hidden="true">
                <line x1="50" y1="20" x2="50" y2="50" />
                <line x1="50" y1="32" x2="30" y2="46" />
                <line x1="50" y1="32" x2="70" y2="46" />
                <circle cx="50" cy="15" r="4" />
              </svg>
              <div class="absolute bottom-2 right-3 rounded bg-amber-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                电源禁区
              </div>
            </div>
          </article>
        </div>
        <footer class="flex items-center justify-between border-t border-slate-100 px-3 py-2">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              @click="setGrid(1)"
            >
              1x1
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              @click="setGrid(2)"
            >
              2x2
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              @click="setGrid(3)"
            >
              3x3
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              @click="toggleAiOverlay"
            >
              {{ aiOverlayOn ? 'AI增强开' : 'AI增强关' }}
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              aria-label="静音切换"
              @click="toggleMute"
            >
              {{ isMuted ? '静音' : '有声' }}
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              aria-label="画中画切换"
              @click="togglePip"
            >
              {{ isPipMode ? '退出PiP' : 'PiP' }}
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              @click="triggerAlert"
            >
              模拟高危
            </button>
          </div>
          <span class="text-xs font-medium text-slate-500">{{ streamStrategy }}</span>
        </footer>
      </main>

      <aside class="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">AI 实时事件流</header>
        <div class="min-h-0 flex-1 space-y-3 overflow-auto p-3">
          <article
            v-for="event in sortedEvents"
            :key="event.id"
            class="slide-in cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300"
            :class="{ 'ring-2 ring-sky-300': highlightedEventId === event.id }"
            @click="focusCamera(event.cameraId, event.id)"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="rounded px-1.5 py-0.5 text-[10px] font-bold" :class="levelClass(event.level)">
                {{ event.level === 'high' ? '高危' : event.level === 'warning' ? '警告' : '提示' }}
              </span>
              <span class="font-mono text-[11px] text-slate-500">{{ event.time }}</span>
            </div>
            <p class="text-sm font-semibold text-slate-800">{{ event.title }} - {{ event.confidence }}%</p>
            <p class="mt-1 text-xs text-slate-600">{{ event.desc }}</p>
            <img
              :src="event.image"
              alt="事件快照"
              class="mt-2 h-20 w-full cursor-zoom-in rounded-md object-cover"
              @click.stop="snapshotPreview = event.image"
            />
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                @click.stop="markSafe(event.id)"
              >
                确认安全
              </button>
              <button
                v-if="event.level === 'high'"
                type="button"
                class="flex-1 rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
              >
                立即报警
              </button>
            </div>
          </article>
        </div>
      </aside>
    </div>

    <div class="space-y-3 xl:hidden">
      <article class="relative h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-sm">
        <div class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-2">
          <span class="truncate text-xs font-semibold text-white">{{ activeCamera.name }}</span>
          <span class="font-mono text-[11px] text-emerald-300">FPS {{ activeCamera.fps }} | {{ activeCamera.latency }}ms</span>
        </div>
        <img :src="activeCamera.image" :alt="activeCamera.name" class="h-full w-full object-cover" />
      </article>
      <div class="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div class="mb-2 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            :class="{ 'border-sky-300 bg-sky-50 font-medium text-sky-700': mobileTab === 'devices' }"
            @click="mobileTab = 'devices'"
          >
            设备列表
          </button>
          <button
            type="button"
            class="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            :class="{ 'border-sky-300 bg-sky-50 font-medium text-sky-700': mobileTab === 'events' }"
            @click="mobileTab = 'events'"
          >
            实时日志
          </button>
        </div>
        <div v-if="mobileTab === 'devices'" class="space-y-2">
          <button
            v-for="device in devices"
            :key="`m-${device.id}`"
            type="button"
            class="relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 transition hover:bg-slate-100"
            :class="{ 'bg-sky-50 text-sky-700 ring-1 ring-sky-200': activeCameraId === device.id }"
            @click="focusCamera(device.id)"
          >
            <span class="h-2 w-2 rounded-full" :class="statusDotClass(device.status)" />
            <span class="truncate">{{ device.name }}</span>
          </button>
        </div>
        <div v-else class="space-y-2">
          <article
            v-for="event in sortedEvents.slice(0, 6)"
            :key="`m-${event.id}`"
            class="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300"
            @click="focusCamera(event.cameraId, event.id)"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-slate-700">{{ event.title }}</p>
              <span class="font-mono text-[11px] text-slate-500">{{ event.time }}</span>
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ event.desc }}</p>
          </article>
        </div>
      </div>
    </div>

    <div v-if="isPipMode" class="pip-mock">
      <img :src="activeCamera.image" :alt="activeCamera.name" class="h-full w-full object-cover" />
      <button type="button" class="pip-close" @click="togglePip">关闭</button>
    </div>

    <div
      v-if="snapshotPreview"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
      @click="snapshotPreview = null"
    >
      <img
        :src="snapshotPreview"
        alt="快照放大图"
        class="max-h-[85vh] w-full max-w-3xl rounded-xl border border-slate-300 object-cover shadow-2xl"
      />
    </div>
  </section>
</template>

<style scoped>
.cell-focus {
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.6), 0 10px 24px rgba(15, 23, 42, 0.3);
}

.cell-danger {
  animation: breathe-red 2s ease-in-out infinite;
}

.bbox-ok {
  position: absolute;
  top: 38%;
  left: 24%;
  width: 22%;
  height: 42%;
  border: 2px solid #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.bbox-danger {
  position: absolute;
  top: 30%;
  left: 52%;
  width: 24%;
  height: 46%;
  border: 2px solid #ef4444;
  background: rgba(239, 68, 68, 0.16);
}

.skeleton {
  position: absolute;
  top: 28%;
  left: 52%;
  width: 24%;
  height: 46%;
  stroke: #22d3ee;
  stroke-width: 2;
  fill: #22d3ee;
}

.pip-mock {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 50;
  width: 220px;
  height: 124px;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #0f172a;
  box-shadow: 0 16px 30px rgba(2, 6, 23, 0.35);
}

.pip-close {
  position: absolute;
  top: 6px;
  right: 6px;
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.7);
  color: #fff;
  border: none;
  font-size: 12px;
  padding: 2px 6px;
}

.slide-in {
  animation: slide-in 0.35s ease-out;
}

@keyframes breathe-red {
  0%,
  100% {
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.9), 0 0 10px rgba(239, 68, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.4), 0 0 22px rgba(239, 68, 68, 0.5);
  }
}

@keyframes slide-in {
  from {
    transform: translateX(16px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
