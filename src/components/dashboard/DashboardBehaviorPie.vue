<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const emit = defineEmits<{
  select: [filter: string | 'all']
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const colors = ['#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6']

function buildOrUpdate() {
  const el = canvasRef.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return

  if (chart) {
    chart.data.labels = [...props.labels]
    const ds = chart.data.datasets[0]
    if (ds) ds.data = [...props.values]
    chart.update()
    return
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [...props.labels],
      datasets: [
        {
          data: [...props.values],
          backgroundColor: colors.slice(0, props.labels.length),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 10, usePointStyle: true, padding: 15 },
        },
        tooltip: {
          callbacks: {
            label: (c) => ` ${c.label}: ${c.raw}%`,
          },
        },
      },
      onClick: (_e, elements) => {
        if (elements.length > 0 && chart) {
          const idx = elements[0].index
          const label = chart.data.labels?.[idx]
          emit('select', typeof label === 'string' ? label : 'all')
        } else {
          emit('select', 'all')
        }
      },
    },
  })
}

onMounted(() => buildOrUpdate())

watch(
  () => [props.labels, props.values],
  () => buildOrUpdate(),
  { deep: true },
)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="relative flex h-56 w-full items-center justify-center">
    <canvas ref="canvasRef" />
  </div>
</template>
