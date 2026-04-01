<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import type { TopologyLink, TopologyNode } from '../../data/deviceDataset'

echarts.use([CanvasRenderer, GraphChart, TooltipComponent])

const props = defineProps<{
  nodes: TopologyNode[]
  links: TopologyLink[]
}>()

const emit = defineEmits<{
  nodeClick: [nodeId: string]
}>()

const host = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

function nodeColor(status: TopologyNode['status']) {
  if (status === 'online') return '#10b981'
  if (status === 'alert') return '#ef4444'
  return '#94a3b8'
}

function linkColor(status: TopologyLink['status']) {
  if (status === 'online') return '#2563eb'
  if (status === 'alert') return '#ef4444'
  return '#9ca3af'
}

function renderChart() {
  if (!chart) return
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} -> ${params.data.target}`
        }
        return `${params.data.name}<br/>${params.data.ip}`
      },
    },
    animationDuration: 320,
    series: [
      {
        type: 'graph',
        layout: 'none',
        roam: true,
        draggable: false,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 8,
        label: {
          show: true,
          position: 'bottom',
          color: '#0f172a',
          fontSize: 12,
          formatter: (p: any) => `${p.data.name}\n${p.data.ip}`,
        },
        lineStyle: {
          width: 2,
          curveness: 0.1,
        },
        data: props.nodes.map((node) => ({
          ...node,
          symbolSize: node.category === 'edge' ? 56 : 46,
          itemStyle: {
            color: nodeColor(node.status),
            shadowBlur: node.status === 'alert' ? 20 : 8,
            shadowColor:
              node.status === 'alert' ? 'rgba(239,68,68,0.6)' : 'rgba(37,99,235,0.25)',
          },
        })),
        links: props.links.map((link) => ({
          ...link,
          lineStyle: {
            color: linkColor(link.status),
            type: link.status === 'offline' ? 'dashed' : 'solid',
            width: link.status === 'alert' ? 3 : 2,
          },
        })),
      },
    ],
  })
}

function onResize() {
  chart?.resize()
}

onMounted(() => {
  if (!host.value) return
  chart = echarts.init(host.value)
  chart.on('click', (params: any) => {
    if (params.dataType === 'node' && params.data?.id) {
      emit('nodeClick', params.data.id)
    }
  })
  renderChart()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})

watch(() => [props.nodes, props.links], renderChart, { deep: true })
</script>

<template>
  <div ref="host" class="h-[520px] w-full rounded-2xl bg-slate-50" />
</template>
