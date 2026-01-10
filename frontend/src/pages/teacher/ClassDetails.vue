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

    <!-- Class Details -->
    <div v-else>
      <!-- Page Header -->
      <div class="flex items-center mb-6">
        <button
          @click="$router.push('/teacher/classes')"
          class="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {{ classData.class_name }}
          </h1>
          <p class="text-gray-600">{{ classData.subject }} • {{ classData.academic_year }}</p>
        </div>
        <button
          @click="$router.push(`/teacher/marks?class=${classId}`)"
          class="btn btn-primary flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Enter Marks
        </button>
      </div>

      <!-- Class Statistics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          :value="classData.statistics?.student_count || 0"
          subtitle="Enrolled"
          color="blue"
        />
        <StatCard
          title="Assessments"
          :value="classData.statistics?.assessment_count || 0"
          :subtitle="getWeightStatus()"
          :color="getWeightStatusColor()"
        />
        <StatCard
          title="Class Average"
          :value="classData.statistics?.class_average ? `${classData.statistics.class_average}/20` : '--'"
          subtitle="Current grade"
          color="purple"
        />
        <StatCard
          title="At Risk"
          :value="classData.statistics?.at_risk_students || 0"
          subtitle="Students below 12/20"
          :color="classData.statistics?.at_risk_students > 0 ? 'red' : 'green'"
        />
      </div>

      <!-- Assessment Types Section -->
      <div class="card mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Assessment Types</h2>
          <button
            @click="showAssessmentModal = true"
            class="btn btn-primary text-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Assessment Type
          </button>
        </div>

        <div v-if="assessments.length > 0" class="space-y-3">
          <div
            v-for="assessment in assessments"
            :key="assessment.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex-1">
              <h3 class="font-medium text-gray-900">{{ assessment.type_name }}</h3>
              <p class="text-sm text-gray-600">Max Score: {{ assessment.max_score }}/20</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-2xl font-bold text-primary-600">{{ assessment.weight }}%</p>
                <p class="text-xs text-gray-500">Weight</p>
              </div>
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="assessment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
              >
                {{ assessment.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <!-- Weight Summary -->
          <div class="flex items-center justify-between p-4 border-2 border-dashed rounded-lg"
            :class="totalWeight === 100 ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'"
          >
            <span class="font-medium" :class="totalWeight === 100 ? 'text-green-900' : 'text-amber-900'">
              Total Weight
            </span>
            <span class="text-2xl font-bold" :class="totalWeight === 100 ? 'text-green-600' : 'text-amber-600'">
              {{ totalWeight }}%
            </span>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="font-medium mb-1">No assessment types yet</p>
          <p class="text-sm">Add assessment types to start entering marks</p>
        </div>
      </div>

      <!-- Student Roster Section -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Student Roster</h2>

        <div v-if="students.length > 0">
          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b-2 border-gray-200">
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Student ID</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th class="text-center py-3 px-4 font-semibold text-gray-700">Current Grade</th>
                  <th class="text-center py-3 px-4 font-semibold text-gray-700">Marks Entered</th>
                  <th class="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th class="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in students"
                  :key="student.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="py-3 px-4 font-mono text-sm text-gray-600">
                    {{ student.student_id }}
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-medium text-gray-900">
                      {{ student.first_name }} {{ student.last_name }}
                    </p>
                    <p class="text-sm text-gray-500">{{ student.email }}</p>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div v-if="student.current_total" class="flex flex-col items-center">
                      <span class="text-xl font-bold" :class="getScoreColor(student.current_total)">
                        {{ student.current_total }}/20
                      </span>
                      <GradeBadge :score="parseFloat(student.current_total)" :letter="student.grade_letter" />
                    </div>
                    <span v-else class="text-gray-400">No marks yet</span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="font-medium text-gray-900">{{ student.marks_count || 0 }}</span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      v-if="student.current_total >= 12"
                      class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      On Track
                    </span>
                    <span
                      v-else-if="student.current_total > 0"
                      class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                    >
                      At Risk
                    </span>
                    <span
                      v-else
                      class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      No Data
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <button
                      @click="viewStudentMarks(student.id)"
                      class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Marks
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden space-y-4">
            <div
              v-for="student in students"
              :key="student.id"
              class="p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="font-medium text-gray-900">
                    {{ student.first_name }} {{ student.last_name }}
                  </p>
                  <p class="text-sm text-gray-600">ID: {{ student.student_id }}</p>
                </div>
                <span
                  v-if="student.current_total >= 12"
                  class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  On Track
                </span>
                <span
                  v-else-if="student.current_total > 0"
                  class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                >
                  At Risk
                </span>
              </div>

              <div v-if="student.current_total" class="flex items-center justify-between pt-3 border-t">
                <div>
                  <p class="text-sm text-gray-600">Current Grade</p>
                  <p class="text-2xl font-bold" :class="getScoreColor(student.current_total)">
                    {{ student.current_total }}/20
                  </p>
                </div>
                <GradeBadge :score="parseFloat(student.current_total)" :letter="student.grade_letter" />
              </div>

              <button
                @click="viewStudentMarks(student.id)"
                class="mt-3 w-full btn btn-secondary text-sm"
              >
                View Marks ({{ student.marks_count || 0 }})
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="font-medium mb-1">No students enrolled</p>
          <p class="text-sm">Contact the administrator to add students to this class</p>
        </div>
      </div>

      <!-- Add Assessment Modal -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showAssessmentModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click="closeAssessmentModal"
        >
          <div class="card max-w-md w-full" @click.stop>
            <h3 class="text-xl font-bold text-gray-900 mb-4">Add Assessment Type</h3>

            <form @submit.prevent="saveAssessment" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="assessmentForm.type_name"
                  type="text"
                  required
                  class="input"
                  placeholder="e.g., Midterm Exam, Quiz, Project"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Weight (%) <span class="text-red-500">*</span>
                </label>
                <input
                  v-model.number="assessmentForm.weight"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  class="input"
                  placeholder="e.g., 30"
                />
                <p class="text-sm text-gray-500 mt-1">
                  Current total: {{ totalWeight }}% • Remaining: {{ 100 - totalWeight }}%
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Max Score
                </label>
                <input
                  v-model.number="assessmentForm.max_score"
                  type="number"
                  step="0.01"
                  value="20"
                  readonly
                  class="input bg-gray-100 cursor-not-allowed"
                />
                <p class="text-sm text-gray-500 mt-1">All assessments use the 0-20 scale</p>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  @click="closeAssessmentModal"
                  class="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="formSubmitting"
                  class="flex-1 btn btn-primary"
                >
                  {{ formSubmitting ? 'Saving...' : 'Add Assessment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import StatCard from '@/components/StatCard.vue'
import GradeBadge from '@/components/GradeBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const route = useRoute()
const router = useRouter()
const classId = route.params.id

const loading = ref(true)
const error = ref(null)
const formSubmitting = ref(false)

const classData = ref({})
const students = ref([])
const assessments = ref([])

const showAssessmentModal = ref(false)
const assessmentForm = ref({
  type_name: '',
  weight: null,
  max_score: 20,
})

const totalWeight = computed(() => {
  return assessments.value.reduce((sum, a) => sum + parseFloat(a.weight || 0), 0)
})

const getWeightStatus = () => {
  const total = totalWeight.value
  if (total === 100) return 'Weights complete'
  if (total < 100) return `${100 - total}% remaining`
  return 'Weights exceed 100%'
}

const getWeightStatusColor = () => {
  const total = totalWeight.value
  if (total === 100) return 'green'
  if (total < 100) return 'amber'
  return 'red'
}

const getScoreColor = (score) => {
  const numScore = parseFloat(score)
  if (numScore >= 18) return 'text-green-600'
  if (numScore >= 16) return 'text-blue-600'
  if (numScore >= 14) return 'text-amber-600'
  if (numScore >= 12) return 'text-orange-600'
  return 'text-red-600'
}

const fetchClassDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const [classResponse, studentsResponse, assessmentsResponse] = await Promise.all([
      api.get(`/teacher/classes/${classId}`),
      api.get(`/teacher/classes/${classId}/students`),
      api.get(`/teacher/classes/${classId}/assessments`),
    ])

    if (classResponse.data.success) {
      classData.value = classResponse.data.data
    }

    if (studentsResponse.data.success) {
      students.value = studentsResponse.data.data
    }

    if (assessmentsResponse.data.success) {
      assessments.value = assessmentsResponse.data.data
    }
  } catch (err) {
    console.error('Failed to load class details:', err)
    error.value = err.response?.data?.message || 'Failed to load class details'
  } finally {
    loading.value = false
  }
}

const saveAssessment = async () => {
  formSubmitting.value = true
  error.value = null

  try {
    const response = await api.post('/teacher/assessments', {
      class_id: classId,
      ...assessmentForm.value,
    })

    if (response.data.success) {
      closeAssessmentModal()
      await fetchClassDetails()
    } else {
      error.value = response.data.message || 'Failed to create assessment'
    }
  } catch (err) {
    console.error('Failed to create assessment:', err)
    error.value = err.response?.data?.message || 'Failed to create assessment'
  } finally {
    formSubmitting.value = false
  }
}

const closeAssessmentModal = () => {
  showAssessmentModal.value = false
  assessmentForm.value = {
    type_name: '',
    weight: null,
    max_score: 20,
  }
}

const viewStudentMarks = (studentId) => {
  // Navigate to a student marks view (to be implemented)
  console.log('View marks for student:', studentId)
}

onMounted(() => {
  fetchClassDetails()
})
</script>
