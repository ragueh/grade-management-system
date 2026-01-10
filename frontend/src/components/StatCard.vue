<template>
  <div class="card">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-600 mb-1">{{ title }}</p>
        <p class="text-2xl md:text-3xl font-bold" :class="valueClass">
          {{ value }}
        </p>
        <p v-if="subtitle" class="text-xs md:text-sm text-gray-500 mt-1">
          {{ subtitle }}
        </p>
      </div>

      <div
        v-if="icon"
        class="p-3 rounded-lg"
        :class="iconBgClass"
      >
        <component
          :is="icon"
          class="w-6 h-6"
          :class="iconClass"
        />
      </div>
    </div>

    <!-- Trend indicator -->
    <div v-if="trend" class="mt-3 flex items-center text-sm">
      <svg
        v-if="trend > 0"
        class="w-4 h-4 text-green-600 mr-1"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
      </svg>
      <svg
        v-else-if="trend < 0"
        class="w-4 h-4 text-red-600 mr-1"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fill-rule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clip-rule="evenodd" />
      </svg>
      <span :class="trend > 0 ? 'text-green-600' : 'text-red-600'">
        {{ Math.abs(trend) }}% {{ trend > 0 ? 'increase' : 'decrease' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: Object,
    default: null,
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'red', 'yellow', 'purple', 'gray'].includes(value),
  },
  trend: {
    type: Number,
    default: null,
  },
})

const valueClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-900',
  }
  return colorMap[props.color] || colorMap.gray
})

const iconBgClass = computed(() => {
  const colorMap = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    gray: 'bg-gray-100',
  }
  return colorMap[props.color] || colorMap.gray
})

const iconClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
  }
  return colorMap[props.color] || colorMap.gray
})
</script>
