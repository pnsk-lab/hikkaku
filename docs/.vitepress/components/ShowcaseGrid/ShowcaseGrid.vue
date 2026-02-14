<template>
  <section>
    <p
      v-if="isLoading"
      class="mb-0 rounded-xl bg-[var(--vp-c-bg-soft)] px-5 py-4"
    >
      Loading showcase...
    </p>
    <p
      v-else-if="error"
      class="mb-0 rounded-xl bg-[var(--vp-c-bg-soft)] px-5 py-4 text-[var(--vp-c-danger-1)]"
    >
      {{ error }}
    </p>
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <ShowcaseCard
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        @open="handleOpen"
      />
    </div>

    <ShowcaseModal
      v-if="activeEntry"
      :title="activeEntry.title"
      :src="activeEntry.path"
      @close="close"
    />
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { parseManifestAuthor, type ShowcaseEntry } from './types'

const entries = ref<ShowcaseEntry[]>([])
const error = ref('')
const isLoading = ref(true)
const activeEntry = ref<ShowcaseEntry | null>(null)
const isBrowser = typeof window !== 'undefined'

const handleOpen = (entry: ShowcaseEntry, path: string) => {
  activeEntry.value = {
    ...entry,
    path,
  }
}

const close = () => {
  activeEntry.value = null
}

const onKeyDown = (event: KeyboardEvent) => {
  if (!activeEntry.value) {
    return
  }
  if (event.key === 'Escape') {
    close()
  }
}

watch(
  activeEntry,
  (value) => {
    if (!isBrowser) return
    document.body.style.overflow = value ? 'hidden' : ''
  },
  { immediate: true },
)

onMounted(() => {
  if (isBrowser) {
    window.addEventListener('keydown', onKeyDown)
  }
})

onUnmounted(() => {
  if (isBrowser) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeyDown)
  }
})

onMounted(async () => {
  try {
    const response = await fetch(withBase('/showcase/manifest.json'))
    if (!response.ok) {
      throw new Error('Failed to fetch showcase manifest.')
    }

    const data = (await response.json()) as unknown
    if (!Array.isArray(data)) {
      throw new Error('Invalid showcase manifest format.')
    }

    entries.value = data.flatMap((item) => {
      if (!item || typeof item !== 'object') {
        return []
      }
      const candidate = item as Partial<ShowcaseEntry>
      if (
        typeof candidate.id !== 'string' ||
        typeof candidate.title !== 'string' ||
        typeof candidate.path !== 'string'
      ) {
        return []
      }

      return [
        {
          id: candidate.id,
          title: candidate.title,
          path: candidate.path,
          author: parseManifestAuthor(candidate.author),
          sourceUrl:
            typeof candidate.sourceUrl === 'string'
              ? candidate.sourceUrl
              : undefined,
          status: candidate.status,
          error: candidate.error,
        },
      ]
    })

    if (entries.value.length === 0) {
      error.value = 'No showcase entries were generated.'
    }
  } catch (err) {
    console.error('Showcase loading error:', err)
    error.value =
      err instanceof Error
        ? err.message
        : 'Showcase is not built. Generate it by running `bun run docs/scripts/build-showcase.ts` from the repository root.'
  } finally {
    isLoading.value = false
  }
})
</script>
