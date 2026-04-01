<script setup lang="ts">
import { computed, ref } from 'vue'
import EnvironmentCanvas from '../components/environment/EnvironmentCanvas.vue'
import EnvironmentRulesPanel from '../components/environment/EnvironmentRulesPanel.vue'
import EnvironmentToolPalette from '../components/environment/EnvironmentToolPalette.vue'
import EnvironmentTopBar from '../components/environment/EnvironmentTopBar.vue'
import { useEnvironmentCanvas } from '../composables/useEnvironmentCanvas'
import { cameraOptions, initialZones } from '../data/environmentDataset'

const canvasSize = { width: 800, height: 500 }

const selectedCameraId = ref(cameraOptions[0].id)
const {
  zones,
  activeTool,
  selectedZoneId,
  selectedZone,
  draftPolygon,
  draftRect,
  transformStyle,
  zoomPercent,
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
} = useEnvironmentCanvas(initialZones, canvasSize)

const lastSavedAt = ref('')

const currentCamera = computed(
  () => cameraOptions.find((item) => item.id === selectedCameraId.value) ?? cameraOptions[0],
)

function refreshFrame() {
  lastSavedAt.value = ''
}

function handleSave() {
  if (zones.value.length === 0) {
    window.alert('请至少绘制一个区域后再保存。')
    return
  }
  if (zones.value.some((item) => item.name.trim().length === 0)) {
    window.alert('请为所有区域填写名称。')
    return
  }
  if (hasConflict.value) {
    const pass = window.confirm('检测到区域冲突，系统将默认高危规则优先，是否继续保存？')
    if (!pass) return
  }
  const payload = zones.value.map((zone) => ({
    id: zone.id,
    name: zone.name,
    type: zone.type,
    rule: zone.rule,
    points: zone.points.map((point) => ({
      x: Math.round((point.x / canvasSize.width) * currentCamera.value.sourceSize.width),
      y: Math.round((point.y / canvasSize.height) * currentCamera.value.sourceSize.height),
    })),
  }))
  console.log('environment-save-payload', payload)
  lastSavedAt.value = new Date().toLocaleString()
}
</script>

<template>
  <section class="text-left">
    <EnvironmentTopBar
      :cameras="cameraOptions"
      :selected-camera-id="selectedCameraId"
      @update:selected-camera-id="selectedCameraId = $event"
      @refresh="refreshFrame"
      @save="handleSave"
    />
    <div class="flex gap-4">
      <EnvironmentToolPalette
        :active-tool="activeTool"
        @update:tool="setTool"
        @remove="removeSelectedZone"
      />
      <EnvironmentCanvas
        :zones="zones"
        :selected-zone-id="selectedZoneId"
        :active-tool="activeTool"
        :draft-polygon="draftPolygon"
        :draft-rect="draftRect"
        :transform-style="transformStyle"
        :zoom-percent="zoomPercent"
        :frame-url="currentCamera.frameUrl"
        :conflict-zone-ids="conflictZoneIds"
        @select="selectZone"
        @wheel-zoom="zoomBy"
        @pan-start="startPan"
        @pan-move="updatePan"
        @pan-end="endPan"
        @rect-start="startRectDraft"
        @rect-move="updateRectDraft"
        @rect-end="finishRectDraft"
        @polygon-point="pushPolygonPoint"
        @polygon-commit="commitPolygonDraft"
        @cancel="cancelDraft"
      />
      <EnvironmentRulesPanel
        :zones="zones"
        :selected-zone="selectedZone"
        :has-conflict="hasConflict"
        :conflict-zone-ids="conflictZoneIds"
        @select="selectZone"
        @toggle-hidden="toggleZoneHidden"
        @update-name="updateSelectedZone({ name: $event })"
        @update-type="updateSelectedZone({ type: $event })"
        @update-condition="
          updateSelectedZone({ rule: { ...(selectedZone?.rule ?? { target: 'allChildren' }), condition: $event } })
        "
      />
    </div>
    <p v-if="lastSavedAt" class="mt-3 text-xs text-slate-500">最近保存：{{ lastSavedAt }}</p>
  </section>
</template>
