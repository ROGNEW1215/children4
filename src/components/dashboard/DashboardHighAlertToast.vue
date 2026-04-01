<script setup lang="ts">
defineProps<{
  show: boolean
  message: string
}>()
</script>

<template>
  <div
    class="pointer-events-none fixed right-6 top-20 z-50 flex max-w-sm items-center rounded-xl bg-red-500 px-6 py-4 text-white shadow-2xl shadow-red-500/40 transition-all duration-300"
    :class="show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'"
    role="status"
    aria-live="assertive"
  >
    <svg
      class="mr-3 h-6 w-6 shrink-0 animate-pulse"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <div>
      <h4 class="text-sm font-bold">高危预警拦截！</h4>
      <p class="mt-0.5 text-xs text-red-100">{{ message }}</p>
    </div>
  </div>
</template>
