<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header -->
    <header class="bg-white shadow-sm lg:hidden safe-top">
      <div class="flex items-center justify-between px-4 py-3">
        <h1 class="text-lg font-semibold text-gray-900">Grade Management</h1>
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar - Desktop -->
      <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <div class="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 class="text-xl font-bold text-primary-600">Student Portal</h1>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            class="nav-item rounded-lg"
            active-class="nav-item-active"
          >
            <component :is="item.icon" class="w-5 h-5 mr-3" />
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- User Info -->
        <div class="p-4 border-t border-gray-200">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
              {{ userInitials }}
            </div>
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ userName }}</p>
              <p class="text-xs text-gray-500">Student</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="mt-3 w-full btn btn-secondary text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      <!-- Mobile Navigation -->
      <Transition
        enter-active-class="transition-transform duration-300"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <aside
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-40 bg-white lg:hidden"
        >
          <div class="flex flex-col h-full">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h1 class="text-lg font-bold text-primary-600">Student Portal</h1>
              <button @click="mobileMenuOpen = false" class="p-2 rounded-lg hover:bg-gray-100">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <RouterLink
                v-for="item in navigation"
                :key="item.name"
                :to="item.to"
                class="nav-item rounded-lg"
                active-class="nav-item-active"
                @click="mobileMenuOpen = false"
              >
                <component :is="item.icon" class="w-5 h-5 mr-3" />
                {{ item.name }}
              </RouterLink>
            </nav>

            <div class="p-4 border-t border-gray-200">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                  {{ userInitials }}
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
                  <p class="text-xs text-gray-500">Student</p>
                </div>
              </div>
              <button
                @click="handleLogout"
                class="w-full btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>
      </Transition>

      <!-- Main Content -->
      <main class="flex-1 lg:ml-64">
        <div class="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)

// Navigation items
const navigation = [
  {
    name: 'Dashboard',
    to: '/student/dashboard',
    icon: h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
    ]),
  },
  {
    name: 'My Marks',
    to: '/student/marks',
    icon: h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ]),
  },
  {
    name: 'Progress',
    to: '/student/progress',
    icon: h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ]),
  },
  {
    name: 'Parent Access',
    to: '/student/parent-access',
    icon: h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })
    ]),
  },
]

const userName = computed(() => {
  const user = authStore.user
  return user ? `${user.first_name} ${user.last_name}` : 'Student'
})

const userInitials = computed(() => {
  const user = authStore.user
  if (user) {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
  }
  return 'S'
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
