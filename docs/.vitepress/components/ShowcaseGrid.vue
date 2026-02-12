<template>
  <section class="showcase">
    <p v-if="isLoading" class="showcase__status">Loading showcase...</p>
    <p v-else-if="error" class="showcase__status showcase__status--error">
      {{ error }}
    </p>
    <div v-else class="showcase__grid">
      <article
        v-for="entry in entries"
        :key="entry.id"
        class="showcase__card"
      >
        <header class="showcase__card-header">
          <h2 class="showcase__card-title">{{ entry.title }}</h2>
          <a
            class="showcase__card-link"
            :href="withBase(_resolveShowcasePath(entry.path))"
            target="_blank"
            rel="noreferrer noopener"
          >
            Open
          </a>
        </header>
        <iframe
          class="showcase__frame"
          :src="withBase(_resolveShowcasePath(entry.path))"
          :title="`${entry.title} showcase`"
          loading="lazy"
        />
        <p v-if="entry.status === 'error'" class="showcase__card-error">
          {{ entry.error }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { onMounted, ref } from 'vue'

type ShowcaseEntry = {
  id: string
  title: string
  path: string
  status?: 'ok' | 'error'
  error?: string
}

const entries = ref<ShowcaseEntry[]>([])
const error = ref('')
const isLoading = ref(true)

const _resolveShowcasePath = (value: string) => {
  if (value.endsWith('.html')) {
    return value
  }
  if (value.endsWith('/')) {
    return `${value}index.html`
  }
  return `${value}/index.html`
}

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
          status: candidate.status,
          error: candidate.error,
        },
      ]
    })

    if (entries.value.length === 0) {
      error.value = 'No showcase entries were generated.'
    }
  } catch {
    error.value =
      'Showcase is not built. Run `bun --cwd docs run build:showcase`.'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.showcase__status {
  margin: 0;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: var(--vp-c-bg-soft);
}

.showcase__status--error {
  color: var(--vp-c-danger-1);
}

.showcase__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.showcase__card {
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.75rem;
  background: var(--vp-c-bg-soft);
}

.showcase__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.showcase__card-title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
}

.showcase__card-link {
  font-size: 0.9rem;
}

.showcase__frame {
  width: 100%;
  height: 420px;
  border: 0;
  border-radius: 0.5rem;
  background: #000;
}

.showcase__card-error {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vp-c-danger-1);
}

@media (max-width: 640px) {
  .showcase__grid {
    grid-template-columns: 1fr;
  }

  .showcase__frame {
    height: 360px;
  }
}
</style>
