<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type Notice = { id: string; title: string; time: string; read: boolean }

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const items = ref<Notice[]>([
  {
    id: '1',
    title: '设备「教室-A3」离线超过 5 分钟',
    time: '10 分钟前',
    read: false,
  },
  {
    id: '2',
    title: '预警规则「走廊奔跑」已触发 1 次',
    time: '1 小时前',
    read: false,
  },
  {
    id: '3',
    title: '系统维护窗口：本周日凌晨 2:00–4:00',
    time: '昨天',
    read: true,
  },
])

const unreadCount = computed(() => items.value.filter((i) => !i.read).length)

function toggle() {
  open.value = !open.value
}

function markAllRead() {
  items.value = items.value.map((i) => ({ ...i, read: true }))
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value || !rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown))
onUnmounted(() => document.removeEventListener('pointerdown', onDocPointerDown))
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
      aria-label="通知"
      :aria-expanded="open"
      aria-haspopup="true"
      @click.stop="toggle"
    >
      <svg
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-show="open"
        class="absolute right-0 z-50 mt-1 w-[min(calc(100vw-2rem),20rem)] origin-top-right rounded-xl border border-slate-200/80 bg-white py-1 shadow-lg shadow-slate-900/10"
        role="menu"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span class="text-sm font-semibold text-slate-900">通知</span>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-xs font-medium text-sky-600 hover:text-sky-700"
            @click="markAllRead"
          >
            全部已读
          </button>
        </div>
        <ul class="max-h-72 overflow-y-auto py-1" aria-label="通知列表">
          <li v-for="n in items" :key="n.id">
            <button
              type="button"
              class="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
              :class="n.read ? 'text-slate-500' : 'text-slate-900 font-medium'"
              @click="n.read = true"
            >
              <span class="line-clamp-2">{{ n.title }}</span>
              <span class="text-xs font-normal text-slate-400">{{ n.time }}</span>
            </button>
          </li>
        </ul>
        <p
          v-if="items.length === 0"
          class="px-3 py-6 text-center text-sm text-slate-500"
        >
          暂无通知
        </p>
      </div>
    </Transition>
  </div>
</template>
