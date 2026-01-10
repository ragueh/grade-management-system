<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Teacher Approvals</h1>
      <p class="text-gray-600">Review and approve teacher registration requests</p>
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

    <!-- Success Message -->
    <AlertBanner
      v-if="successMessage"
      type="success"
      :message="successMessage"
      dismissible
      @dismiss="successMessage = null"
      class="mb-6"
    />

    <!-- Teacher List -->
    <div v-else class="space-y-6">
      <!-- Tabs -->
      <div class="flex gap-2 border-b border-gray-200">
        <button
          @click="activeTab = 'pending'"
          class="px-4 py-2 font-medium transition-colors"
          :class="activeTab === 'pending'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'"
        >
          Pending
          <span v-if="pendingTeachers.length > 0"
            class="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full"
          >
            {{ pendingTeachers.length }}
          </span>
        </button>
        <button
          @click="activeTab = 'approved'"
          class="px-4 py-2 font-medium transition-colors"
          :class="activeTab === 'approved'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'"
        >
          Approved
        </button>
        <button
          @click="activeTab = 'all'"
          class="px-4 py-2 font-medium transition-colors"
          :class="activeTab === 'all'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'"
        >
          All Teachers
        </button>
      </div>

      <!-- Pending Teachers -->
      <div v-if="activeTab === 'pending'">
        <div v-if="pendingTeachers.length > 0" class="space-y-4">
          <div
            v-for="teacher in pendingTeachers"
            :key="teacher.id"
            class="card border-l-4 border-amber-400"
          >
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-start gap-3">
                  <div class="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center font-semibold text-lg">
                    {{ teacher.first_name[0] }}{{ teacher.last_name[0] }}
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ teacher.first_name }} {{ teacher.last_name }}
                    </h3>
                    <p class="text-gray-600">{{ teacher.email }}</p>
                    <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        ID: {{ teacher.employee_id }}
                      </span>
                      <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {{ teacher.department }}
                      </span>
                      <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Registered {{ formatDate(teacher.created_at) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  @click="approveTeacher(teacher.id)"
                  :disabled="processingId === teacher.id"
                  class="btn btn-primary text-sm flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ processingId === teacher.id ? 'Approving...' : 'Approve' }}
                </button>
                <button
                  @click="openRejectModal(teacher)"
                  :disabled="processingId === teacher.id"
                  class="btn btn-secondary text-sm flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card text-center py-12">
          <svg class="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p class="text-gray-600">No pending teacher approvals at this time</p>
        </div>
      </div>

      <!-- Approved Teachers -->
      <div v-if="activeTab === 'approved'">
        <div v-if="approvedTeachers.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            v-for="teacher in approvedTeachers"
            :key="teacher.id"
            class="card"
          >
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                {{ teacher.first_name[0] }}{{ teacher.last_name[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900">
                  {{ teacher.first_name }} {{ teacher.last_name }}
                </h3>
                <p class="text-sm text-gray-600 truncate">{{ teacher.email }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ teacher.department }}</p>
              </div>
              <button
                @click="revokeApproval(teacher.id)"
                class="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>

        <div v-else class="card text-center py-12">
          <p class="text-gray-600">No approved teachers yet</p>
        </div>
      </div>

      <!-- All Teachers -->
      <div v-if="activeTab === 'all'">
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b-2 border-gray-200 bg-gray-50">
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                  <th class="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th class="text-center py-3 px-4 font-semibold text-gray-700">Classes</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="teacher in allTeachers"
                  :key="teacher.id"
                  class="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td class="py-3 px-4">
                    {{ teacher.first_name }} {{ teacher.last_name }}
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ teacher.email }}</td>
                  <td class="py-3 px-4 text-gray-600">{{ teacher.department }}</td>
                  <td class="py-3 px-4 text-center">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="teacher.is_approved_by_admin
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'"
                    >
                      {{ teacher.is_approved_by_admin ? 'Approved' : 'Pending' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center text-gray-900 font-medium">
                    {{ teacher.class_count || 0 }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Confirmation Modal -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showRejectModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="closeRejectModal"
      >
        <div class="card max-w-md w-full" @click.stop>
          <h3 class="text-xl font-bold text-gray-900 mb-4">Reject Teacher Application</h3>
          <p class="text-gray-600 mb-4">
            Are you sure you want to reject the application from
            <strong>{{ rejectingTeacher?.first_name }} {{ rejectingTeacher?.last_name }}</strong>?
            This action cannot be undone.
          </p>

          <div class="flex gap-3">
            <button
              @click="closeRejectModal"
              class="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="confirmReject"
              :disabled="processingId !== null"
              class="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
            >
              {{ processingId ? 'Rejecting...' : 'Reject Application' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import AlertBanner from '@/components/AlertBanner.vue'

const loading = ref(true)
const error = ref(null)
const successMessage = ref(null)
const processingId = ref(null)

const activeTab = ref('pending')
const teachers = ref([])

const showRejectModal = ref(false)
const rejectingTeacher = ref(null)

const pendingTeachers = computed(() =>
  teachers.value.filter(t => !t.is_approved_by_admin)
)

const approvedTeachers = computed(() =>
  teachers.value.filter(t => t.is_approved_by_admin)
)

const allTeachers = computed(() => teachers.value)

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchTeachers = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/admin/teachers')

    if (response.data.success) {
      teachers.value = response.data.data
    }
  } catch (err) {
    console.error('Failed to load teachers:', err)
    error.value = 'Failed to load teacher data'
  } finally {
    loading.value = false
  }
}

const approveTeacher = async (teacherId) => {
  processingId.value = teacherId
  error.value = null
  successMessage.value = null

  try {
    const response = await api.post(`/admin/teachers/${teacherId}/approve`)

    if (response.data.success) {
      successMessage.value = 'Teacher approved successfully!'
      await fetchTeachers()
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to approve teacher'
  } finally {
    processingId.value = null
  }
}

const openRejectModal = (teacher) => {
  rejectingTeacher.value = teacher
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  rejectingTeacher.value = null
}

const confirmReject = async () => {
  if (!rejectingTeacher.value) return

  processingId.value = rejectingTeacher.value.id
  error.value = null
  successMessage.value = null

  try {
    const response = await api.delete(`/admin/teachers/${rejectingTeacher.value.id}`)

    if (response.data.success) {
      successMessage.value = 'Teacher application rejected'
      closeRejectModal()
      await fetchTeachers()
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to reject teacher'
  } finally {
    processingId.value = null
  }
}

const revokeApproval = async (teacherId) => {
  if (!confirm('Are you sure you want to revoke approval for this teacher?')) return

  processingId.value = teacherId
  error.value = null
  successMessage.value = null

  try {
    const response = await api.post(`/admin/teachers/${teacherId}/revoke`)

    if (response.data.success) {
      successMessage.value = 'Teacher approval revoked'
      await fetchTeachers()
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to revoke approval'
  } finally {
    processingId.value = null
  }
}

onMounted(() => {
  fetchTeachers()
})
</script>
