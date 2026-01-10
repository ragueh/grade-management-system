<template>
  <span
    class="badge"
    :class="badgeClass"
  >
    {{ letter }} - {{ description }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: {
    type: Number,
    required: true,
  },
  letter: {
    type: String,
    default: null,
  },
})

const gradeInfo = computed(() => {
  const score = props.score

  if (score >= 18) {
    return { letter: 'A', description: 'Excellent', class: 'badge-a' }
  } else if (score >= 16) {
    return { letter: 'B', description: 'Very Good', class: 'badge-b' }
  } else if (score >= 14) {
    return { letter: 'C', description: 'Good', class: 'badge-c' }
  } else if (score >= 12) {
    return { letter: 'D', description: 'Satisfactory', class: 'badge-d' }
  } else {
    return { letter: 'F', description: 'Needs Improvement', class: 'badge-f' }
  }
})

const letter = computed(() => props.letter || gradeInfo.value.letter)
const description = computed(() => gradeInfo.value.description)
const badgeClass = computed(() => gradeInfo.value.class)
</script>
