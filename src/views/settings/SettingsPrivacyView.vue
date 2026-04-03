<script setup lang="ts">
import { computed, ref } from 'vue'

type ApprovalScope = 'video' | 'video-log' | 'log'
type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface AccessHistoryItem {
  time: string
  detail: string
  tone: 'success' | 'neutral' | 'info'
}

interface ApprovalRequest {
  id: string
  applicantName: string
  applicantShort: string
  childName: string
  reason: string
  scope: ApprovalScope
  status: ApprovalStatus
  rejectReason?: string
  history: AccessHistoryItem[]
}

type DangerAction = 'disable-thermal' | 'disable-blur' | 'retention-below-compliance'

const thermalEnabled = ref(false)
const blurEnabled = ref(true)
const cacheHours = ref<'24' | '48' | '168'>('48')
const retentionDays = ref(180)
const lastSafeRetentionDays = ref(180)
const isLockdownMode = ref(false)

const demoPreviewSrc = '/yolo-demo.mp4'

const approvalRequests = ref<ApprovalRequest[]>([
  {
    id: 'req-1',
    applicantName: '王爸爸',
    applicantShort: '王',
    childName: '大二班 - 王小明',
    reason: '孩子今天感冒刚来园区，想偶尔查看午休情况。',
    scope: 'video-log',
    status: 'pending',
    history: [
      { time: '2026-03-28 14:00:22', detail: '获取了大二班主摄 10 分钟实时查看流，已正常结束。', tone: 'success' },
      { time: '2026-03-25 09:15:00', detail: '权限到期自动回收，系统通过实时通道断连。', tone: 'neutral' },
      { time: '2026-03-24 08:30:00', detail: '系统管理员审批通过了视频查阅权限。', tone: 'info' },
    ],
  },
  {
    id: 'req-2',
    applicantName: '李妈妈',
    applicantShort: '李',
    childName: '小一班 - 李小华',
    reason: '申请接收每日异常越界行为推送。',
    scope: 'log',
    status: 'pending',
    history: [
      { time: '2026-03-26 16:22:11', detail: '接收了 1 条越界告警日志推送。', tone: 'success' },
      { time: '2026-03-20 18:00:00', detail: '历史权限过期，已自动回收。', tone: 'neutral' },
    ],
  },
])

const isRejectModalOpen = ref(false)
const rejectReason = ref('')
const rejectTargetId = ref<string | null>(null)
const rejectError = ref('')

const isDangerModalOpen = ref(false)
const dangerAction = ref<DangerAction | null>(null)
const dangerMessage = ref('')
const rollbackRetentionDays = ref<number | null>(null)

const isDrawerOpen = ref(false)
const activeRequestId = ref<string | null>(null)

const privacyLevel = computed(() => {
  if (thermalEnabled.value) return '最高级（红外替代）'
  if (blurEnabled.value) return '部分遮挡（AI 打码）'
  return '全透传（无保护）'
})

const privacyToneClass = computed(() => {
  if (thermalEnabled.value) return 'text-rose-600'
  if (blurEnabled.value) return 'text-amber-600'
  return 'text-slate-500'
})

const activeRequest = computed(() =>
  approvalRequests.value.find((item) => item.id === activeRequestId.value) ?? null,
)

const pendingCount = computed(
  () => approvalRequests.value.filter((item) => item.status === 'pending').length,
)

function scopeLabel(scope: ApprovalScope): string {
  if (scope === 'video') return '仅视频'
  if (scope === 'video-log') return '视频 + 日志'
  return '仅日志推送'
}

function openDangerModal(action: DangerAction, message: string) {
  dangerAction.value = action
  dangerMessage.value = message
  isDangerModalOpen.value = true
}

function closeDangerModal() {
  dangerAction.value = null
  dangerMessage.value = ''
  rollbackRetentionDays.value = null
  isDangerModalOpen.value = false
}

