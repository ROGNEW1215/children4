<script setup lang="ts">
import type { DashboardKpi } from '../../data/dashboardDataset'

defineProps<{
  kpi: DashboardKpi
}>()

const emit = defineEmits<{
  'click-warnings': []
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
    <button
      type="button"
      class="cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
      @click="emit('click-warnings')"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="mb-1 text-xs font-medium text-slate-500">今日预警总数</p>
          <h3 class="text-2xl font-bold text-slate-800 md:text-3xl">
            {{ kpi.warningsToday }}
          </h3>
        </div>
        <div class="rounded-lg bg-red-50 p-2">
          <svg
            class="h-5 w-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4 flex items-center text-xs">
        <span
          :class="
            kpi.warningDeltaPct <= 0
              ? 'font-medium text-emerald-600'
              : 'font-medium text-red-500'
          "
          class="inline-flex items-center"
        >
          <svg
            v-if="kpi.warningDeltaPct <= 0"
            class="mr-0.5 h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <svg
            v-else
            class="mr-0.5 h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          {{ Math.abs(kpi.warningDeltaPct) }}%
        </span>
        <span class="ml-2 text-slate-400">较昨日</span>
      </div>
    </button>

    <div
      class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="mb-1 text-xs font-medium text-slate-500">设备在线率</p>
          <h3 class="text-2xl font-bold text-slate-800 md:text-3xl">
            {{ kpi.devicesOnline }}/{{ kpi.devicesTotal }}
          </h3>
        </div>
        <div class="rounded-lg bg-emerald-50 p-2">
          <svg
            class="h-5 w-5 text-emerald-600"
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
        </div>
      </div>
      <p class="mt-4 text-xs text-slate-500">{{ kpi.deviceSubtitle }}</p>
    </div>

    <div
      class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="mb-1 text-xs font-medium text-slate-500">危险高发区域</p>
          <h3 class="mt-1 text-xl font-bold text-slate-800 md:text-2xl">
            {{ kpi.hotArea }}
          </h3>
        </div>
        <div class="rounded-lg bg-orange-50 p-2">
          <svg
            class="h-5 w-5 text-orange-500"
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
        </div>
      </div>
      <div class="mt-3">
        <span class="rounded bg-orange-50 px-2 py-1 text-xs text-orange-600">
          {{ kpi.hotAreaHint }}
        </span>
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="mb-1 text-xs font-medium text-slate-500">系统健康度</p>
          <h3 class="text-2xl font-bold text-slate-800 md:text-3xl">
            {{ kpi.latencyMs }}<span class="ml-1 text-sm font-normal text-slate-500">ms</span>
          </h3>
        </div>
        <div class="rounded-lg bg-sky-50 p-2">
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>
      <p class="mt-4 text-xs text-slate-500">{{ kpi.latencyHint }}</p>
    </div>
  </div>
</template>
