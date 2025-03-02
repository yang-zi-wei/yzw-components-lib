<template>
  <div class="w-100 h-100 d-flex align-center justify-center">
    <div style="width: 90%; height: 90%; overflow: auto;">
      <file-diff />
    </div>
  </div>
</template>

<script lang="ts" setup>
import fileDiff from '@/components/file-diff.vue';
defineOptions({
  name: 'FileDiffPlay'
})
</script>
