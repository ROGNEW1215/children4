<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardLogEntry } from '../../data/dashboardDataset'

const props = defineProps<{
  entries: DashboardLogEntry[]
  filterType: string | 'all'
}>()

const filtered = computed(() => {
  if (props.filterType === 'all') return props.entries
  return props.entries.filter((e) => e.type === props.filterType)
})

function levelClass(level: DashboardLogEntry['level']) {
  if (level === 'high') return 'text-red-600 bg-red-50'
  if (level === 'medium') return 'text-orange-500 bg-orange-50'
  return 'text-emerald-600 bg-emerald-50'
}

function dotClass(level: DashboardLogEntry['level']) {
  if (level === 'high') return 'bg-red-500'
  if (level === 'medium') return 'bg-orange-400'
  return 'bg-emerald-500'
}
</script>

<template>
  <div class="relative flex max-h-[min(420px,55vh)] flex-1 flex-col overflow-y-auto pr-2">
    <div
      class="pointer-events-none absolute left-0 top-0 z-10 h-4 w-full bg-gradient-to-b from-white to-transparent"
    />
    <div class="space-y-0 pt-2">
      <div
        v-for="(log, index) in filtered"
        :key="log.id"
        class="group flex animate-[slideIn_0.3s_ease-out_both] items-start"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="w-16 shrink-0 pt-1 font-mono text-xs text-slate-400">
          {{ log.time }}
        </div>
        <div class="relative flex-1 border-l-2 border-slate-100 pb-4 pl-4">
          <div
            class="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white"
            :class="dotClass(log.level)"
          />
          <div
            class="rounded-lg bg-slate-50 p-3 transition-colors group-hover:bg-sky-50/50"
          >
            <div class="mb-1 flex items-center justify-between">
              <span
                class="rounded px-2 py-0.5 text-xs font-bold"
                :class="levelClass(log.level)"
              >
                {{ log.type }}
              </span>
              <span class="flex items-center text-xs text-slate-500">
                <svg
                  class="mr-1 h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {{ log.loc }}
              </span>
            </div>
            <p class="text-sm text-slate-700">{{ log.msg }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
