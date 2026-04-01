<script setup lang="ts">
import type { CameraOption } from '../../data/environmentDataset'

const props = defineProps<{
  cameras: CameraOption[]
  selectedCameraId: string
}>()

const emit = defineEmits<{
  refresh: []
  save: []
  'update:selectedCameraId': [value: string]
}>()

function onCameraChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:selectedCameraId', target.value)
}
</script>

<template>
  <header class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-bold text-slate-800">环境规则配置</h1>
      <select
        :value="props.selectedCameraId"
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        @change="onCameraChange"
      >
        <option v-for="item in props.cameras" :key="item.id" :value="item.id">{{ item.label }}</option>
      </select>
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        @click="emit('refresh')"
      >
        刷新抓帧
      </button>
      <button
        type="button"
        class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
        @click="emit('save')"
      >
        保存并下发规则
      </button>
    </div>
  </header>
</template>
