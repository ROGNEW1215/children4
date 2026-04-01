<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function buildOrUpdate() {
  const el = canvasRef.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return

  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)')
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0)')

  if (chart) {
    chart.data.labels = [...props.labels]
    const ds = chart.data.datasets[0]
    if (ds) {
      ds.data = [...props.values]
      ds.backgroundColor = gradient
    }
    chart.update()
    return
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...props.labels],
      datasets: [
        {
          label: '预警频次',
          data: [...props.values],
          borderColor: '#2563EB',
          backgroundColor: gradient,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#2563EB',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (c) => `发生预警: ${c.raw} 次`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          border: { display: false },
        },
        x: {
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  })
}

onMounted(() => {
  buildOrUpdate()
})

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
  <div class="h-64 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
