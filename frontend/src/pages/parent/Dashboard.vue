<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Welcome, {{ parentName }}!
      </h1>
      <p class="text-gray-600">Monitor your children's academic progress</p>
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
      <!-- Statistics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Children"
          :value="dashboardData.statistics?.total_children || 0"
          subtitle="Total registered"
          color="purple"
        />

        <StatCard
          title="With Access"
          :value="dashboardData.statistics?.accessible_children || 0"
          subtitle="Permission granted"
          color="green"
        />

        <StatCard
          title="Total Alerts"
          :value="dashboardData.statistics?.total_alerts || 0"
          :subtitle="dashboardData.statistics?.total_alerts > 0 ? 'Needs attention' : 'All good'"
          :color="dashboardData.statistics?.total_alerts > 0 ? 'red' : 'gray'"
        />
      </div>

      <!-- Children List -->
      <div class="card">
        <h2 class="card-header">My Children's Progress</h2>

        <div v-if="dashboardData.children && dashboardData.children.length > 0" class="space-y-4">
          <div
            v-for="child in dashboardData.children"
            :key="child.id"
            class="p-4 rounded-lg border-2 transition-all"
            :class="child.allow_parent_access && child.permission_status === 'active'
              ? 'border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer'
              : 'border-gray-200 bg-gray-50'"
            @click="child.allow_parent_access && child.permission_status === 'active' && $router.push(`/parent/child/${child.id}`)"
          >
            <!-- Child Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 text-lg">
                  {{ child.first_name }} {{ child.last_name }}
                </h3>
                <p class="text-sm text-gray-600">{{ child.class_name }} - {{ child.subject }}</p>
                <p class="text-xs text-gray-500 mt-1">Student ID: {{ child.student_id }}</p>
              </div>

              <!-- Access Status Badge -->
              <span
                v-if="child.allow_parent_access && child.permission_status === 'active'"
                class="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full"
              >
                Access Granted
              </span>
              <span
                v-else
                class="px-3 py-1 bg-gray-400 text-white text-xs font-medium rounded-full"
              >
                No Access
              </span>
            </div>

            <!-- Child Grades (if accessible) -->
            <div v-if="child.allow_parent_access && child.permission_status === 'active' && child.current_total" class="flex items-center justify-between pt-3 border-t border-green-200">
              <div>
                <p class="text-sm text-gray-600">Current Grade</p>
                <p class="text-2xl font-bold" :class="getGradeColor(child.current_total)">
                  {{ child.current_total }}/20
                </p>
              </div>
              <div class="text-right">
                <GradeBadge :score="parseFloat(child.current_total)" :letter="child.grade_letter" />
                <p class="text-sm text-gray-600 mt-1">{{ child.percentage }}%</p>
              </div>
            </div>

            <!-- No Access Message -->
            <div v-else-if="!child.allow_parent_access || child.permission_status !== 'active'" class="pt-3 border-t border-gray-200">
              <p class="text-sm text-gray-600 italic">
                {{ child.first_name }} has not granted you access to view their grades yet.
              </p>
            </div>

            <!-- View Details Button -->
            <div v-if="child.allow_parent_access && child.permission_status === 'active'" class="mt-3">
              <button class="btn btn-primary w-full text-sm">
                View Detailed Progress →
              </button>
            </div>
          </div>
        </div>

        <!-- No Children Message -->
        <div v-else class="text-center py-8 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="font-medium text-gray-900 mb-1">No children registered</p>
          <p class="text-sm">Contact your child's teacher to link your accounts</p>
        </div>
      </div>

      <!-- Information Card -->
      <div class="card bg-blue-50 border border-blue-200">
        <h3 class="font-medium text-blue-900 mb-2">Need Help?</h3>
        <p class="text-sm text-blue-800">
          If you can't see your child's grades, ask them to grant you access from their Parent Access settings page.
          They have full control over what you can see.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import StatCard from '@/components/StatCard.vue'
import GradeBadge from '@/components/GradeBadge.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)
const dashboardData = ref({})

const parentName = computed(() => {
  return authStore.user?.first_name || 'Parent'
})

const fetchDashboard = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/parent/dashboard')

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

const getGradeColor = (score) => {
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
