<script setup lang="ts">
import type { DrawTool } from '../../data/environmentDataset'

const props = defineProps<{
  activeTool: DrawTool
}>()

const emit = defineEmits<{
  'update:tool': [value: DrawTool]
  remove: []
}>()

const tools: Array<{ value: DrawTool; label: string }> = [
  { value: 'select', label: '选择' },
  { value: 'hand', label: '平移' },
  { value: 'rect', label: '矩形' },
  { value: 'polygon', label: '多边形' },
]
</script>

<template>
  <aside class="w-20 shrink-0 rounded-2xl bg-white p-2 shadow-sm">
    <div class="flex flex-col gap-2">
      <button
        v-for="tool in tools"
        :key="tool.value"
        type="button"
        class="rounded-lg px-2 py-2 text-xs transition"
        :class="
          props.activeTool === tool.value
            ? 'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200'
            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
        "
        @click="emit('update:tool', tool.value)"
      >
        {{ tool.label }}
      </button>
      <button
        type="button"
        class="mt-2 rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-xs text-red-600 hover:bg-red-100"
        @click="emit('remove')"
      >
        删除
      </button>
    </div>
  </aside>
</template>
