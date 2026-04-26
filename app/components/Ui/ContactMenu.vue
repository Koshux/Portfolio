<script setup lang="ts">
// Header contact group.
//
// Mobile (< sm): collapsed into a single "Contact" disclosure button so
// the header has room for the live-signal chip and the brand without
// wrapping. Built on the native <details>/<summary> pattern so keyboard
// (Enter/Space to toggle, Esc to close while the summary is focused) and
// AT users get the right semantics out of the box.
//
// Desktop (>= sm): renders the two icon links inline as before.
//
// Click-outside and link-click both collapse the panel so it never
// stays open after the user has acted (WCAG 2.2 — 1.4.13 dismissible).

const open = ref(false)
const root = ref<HTMLDetailsElement | null>(null)

function onToggle(event: Event) {
  // Mirror the native <details> open state into reactive land so we can
  // close it programmatically on outside click / link click.
  open.value = (event.target as HTMLDetailsElement).open
}

function close() {
  open.value = false
  if (root.value) root.value.open = false
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!open.value || !root.value) return
  if (!root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    close()
    // Return focus to the disclosure trigger for keyboard users.
    root.value?.querySelector('summary')?.focus()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <!--
    Mobile: <details> dropdown. Hidden on sm+ via .sm:hidden so we never
    duplicate the same actions on the wider layout.
  -->
  <details
    ref="root"
    class="relative md:hidden"
    @toggle="onToggle"
  >
    <summary
      class="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-paper-white marker:hidden hover:bg-paper-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors [&::-webkit-details-marker]:hidden"
      aria-label="Contact menu"
    >
      <span class="sr-only">Open contact menu</span>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-5 w-5"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </summary>
    <div
      class="absolute right-0 top-12 z-50 w-56 origin-top-right rounded-xl border border-paper-white/10 bg-ink-black/95 p-2 shadow-lg shadow-ink-black/60 backdrop-blur-sm"
    >
      <a
        href="https://github.com/koshux"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-paper-white hover:bg-paper-white/5 hover:text-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
        @click="close"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="h-4 w-4 shrink-0"
        >
          <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.97 10.97 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
        </svg>
        <span>GitHub</span>
      </a>
      <a
        href="mailto:lanzonprojects@gmail.com"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-paper-white hover:bg-paper-white/5 hover:text-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
        @click="close"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4 shrink-0"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
        <span>Email</span>
      </a>
      <a
        href="https://www.linkedin.com/in/james-lanzon/"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-paper-white hover:bg-paper-white/5 hover:text-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
        @click="close"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="h-4 w-4 shrink-0"
        >
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
        </svg>
        <span>LinkedIn</span>
      </a>
    </div>
  </details>

  <!--
    Desktop: render the two icon links inline. Hidden below sm so the
    mobile dropdown above is the only path on small screens.
  -->
  <div class="hidden items-center gap-1 md:flex md:gap-2">
    <UiIconLink
      href="https://github.com/koshux"
      :label="`James' GitHub profile`"
      sr-label="GitHub"
      :external="true"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-5 w-5"
      >
        <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.97 10.97 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
      </svg>
    </UiIconLink>
    <UiIconLink
      href="mailto:lanzonprojects@gmail.com"
      label="Email James"
      sr-label="Email"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-5 w-5"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    </UiIconLink>
    <UiIconLink
      href="https://www.linkedin.com/in/james-lanzon/"
      :label="`James' LinkedIn profile`"
      sr-label="LinkedIn"
      :external="true"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-5 w-5"
      >
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    </UiIconLink>
  </div>
</template>
