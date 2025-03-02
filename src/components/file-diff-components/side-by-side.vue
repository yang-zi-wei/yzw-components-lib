<template>
<div v-for="(area, areaIndex) in renderAreasBySides" :key="area.fileInfo">
  <div class="file-info">{{ area.fileInfo }}</div>
  <div class="diff-body d-flex">
    <div class="left-area">
      <div class="area-wrapper">
        <div class="file-row d-flex" :class="{ delete: left.delete, 'empty-row': !left.seq }" v-for="(left, rowIndex) in area.leftRows" :key="left.seq">
          <div class="row-index d-inline-block flex-shrink-0">{{ left.seq || '' }}</div>
          <div v-if="diffContents" class="row-content d-inline-flex flex-nowrap"
            v-html="diffContents[areaIndex][rowIndex].oldContent">
          </div>
        </div>
      </div>
    </div>
    <div class="right-area">
      <div class="area-wrapper">
        <div class="file-row d-flex" :class="{ add: right.add, 'empty-row': !right.seq }" v-for="(right, rowIndex) in area.rightRows" :key="right.seq">
          <div class="row-index d-inline-block flex-shrink-0">{{ right.seq || '' }}</div>
          <div v-if="diffContents" class="row-content d-inline-flex flex-nowrap"
            v-html="diffContents[areaIndex][rowIndex].newContent"
          ></div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" setup>
import type { RenderUnit } from '@/types/file-diff';

defineOptions({ name: 'SideBySide' })

defineProps<{
  renderAreasBySides: RenderUnit[];
  diffContents?: Array<Array<{ oldContent: string; newContent: string; }>>;
}>()
</script>

<style lang="scss" scoped>
.diff-body,
.row-index,
.file-info {
  border-color: #d8d8d8;
  border-style: solid;
  border-width: 0;
  text-align: center;
  padding: 2px 0;
}
.file-info {
  border-bottom-width: 1px;
  border-left-width: 1px;
  border-right-width: 1px;
}
.diff-body {
  border-width: 1px;
  border-top: none;
}
.row-index {
  position: sticky;
  left: 0;
  width: 52px;
  text-align: center;
  background-color: #fff;
}
.row-index,
.file-row {
  height: 20px;
  line-height: 20px;
}
.row-content {
  padding-left: 4px;
  white-space: pre;
}
.left-area,
.right-area {
  flex-basis: 50%;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}
.area-wrapper {
  min-width: 100%;
  width: fit-content;
}
.left-area {
  .row-index {
    border-right-width: 1px;
  }
}
.right-area {
  .row-index {
    border-right-width: 1px;
    border-left-width: 1px;
  }
}
.file-row {
  min-width: 100%;
  width: fit-content;
  &.delete {
    background-color: #fee8e9;
    .row-index {
      background-color: #fee8e9;
    }
  }
  &.add {
    background-color: #dfd;
    .row-index {
      background-color: #dfd;
    }
  }
  &.empty-row {
    background-color: #f1f1f1;
  }
}
</style>
