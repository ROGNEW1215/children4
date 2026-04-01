<script setup lang="ts"></script>

<template>
  <div
    class="min-h-dvh flex items-stretch sm:items-center justify-center bg-[#f5f7fa] px-0 sm:px-4 py-0 sm:py-8"
  >
    <div
      class="w-full max-w-none min-h-dvh sm:min-h-0 sm:max-w-[480px] rounded-none sm:rounded-2xl bg-white shadow-none sm:shadow-[0_10px_40px_-10px_rgba(15,23,42,0.12),0_4px_16px_-4px_rgba(15,23,42,0.08)] flex flex-col"
    >
      <div class="flex-1 flex flex-col p-6 sm:p-8 text-left">
        <router-view />
      </div>
    </div>
  </div>
</template>
