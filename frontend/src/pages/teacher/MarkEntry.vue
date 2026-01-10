<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Enter Marks</h1>
      <p class="text-gray-600">Add assessment scores and comments for students</p>
    </div>

    <!-- Success Message -->
    <AlertBanner
      v-if="successMessage"
      type="success"
      :message="successMessage"
      dismissible
      @dismiss="successMessage = null"
      class="mb-6"
    />

    <!-- Error Message -->
    <AlertBanner
      v-if="error"
      type="critical"
      :message="error"
      dismissible
      @dismiss="error = null"
      class="mb-6"
    />

    <!-- Mark Entry Form -->
    <div class="card max-w-3xl mx-auto">
      <form @submit.prevent="submitMark" class="space-y-6">
        <!-- Class Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Class <span class="text-red-500">*</span>
          </label>
          <select
            v-model="markForm.class_id"
            @change="onClassChange"
            required
            class="input"
            :disabled="loadingClasses"
          >
            <option value="">-- Choose a class --</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.class_name }} - {{ cls.subject }} ({{ cls.student_count }} students)
            </option>
          </select>
          <p v-if="loadingClasses" class="text-sm text-gray-500 mt-1">Loading classes...</p>
        </div>

        <!-- Assessment Type Selection -->
        <div v-if="markForm.class_id">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Assessment Type <span class="text-red-500">*</span>
          </label>
          <select
            v-model="markForm.assessment_id"
            required
            class="input"
            :disabled="loadingAssessments"
          >
            <option value="">-- Choose an assessment type --</option>
            <option v-for="assessment in assessments" :key="assessment.id" :value="assessment.id">
              {{ assessment.type_name }} - {{ assessment.weight }}% (Max: {{ assessment.max_score }}/20)
            </option>
          </select>
          <p v-if="loadingAssessments" class="text-sm text-gray-500 mt-1">Loading assessments...</p>
          <p v-else-if="assessments.length === 0" class="text-sm text-amber-600 mt-1">
            No assessments configured for this class. Please create assessments first.
          </p>
        </div>

        <!-- Student Selection -->
        <div v-if="markForm.class_id">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Student <span class="text-red-500">*</span>
          </label>
          <select
            v-model="markForm.student_id"
            required
            class="input"
            :disabled="loadingStudents"
          >
            <option value="">-- Choose a student --</option>
            <option v-for="student in students" :key="student.id" :value="student.id">
              {{ student.first_name }} {{ student.last_name }} (ID: {{ student.student_id }})
            </option>
          </select>
          <p v-if="loadingStudents" class="text-sm text-gray-500 mt-1">Loading students...</p>
          <p v-else-if="students.length === 0" class="text-sm text-amber-600 mt-1">
            No students enrolled in this class yet.
          </p>
        </div>

        <!-- Assessment Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Assessment Date <span class="text-red-500">*</span>
          </label>
          <input
            v-model="markForm.assessment_date"
            type="date"
            required
            class="input"
            :max="today"
          />
          <p class="text-sm text-gray-500 mt-1">When was this assessment completed?</p>
        </div>

        <!-- Score Input -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Score <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model.number="markForm.score"
              type="number"
              step="0.01"
              min="0"
              max="20"
              required
              class="input pr-16"
              placeholder="0.00"
              @input="validateScore"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span class="text-gray-500 font-medium">/ 20</span>
            </div>
          </div>
          <div class="flex items-center justify-between mt-2">
            <p class="text-sm text-gray-500">Enter a score between 0 and 20</p>
            <div v-if="markForm.score !== null && markForm.score !== ''" class="flex items-center gap-2">
              <GradeBadge :score="parseFloat(markForm.score)" />
              <span class="text-sm font-medium" :class="getScoreColor(markForm.score)">
                {{ ((markForm.score / 20) * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Teacher Comment -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Teacher Comment (Optional)
          </label>
          <textarea
            v-model="markForm.teacher_comment"
            rows="4"
            class="input"
            placeholder="Add feedback, notes, or observations about this assessment..."
            maxlength="500"
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">
            {{ markForm.teacher_comment?.length || 0 }} / 500 characters
          </p>
        </div>

        <!-- Status Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Mark Status
          </label>
          <div class="flex gap-4">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="markForm.status"
                type="radio"
                value="published"
                class="mr-2"
              />
              <span class="text-sm">Published (Visible to student)</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="markForm.status"
                type="radio"
                value="draft"
                class="mr-2"
              />
              <span class="text-sm">Draft (Not visible yet)</span>
            </label>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex gap-3 pt-4 border-t">
          <button
            type="button"
            @click="resetForm"
            class="flex-1 btn btn-secondary"
            :disabled="formSubmitting"
          >
            Clear Form
          </button>
          <button
            type="submit"
            class="flex-1 btn btn-primary"
            :disabled="formSubmitting || !isFormValid"
          >
            {{ formSubmitting ? 'Submitting...' : 'Submit Mark' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Recent Marks (if any) -->
    <div v-if="recentMarks.length > 0" class="card max-w-3xl mx-auto mt-6">
      <h3 class="font-semibold text-gray-900 mb-4">Recently Entered Marks</h3>
      <div class="space-y-3">
        <div
          v-for="mark in recentMarks"
          :key="mark.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex-1">
            <p class="font-medium text-gray-900">
              {{ mark.student_name }} - {{ mark.assessment_name }}
            </p>
            <p class="text-sm text-gray-600">
              {{ formatDate(mark.assessment_date) }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xl font-bold" :class="getScoreColor(mark.score)">
              {{ mark.score }}/20
            </span>
            <GradeBadge :score="parseFloat(mark.score)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Help Card -->
    <div class="card max-w-3xl mx-auto mt-6 bg-blue-50 border border-blue-200">
      <h3 class="font-medium text-blue-900 mb-2">Tips for Entering Marks</h3>
      <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
        <li>All scores are on a 0-20 scale (not percentages)</li>
        <li>Assessment weights must total 100% before entering marks</li>
        <li>Draft marks are saved but not visible to students</li>
        <li>Published marks immediately update student calculations and may trigger alerts</li>
        <li>Comments help students understand their performance</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import GradeBadge from '@/components/GradeBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const route = useRoute()

const loadingClasses = ref(true)
const loadingAssessments = ref(false)
const loadingStudents = ref(false)
const formSubmitting = ref(false)
const error = ref(null)
const successMessage = ref(null)

const classes = ref([])
const assessments = ref([])
const students = ref([])
const recentMarks = ref([])

const today = new Date().toISOString().split('T')[0]

const markForm = ref({
  class_id: route.query.class || '',
  assessment_id: '',
  student_id: '',
  assessment_date: today,
  score: null,
  teacher_comment: '',
  status: 'published',
})

const isFormValid = computed(() => {
  return (
    markForm.value.class_id &&
    markForm.value.assessment_id &&
    markForm.value.student_id &&
    markForm.value.assessment_date &&
    markForm.value.score !== null &&
    markForm.value.score >= 0 &&
    markForm.value.score <= 20
  )
})

const fetchClasses = async () => {
  loadingClasses.value = true
  try {
    const response = await api.get('/teacher/classes')
    if (response.data.success) {
      classes.value = response.data.data

      // If class was pre-selected from query param, load its data
      if (markForm.value.class_id) {
        onClassChange()
      }
    }
  } catch (err) {
    console.error('Failed to load classes:', err)
    error.value = 'Failed to load classes'
  } finally {
    loadingClasses.value = false
  }
}

const onClassChange = async () => {
  markForm.value.assessment_id = ''
  markForm.value.student_id = ''
  assessments.value = []
  students.value = []

  if (!markForm.value.class_id) return

  // Load assessments and students for selected class
  await Promise.all([
    fetchAssessments(markForm.value.class_id),
    fetchStudents(markForm.value.class_id)
  ])
}

const fetchAssessments = async (classId) => {
  loadingAssessments.value = true
  try {
    const response = await api.get(`/teacher/classes/${classId}/assessments`)
    if (response.data.success) {
      assessments.value = response.data.data
    }
  } catch (err) {
    console.error('Failed to load assessments:', err)
  } finally {
    loadingAssessments.value = false
  }
}

const fetchStudents = async (classId) => {
  loadingStudents.value = true
  try {
    const response = await api.get(`/teacher/classes/${classId}/students`)
    if (response.data.success) {
      students.value = response.data.data
    }
  } catch (err) {
    console.error('Failed to load students:', err)
  } finally {
    loadingStudents.value = false
  }
}

const validateScore = () => {
  if (markForm.value.score < 0) {
    markForm.value.score = 0
  } else if (markForm.value.score > 20) {
    markForm.value.score = 20
  }
}

const getScoreColor = (score) => {
  const numScore = parseFloat(score)
  if (numScore >= 18) return 'text-green-600'
  if (numScore >= 16) return 'text-blue-600'
  if (numScore >= 14) return 'text-amber-600'
  if (numScore >= 12) return 'text-orange-600'
  return 'text-red-600'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const submitMark = async () => {
  if (!isFormValid.value) return

  formSubmitting.value = true
  error.value = null
  successMessage.value = null

  try {
    const response = await api.post('/teacher/marks', markForm.value)

    if (response.data.success) {
      successMessage.value = 'Mark submitted successfully!'

      // Add to recent marks
      const newMark = response.data.data
      const student = students.value.find(s => s.id === markForm.value.student_id)
      const assessment = assessments.value.find(a => a.id === markForm.value.assessment_id)

      recentMarks.value.unshift({
        id: newMark.id,
        student_name: `${student.first_name} ${student.last_name}`,
        assessment_name: assessment.type_name,
        assessment_date: markForm.value.assessment_date,
        score: markForm.value.score,
      })

      // Keep only last 5 recent marks
      if (recentMarks.value.length > 5) {
        recentMarks.value = recentMarks.value.slice(0, 5)
      }

      // Reset form but keep class selection
      const classId = markForm.value.class_id
      resetForm()
      markForm.value.class_id = classId

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      error.value = response.data.message || 'Failed to submit mark'
    }
  } catch (err) {
    console.error('Submit mark error:', err)
    error.value = err.response?.data?.message || 'Failed to submit mark. Please try again.'
  } finally {
    formSubmitting.value = false
  }
}

const resetForm = () => {
  markForm.value = {
    class_id: '',
    assessment_id: '',
    student_id: '',
    assessment_date: today,
    score: null,
    teacher_comment: '',
    status: 'published',
  }
  assessments.value = []
  students.value = []
}

onMounted(() => {
  fetchClasses()
})
</script>
