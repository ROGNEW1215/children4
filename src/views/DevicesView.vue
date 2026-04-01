<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DeviceTopologyGraph from '../components/devices/DeviceTopologyGraph.vue'
import { useDeviceRealtime } from '../composables/useDeviceRealtime'
import {
  deviceStatusOptions,
  deviceTypeOptions,
  filterDeviceRecords,
  getDeviceDataset,
  type DeviceRecord,
  type DeviceStatus,
  type DeviceType,
  type ViewMode,
} from '../data/deviceDataset'

const dataset = ref(getDeviceDataset())
const viewMode = ref<ViewMode>('topology')
const keyword = ref('')
const typeFilter = ref<'all' | DeviceType>('all')
const statusFilter = ref<'all' | DeviceStatus>('all')
const drawerOpen = ref(false)
const rebootModalOpen = ref(false)
const selectedDevice = ref<DeviceRecord | null>(null)
const confirmPassword = ref('')

const realtime = useDeviceRealtime()

const onlineRate = computed(() =>
  Math.round((dataset.value.kpi.onlineDevices / dataset.value.kpi.totalDevices) * 1000) / 10,
)

const filteredDevices = computed(() =>
  filterDeviceRecords(dataset.value.devices, keyword.value, typeFilter.value, statusFilter.value),
)

function openDrawerById(deviceId: string) {
  const hit = dataset.value.devices.find((item) => item.id === deviceId)
  if (!hit) return
  selectedDevice.value = hit
  drawerOpen.value = true
}