function onThermalToggle() {
  if (thermalEnabled.value) {
    blurEnabled.value = true
    return
  }
  openDangerModal('disable-thermal', '关闭红外模式将恢复实景视频传输，可能增加隐私泄露风险。')
}

function onBlurToggle() {
  if (thermalEnabled.value) {
    blurEnabled.value = true
    return
  }
  if (!blurEnabled.value) {
    openDangerModal('disable-blur', '关闭 AI 实时打码将直接暴露儿童面部特征。')
  }
}

function onRetentionInput(value: number) {
  if (value < 180 && lastSafeRetentionDays.value >= 180) {
    rollbackRetentionDays.value = lastSafeRetentionDays.value
    openDangerModal(
      'retention-below-compliance',
      `当前设置 ${value} 天，低于建议的 180 天合规周期，超期数据将执行不可恢复销毁。`,
    )
  } else {
    lastSafeRetentionDays.value = value
  }
}

function confirmDangerAction() {
  if (dangerAction.value === 'disable-thermal') {
    thermalEnabled.value = false
  }
  if (dangerAction.value === 'disable-blur') {
    blurEnabled.value = false
  }
  if (dangerAction.value === 'retention-below-compliance') {
    lastSafeRetentionDays.value = retentionDays.value
  }
  closeDangerModal()
}

function cancelDangerAction() {
  if (dangerAction.value === 'disable-thermal') {
    thermalEnabled.value = true
  }
  if (dangerAction.value === 'disable-blur') {
    blurEnabled.value = true
  }
  if (dangerAction.value === 'retention-below-compliance') {
    retentionDays.value = rollbackRetentionDays.value ?? 180
  }
  closeDangerModal()
}

function approveRequest(id: string) {
  const target = approvalRequests.value.find((item) => item.id === id)
  if (!target || target.status !== 'pending') return
  target.status = 'approved'
}

function openRejectModal(id: string) {
  rejectTargetId.value = id
  rejectReason.value = ''
  rejectError.value = ''
  isRejectModalOpen.value = true
}

function closeRejectModal() {
  rejectTargetId.value = null
  rejectReason.value = ''
  rejectError.value = ''
  isRejectModalOpen.value = false
}

function submitReject() {
  const reason = rejectReason.value.trim()
  if (!reason) {
    rejectError.value = '必须填写回绝理由后才能提交。'
    return
  }
  const target = approvalRequests.value.find((item) => item.id === rejectTargetId.value)
  if (!target || target.status !== 'pending') return
  target.status = 'rejected'
  target.rejectReason = reason
  closeRejectModal()
}

function openHistoryDrawer(id: string) {
  activeRequestId.value = id
  isDrawerOpen.value = true
}

function closeHistoryDrawer() {
  isDrawerOpen.value = false
}

function triggerLockdown() {
  isLockdownMode.value = true
  thermalEnabled.value = true
  blurEnabled.value = true
}

function releaseLockdown() {
  isLockdownMode.value = false
}
</script>

