<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Grade Management System
        </h1>
        <p class="text-primary-100 text-sm md:text-base">
          Sign in to access your account
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-lg shadow-xl p-6 md:p-8">
        <!-- Alert Messages -->
        <div v-if="errorMessage" class="alert alert-critical mb-4">
          <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          {{ errorMessage }}
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="mb-4">
            <label for="email" class="label">Email Address</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              :class="{ 'input-error': errors.email }"
              placeholder="your.email@example.com"
              required
              autocomplete="email"
            />
            <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label for="password" class="label">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="input"
              :class="{ 'input-error': errors.password }"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            />
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary w-full mb-4"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner mr-2"></span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <!-- Register Link -->
          <div class="text-center">
            <p class="text-sm text-gray-600">
              Don't have an account?
              <RouterLink to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
                Register here
              </RouterLink>
            </p>
          </div>
        </form>

        <!-- Demo Accounts -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center mb-3">Demo Accounts</p>
          <div class="grid grid-cols-4 gap-2 text-xs">
            <button
              @click="fillDemoCredentials('admin')"
              class="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            >
              Admin
            </button>
            <button
              @click="fillDemoCredentials('teacher')"
              class="px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              Teacher
            </button>
            <button
              @click="fillDemoCredentials('student')"
              class="px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              Student
            </button>
            <button
              @click="fillDemoCredentials('parent')"
              class="px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
            >
              Parent
            </button>
          </div>
        </div>
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

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const handleLogin = async () => {
  // Reset errors
  errors.email = ''
  errors.password = ''
  errorMessage.value = ''

  // Validate
  if (!form.email) {
    errors.email = 'Email is required'
    return
  }
  if (!form.password) {
    errors.password = 'Password is required'
    return
  }

  loading.value = true

  try {
    const result = await authStore.login({
      email: form.email,
      password: form.password,
    })

    if (result.success) {
      // Redirect to appropriate dashboard
      const dashboardMap = {
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
        parent: '/parent/dashboard',
        admin: '/admin/dashboard',
      }

      const redirectPath = dashboardMap[result.user.role] || '/'
      router.push(redirectPath)
    } else {
      errorMessage.value = result.message || 'Login failed. Please try again.'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}

const fillDemoCredentials = (role) => {
  const demoAccounts = {
    admin: {
      email: 'admin@school.com',
      password: 'Admin123!',
    },
    teacher: {
      email: 'teacher1@school.com',
      password: 'Teacher123!',
    },
    student: {
      email: 'student1@school.com',
      password: 'Student123!',
    },
    parent: {
      email: 'parent1@email.com',
      password: 'Parent123!',
    },
  }

  if (demoAccounts[role]) {
    form.email = demoAccounts[role].email
    form.password = demoAccounts[role].password
  }
}
</script>
