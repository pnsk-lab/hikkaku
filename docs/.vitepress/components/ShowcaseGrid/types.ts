export type ShowcaseAuthor = {
  name: string
  email?: string
  url?: string
}

export type ShowcaseEntry = {
  id: string
  title: string
  path: string
  author?: ShowcaseAuthor
  sourceUrl?: string
  status?: 'ok' | 'error'
  error?: string
}

export const parseManifestAuthor = (
  author: unknown,
): ShowcaseAuthor | undefined => {
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
