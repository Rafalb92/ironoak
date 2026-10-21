<script setup lang="ts">
/**
 * Explains why a control is disabled for the demo admin.
 *
 * Disabled shadcn buttons get `pointer-events: none`, so they never see the
 * hover a tooltip needs. The wrapper takes hover and focus instead; tabindex
 * keeps the reason reachable from the keyboard, since disabled buttons are not.
 */
const { locked, as = 'span' } = defineProps<{
  locked: boolean;
  /** 'div' for wrapping whole blocks (fieldsets), 'span' for single buttons */
  as?: 'span' | 'div';
}>();

const { demoReason } = useAdminPermissions();
</script>

<template>
  <slot v-if="!locked" />

  <TooltipProvider v-else :delay-duration="150">
    <Tooltip>
      <TooltipTrigger as-child>
        <component
          :is="as"
          tabindex="0"
          class="cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
          :class="as === 'div' ? 'block' : 'inline-flex'"
        >
          <slot />
        </component>
      </TooltipTrigger>
      <TooltipContent>{{ demoReason }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>