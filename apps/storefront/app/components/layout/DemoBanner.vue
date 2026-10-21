<script setup lang="ts">
/**
 * Always shown, never dismissible: remembering a dismissal per visitor would
 * personalise shared, cached HTML — the same hydration trap as the cart count.
 */
</script>

<template>
  <div role="note" class="bg-ink text-bone">
    <p class="t-spec mx-auto max-w-site px-4 py-2 text-center md:px-6">
      Portfolio demo — nothing ships and no real payments are taken.
      <span class="hidden sm:inline">
        Pay with test card <span class="font-semibold tracking-wide">4242 4242 4242 4242</span>, any future date and CVC.
      </span>
    </p>
  </div>
</template>