<template>
  <svg>
    <use
      :href="id"
      :xlink-href="id"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from '#imports'

const props = withDefaults(defineProps<{ name: string, sprite?: string }>(), {
  sprite: 'global',
})
const id = computed(() => `#${props.sprite}-${props.name}`)
</script>
