<script setup lang="ts">
import { computed } from 'vue'
import {
  ruleConditionOptions,
  zoneTypeOptions,
  zoneTypeTheme,
  type RuleCondition,
  type ZoneModel,
  type ZoneType,
} from '../../data/environmentDataset'

const props = defineProps<{
  zones: ZoneModel[]
  selectedZone: ZoneModel | null
  hasConflict: boolean
  conflictZoneIds: Set<string>
}>()

const emit = defineEmits<{
  select: [id: string]
  toggleHidden: [id: string]
  updateName: [value: string]
  updateType: [value: ZoneType]
  updateCondition: [value: RuleCondition]
}>()

const selectedName = computed(() => props.selectedZone?.name ?? '')
const selectedType = computed(() => props.selectedZone?.type ?? 'danger')
const selectedCondition = computed(() => props.selectedZone?.rule.condition ?? 'enter')

function onNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('updateName', target.value)
}

function onTypeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('updateType', target.value as ZoneType)
}

function onConditionChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('updateCondition', target.value as RuleCondition)
}
</script>

<template>
  <aside class="w-80 shrink-0 rounded-2xl bg-white shadow-sm">
    <div class="border-b border-slate-100 px-4 py-3">
      <h2 class="text-sm font-bold text-slate-800">区域规则面板</h2>
      <p v-if="props.hasConflict" class="mt-1 text-xs text-red-600">检测到区域重叠，高危规则将优先。</p>
    </div>

    <div class="space-y-4 p-4">
      <section>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">区域列表</p>
        <div class="space-y-2">
          <button
            v-for="item in props.zones"
            :key="item.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left transition"
            :class="
              props.selectedZone?.id === item.id
                ? 'border-blue-200 bg-blue-50'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            "
            @click="emit('select', item.id)"
          >
            <span
              class="h-2.5 w-2.5 rounded-full"
              :style="{ backgroundColor: zoneTypeTheme[item.type].stroke }"
            />
            <span class="min-w-0 flex-1 truncate text-sm text-slate-700">{{ item.name }}</span>
            <span
              v-if="props.conflictZoneIds.has(item.id)"
              class="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-600"
            >
              冲突
            </span>
            <button
              type="button"
              class="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
              @click.stop="emit('toggleHidden', item.id)"
            >
              {{ item.hidden ? '显示' : '隐藏' }}
            </button>
          </button>
        </div>
      </section>

      <section v-if="props.selectedZone" class="space-y-3 border-t border-slate-100 pt-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">属性定义</p>
        <div>
          <label class="mb-1 block text-xs text-slate-500">区域名称</label>
          <input
            :value="selectedName"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            @input="onNameInput"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-500">区域属性</label>
          <select
            :value="selectedType"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            @change="onTypeChange"
          >
            <option v-for="opt in zoneTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-500">触发条件</label>
          <select
            :value="selectedCondition"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            @change="onConditionChange"
          >
            <option v-for="opt in ruleConditionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </section>
    </div>
  </aside>
</template>
