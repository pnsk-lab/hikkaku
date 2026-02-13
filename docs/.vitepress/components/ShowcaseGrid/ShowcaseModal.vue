<template>
  <teleport to="body">
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="handleClose"
    >
      <div
        class="relative flex h-[92vh] w-[95vw] max-w-6xl flex-col rounded-xl border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] shadow-2xl"
        @click.stop
      >
        <header
          class="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[var(--vp-c-divider)] px-4 py-3"
        >
          <p class="m-0 text-base font-medium">{{ title }}</p>
          <button
            class="inline-flex min-h-8 items-center justify-center rounded-md border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)] px-3 text-sm text-[var(--vp-c-text-1)]"
            type="button"
            @click="handleClose"
          >
            Close
          </button>
        </header>
        <iframe
          :src="src"
          :title="title"
          class="min-h-0 flex-1 border-0 bg-black"
        />
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{ title: string; src: string }>()
const emit = defineEmits<(event: 'close') => void>()

const handleClose = () => {
  emit('close')
}
</script>