function openDrawer(device: DeviceRecord) {
  selectedDevice.value = device
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

function openRebootModal() {
  rebootModalOpen.value = true
}

function closeRebootModal() {
  rebootModalOpen.value = false
  confirmPassword.value = ''
}

function syncKpi() {
  const onlineDevices = dataset.value.devices.filter((d) => d.status === 'online').length
  const tamperAlerts = dataset.value.devices.filter((d) => d.status === 'alert').length
  dataset.value.kpi.onlineDevices = onlineDevices
  dataset.value.kpi.tamperAlerts = tamperAlerts
}

function updateTopologyState() {
  dataset.value.nodes = dataset.value.nodes.map((node) => {
    const device = dataset.value.devices.find((item) => item.id === node.id)
    return device ? { ...node, status: device.status } : node
  })
  dataset.value.links = dataset.value.links.map((link) => {
    const target = dataset.value.devices.find((item) => item.id === link.target)
    return target ? { ...link, status: target.status } : link
  })
}

onMounted(() => {
  realtime.connect({
    intervalMs: 7000,
    onMessage: (payload) => {
      const index = dataset.value.devices.findIndex((item) => item.id === payload.deviceId)
      if (index < 0) return
      const next = { ...dataset.value.devices[index] }
      if (payload.status) next.status = payload.status
      if (payload.upRate) next.upRate = payload.upRate
      if (payload.downRate) next.downRate = payload.downRate
      dataset.value.devices.splice(index, 1, next)
      syncKpi()
      updateTopologyState()
      if (selectedDevice.value?.id === next.id) {
        selectedDevice.value = next
      }
    },
  })
})
</script>

<template>
  <section class="text-left">
    <header class="mb-5">
      <h1 class="text-2xl font-bold text-slate-800">设备与节点状态</h1>
      <p class="mt-1 text-sm text-slate-500">核心路由、边缘算力与终端摄像头拓扑联动</p>
    </header>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">接入设备总数</p>
        <p class="mt-2 text-3xl font-bold text-slate-800">{{ dataset.kpi.totalDevices }}</p>
      </article>
      <article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">在线率</p>
        <p class="mt-2 text-3xl font-bold text-slate-800">{{ onlineRate }}%</p>
        <p class="text-xs text-emerald-600">
          {{ dataset.kpi.onlineDevices }} / {{ dataset.kpi.totalDevices }} 在线
        </p>
      </article>
      <article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">防拆告警数</p>
        <p class="mt-2 text-3xl font-bold text-red-500">{{ dataset.kpi.tamperAlerts }}</p>
      </article>
      <article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">边缘节点负载</p>
        <p class="mt-2 text-sm text-slate-700">
          CPU {{ dataset.kpi.edgeCpuLoad }}% · GPU {{ dataset.kpi.edgeGpuLoad }}%
        </p>
      </article>
    </div>

    <section class="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex rounded-lg border border-slate-100 bg-slate-50 p-1">
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm text-slate-600 transition"
              :class="{ 'bg-white font-semibold text-blue-600 shadow-sm': viewMode === 'topology' }"
              @click="viewMode = 'topology'"
            >
              拓扑视图
            </button>
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm text-slate-600 transition"
              :class="{ 'bg-white font-semibold text-blue-600 shadow-sm': viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              列表视图
            </button>
          </div>

          <input
            v-model="keyword"
            type="text"
            placeholder="IP / MAC / 别名 / SN"
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            v-model="typeFilter"
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option v-for="item in deviceTypeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>

          <select
            v-model="statusFilter"
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option v-for="item in deviceStatusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
          >
            + 录入新设备
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            @click="openRebootModal"
          >
            批量重启
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            固件升级
          </button>
        </div>
      </div>
    </section>

    <section class="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div v-if="viewMode === 'topology'">
        <p class="mb-3 text-xs text-slate-500">支持缩放与拖拽，点击节点查看设备详情</p>
        <DeviceTopologyGraph
          :nodes="dataset.nodes"
          :links="dataset.links"
          @node-click="openDrawerById"
        />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th class="px-4 py-3 text-left">设备信息</th>
              <th class="px-4 py-3 text-left">网络信息</th>
              <th class="px-4 py-3 text-left">AI 绑定状态</th>
              <th class="px-4 py-3 text-left">运行状态</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="device in filteredDevices" :key="device.id" class="hover:bg-slate-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-800">{{ device.name }}</p>
                <p class="text-xs text-slate-400">SN: {{ device.sn }}</p>
              </td>
              <td class="px-4 py-3 font-mono text-xs">
                <p>{{ device.ip }} ({{ device.ipMode === 'static' ? '静态' : 'DHCP' }})</p>
                <p class="text-slate-400">{{ device.mac }}</p>
              </td>
              <td class="px-4 py-3">
                <span class="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                  {{ device.aiBinding }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded px-2 py-1 text-xs font-semibold"
                  :class="
                    device.status === 'online'
                      ? 'bg-emerald-50 text-emerald-700'
                      : device.status === 'alert'
                        ? 'animate-pulse bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{
                    device.status === 'online'
                      ? '在线'
                      : device.status === 'alert'
                        ? '防拆告警'
                        : '离线'
                  }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                  @click="openDrawer(device)"
                >
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="fade">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        @click="closeDrawer"
      />
    </Transition>
    <aside
      class="drawer fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-auto border-l border-slate-100 bg-white shadow-2xl"
      :class="{ 'drawer-open': drawerOpen }"
    >
      <div v-if="selectedDevice" class="p-5">
        <div class="mb-4 flex items-start justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-800">{{ selectedDevice.name }}</h3>
            <p class="text-xs text-slate-500">{{ selectedDevice.ip }}</p>
          </div>
          <button type="button" class="rounded bg-slate-100 px-2 py-1 text-sm" @click="closeDrawer">
            关闭
          </button>
        </div>
        <div class="space-y-3 text-sm">
          <p><span class="text-slate-400">MAC：</span>{{ selectedDevice.mac }}</p>
          <p><span class="text-slate-400">固件：</span>{{ selectedDevice.firmware }}</p>
          <p><span class="text-slate-400">上行：</span>{{ selectedDevice.upRate }}</p>
          <p><span class="text-slate-400">下行：</span>{{ selectedDevice.downRate }}</p>
          <p class="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
            防拆联动：检测到告警时自动触发 App 推送与视频抢传。
          </p>
        </div>
      </div>
    </aside>

    <Transition name="fade">
      <div v-if="rebootModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <h3 class="text-lg font-bold text-slate-800">确认批量重启？</h3>
          <p class="mt-1 text-xs text-slate-500">请输入管理员密码进行二次确认。</p>
          <input
            v-model="confirmPassword"
            type="password"
            class="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="请输入密码"
          />
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="rounded-lg bg-slate-100 px-3 py-2 text-sm" @click="closeRebootModal">
              取消
            </button>
            <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-sm text-white" @click="closeRebootModal">
              确认重启
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.drawer {
  transform: translateX(100%);
  transition: transform 0.25s ease;
}

.drawer-open {
  transform: translateX(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
