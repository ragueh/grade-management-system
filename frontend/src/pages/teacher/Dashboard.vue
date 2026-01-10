<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {{ teacherName }}!
      </h1>
      <p class="text-gray-600">Manage your classes and track student progress</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="spinner"></div>
    </div>

    <!-- Error State -->
    <AlertBanner
      v-else-if="error"
      type="critical"
      :message="error"
      dismissible
      @dismiss="error = null"
    />

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- Statistics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          :value="dashboardData.statistics?.total_classes || 0"
          subtitle="Active classes"
          color="blue"
        />

        <StatCard
          title="Total Students"
          :value="dashboardData.statistics?.total_students || 0"
          subtitle="Across all classes"
          color="green"
        />

        <StatCard
          title="Marks Entered"
          :value="dashboardData.statistics?.total_marks || 0"
          subtitle="Total assessments"
          color="purple"
        />

        <StatCard
          title="Active Alerts"
          :value="dashboardData.statistics?.active_alerts || 0"
          :subtitle="dashboardData.statistics?.active_alerts > 0 ? 'Students need attention' : 'All students on track'"
          :color="dashboardData.statistics?.active_alerts > 0 ? 'red' : 'gray'"
        />
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h2 class="card-header">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RouterLink
            to="/teacher/marks"
            class="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group"
          >
            <div class="p-3 bg-primary-600 rounded-lg group-hover:bg-primary-700 transition-colors">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="font-semibold text-gray-900">Enter Marks</p>
              <p class="text-sm text-gray-600">Add new assessment scores</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/teacher/classes"
            class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <div class="p-3 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="font-semibold text-gray-900">Manage Classes</p>
              <p class="text-sm text-gray-600">View and edit class details</p>
            </div>
          </RouterLink>

          <button
            @click="showComingSoon = true"
            class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group text-left"
          >
            <div class="p-3 bg-purple-600 rounded-lg group-hover:bg-purple-700 transition-colors">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="font-semibold text-gray-900">View Reports</p>
              <p class="text-sm text-gray-600">Class analytics & exports</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Classes Overview -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-header mb-0">My Classes</h2>
          <RouterLink to="/teacher/classes" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </RouterLink>
        </div>

        <div v-if="dashboardData.classes && dashboardData.classes.length > 0" class="space-y-3">
          <div
            v-for="classItem in dashboardData.classes"
            :key="classItem.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$router.push(`/teacher/classes/${classItem.id}`)"
          >
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{{ classItem.class_name }}</h3>
              <p class="text-sm text-gray-600">{{ classItem.subject }} • {{ classItem.academic_year }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-primary-600">{{ classItem.student_count }}</p>
              <p class="text-xs text-gray-500">Students</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <p>No classes yet</p>
          <RouterLink to="/teacher/classes" class="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
            Create your first class
          </RouterLink>
        </div>
      </div>

      <!-- Coming Soon Modal -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showComingSoon"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click="showComingSoon = false"
        >
          <div class="card max-w-md" @click.stop>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p class="text-gray-600 mb-4">This feature is under development and will be available soon.</p>
            <button @click="showComingSoon = false" class="btn btn-primary w-full">
              Got it
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import StatCard from '@/components/StatCard.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)
const dashboardData = ref({})
const showComingSoon = ref(false)

const teacherName = computed(() => {
  return authStore.user?.first_name || 'Teacher'
})

const fetchDashboard = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/teacher/dashboard')

    if (response.data.success) {
      dashboardData.value = response.data.data
    } else {
      error.value = response.data.message || 'Failed to load dashboard'
    }
  } catch (err) {
    console.error('Dashboard error:', err)
    error.value = err.response?.data?.message || 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>
