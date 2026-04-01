<script setup lang="ts">
import { siteMapSections } from '../../config/siteMap'

defineProps<{
  open: boolean
}>()

defineEmits<{
  navigate: []
}>()
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-show="open"
    class="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
    aria-hidden="true"
    @click="$emit('navigate')"
  />
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex w-[min(100%,16rem)] flex-col border-r border-slate-200/80 bg-white shadow-[4px_0_24px_-8px_rgba(15,23,42,0.12)] transition-transform duration-200 ease-out md:static md:z-0 md:w-56 md:translate-x-0 md:shadow-none',
      open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ]"
  >
    <div class="flex h-14 shrink-0 items-center border-b border-slate-200/80 px-4">
      <router-link
        to="/dashboard"
        class="text-sm font-semibold text-sky-700"
        @click="$emit('navigate')"
      >
        SecureGuard
      </router-link>
    </div>
    <nav class="flex-1 overflow-y-auto px-2 py-3 text-sm" aria-label="主导航">
      <div v-for="section in siteMapSections" :key="section.id" class="mb-5 last:mb-0">
        <p class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {{ section.title }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in section.items" :key="item.path">
            <router-link
              :to="item.path"
              custom
              v-slot="{ href, navigate, isActive }"
            >
              <a
                :href="href"
                :class="[
                  'block rounded-lg px-3 py-2 text-slate-700 transition-colors',
                  isActive
                    ? 'bg-sky-50 font-medium text-sky-800'
                    : 'hover:bg-slate-50',
                ]"
                @click="
                  (e) => {
                    navigate(e)
                    $emit('navigate')
                  }
                "
              >
                {{ item.title }}
              </a>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>
