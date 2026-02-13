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
          <div class="showcase__card-links">
            <a
              v-if="entry.sourceUrl"
              class="showcase__card-link vp-external-link-icon"
              :href="entry.sourceUrl"
              target="_blank"
              rel="noreferrer noopener"
            >
              Open Source
            </a>
            <a
              v-if="entry.author && toAuthorHref(entry.author)"
              class="showcase__card-link vp-external-link-icon"
              :href="toAuthorHref(entry.author)"
              target="_blank"
              rel="noreferrer noopener"
            >
              Author: {{ entry.author.name }}
            </a>
            <button
              v-else-if="entry.author"
              class="showcase__card-link"
              type="button"
              disabled
            >
              Author: {{ entry.author.name }}
            </button>
            <button
              v-else
              class="showcase__card-link showcase__card-link--disabled"
              type="button"
              disabled
            >
              Author: Unknown
            </button>
            <a
              class="showcase__card-link"
              :href="withBase(_resolveShowcasePath(entry.path))"
              target="_blank"
              rel="noreferrer noopener"
            >
              Open
            </a>
          </div>
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
  author?: {
    name: string
    email?: string
    url?: string
  }
  sourceUrl?: string
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

const parseManifestAuthor = (author: unknown) => {
  if (!author) {
    return undefined
  }

  if (typeof author === 'string') {
    const name = author.trim()
    return name ? { name } : undefined
  }

  if (typeof author !== 'object' || Array.isArray(author)) {
    return undefined
  }

  const candidate = author as {
    name?: unknown
    email?: unknown
    url?: unknown
  }
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''
  if (!name) {
    return undefined
  }

  return {
    name,
    ...(typeof candidate.email === 'string' && candidate.email.trim()
      ? { email: candidate.email.trim() }
      : {}),
    ...(typeof candidate.url === 'string' && candidate.url.trim()
      ? { url: candidate.url.trim() }
      : {}),
  }
}

const toAuthorHref = (author: ShowcaseEntry['author']) => {
  if (!author) {
    return undefined
  }
  if (author.url) {
    return author.url
  }
  if (author.email) {
    return `mailto:${author.email}`
  }
  return undefined
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

.showcase__card-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.showcase__card-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.5rem;
  background: var(--vp-c-bg);
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.showcase__card-link:hover {
  text-decoration: none;
  background: var(--vp-c-bg-soft);
}

.showcase__card-link[disabled] {
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  opacity: 0.7;
  cursor: not-allowed;
}

.showcase__card-link--disabled {
  border-style: dashed;
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
