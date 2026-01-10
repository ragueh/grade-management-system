import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const refreshToken = ref(localStorage.getItem('refreshToken') || null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)

  // Actions
  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)

      if (response.data.success) {
        const { user: userData, token: accessToken, refreshToken: refresh } = response.data.data

        user.value = userData
        token.value = accessToken
        refreshToken.value = refresh

        // Store in localStorage
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', refresh)
        localStorage.setItem('user', JSON.stringify(userData))

        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

        return { success: true, user: userData }
      }

      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.',
      }
    }
  }

  async function register(userData) {
    try {
      const response = await api.post('/auth/register', userData)

      if (response.data.success) {
        const { user: newUser, token: accessToken } = response.data.data

        user.value = newUser
        token.value = accessToken

        // Store in localStorage
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(newUser))

        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

        return { success: true, user: newUser }
      }

      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Register error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
      }
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear state
      user.value = null
      token.value = null
      refreshToken.value = null

      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // Remove authorization header
      delete api.defaults.headers.common['Authorization']
    }
  }

  async function fetchProfile() {
    try {
      const response = await api.get('/auth/me')

      if (response.data.success) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(response.data.data))
        return { success: true, user: response.data.data }
      }

      return { success: false }
    } catch (error) {
      console.error('Fetch profile error:', error)
      // If token is invalid, logout
      if (error.response?.status === 401) {
        await logout()
      }
      return { success: false }
    }
  }

  async function updateProfile(updates) {
    try {
      const response = await api.put('/auth/profile', updates)

      if (response.data.success) {
        user.value = { ...user.value, ...response.data.data }
        localStorage.setItem('user', JSON.stringify(user.value))
        return { success: true, user: user.value }
      }

      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Update profile error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed. Please try again.',
      }
    }
  }

  async function changePassword(passwords) {
    try {
      const response = await api.put('/auth/change-password', passwords)

      if (response.data.success) {
        return { success: true, message: response.data.message }
      }

      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Change password error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed. Please try again.',
      }
    }
  }

  function initializeAuth() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`

      // Fetch fresh profile data
      fetchProfile()
    }
  }

  // Initialize auth on store creation
  initializeAuth()

  return {
    // State
    user,
    token,
    refreshToken,

    // Getters
    isAuthenticated,
    userRole,

    // Actions
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    changePassword,
    initializeAuth,
  }
})
