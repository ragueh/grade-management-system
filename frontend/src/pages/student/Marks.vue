<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Marks</h1>
      <p class="text-gray-600">View all your assessment results with teacher feedback</p>
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

    <!-- Marks Content -->
    <div v-else>
      <!-- No marks message -->
      <div v-if="!marks || marks.length === 0" class="card text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No marks yet</h3>
        <p class="text-gray-600">Your marks will appear here once your teacher enters them.</p>
      </div>

      <!-- Marks List -->
      <div v-else class="space-y-4">
        <!-- Desktop Table View -->
        <div class="hidden md:block card overflow-hidden p-0">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher Comment
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="mark in marks"
                :key="mark.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(mark.assessment_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ mark.type_name }}</div>
                  <div class="text-sm text-gray-500">{{ mark.class_name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-lg font-bold" :class="getScoreColor(mark.score)">
                    {{ mark.score }}/{{ mark.max_score }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ ((mark.score / mark.max_score) * 100).toFixed(1) }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <GradeBadge :score="parseFloat(mark.score)" />
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <p v-if="mark.teacher_comment" class="italic max-w-md">
                    "{{ mark.teacher_comment }}"
                  </p>
                  <p v-else class="text-gray-400">No comment</p>
                  <p class="text-xs text-gray-500 mt-1">
                    By {{ mark.teacher_first_name }} {{ mark.teacher_last_name }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-3">
          <div
            v-for="mark in marks"
            :key="mark.id"
            class="card"
          >
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ mark.type_name }}</h3>
                <p class="text-sm text-gray-500">{{ mark.class_name }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(mark.assessment_date) }}</p>
              </div>
              <GradeBadge :score="parseFloat(mark.score)" />
            </div>

            <!-- Score -->
            <div class="flex items-center justify-between py-3 border-t border-b border-gray-200">
              <span class="text-sm font-medium text-gray-600">Score</span>
              <div class="text-right">
                <div class="text-2xl font-bold" :class="getScoreColor(mark.score)">
                  {{ mark.score }}/{{ mark.max_score }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ ((mark.score / mark.max_score) * 100).toFixed(1) }}%
                </div>
              </div>
            </div>

            <!-- Teacher Comment -->
            <div v-if="mark.teacher_comment" class="mt-3">
              <p class="text-sm font-medium text-gray-600 mb-1">Teacher's Feedback</p>
              <p class="text-sm text-gray-700 italic bg-gray-50 p-3 rounded">
                "{{ mark.teacher_comment }}"
              </p>
              <p class="text-xs text-gray-500 mt-1">
                - {{ mark.teacher_first_name }} {{ mark.teacher_last_name }}
              </p>
            </div>
            <div v-else class="mt-3">
              <p class="text-sm text-gray-400">No teacher comment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import GradeBadge from '@/components/GradeBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const loading = ref(true)
const error = ref(null)
const marks = ref([])

const fetchMarks = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/student/marks')

    if (response.data.success) {
      marks.value = response.data.data
    } else {
      error.value = response.data.message || 'Failed to load marks'
    }
  } catch (err) {
    console.error('Fetch marks error:', err)
    error.value = err.response?.data?.message || 'Failed to load marks'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
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
  fetchMarks()
})
</script>
