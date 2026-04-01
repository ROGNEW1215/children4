import { computed, ref } from 'vue'
import type { DrawTool, Point, ZoneModel, ZoneType } from '../data/environmentDataset'

interface CanvasSize {
  width: number
  height: number
}

function generateId() {
  return `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function toPointString(points: Point[]) {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

function bounds(points: Point[]) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

export function useEnvironmentCanvas(initialZones: ZoneModel[], canvasSize: CanvasSize) {
  const zones = ref<ZoneModel[]>(initialZones.map((z) => ({ ...z, points: z.points.map((p) => ({ ...p })) })))
  const activeTool = ref<DrawTool>('select')
  const selectedZoneId = ref<string | null>(zones.value[0]?.id ?? null)
  const draftPolygon = ref<Point[]>([])
  const draftRect = ref<{ start: Point; end: Point } | null>(null)

  const zoom = ref(1)
  const pan = ref({ x: 0, y: 0 })
  const isPanning = ref(false)
  const panStart = ref<Point | null>(null)

  const conflictZoneIds = computed(() => {
    const hits = new Set<string>()
    const visible = zones.value.filter((z) => !z.hidden)
    for (let i = 0; i < visible.length; i += 1) {
      for (let j = i + 1; j < visible.length; j += 1) {
        const a = visible[i]
        const b = visible[j]
        const ba = bounds(a.points)
        const bb = bounds(b.points)
        const overlap = ba.minX < bb.maxX && ba.maxX > bb.minX && ba.minY < bb.maxY && ba.maxY > bb.minY
        if (overlap) {
          hits.add(a.id)
          hits.add(b.id)
        }
      }
    }
    return hits
  })

  const hasConflict = computed(() =>
    zones.value.some((z) => z.type === 'danger' && conflictZoneIds.value.has(z.id)),
  )

  const selectedZone = computed(() =>
    zones.value.find((item) => item.id === selectedZoneId.value) ?? null,
  )

  const transformStyle = computed(() => `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`)
  const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`)

  function setTool(tool: DrawTool) {
    activeTool.value = tool
    if (tool !== 'polygon') draftPolygon.value = []
    if (tool !== 'rect') draftRect.value = null
  }

  function selectZone(id: string | null) {
    selectedZoneId.value = id
  }

  function addRect(start: Point, end: Point, type: ZoneType = 'danger') {
    const minX = Math.max(0, Math.min(start.x, end.x))
    const maxX = Math.min(canvasSize.width, Math.max(start.x, end.x))
    const minY = Math.max(0, Math.min(start.y, end.y))
    const maxY = Math.min(canvasSize.height, Math.max(start.y, end.y))
    if (Math.abs(maxX - minX) < 8 || Math.abs(maxY - minY) < 8) return
    const id = generateId()
    zones.value.push({
      id,
      name: `区域 ${zones.value.length + 1}`,
      type,
      hidden: false,
      points: [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ],
      rule: { condition: 'enter', target: 'allChildren' },
    })
    selectedZoneId.value = id
  }

  function addPolygon(points: Point[], type: ZoneType = 'danger') {
    if (points.length < 3) return
    const id = generateId()
    zones.value.push({
      id,
      name: `区域 ${zones.value.length + 1}`,
      type,
      hidden: false,
      points,
      rule: { condition: 'enter', target: 'allChildren' },
    })
    selectedZoneId.value = id
  }

  function removeSelectedZone() {
    if (!selectedZoneId.value) return
    zones.value = zones.value.filter((item) => item.id !== selectedZoneId.value)
    selectedZoneId.value = zones.value[0]?.id ?? null
  }

  function toggleZoneHidden(zoneId: string) {
    zones.value = zones.value.map((item) =>
      item.id === zoneId ? { ...item, hidden: !item.hidden } : item,
    )
  }

  function updateSelectedZone(payload: Partial<Pick<ZoneModel, 'name' | 'type' | 'rule'>>) {
    if (!selectedZoneId.value) return
    zones.value = zones.value.map((item) => {
      if (item.id !== selectedZoneId.value) return item
      return {
        ...item,
        ...payload,
      }
    })
  }

  function startRectDraft(point: Point) {
    draftRect.value = { start: point, end: point }
  }

  function updateRectDraft(point: Point) {
    if (!draftRect.value) return
    draftRect.value = {
      start: draftRect.value.start,
      end: point,
    }
  }

  function finishRectDraft() {
    if (!draftRect.value) return
    addRect(draftRect.value.start, draftRect.value.end)
    draftRect.value = null
  }

  function pushPolygonPoint(point: Point) {
    draftPolygon.value.push(point)
  }

  function commitPolygonDraft() {
    addPolygon(draftPolygon.value.map((p) => ({ ...p })))
    draftPolygon.value = []
  }

  function cancelDraft() {
    draftPolygon.value = []
    draftRect.value = null
  }

  function zoomBy(step: number) {
    zoom.value = Math.max(0.5, Math.min(zoom.value + step, 3))
  }

  function startPan(cursor: Point) {
    isPanning.value = true
    panStart.value = { x: cursor.x - pan.value.x, y: cursor.y - pan.value.y }
  }

  function updatePan(cursor: Point) {
    if (!isPanning.value || !panStart.value) return
    pan.value = {
      x: cursor.x - panStart.value.x,
      y: cursor.y - panStart.value.y,
    }
  }

  function endPan() {
    isPanning.value = false
    panStart.value = null
  }

  function toZonePointString(points: Point[]) {
    return toPointString(points)
  }

  return {
    zones,
    activeTool,
    selectedZoneId,
    selectedZone,
    draftPolygon,
    draftRect,
    zoom,
    zoomPercent,
    pan,
    transformStyle,
    hasConflict,
    conflictZoneIds,
    setTool,
    selectZone,
    removeSelectedZone,
    toggleZoneHidden,
    updateSelectedZone,
    startRectDraft,
    updateRectDraft,
    finishRectDraft,
    pushPolygonPoint,
    commitPolygonDraft,
    cancelDraft,
    zoomBy,
    startPan,
    updatePan,
    endPan,
    toZonePointString,
  }
}
