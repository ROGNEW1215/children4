<script setup lang="ts">
import { computed, ref } from 'vue'
import { zoneTypeTheme, type DrawTool, type Point, type ZoneModel } from '../../data/environmentDataset'

const props = defineProps<{
  zones: ZoneModel[]
  selectedZoneId: string | null
  activeTool: DrawTool
  draftPolygon: Point[]
  draftRect: { start: Point; end: Point } | null
  transformStyle: string
  zoomPercent: string
  frameUrl: string
  conflictZoneIds: Set<string>
}>()

const emit = defineEmits<{
  select: [id: string | null]
  wheelZoom: [step: number]
  panStart: [point: Point]
  panMove: [point: Point]
  panEnd: []
  rectStart: [point: Point]
  rectMove: [point: Point]
  rectEnd: []
  polygonPoint: [point: Point]
  polygonCommit: []
  cancel: []
}>()

const canvasRef = ref<HTMLElement | null>(null)

const defaultSize = { width: 800, height: 500 }

const draftRectPoints = computed(() => {
  if (!props.draftRect) return ''
  const minX = Math.min(props.draftRect.start.x, props.draftRect.end.x)
  const maxX = Math.max(props.draftRect.start.x, props.draftRect.end.x)
  const minY = Math.min(props.draftRect.start.y, props.draftRect.end.y)
  const maxY = Math.max(props.draftRect.start.y, props.draftRect.end.y)
  return `${minX},${minY} ${maxX},${minY} ${maxX},${maxY} ${minX},${maxY}`
})

const draftPolygonPoints = computed(() => props.draftPolygon.map((p) => `${p.x},${p.y}`).join(' '))

function getPoint(event: MouseEvent): Point {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  const x = ((event.clientX - rect.left) / rect.width) * defaultSize.width
  const y = ((event.clientY - rect.top) / rect.height) * defaultSize.height
  return {
    x: Math.max(0, Math.min(defaultSize.width, x)),
    y: Math.max(0, Math.min(defaultSize.height, y)),
  }
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  emit('wheelZoom', event.deltaY > 0 ? -0.1 : 0.1)
}

function onMouseDown(event: MouseEvent) {
  const point = getPoint(event)
  if (props.activeTool === 'hand' || event.button === 1) {
    emit('panStart', { x: event.clientX, y: event.clientY })
    return
  }
  if (props.activeTool === 'rect') {
    emit('rectStart', point)
  }
}

function onMouseMove(event: MouseEvent) {
  if (props.activeTool === 'hand') {
    emit('panMove', { x: event.clientX, y: event.clientY })
    return
  }
  if (props.activeTool === 'rect') {
    emit('rectMove', getPoint(event))
  }
}

function onMouseUp() {
  if (props.activeTool === 'hand') {
    emit('panEnd')
    return
  }
  if (props.activeTool === 'rect') emit('rectEnd')
}

function onCanvasClick(event: MouseEvent) {
  const point = getPoint(event)
  if (props.activeTool === 'select') emit('select', null)
  if (props.activeTool === 'polygon') emit('polygonPoint', point)
}

function onCanvasDblClick() {
  if (props.activeTool === 'polygon') emit('polygonCommit')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('cancel')
  if (props.activeTool === 'polygon' && event.key === 'Enter') emit('polygonCommit')
}
</script>

<template>
  <section class="relative flex-1 overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
    <div class="absolute bottom-3 left-3 z-20 rounded-lg bg-white px-2 py-1 text-xs text-slate-600 shadow">
      缩放 {{ props.zoomPercent }}
    </div>
    <div
      ref="canvasRef"
      class="relative m-auto h-full max-h-[700px] w-full max-w-[1000px] origin-center"
      tabindex="0"
      @keydown="onKeydown"
      @wheel="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @click="onCanvasClick"
      @dblclick="onCanvasDblClick"
    >
      <div
        class="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-slate-300 shadow-xl"
        :style="{ transform: props.transformStyle }"
      >
        <img :src="props.frameUrl" alt="camera frame" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-black/10" />
        <svg class="absolute inset-0 h-full w-full">
          <polygon
            v-for="zone in props.zones"
            v-show="!zone.hidden"
            :key="zone.id"
            :points="zone.points.map((p) => `${p.x},${p.y}`).join(' ')"
            :fill="zoneTypeTheme[zone.type].fill"
            :stroke="props.selectedZoneId === zone.id ? '#2563eb' : zoneTypeTheme[zone.type].stroke"
            :stroke-width="props.selectedZoneId === zone.id ? 3 : 2"
            class="cursor-pointer transition"
            @click.stop="emit('select', zone.id)"
          />
          <polygon
            v-if="draftRectPoints"
            :points="draftRectPoints"
            fill="rgba(37,99,235,0.2)"
            stroke="#2563eb"
            stroke-width="2"
            stroke-dasharray="4 4"
          />
          <polyline
            v-if="draftPolygonPoints"
            :points="draftPolygonPoints"
            fill="rgba(37,99,235,0.15)"
            stroke="#2563eb"
            stroke-width="2"
            stroke-dasharray="4 4"
          />
          <text
            v-for="zone in props.zones"
            v-show="!zone.hidden"
            :key="`${zone.id}-name`"
            :x="zone.points[0]?.x + 6"
            :y="zone.points[0]?.y - 4"
            fill="#0f172a"
            font-size="11"
          >
            {{ zone.name }}<tspan v-if="props.conflictZoneIds.has(zone.id)"> (冲突)</tspan>
          </text>
        </svg>
      </div>
    </div>
  </section>
</template>
