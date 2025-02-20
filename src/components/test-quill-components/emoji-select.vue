<template>
  <EmojiPicker
    :native="true"
    @select="emit('select', $event)"
    v-click-outside="handleClickOutside"
  />
</template>

<script lang="ts" setup>
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

defineOptions({ name: 'EmojiSelect' })

defineProps({
  handleClickOutside: {
    type: Function,
  },
})
const emit = defineEmits(['select'])
</script>
