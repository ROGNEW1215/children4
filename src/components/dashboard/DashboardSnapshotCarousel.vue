<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  cameras: { id: string; name: string; imageUrl: string }[]
  /** When set, carousel stops and this index is shown */
  lockIndex: number | null
  /** Red border + danger overlay styling */
  dangerHighlight: boolean
}>()

const carouselIx = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
const clock = ref('')

function tickClock() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  clock.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

let clockTimer: ReturnType<typeof setInterval> | null = null

function startCarousel() {
  stopCarousel()
  if (props.cameras.length <= 1) return
  timer = setInterval(() => {
    carouselIx.value = (carouselIx.value + 1) % props.cameras.length
  }, 5000)
}

function stopCarousel() {
  if (timer != null) {
    clearInterval(timer)
    timer = null
  }
}

const displayIndex = computed(() => {
  if (props.lockIndex != null) {
    const i = props.lockIndex
    return i >= 0 && i < props.cameras.length ? i : 0
  }
  return carouselIx.value
})

const currentCam = computed(() => props.cameras[displayIndex.value])

watch(
  () => props.lockIndex,
  (lock) => {
    if (lock == null) startCarousel()
    else stopCarousel()
  },
  { immediate: true },
)

watch(
  () => props.cameras,
  () => {
    carouselIx.value = 0
    if (props.lockIndex == null) startCarousel()
  },
  { deep: true },
)

onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  if (props.lockIndex == null) startCarousel()
})

onBeforeUnmount(() => {
  stopCarousel()
  if (clockTimer != null) clearInterval(clockTimer)
})
</script>

<template>
  <div
    class="relative min-h-[200px] flex-1 overflow-hidden rounded-xl border-2 transition-all duration-300"
    :class="
      dangerHighlight
        ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
        : 'border-transparent'
    "
    role="region"
    aria-label="实时监控快照，静音轮播"
  >
    <div
      v-if="currentCam"
      class="absolute inset-0 bg-cover bg-center opacity-60 transition-all duration-500"
      :style="{ backgroundImage: `url(${currentCam.imageUrl})` }"
    />
    <div
      class="pointer-events-none absolute border-2 transition-all duration-500"
      :class="
        dangerHighlight
          ? 'animate-pulse border-red-500 bg-red-500/20'
          : 'border-emerald-500 bg-emerald-500/20'
      "
      :style="
        dangerHighlight
          ? { top: '10%', left: '60%', width: '30%', height: '60%' }
          : { top: '30%', left: '40%', width: '25%', height: '45%' }
      "
    >
      <span
        class="absolute -top-6 left-[-2px] rounded px-2 py-0.5 font-mono text-[10px] text-white"
        :class="dangerHighlight ? 'animate-pulse bg-red-500' : 'bg-emerald-600'"
      >
        {{
          dangerHighlight ? 'DANGER: Climbing 99%' : 'Person 98%'
        }}
      </span>
    </div>
    <div
      class="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-1 font-mono text-xs text-white/80"
    >
      {{ currentCam?.name ?? '' }} · {{ clock }}
    </div>
    <div
      v-if="cameras.length > 1 && lockIndex == null"
      class="absolute bottom-3 left-3 flex gap-1"
      aria-hidden="true"
    >
      <span
        v-for="(c, i) in cameras"
        :key="c.id"
        class="h-1.5 w-1.5 rounded-full transition-colors"
        :class="i === displayIndex ? 'bg-white' : 'bg-white/40'"
      />
    </div>
  </div>
</template>
