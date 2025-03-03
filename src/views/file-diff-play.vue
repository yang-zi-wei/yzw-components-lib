<template>
  <div class="w-100 h-100 d-flex flex-column pl-4 pt-2 pb-4">
    <div>
      选择显示方式：
      <v-select
        v-model="renderType"
        width="150px"
        density="compact"
        :items="[{
          value: RenderType.两栏,
          title: RenderType[RenderType.两栏]
        }, {
          value: RenderType.行与行,
          title: RenderType[RenderType.行与行]
        }]"
        variant="outlined"
      ></v-select>
    </div>
    <div style="width: 95%; height: 95%;">
      <file-diff :renderType="renderType"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import fileDiff from '@/components/file-diff.vue';
import { RenderType } from '@/enums/file-diff';
import { ref } from 'vue';
defineOptions({
  name: 'FileDiffPlay'
})

const renderType = ref<RenderType>(RenderType.两栏)
</script>
