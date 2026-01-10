<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-12">
    <div class="w-full max-w-2xl">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Create Your Account
        </h1>
        <p class="text-primary-100 text-sm md:text-base">
          Join the Grade Management System
        </p>
      </div>

      <!-- Register Card -->
      <div class="bg-white rounded-lg shadow-xl p-6 md:p-8">
        <!-- Alert Messages -->
        <div v-if="errorMessage" class="alert alert-critical mb-4">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="alert alert-success mb-4">
          {{ successMessage }}
        </div>

        <!-- Registration Form -->
        <form @submit.prevent="handleRegister">
          <!-- Role Selection -->
          <div class="mb-6">
            <label class="label">I am a...</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="role in roles"
                :key="role.value"
                type="button"
                @click="form.role = role.value"
                class="px-4 py-3 rounded-lg border-2 transition-all text-sm md:text-base"
                :class="form.role === role.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'"
              >
                {{ role.label }}
              </button>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="first_name" class="label">First Name</label>
              <input
                id="first_name"
                v-model="form.first_name"
                type="text"
                class="input"
                required
              />
            </div>

            <div>
              <label for="last_name" class="label">Last Name</label>
              <input
                id="last_name"
                v-model="form.last_name"
                type="text"
                class="input"
                required
              />
            </div>
          </div>

          <!-- Email and Phone -->
          <div class="mb-4">
            <label for="email" class="label">Email Address</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              required
            />
          </div>

          <div class="mb-4">
            <label for="phone_number" class="label">Phone Number (Optional)</label>
            <input
              id="phone_number"
              v-model="form.phone_number"
              type="tel"
              class="input"
              placeholder="+1234567890"
            />
          </div>

          <!-- Teacher-specific fields -->
          <div v-if="form.role === 'teacher'" class="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 class="font-semibold text-blue-900 mb-3">Teacher Information</h3>

            <div class="mb-3">
              <label for="employee_id" class="label">Employee ID</label>
              <input
                id="employee_id"
                v-model="form.employee_id"
                type="text"
                class="input"
                placeholder="TCH001"
              />
            </div>

            <div>
              <label for="department" class="label">Department</label>
              <input
                id="department"
                v-model="form.department"
                type="text"
                class="input"
                placeholder="Mathematics, Science, etc."
              />
            </div>

            <p class="text-xs text-blue-700 mt-2">
              Note: Teacher accounts require admin approval before activation.
            </p>
          </div>

          <!-- Student-specific fields -->
          <div v-if="form.role === 'student'" class="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 class="font-semibold text-green-900 mb-3">Student Information</h3>

            <div class="mb-3">
              <label for="student_id" class="label">Student ID</label>
              <input
                id="student_id"
                v-model="form.student_id"
                type="text"
                class="input"
                placeholder="STU001"
                required
              />
            </div>

            <div>
              <label for="class_id" class="label">Class ID</label>
              <input
                id="class_id"
                v-model="form.class_id"
                type="number"
                class="input"
                placeholder="1"
                required
              />
              <p class="text-xs text-green-700 mt-1">
                Ask your teacher for your class ID
              </p>
            </div>
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label for="password" class="label">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="input"
              required
              minlength="8"
            />
            <p class="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div class="mb-6">
            <label for="confirm_password" class="label">Confirm Password</label>
            <input
              id="confirm_password"
              v-model="form.confirm_password"
              type="password"
              class="input"
              :class="{ 'input-error': form.password && form.confirm_password && form.password !== form.confirm_password }"
              required
            />
            <p v-if="form.password && form.confirm_password && form.password !== form.confirm_password" class="error-message">
              Passwords do not match
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary w-full mb-4"
            :disabled="loading || (form.password !== form.confirm_password)"
          >
            <span v-if="loading" class="spinner mr-2"></span>
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>

          <!-- Login Link -->
          <div class="text-center">
            <p class="text-sm text-gray-600">
              Already have an account?
              <RouterLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
                Sign in here
              </RouterLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const roles = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
]

const form = reactive({
  role: 'student',
  email: '',
  password: '',
  confirm_password: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  // Teacher fields
  employee_id: '',
  department: '',
  // Student fields
  student_id: '',
  class_id: '',
})

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Validate passwords match
  if (form.password !== form.confirm_password) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    // Prepare registration data based on role
    const registrationData = {
      email: form.email,
      password: form.password,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
      phone_number: form.phone_number || undefined,
    }

    // Add role-specific fields
    if (form.role === 'teacher') {
      registrationData.employee_id = form.employee_id
      registrationData.department = form.department
    } else if (form.role === 'student') {
      registrationData.student_id = form.student_id
      registrationData.class_id = parseInt(form.class_id)
    }

    const result = await authStore.register(registrationData)

    if (result.success) {
      successMessage.value = 'Account created successfully! Redirecting...'

      setTimeout(() => {
        // Redirect to appropriate dashboard
        const dashboardMap = {
          teacher: '/teacher/dashboard',
          student: '/student/dashboard',
          parent: '/parent/dashboard',
        }
        router.push(dashboardMap[result.user.role] || '/')
      }, 1500)
    } else {
      errorMessage.value = result.message || 'Registration failed. Please try again.'
    }
  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
