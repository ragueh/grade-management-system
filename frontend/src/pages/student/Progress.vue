<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
      <p class="text-gray-600">Visualize your academic performance over time</p>
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

    <!-- Progress Content -->
    <div v-else class="space-y-6">
      <!-- Current Status Card -->
      <div class="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-left">
            <p class="text-primary-100 text-sm font-medium mb-2">Current Overall Grade</p>
            <div class="text-5xl md:text-6xl font-bold mb-2">
              {{ progressData.current_grade?.total || '--' }}/20
            </div>
            <GradeBadge
              v-if="progressData.current_grade?.total"
              :score="parseFloat(progressData.current_grade.total)"
              :letter="progressData.current_grade.grade_letter"
              class="inline-block"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-primary-100 text-xs mb-1">Total Marks</p>
              <p class="text-2xl font-bold">{{ progressData.statistics?.total_marks || 0 }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-primary-100 text-xs mb-1">Average</p>
              <p class="text-2xl font-bold">{{ progressData.statistics?.average_score || '--' }}/20</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-primary-100 text-xs mb-1">Highest</p>
              <p class="text-2xl font-bold">{{ progressData.statistics?.highest_score || '--' }}/20</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <p class="text-primary-100 text-xs mb-1">Lowest</p>
              <p class="text-2xl font-bold">{{ progressData.statistics?.lowest_score || '--' }}/20</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Indicator -->
      <div v-if="progressData.trend" class="card"
        :class="progressData.trend.is_improving ? 'bg-green-50 border-green-200' : progressData.trend.is_declining ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'"
      >
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-full"
            :class="progressData.trend.is_improving ? 'bg-green-600' : progressData.trend.is_declining ? 'bg-red-600' : 'bg-blue-600'"
          >
            <svg v-if="progressData.trend.is_improving" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <svg v-else-if="progressData.trend.is_declining" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <svg v-else class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold"
              :class="progressData.trend.is_improving ? 'text-green-900' : progressData.trend.is_declining ? 'text-red-900' : 'text-blue-900'"
            >
              {{ progressData.trend.is_improving ? 'Improving Performance!' : progressData.trend.is_declining ? 'Performance Declining' : 'Stable Performance' }}
            </h3>
            <p class="text-sm"
              :class="progressData.trend.is_improving ? 'text-green-700' : progressData.trend.is_declining ? 'text-red-700' : 'text-blue-700'"
            >
              {{ progressData.trend.message || 'Your grades are stable over recent assessments' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Grade Timeline Chart -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Grade Timeline</h2>

        <div v-if="progressData.timeline && progressData.timeline.length > 0" class="space-y-4">
          <!-- Chart Legend -->
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-primary-600 rounded-full"></div>
              <span class="text-gray-600">Your Scores</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-red-400 border-2 border-red-600 rounded-full"></div>
              <span class="text-gray-600">Warning Threshold (12/20)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-green-400 border-2 border-green-600 rounded-full"></div>
              <span class="text-gray-600">Excellent (18/20)</span>
            </div>
          </div>

          <!-- Timeline Chart -->
          <div class="relative pt-8 pb-4">
            <!-- Y-axis labels -->
            <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
              <span>20</span>
              <span>15</span>
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>

            <!-- Chart area -->
            <div class="ml-8 relative" style="height: 250px;">
              <!-- Grid lines -->
              <div class="absolute inset-0 flex flex-col justify-between">
                <div class="border-t border-gray-200"></div>
                <div class="border-t border-gray-200"></div>
                <div class="border-t border-gray-200"></div>
                <div class="border-t border-gray-200"></div>
                <div class="border-t border-gray-200"></div>
              </div>

              <!-- Threshold lines -->
              <div class="absolute inset-x-0 border-t-2 border-dashed border-red-300" style="bottom: 60%;"></div>
              <div class="absolute inset-x-0 border-t-2 border-dashed border-green-300" style="bottom: 90%;"></div>

              <!-- Data points and bars -->
              <div class="absolute inset-0 flex items-end justify-around gap-2 px-4">
                <div
                  v-for="(item, index) in progressData.timeline.slice(-10)"
                  :key="index"
                  class="flex-1 flex flex-col items-center group relative"
                >
                  <!-- Bar -->
                  <div
                    class="w-full rounded-t-lg transition-all cursor-pointer"
                    :class="getScoreColorClass(item.score)"
                    :style="{ height: `${(item.score / 20) * 100}%` }"
                  >
                    <!-- Tooltip on hover -->
                    <div class="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                      <div class="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                        <p class="font-semibold">{{ item.score }}/20</p>
                        <p class="text-gray-300">{{ item.assessment_name }}</p>
                        <p class="text-gray-400">{{ formatDate(item.date) }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Date label -->
                  <p class="text-xs text-gray-500 mt-2 truncate w-full text-center">
                    {{ formatShortDate(item.date) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p class="text-sm text-gray-500 text-center italic">
            Showing {{ Math.min(progressData.timeline.length, 10) }} most recent assessments
          </p>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="font-medium mb-1">No assessment data yet</p>
          <p class="text-sm">Your progress will appear here once you receive grades</p>
        </div>
      </div>

      <!-- Performance by Assessment Type -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Performance by Assessment Type</h2>

        <div v-if="progressData.by_assessment && progressData.by_assessment.length > 0" class="space-y-4">
          <div
            v-for="assessment in progressData.by_assessment"
            :key="assessment.type_name"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">{{ assessment.type_name }}</h3>
                <p class="text-sm text-gray-600">
                  {{ assessment.count }} assessment{{ assessment.count !== 1 ? 's' : '' }} • Weight: {{ assessment.weight }}%
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold" :class="getScoreColor(assessment.average)">
                  {{ assessment.average }}/20
                </p>
                <GradeBadge :score="parseFloat(assessment.average)" />
              </div>
            </div>

            <!-- Progress bar -->
            <div class="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="absolute top-0 left-0 h-full rounded-full transition-all"
                :class="getScoreColorClass(assessment.average)"
                :style="{ width: `${(assessment.average / 20) * 100}%` }"
              ></div>
            </div>

            <!-- Range indicator -->
            <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Lowest: {{ assessment.lowest }}/20</span>
              <span>Highest: {{ assessment.highest }}/20</span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <p>No assessment data available</p>
        </div>
      </div>

      <!-- Goals and Insights -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Grade Distribution -->
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">Grade Distribution</h3>

          <div v-if="progressData.distribution" class="space-y-3">
            <div v-for="grade in gradeLabels" :key="grade.letter" class="flex items-center gap-3">
              <span class="w-8 text-center font-bold" :class="grade.color">{{ grade.letter }}</span>
              <div class="flex-1 relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  class="absolute top-0 left-0 h-full rounded-lg transition-all"
                  :class="grade.bgClass"
                  :style="{ width: `${getDistributionPercent(grade.letter)}%` }"
                ></div>
                <span class="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700">
                  {{ progressData.distribution[grade.letter] || 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">Quick Insights</h3>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span class="text-purple-900 font-medium">Assessments Completed</span>
              <span class="text-2xl font-bold text-purple-600">
                {{ progressData.statistics?.total_marks || 0 }}
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span class="text-blue-900 font-medium">Above Average (≥16)</span>
              <span class="text-2xl font-bold text-blue-600">
                {{ progressData.statistics?.above_average_count || 0 }}
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span class="text-green-900 font-medium">Excellent Grades (≥18)</span>
              <span class="text-2xl font-bold text-green-600">
                {{ progressData.statistics?.excellent_count || 0 }}
              </span>
            </div>

            <div class="flex items-center justify-between p-3"
              :class="(progressData.statistics?.below_passing_count || 0) > 0 ? 'bg-red-50' : 'bg-gray-50'"
            >
              <span :class="(progressData.statistics?.below_passing_count || 0) > 0 ? 'text-red-900' : 'text-gray-900'" class="font-medium">
                Below Passing (&lt;12)
              </span>
              <span class="text-2xl font-bold"
                :class="(progressData.statistics?.below_passing_count || 0) > 0 ? 'text-red-600' : 'text-gray-600'"
              >
                {{ progressData.statistics?.below_passing_count || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Improvement Tips -->
      <div class="card bg-blue-50 border border-blue-200">
        <h3 class="font-medium text-blue-900 mb-2">Tips for Success</h3>
        <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Review your performance regularly to identify patterns</li>
          <li>Focus on assessment types where you score below your average</li>
          <li>Aim to maintain consistency across all assessment types</li>
          <li>Use teacher comments to understand areas for improvement</li>
          <li>Celebrate your progress and keep working toward your goals!</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import GradeBadge from '@/components/GradeBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const loading = ref(true)
const error = ref(null)
const progressData = ref({})

const gradeLabels = [
  { letter: 'A', color: 'text-green-600', bgClass: 'bg-green-500' },
  { letter: 'B', color: 'text-blue-600', bgClass: 'bg-blue-500' },
  { letter: 'C', color: 'text-amber-600', bgClass: 'bg-amber-500' },
  { letter: 'D', color: 'text-orange-600', bgClass: 'bg-orange-500' },
  { letter: 'F', color: 'text-red-600', bgClass: 'bg-red-500' },
]

const getDistributionPercent = (letter) => {
  if (!progressData.value.distribution) return 0
  const total = Object.values(progressData.value.distribution).reduce((sum, val) => sum + val, 0)
  if (total === 0) return 0
  return ((progressData.value.distribution[letter] || 0) / total) * 100
}

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

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatShortDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const fetchProgress = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/student/progress')

    if (response.data.success) {
      progressData.value = response.data.data
    } else {
      error.value = response.data.message || 'Failed to load progress data'
    }
  } catch (err) {
    console.error('Progress error:', err)
    error.value = err.response?.data?.message || 'Failed to load progress data'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProgress()
})
</script>