<template>
  <div class="space-y-6 text-left">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">隐私与授权控制</h1>
        <p class="mt-1 text-sm text-slate-500">全局合规策略、边缘脱敏配置与家长访问审批流</p>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold"
          :class="
            isLockdownMode
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          "
        >
          <span
            class="mr-2 inline-block h-2 w-2 rounded-full"
            :class="isLockdownMode ? 'bg-rose-500' : 'bg-emerald-500'"
          />
          {{ isLockdownMode ? '核心防御介入中' : '系统安全运行中' }}
        </span>
      </div>
    </header>

    <section
      v-if="isLockdownMode"
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"
    >
      <div>
        <p class="text-sm font-semibold text-rose-700">物理防拆联动已触发：隐私等级已提升至最高级</p>
        <p class="text-xs text-rose-600">系统已切断外部远程访问，边缘节点仅输出脱敏结果。</p>
      </div>
      <button
        type="button"
        class="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        @click="releaseLockdown"
      >
        解除锁定
      </button>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">全局脱敏控制</h2>
            <p class="mt-1 text-xs text-slate-500">
              当前级别：<span class="font-semibold" :class="privacyToneClass">{{ privacyLevel }}</span>
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            @click="triggerLockdown"
          >
            模拟防拆告警
          </button>
        </div>

        <div class="relative mb-6 h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <video
            :src="demoPreviewSrc"
            class="h-full w-full object-cover transition duration-500"
            :class="{ 'thermal-filter': thermalEnabled }"
            muted
            loop
            playsinline
            autoplay
          />
          <div v-if="blurEnabled && !thermalEnabled" class="absolute inset-0">
            <div
              class="absolute left-[46%] top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
            />
          </div>
          <div class="absolute bottom-2 right-2 rounded bg-black/45 px-2 py-1 text-[10px] text-white">
            边缘节点渲染预览
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p class="text-sm font-semibold text-slate-800">红外热成像模式</p>
              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                开启后仅展示热力轮廓，显著提升隐私保护等级。
              </p>
            </div>
            <input
              v-model="thermalEnabled"
              type="checkbox"
              class="mt-1 h-5 w-5 accent-sky-600"
              @change="onThermalToggle"
            />
          </label>

          <label class="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p class="text-sm font-semibold text-slate-800">AI 实时人脸打码</p>
              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                利用 YOLO 引擎在推流前打码敏感区域，降低身份暴露风险。
              </p>
            </div>
            <input
              v-model="blurEnabled"
              type="checkbox"
              class="mt-1 h-5 w-5 accent-sky-600 disabled:cursor-not-allowed"
              :disabled="thermalEnabled"
              @change="onBlurToggle"
            />
          </label>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">数据生命周期管理</h2>
        <p class="mt-1 text-xs text-slate-500">配置缓存与报警短视频留存周期，保障合规可追溯。</p>

        <div class="mt-6 space-y-6">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-800">实时监控缓存</label>
            <select
              v-model="cacheHours"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
            >
              <option value="24">24 小时（极低存储）</option>
              <option value="48">48 小时（推荐）</option>
              <option value="168">7 天（高留存）</option>
            </select>
          </div>

          <div class="border-t border-slate-100 pt-4">
            <div class="mb-2 flex items-center justify-between">
              <label class="text-sm font-semibold text-slate-800">报警短视频留存周期</label>
              <span class="font-mono text-sm font-semibold text-sky-700">{{ retentionDays }} 天</span>
            </div>
            <input
              v-model.number="retentionDays"
              type="range"
              min="30"
              max="365"
              step="30"
              class="w-full accent-sky-600"
              @change="onRetentionInput(retentionDays)"
            />
            <div class="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>30D</span>
              <span>180D(合规)</span>
              <span>365D</span>
            </div>
          </div>
        </div>

        <div class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs leading-relaxed text-rose-700">
          系统已开启磁盘覆盖模式，超期数据将执行不可恢复销毁。
        </div>
      </section>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">家长权限审批流</h2>
          <p class="mt-1 text-xs text-slate-500">点击申请人头像可查看历史访问记录</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            待审批 {{ pendingCount }} 条
          </span>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            黑白名单管理
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[840px] w-full text-left text-sm">
          <thead class="border-y border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th class="px-4 py-3 font-medium">申请人</th>
              <th class="px-4 py-3 font-medium">关联儿童</th>
              <th class="px-4 py-3 font-medium">权限范围</th>
              <th class="px-4 py-3 font-medium">申请理由</th>
              <th class="px-4 py-3 text-right font-medium">审批操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in approvalRequests"
              :key="item.id"
              class="transition hover:bg-slate-50/80"
              :class="{ 'opacity-60': item.status !== 'pending' }"
            >
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="flex items-center gap-3 text-left"
                  @click="openHistoryDrawer(item.id)"
                >
                  <span
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700"
                  >
                    {{ item.applicantShort }}
                  </span>
                  <span class="font-semibold text-slate-800">{{ item.applicantName }}</span>
                </button>
              </td>
              <td class="px-4 py-3 text-slate-700">{{ item.childName }}</td>
              <td class="px-4 py-3">
                <span class="rounded border px-2 py-0.5 text-xs font-medium" :class="item.scope === 'video-log'
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : item.scope === 'video'
                    ? 'border-violet-200 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600'">
                  {{ scopeLabel(item.scope) }}
                </span>
              </td>
              <td class="max-w-[260px] px-4 py-3 text-xs text-slate-500">{{ item.reason }}</td>
              <td class="px-4 py-3 text-right">
                <template v-if="item.status === 'pending'">
                  <button
                    type="button"
                    class="mr-2 rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                    @click="approveRequest(item.id)"
                  >
                    同意
                  </button>
                  <button
                    type="button"
                    class="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-600"
                    @click="openRejectModal(item.id)"
                  >
                    拒绝
                  </button>
                </template>
                <span
                  v-else-if="item.status === 'approved'"
                  class="inline-flex items-center text-xs font-semibold text-emerald-700"
                >
                  已放行（实时生效）
                </span>
                <span v-else class="inline-flex items-center text-xs font-semibold text-slate-500">
                  已回绝
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="isDrawerOpen && activeRequest"
      class="fixed inset-0 z-40 bg-black/30"
      @click.self="closeHistoryDrawer"
    >
      <aside
        class="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-900">历史访问审计</h3>
          <button
            type="button"
            class="rounded bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
            @click="closeHistoryDrawer"
          >
            关闭
          </button>
        </div>

        <div class="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700">
            {{ activeRequest.applicantShort }}
          </span>
          <div>
            <p class="font-semibold text-slate-800">{{ activeRequest.applicantName }}</p>
            <p class="text-xs text-slate-500">{{ activeRequest.childName }}</p>
          </div>
        </div>

        <div class="space-y-4 border-l-2 border-slate-100 pl-4">
          <div v-for="entry in activeRequest.history" :key="`${entry.time}-${entry.detail}`" class="relative">
            <span
              class="absolute -left-[21px] top-1 inline-block h-2.5 w-2.5 rounded-full ring-4 ring-white"
              :class="
                entry.tone === 'success'
                  ? 'bg-emerald-500'
                  : entry.tone === 'info'
                    ? 'bg-sky-500'
                    : 'bg-slate-300'
              "
            />
            <p class="text-[11px] text-slate-400">{{ entry.time }}</p>
            <p class="mt-1 rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm text-slate-700">
              {{ entry.detail }}
            </p>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="isRejectModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-900">拒绝权限申请</h3>
        <p class="mt-2 text-xs text-slate-500">请填写回绝理由，系统将同步推送至家长端。</p>

        <textarea
          v-model="rejectReason"
          rows="4"
          class="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-sky-400"
          placeholder="例如：园区规定午休期间暂不开放实时视频。"
        />
        <p v-if="rejectError" class="mt-2 text-xs font-medium text-rose-600">{{ rejectError }}</p>

        <div class="mt-5 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
            @click="closeRejectModal"
          >
            取消
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            @click="submitReject"
          >
            确认回绝
          </button>
        </div>
      </div>
    </div>

    <div v-if="isDangerModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-md rounded-2xl border-t-4 border-rose-500 bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-900">高风险操作确认</h3>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ dangerMessage }}</p>

        <div class="mt-5 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
            @click="cancelDangerAction"
          >
            放弃更改
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg border border-rose-300 bg-white py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            @click="confirmDangerAction"
          >
            执意修改
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thermal-filter {
  filter: grayscale(100%) sepia(100%) hue-rotate(270deg) saturate(600%) contrast(140%) invert(10%);
}
</style>
