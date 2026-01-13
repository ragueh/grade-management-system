<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Classes</h1>
        <p class="text-gray-600">Manage your classes and view student rosters</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="btn btn-primary flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create New Class
      </button>
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

    <!-- Classes Grid -->
    <div v-else-if="classes.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="classItem in classes"
        :key="classItem.id"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewClassDetails(classItem.id)"
      >
        <!-- Class Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 mb-1">
              {{ classItem.class_name }}
            </h3>
            <p class="text-gray-600">{{ classItem.subject }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ classItem.academic_year }}</p>
          </div>
          <button
            @click.stop="openEditModal(classItem)"
            class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        <!-- Class Statistics -->
        <div class="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
          <div class="text-center">
            <p class="text-2xl font-bold text-primary-600">{{ classItem.student_count || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Students</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ classItem.assessment_count || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Assessments</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-purple-600">{{ classItem.total_marks || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Marks</p>
          </div>
        </div>

        <!-- Class Actions -->
        <div class="flex gap-2 mt-4">
          <button
            @click.stop="$router.push(`/teacher/marks?class=${classItem.id}`)"
            class="flex-1 btn btn-primary text-sm"
          >
            Enter Marks
          </button>
          <button
            @click.stop="viewClassDetails(classItem.id)"
            class="flex-1 btn btn-secondary text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
      <p class="text-gray-600 mb-4">Create your first class to start managing students and marks</p>
      <button @click="showCreateModal = true" class="btn btn-primary">
        Create New Class
      </button>
    </div>

    <!-- Create/Edit Class Modal -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCreateModal || showEditModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="closeModals"
      >
        <div class="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" @click.stop>
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            {{ editingClass ? 'Edit Class' : 'Create New Class' }}
          </h3>

          <form @submit.prevent="saveClass" class="space-y-4">
            <!-- Class Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Class Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="classForm.class_name"
                type="text"
                required
                class="input"
                placeholder="e.g., 5A, 6B Science"
              />
            </div>

            <!-- Subject -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Subject <span class="text-red-500">*</span>
              </label>
              <input
                v-model="classForm.subject"
                type="text"
                required
                class="input"
                placeholder="e.g., Mathematics, English, Science"
              />
            </div>

            <!-- Academic Year -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Academic Year <span class="text-red-500">*</span>
              </label>
              <input
                v-model="classForm.academic_year"
                type="text"
                required
                class="input"
                placeholder="e.g., 2024-2025"
                pattern="\d{4}-\d{4}"
              />
              <p class="text-xs text-gray-500 mt-1">Format: YYYY-YYYY (e.g., 2025-2026)</p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                v-model="classForm.description"
                rows="3"
                class="input"
                placeholder="Add any additional details about this class..."
              ></textarea>
            </div>

            <!-- Form Actions -->
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="closeModals"
                class="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="formSubmitting"
                class="flex-1 btn btn-primary"
              >
                {{ formSubmitting ? 'Saving...' : (editingClass ? 'Update Class' : 'Create Class') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import AlertBanner from '@/components/AlertBanner.vue'

const router = useRouter()

const loading = ref(true)
const error = ref(null)
const classes = ref([])

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingClass = ref(null)
const formSubmitting = ref(false)

const classForm = ref({
  class_name: '',
  subject: '',
  academic_year: '',
  description: '',
})

const fetchClasses = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/teacher/classes')

    if (response.data.success) {
      classes.value = response.data.data
    } else {
      error.value = response.data.message || 'Failed to load classes'
    }
  } catch (err) {
    console.error('Classes error:', err)
    error.value = err.response?.data?.message || 'Failed to load classes'
  } finally {
    loading.value = false
  }
}

const openEditModal = (classItem) => {
  editingClass.value = classItem
  classForm.value = {
    class_name: classItem.class_name,
    subject: classItem.subject,
    academic_year: classItem.academic_year,
    description: classItem.description || '',
  }
  showEditModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingClass.value = null
  classForm.value = {
    class_name: '',
    subject: '',
    academic_year: '',
    description: '',
  }
}

const saveClass = async () => {
  formSubmitting.value = true
  error.value = null

  try {
    let response
    if (editingClass.value) {
      // Update existing class
      response = await api.put(`/teacher/classes/${editingClass.value.id}`, classForm.value)
    } else {
      // Create new class
      response = await api.post('/teacher/classes', classForm.value)
    }

    if (response.data.success) {
      closeModals()
      await fetchClasses()
    } else {
      error.value = response.data.message || 'Failed to save class'
    }
  } catch (err) {
    console.error('Save class error:', err)
    const responseData = err.response?.data
    if (responseData?.errors && responseData.errors.length > 0) {
      error.value = responseData.errors.map(e => e.msg).join(', ')
    } else {
      error.value = responseData?.message || 'Failed to save class'
    }
  } finally {
    formSubmitting.value = false
  }
}

const viewClassDetails = (classId) => {
  router.push(`/teacher/classes/${classId}`)
}

onMounted(() => {
  fetchClasses()
})
</script>
