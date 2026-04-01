<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { logout, accountLabel, roleLabel } = useAuth()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const initials = computed(() => {
  const a = accountLabel.value?.trim()
  if (a) {
    if (a.includes('@')) {
      const local = a.split('@')[0] ?? ''
      return local.slice(0, 2).toUpperCase() || 'U'
    }
    if (/^1\d{10}$/.test(a)) return a.slice(-2)
    return a.length >= 2 ? a.slice(0, 2) : a
  }
  return roleLabel.value === '家长' ? '家' : roleLabel.value === '机构管理员' ? '机' : '?'
})

function toggle() {
  open.value = !open.value
}

function exit() {
  open.value = false
  logout()
  router.push('/login')
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
      class="flex h-9 max-w-[10rem] shrink-0 items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-left hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
      :aria-expanded="open"
      aria-haspopup="true"
      aria-label="用户菜单"
      @click.stop="toggle"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800"
      >
        {{ initials }}
      </span>
      <span class="hidden min-w-0 flex-1 flex-col sm:flex">
        <span class="truncate text-xs font-medium text-slate-900">{{
          accountLabel || '用户'
        }}</span>
        <span class="truncate text-[11px] text-slate-500">{{ roleLabel }}</span>
      </span>
      <svg
        class="hidden h-4 w-4 shrink-0 text-slate-400 sm:block"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
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
        class="absolute right-0 z-50 mt-1 w-52 origin-top-right rounded-xl border border-slate-200/80 bg-white py-1 shadow-lg shadow-slate-900/10"
        role="menu"
        @click.stop
      >
        <div class="border-b border-slate-100 px-3 py-2 sm:hidden">
          <div class="truncate text-sm font-medium text-slate-900">
            {{ accountLabel || '用户' }}
          </div>
          <div class="truncate text-xs text-slate-500">{{ roleLabel }}</div>
        </div>
        <router-link
          to="/settings/system"
          class="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          role="menuitem"
          @click="open = false"
        >
          系统与账户设置
        </router-link>
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
          role="menuitem"
          @click="exit"
        >
          退出登录
        </button>
      </div>
    </Transition>
  </div>
</template>
