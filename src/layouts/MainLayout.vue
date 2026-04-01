<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppSidebar from '../components/layout/AppSidebar.vue'

const sidebarOpen = ref(false)
const mainScroller = ref<HTMLElement | null>(null)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnNavigate() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="flex min-h-dvh bg-[#f5f7fa]">
    <AppSidebar :open="sidebarOpen" @navigate="closeSidebarOnNavigate" />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader :scroller="mainScroller" @toggle-sidebar="toggleSidebar" />
      <main ref="mainScroller" class="min-h-0 flex-1 overflow-auto p-4 md:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
