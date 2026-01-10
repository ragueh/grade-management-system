<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {{ studentName }}!
      </h1>
      <p class="text-gray-600">Here's your academic progress overview</p>
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
      <!-- Current Grade Card -->
      <div class="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div class="text-center">
          <p class="text-primary-100 text-sm md:text-base mb-2">Current Grade</p>
          <div class="text-4xl md:text-6xl font-bold mb-2">
            {{ dashboardData.statistics?.current_grade?.total || '--' }}/20
          </div>
          <div class="flex items-center justify-center space-x-4 text-primary-100">
            <span class="text-lg">{{ dashboardData.statistics?.current_grade?.percentage || '--' }}%</span>
            <span class="text-2xl font-semibold">{{ dashboardData.statistics?.current_grade?.letter || '--' }}</span>
          </div>
          <p v-if="dashboardData.student?.class_name" class="mt-4 text-primary-100">
            {{ dashboardData.student.class_name }} - {{ dashboardData.student.subject }}
          </p>
        </div>
      </div>

      <!-- Statistics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Marks"
          :value="dashboardData.statistics?.total_marks || 0"
          subtitle="Assessments completed"
          color="blue"
        />

        <StatCard
          title="Average Score"
          :value="`${dashboardData.statistics?.average_score || '0'}/20`"
          subtitle="Overall average"
          color="green"
        />

        <StatCard
          title="Active Alerts"
          :value="dashboardData.statistics?.active_alerts || 0"
          :subtitle="dashboardData.statistics?.active_alerts > 0 ? 'Needs attention' : 'All good!'"
          :color="dashboardData.statistics?.active_alerts > 0 ? 'red' : 'gray'"
        />
      </div>

      <!-- Active Alerts -->
      <div v-if="dashboardData.alerts && dashboardData.alerts.length > 0" class="space-y-3">
        <h2 class="text-lg font-semibold text-gray-900">Active Alerts</h2>
        <AlertBanner
          v-for="alert in dashboardData.alerts"
          :key="alert.id"
          :type="alert.severity === 'critical' ? 'critical' : 'warning'"
          :title="formatAlertType(alert.alert_type)"
          :message="alert.message"
        />
      </div>

      <!-- Trend Analysis -->
      <div v-if="dashboardData.trend" class="card">
        <h2 class="card-header">Performance Trend</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Last {{ dashboardData.trend.recent_count }} assessments</p>
            <p class="text-lg font-semibold" :class="dashboardData.trend.is_declining ? 'text-red-600' : 'text-green-600'">
              {{ dashboardData.trend.is_declining ? '↓ Declining' : '→ Stable/Improving' }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Average Change</p>
            <p class="text-2xl font-bold" :class="dashboardData.trend.average_change < 0 ? 'text-red-600' : 'text-green-600'">
              {{ dashboardData.trend.average_change > 0 ? '+' : '' }}{{ dashboardData.trend.average_change }}
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Marks -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-header mb-0">Recent Marks</h2>
          <RouterLink to="/student/marks" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </RouterLink>
        </div>

        <div v-if="dashboardData.recent_marks && dashboardData.recent_marks.length > 0" class="space-y-3">
          <div
            v-for="mark in dashboardData.recent_marks"
            :key="mark.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ mark.type_name }}</p>
              <p class="text-sm text-gray-500">{{ formatDate(mark.assessment_date) }}</p>
              <p v-if="mark.teacher_comment" class="text-sm text-gray-600 mt-1 italic">
                "{{ mark.teacher_comment }}"
              </p>
            </div>
            <div class="text-right ml-4">
              <p class="text-2xl font-bold" :class="getScoreColor(mark.score)">
                {{ mark.score }}/{{ mark.max_score }}
              </p>
              <GradeBadge :score="parseFloat(mark.score)" />
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <p>No marks recorded yet</p>
        </div>
      </div>

      <!-- Parent Access Status -->
      <div class="card">
        <h2 class="card-header">Parent Access</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-700">
              {{ dashboardData.student?.allow_parent_access ? 'Parents can view your grades' : 'Parents cannot view your grades' }}
            </p>
            <p v-if="dashboardData.student?.has_parent_linked" class="text-sm text-gray-500 mt-1">
              Parent account linked
            </p>
          </div>
          <RouterLink to="/student/parent-access" class="btn btn-secondary">
            Manage
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import StatCard from '@/components/StatCard.vue'
import GradeBadge from '@/components/GradeBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)
const dashboardData = ref({})

const studentName = computed(() => {
  return authStore.user?.first_name || 'Student'
})

const fetchDashboard = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/student/dashboard')

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

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatAlertType = (type) => {
  const typeMap = {
    low_score: 'Low Score Alert',
    declining_trend: 'Declining Trend',
    attendance: 'Attendance Issue',
    custom: 'Alert',
  }
  return typeMap[type] || 'Alert'
}

const getScoreColor = (score) => {
  const numScore = parseFloat(score)
  if (numScore >= 18) return 'text-green-600'
  if (numScore >= 16) return 'text-blue-600'
  if (numScore >= 14) return 'text-amber-600'
  if (numScore >= 12) return 'text-orange-600'
  return 'text-red-600'
}

onMounted(() => {
  fetchDashboard()
})
</script>
