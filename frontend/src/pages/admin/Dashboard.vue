<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        System Overview
      </h1>
      <p class="text-gray-600">Monitor and manage the Grade Management System</p>
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
      <!-- System Statistics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          :value="dashboardData.statistics?.total_users || 0"
          subtitle="System-wide"
          color="blue"
        />

        <StatCard
          title="Teachers"
          :value="dashboardData.statistics?.total_teachers || 0"
          :subtitle="`${dashboardData.statistics?.pending_teachers || 0} pending approval`"
          :color="dashboardData.statistics?.pending_teachers > 0 ? 'amber' : 'green'"
        />

        <StatCard
          title="Students"
          :value="dashboardData.statistics?.total_students || 0"
          subtitle="Enrolled"
          color="purple"
        />

        <StatCard
          title="Parents"
          :value="dashboardData.statistics?.total_parents || 0"
          subtitle="Registered"
          color="indigo"
        />
      </div>

      <!-- Academic Statistics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          :value="dashboardData.statistics?.total_classes || 0"
          subtitle="Active classes"
          color="green"
        />

        <StatCard
          title="Assessments"
          :value="dashboardData.statistics?.total_assessments || 0"
          subtitle="Configured"
          color="teal"
        />

        <StatCard
          title="Marks Entered"
          :value="dashboardData.statistics?.total_marks || 0"
          subtitle="All time"
          color="cyan"
        />

        <StatCard
          title="Active Alerts"
          :value="dashboardData.statistics?.total_alerts || 0"
          :subtitle="dashboardData.statistics?.total_alerts > 0 ? 'Requires attention' : 'All clear'"
          :color="dashboardData.statistics?.total_alerts > 0 ? 'red' : 'gray'"
        />
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h2 class="card-header">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RouterLink
            to="/admin/teachers"
            class="flex items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors group"
          >
            <div class="p-3 bg-amber-600 rounded-lg group-hover:bg-amber-700 transition-colors">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4 flex-1">
              <p class="font-semibold text-gray-900">Approve Teachers</p>
              <p class="text-sm text-gray-600">{{ dashboardData.statistics?.pending_teachers || 0 }} pending</p>
            </div>
            <div v-if="dashboardData.statistics?.pending_teachers > 0"
              class="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded-full"
            >
              {{ dashboardData.statistics.pending_teachers }}
            </div>
          </RouterLink>

          <RouterLink
            to="/admin/users"
            class="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div class="p-3 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="font-semibold text-gray-900">Manage Users</p>
              <p class="text-sm text-gray-600">View and edit all users</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/admin/reports"
            class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <div class="p-3 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="font-semibold text-gray-900">System Reports</p>
              <p class="text-sm text-gray-600">Analytics and exports</p>
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- Pending Teacher Approvals -->
      <div v-if="dashboardData.pending_teachers && dashboardData.pending_teachers.length > 0" class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Pending Teacher Approvals</h2>
          <RouterLink to="/admin/teachers" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </RouterLink>
        </div>

        <div class="space-y-3">
          <div
            v-for="teacher in dashboardData.pending_teachers.slice(0, 5)"
            :key="teacher.id"
            class="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900">
                {{ teacher.first_name }} {{ teacher.last_name }}
              </p>
              <p class="text-sm text-gray-600">{{ teacher.email }}</p>
              <p class="text-xs text-gray-500 mt-1">
                Employee ID: {{ teacher.employee_id }} • {{ teacher.department }}
              </p>
            </div>
            <RouterLink
              :to="`/admin/teachers`"
              class="btn btn-primary text-sm"
            >
              Review
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>

        <div v-if="dashboardData.recent_activity && dashboardData.recent_activity.length > 0" class="space-y-3">
          <div
            v-for="activity in dashboardData.recent_activity"
            :key="activity.id"
            class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div class="p-2 bg-primary-100 rounded-lg">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-900">{{ activity.description }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatDate(activity.created_at) }}</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <p>No recent activity</p>
        </div>
      </div>

      <!-- System Health -->
      <div class="card bg-green-50 border border-green-200">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-green-600 rounded-full">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-green-900">System Status: Operational</h3>
            <p class="text-sm text-green-700">All services running normally</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'
import StatCard from '@/components/StatCard.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const loading = ref(true)
const error = ref(null)
const dashboardData = ref({})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMs / 3600000)
  const diffInDays = Math.floor(diffInMs / 86400000)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchDashboard = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/admin/dashboard')

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
