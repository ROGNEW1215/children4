<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { findSiteMapItemByPath } from '../../config/siteMap'
import HeaderNotifications from './HeaderNotifications.vue'
import HeaderUserProfile from './HeaderUserProfile.vue'

const emit = defineEmits<{
  toggleSidebar: []
}>()

const route = useRoute()

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
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 md:px-6"
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
