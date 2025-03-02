<template>
  <div v-for="area in renderAreasByLines" :key="area.fileInfo">
    <div class="file-info">{{ area.fileInfo }}</div>
    <div class="lines-wrapper">
      <div class="area-wrapper">
        <div
          class="d-flex row-by-lines"
          :class="[{
            delete: line.delete,
            add: line.add
          }]"
          v-for="line in area.lines"
          :key="`${line.oldSeq || 0}-${line.newSeq || 0}`"
        >
          <div class="left-row-index-by-lines row-index-by-lines d-inline-block flex-shrink-0">{{ line.oldSeq || '' }}</div>
          <div class="right-row-index-by-lines row-index-by-lines d-inline-block flex-shrink-0">{{ line.newSeq || '' }}</div>
          <div class="row-content d-inline-flex flex-nowrap"
          >{{ line.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RenderUnitByLines } from '@/types/file-diff';

defineOptions({ name: 'LineByLine' })

defineProps<{
  renderAreasByLines: RenderUnitByLines[];
}>()
</script>

<style lang="scss" scoped>
.file-info {
  border-color: #d8d8d8;
  border-style: solid;
  border-width: 0;
  text-align: center;
  padding: 2px 0;
}
.row-content {
  padding-left: 4px;
  white-space: pre;
}
.area-wrapper {
  border: 1px solid #d8d8d8;
  border-top: 0;
}
.left-row-index-by-lines,
.right-row-index-by-lines {
  position: sticky;
  left: 0;
  width: 52px;
  height: 20px;
  line-height: 20px;
  padding: 2px 0;
  text-align: center;
  background-color: #fff;
}
.right-row-index-by-lines {
  left: 52px;
  border-right: 1px solid #d8d8d8;
}
.row-by-lines {
  height: 20px;
  line-height: 20px;
  &.delete {
    background-color: #fee8e9;
    .row-index-by-lines {
      background-color: #fee8e9;
    }
  }
  &.add {
    background-color: #dfd;
    .row-index-by-lines {
      background-color: #dfd;
    }
  }
}
.lines-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
