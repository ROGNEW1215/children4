<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { findSiteMapItemByPath } from '../../config/siteMap'
import HeaderNotifications from './HeaderNotifications.vue'
import HeaderUserProfile from './HeaderUserProfile.vue'

const props = defineProps<{
  scroller?: HTMLElement | null
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const route = useRoute()
const isElevated = ref(false)

function syncElevated() {
  const el = props.scroller
  isElevated.value = !!el && el.scrollTop > 0
}

function bindScroller(scroller: HTMLElement | null | undefined) {
  if (!scroller) {
    isElevated.value = false
    return () => {}
  }

  const onScroll = () => syncElevated()
  scroller.addEventListener('scroll', onScroll, { passive: true })
  syncElevated()
  return () => scroller.removeEventListener('scroll', onScroll)
}

let cleanup: (() => void) | null = null

const pageTitle = computed(() => {
  const fromMap = findSiteMapItemByPath(route.path)
  if (fromMap) return fromMap.title
  const meta = route.meta.title
  return typeof meta === 'string' ? meta : 'SecureGuard'
})

watch(
  pageTitle,
  (title) => {
    document.title = `${title} · SecureGuard`
  },
  { immediate: true },
)

watch(
  () => props.scroller,
  (next) => {
    cleanup?.()
    cleanup = bindScroller(next)
  },
  { immediate: true },
)

onUnmounted(() => cleanup?.())
</script>

<template>
  <header
    class="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 md:px-6"
    :class="[
      isElevated
        ? 'border-slate-200/90 bg-white/80 shadow-sm shadow-slate-900/5 supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:backdrop-blur'
        : 'border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur',
    ]"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
      <button
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="切换菜单"
        @click="emit('toggleSidebar')"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-base font-semibold tracking-tight text-slate-900 md:text-lg">
          {{ pageTitle }}
        </h1>
        <p class="mt-0.5 truncate text-xs text-slate-500">
          SecureGuard · 科技守护童年
        </p>
      </div>
    </div>
    <div class="flex shrink-0 items-center gap-2 md:gap-3">
      <HeaderNotifications />
      <HeaderUserProfile />
    </div>
  </header>
</template>
