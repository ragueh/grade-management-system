<template>
  <div>
    <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Parent Access Settings</h1>
    <p class="text-gray-600 mb-6">Control whether your parents can view your grades</p>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="spinner"></div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Access Toggle Card -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Access Permission</h2>

        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-medium text-gray-900 mb-1">
              {{ accessStatus.allow_parent_access ? 'Access Granted' : 'Access Denied' }}
            </h3>
            <p class="text-sm text-gray-600">
              {{
                accessStatus.allow_parent_access
                  ? 'Your parents can currently view your marks, grades, and alerts.'
                  : 'Your parents cannot view your academic information.'
              }}
            </p>
          </div>

          <button
            @click="toggleAccess"
            :disabled="!accessStatus.has_parent_linked || updating"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="accessStatus.allow_parent_access ? 'bg-primary-600' : 'bg-gray-200'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="accessStatus.allow_parent_access ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- No Parent Linked Warning -->
        <AlertBanner
          v-if="!accessStatus.has_parent_linked"
          type="warning"
          class="mt-4"
        >
          <p class="text-sm">
            No parent account is linked to your profile. Ask your parent to register and provide their email to your teacher to link accounts.
          </p>
        </AlertBanner>

        <!-- Success Message -->
        <AlertBanner
          v-if="successMessage"
          type="success"
          class="mt-4"
          :message="successMessage"
          dismissible
          @dismiss="successMessage = null"
        />
      </div>

      <!-- Information Card -->
      <div class="card bg-blue-50 border border-blue-200">
        <h3 class="font-medium text-blue-900 mb-3">What Parents Can See</h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li class="flex items-start">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>All your marks and assessment scores</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Teacher comments and feedback</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Your current grade and progress</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Active alerts and warnings</span>
          </li>
        </ul>
      </div>

      <!-- Privacy Card -->
      <div class="card">
        <h3 class="font-medium text-gray-900 mb-2">Privacy &amp; Control</h3>
        <p class="text-sm text-gray-600">
          You have complete control over parent access. You can enable or disable it at any time. All changes are logged for your security.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import AlertBanner from '@/components/AlertBanner.vue'

const loading = ref(true)
const updating = ref(false)
const successMessage = ref(null)

const accessStatus = ref({
  allow_parent_access: false,
  has_parent_linked: false,
})

const fetchAccessStatus = async () => {
  loading.value = true

  try {
    const response = await api.get('/student/parent-access')

    if (response.data.success) {
      accessStatus.value = response.data.data
    }
  } catch (err) {
    console.error('Fetch access status error:', err)
  } finally {
    loading.value = false
  }
}

const toggleAccess = async () => {
  updating.value = true
  successMessage.value = null

  try {
    const newStatus = !accessStatus.value.allow_parent_access

    const response = await api.put('/student/parent-access', {
      allow_parent_access: newStatus,
    })

    if (response.data.success) {
      accessStatus.value.allow_parent_access = newStatus
      successMessage.value = newStatus
        ? 'Parent access granted successfully'
        : 'Parent access revoked successfully'
    }
  } catch (err) {
    console.error('Toggle access error:', err)
    successMessage.value = null
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  fetchAccessStatus()
})
</script>
