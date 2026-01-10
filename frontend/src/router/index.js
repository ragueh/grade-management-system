import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue'),
    meta: { requiresGuest: true },
  },
  // Teacher routes
  {
    path: '/teacher',
    name: 'TeacherLayout',
    component: () => import('@/layouts/TeacherLayout.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      {
        path: 'dashboard',
        name: 'TeacherDashboard',
        component: () => import('@/pages/teacher/Dashboard.vue'),
      },
      {
        path: 'classes',
        name: 'TeacherClasses',
        component: () => import('@/pages/teacher/Classes.vue'),
      },
      {
        path: 'classes/:id',
        name: 'ClassDetails',
        component: () => import('@/pages/teacher/ClassDetails.vue'),
      },
      {
        path: 'marks',
        name: 'MarkEntry',
        component: () => import('@/pages/teacher/MarkEntry.vue'),
      },
    ],
  },
  // Student routes
  {
    path: '/student',
    name: 'StudentLayout',
    component: () => import('@/layouts/StudentLayout.vue'),
    meta: { requiresAuth: true, role: 'student' },
    children: [
      {
        path: 'dashboard',
        name: 'StudentDashboard',
        component: () => import('@/pages/student/Dashboard.vue'),
      },
      {
        path: 'marks',
        name: 'StudentMarks',
        component: () => import('@/pages/student/Marks.vue'),
      },
      {
        path: 'progress',
        name: 'StudentProgress',
        component: () => import('@/pages/student/Progress.vue'),
      },
      {
        path: 'parent-access',
        name: 'ParentAccess',
        component: () => import('@/pages/student/ParentAccess.vue'),
      },
    ],
  },
  // Parent routes
  {
    path: '/parent',
    name: 'ParentLayout',
    component: () => import('@/layouts/ParentLayout.vue'),
    meta: { requiresAuth: true, role: 'parent' },
    children: [
      {
        path: 'dashboard',
        name: 'ParentDashboard',
        component: () => import('@/pages/parent/Dashboard.vue'),
      },
      {
        path: 'child/:studentId',
        name: 'ChildDetails',
        component: () => import('@/pages/parent/ChildDetails.vue'),
      },
    ],
  },
  // Admin routes
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/pages/admin/Dashboard.vue'),
      },
      {
        path: 'teachers',
        name: 'AdminTeachers',
        component: () => import('@/pages/admin/TeacherApprovals.vue'),
      },
    ],
  },
  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // Check if route requires guest (login/register)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap = {
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard',
      admin: '/admin/dashboard',
    }
    next(dashboardMap[authStore.user?.role] || '/')
    return
  }

  // Check role-based access
  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    // Redirect to user's appropriate dashboard
    const dashboardMap = {
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard',
      admin: '/admin/dashboard',
    }
    next(dashboardMap[authStore.user?.role] || '/')
    return
  }

  next()
})

export default router
