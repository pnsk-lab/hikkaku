<template>
  <div class="flex flex-wrap gap-2 items-center">
    <a
      v-if="entry.sourceUrl"
      class="w-4 h-4 bg-[var(--vp-c-text-2)]  i-tabler-brand-github"
      :href="entry.sourceUrl"
      target="_blank"
      rel="noreferrer noopener"
    />
    <button
      class="flex justify-center items-center w-4 h-4"
      type="button"
      aria-label="Enlarge showcase"
      @click="$emit('open', entry, path)"
    >
      <span class="w-4 h-4 bg-[var(--vp-c-text-2)] i-tabler-arrows-maximize"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ShowcaseEntry } from './types'

const props = defineProps<{
  entry: ShowcaseEntry
  path: string
}>()

defineEmits<(event: 'open', entry: ShowcaseEntry, path: string) => void>()

const toAuthorHref = computed(() => {
  if (!props.entry.author) {
    return undefined
  }
  if (props.entry.author.url) {
    return props.entry.author.url
  }
  if (props.entry.author.email) {
    return `mailto:${props.entry.author.email}`
  }
  return undefined
})

const _authorLink = computed(() => toAuthorHref.value)
</script>
