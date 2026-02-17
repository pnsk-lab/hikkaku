<template>
  <article
    class="grid gap-3 rounded-xl border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)] px-5 py-4"
  >
  <header class="flex items-center justify-between gap-3">
      <div class="text-2xl font-bold font-family-[var(--vp-font-family-base)]">{{ entry.title }}</div>
      <ShowcaseLinks
        :entry="entry"
        :path="resolvedPath"
        @open="handleOpen"
      />
    </header>
    <div class="aspect-4/3">
      <iframe
        class="w-full h-full border-0 rounded-md"
        :src="resolvedPath"
        :title="`${entry.title} showcase`"
        loading="lazy"
      />
    </div>

    <p v-if="entry.status === 'error'" class="m-0 text-sm text-[var(--vp-c-danger-1)]">
      {{ entry.error }}
    </p>
    <div v-if="entry.author" class="text-sm text-[var(--vp-c-text-2)]">
      Created by <a :href="entry.author.url" target="_blank" rel="noopener noreferrer">{{ entry.author.name }}</a>
    </div>
  </article>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import ShowcaseLinks from './ShowcaseLinks.vue'
import type { ShowcaseEntry } from './types'

const props = defineProps<{ entry: ShowcaseEntry }>()
const emit =
  defineEmits<(event: 'open', entry: ShowcaseEntry, path: string) => void>()

const handleOpen = (nextEntry: ShowcaseEntry, path: string) => {
  emit('open', nextEntry, path)
}

const _resolveShowcasePath = (value: string) => {
  const resolvedValue = value.startsWith('/') ? value : `/showcase/${value}`
  if (value.endsWith('.html')) {
    return resolvedValue
  }
  if (resolvedValue.endsWith('/')) {
    return `${resolvedValue}index.html`
  }
  return `${resolvedValue}/index.html`
}

const resolvedPath = withBase(_resolveShowcasePath(props.entry.path))
</script>
