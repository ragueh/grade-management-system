<template>
  <div>
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

    <!-- Access Denied -->
    <div v-else-if="!hasAccess" class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto text-amber-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Access Not Granted</h3>
      <p class="text-gray-600 mb-4">
        {{ childData.first_name }} has not granted you permission to view their grades yet.
      </p>
      <button @click="$router.push('/parent/dashboard')" class="btn btn-primary">
        Back to Dashboard
      </button>
    </div>

    <!-- Child Details -->
    <div v-else>
      <!-- Page Header -->
      <div class="flex items-center mb-6">
        <button
          @click="$router.push('/parent/dashboard')"
          class="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {{ childData.first_name }}'s Progress
          </h1>
          <p class="text-gray-600">{{ childData.class_name }} • {{ childData.subject }}</p>
        </div>
        <span class="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
          Access Granted
        </span>
      </div>

      <!-- Current Grade Card -->
      <div class="card bg-gradient-to-br from-purple-500 to-purple-700 text-white mb-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-left">
            <p class="text-purple-100 text-sm font-medium mb-2">Current Overall Grade</p>
            <div class="text-5xl md:text-6xl font-bold mb-2">
              {{ childData.current_grade?.total || '--' }}/20
            </div>
            <div class="flex items-center gap-2 justify-center md:justify-start">
              <GradeBadge
                v-if="childData.current_grade?.total"
                :score="parseFloat(childData.current_grade.total)"
                :letter="childData.current_grade.grade_letter"
              />
              <span class="text-purple-100">{{ childData.current_grade?.percentage || '--' }}%</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-purple-100 text-xs mb-1">Total Marks</p>
              <p class="text-2xl font-bold">{{ childData.statistics?.total_marks || 0 }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-purple-100 text-xs mb-1">Average</p>
              <p class="text-2xl font-bold">{{ childData.statistics?.average_score || '--' }}/20</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-purple-100 text-xs mb-1">Highest</p>
              <p class="text-2xl font-bold">{{ childData.statistics?.highest_score || '--' }}/20</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-purple-100 text-xs mb-1">Active Alerts</p>
              <p class="text-2xl font-bold">{{ childData.statistics?.active_alerts || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts Section -->
      <div v-if="childData.alerts && childData.alerts.length > 0" class="mb-6">
        <div
          v-for="alert in childData.alerts"
          :key="alert.id"
          class="card mb-3"
          :class="alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'"
        >
          <div class="flex items-start gap-3">
            <div
              class="p-2 rounded-full"
              :class="alert.severity === 'critical' ? 'bg-red-600' : 'bg-amber-600'"
            >
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3
                class="font-semibold mb-1"
                :class="alert.severity === 'critical' ? 'text-red-900' : 'text-amber-900'"
              >
                {{ alert.alert_type === 'low_score' ? 'Low Score Alert' : alert.alert_type === 'declining_trend' ? 'Declining Performance' : 'Academic Alert' }}
              </h3>
              <p
                class="text-sm"
                :class="alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'"
              >
                {{ alert.message }}
              </p>
              <p class="text-xs mt-1"
                :class="alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'"
              >
                {{ formatDate(alert.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Marks -->
      <div class="card mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Assessments</h2>

        <div v-if="childData.recent_marks && childData.recent_marks.length > 0" class="space-y-4">
          <div
            v-for="mark in childData.recent_marks"
            :key="mark.id"
            class="p-4 bg-gray-50 rounded-lg border-l-4"
            :class="getScoreBorderClass(mark.score)"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ mark.type_name }}</h3>
                <p class="text-sm text-gray-600">{{ formatDate(mark.assessment_date) }}</p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold" :class="getScoreColor(mark.score)">
                  {{ mark.score }}/20
                </p>
                <GradeBadge :score="parseFloat(mark.score)" />
              </div>
            </div>

            <div v-if="mark.teacher_comment" class="mt-3 pt-3 border-t border-gray-200">
              <p class="text-sm text-gray-700 italic">"{{ mark.teacher_comment }}"</p>
              <p class="text-xs text-gray-500 mt-1">Teacher's Comment</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <p>No marks recorded yet</p>
        </div>
      </div>

      <!-- Performance Breakdown -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Performance Breakdown</h2>

        <div v-if="childData.grade_breakdown && childData.grade_breakdown.length > 0" class="space-y-4">
          <div
            v-for="item in childData.grade_breakdown"
            :key="item.assessment_type"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">{{ item.assessment_type }}</h3>
                <p class="text-sm text-gray-600">
                  Weight: {{ item.weight }}% • Contributes {{ item.weighted_score }}/20 to final grade
                </p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold" :class="getScoreColor(item.score)">
                  {{ item.score }}/20
                </p>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="absolute top-0 left-0 h-full rounded-full transition-all"
                :class="getScoreColorClass(item.score)"
                :style="{ width: `${(item.score / 20) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <p>Grade breakdown not available yet</p>
        </div>
      </div>

      <!-- Information Card -->
      <div class="card mt-6 bg-blue-50 border border-blue-200">
        <h3 class="font-medium text-blue-900 mb-2">About This Information</h3>
        <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>This information is shared with your permission by {{ childData.first_name }}</li>
          <li>All grades are on a 0-20 scale where 12/20 is the minimum passing grade</li>
          <li>Weighted grades show how each assessment type contributes to the final grade</li>
          <li>{{ childData.first_name }} can revoke access at any time from their Parent Access settings</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import GradeBadge from '@/components/GradeBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const route = useRoute()
const router = useRouter()
const childId = route.params.studentId

const loading = ref(true)
const error = ref(null)
const hasAccess = ref(false)
const childData = ref({})

const getScoreColor = (score) => {
  const numScore = parseFloat(score)
  if (numScore >= 18) return 'text-green-600'
  if (numScore >= 16) return 'text-blue-600'
  if (numScore >= 14) return 'text-amber-600'
  if (numScore >= 12) return 'text-orange-600'
  return 'text-red-600'
}

const getScoreColorClass = (score) => {
  const numScore = parseFloat(score)
  if (numScore >= 18) return 'bg-green-500'
  if (numScore >= 16) return 'bg-blue-500'
  if (numScore >= 14) return 'bg-amber-500'
  if (numScore >= 12) return 'bg-orange-500'
  return 'bg-red-500'
}

const getScoreBorderClass = (score) => {
  const numScore = parseFloat(score)
  if (numScore >= 18) return 'border-green-500'
  if (numScore >= 16) return 'border-blue-500'
  if (numScore >= 14) return 'border-amber-500'
  if (numScore >= 12) return 'border-orange-500'
  return 'border-red-500'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchChildDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get(`/parent/children/${childId}`)

    if (response.data.success) {
      childData.value = response.data.data
      hasAccess.value = childData.value.allow_parent_access && childData.value.permission_status === 'active'

      // Fetch additional data if access is granted
      if (hasAccess.value) {
        await Promise.all([
          fetchChildMarks(),
          fetchChildGrade(),
          fetchChildAlerts()
        ])
      }
    } else {
      error.value = response.data.message || 'Failed to load child details'
    }
  } catch (err) {
    console.error('Child details error:', err)
    error.value = err.response?.data?.message || 'Failed to load child details'
  } finally {
    loading.value = false
  }
}

const fetchChildMarks = async () => {
  try {
    const response = await api.get(`/parent/children/${childId}/marks`)
    if (response.data.success) {
      childData.value.recent_marks = response.data.data.slice(0, 5) // Get last 5 marks
    }
  } catch (err) {
    console.error('Failed to fetch marks:', err)
  }
}

const fetchChildGrade = async () => {
  try {
    const response = await api.get(`/parent/children/${childId}/grade`)
    if (response.data.success) {
      childData.value.current_grade = response.data.data.current_grade
      childData.value.grade_breakdown = response.data.data.breakdown
    }
  } catch (err) {
    console.error('Failed to fetch grade:', err)
  }
}

const fetchChildAlerts = async () => {
  try {
    const response = await api.get(`/parent/children/${childId}/alerts`)
    if (response.data.success) {
      childData.value.alerts = response.data.data
    }
  } catch (err) {
    console.error('Failed to fetch alerts:', err)
  }
}

onMounted(() => {
  fetchChildDetails()
})
</script>
