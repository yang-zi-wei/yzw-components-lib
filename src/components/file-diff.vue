<template>
  <div class="file-diff">
    <div class="file-header">{{ fileInfoDesc }}</div>
    <div v-for="(area, areaIndex) in renderAreas" :key="area.fileInfo">
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
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import * as Diff from 'diff'

hljs.registerLanguage('typescript', typescript);

window.Diff = Diff

interface RowUnit {
  seq: number;
  content: string;
  add?: boolean;
  delete?: boolean;
}
interface RenderUnit {
  fileInfo: string;
  leftRows: RowUnit[];
  rightRows: RowUnit[];
}

defineOptions({ name: 'FileDiff' })

const fileInfo = ref({
  oldFileName: '',
  newFileName: ''
})
const fileInfoDesc = computed(() => {
  const {
    oldFileName,
    newFileName
  } = fileInfo.value
  if (oldFileName === newFileName ) {
    return oldFileName
  }
  return `${oldFileName} -> ${newFileName}`
})

const renderAreas = ref<RenderUnit[]>([])
const diffContents = ref<Array<Array<{ oldContent: string; newContent: string; }>>>()

const getDiffContents = () => {
  return renderAreas.value.reduce<Array<Array<{ newContent: string; oldContent: string;}>>>((result, areaItem, areaIndex) => {
    const { leftRows, rightRows} = areaItem
    leftRows.forEach((rowItem, rowIndex) => {
      if (!result[areaIndex]) result[areaIndex] = []
      let oldContent = rowItem.content || ''
      let newContent = rightRows[rowIndex].content || ''
      const oldStartWithFlag = oldContent.startsWith('-')
      const newStartWithFlag = newContent.startsWith('+')
      const diffOldContent = oldStartWithFlag ? oldContent.slice(1) : oldContent
      const diffNewContent = newStartWithFlag ? newContent.slice(1) : newContent
      //  逐词对比
      const changes = handleDiffWords(diffOldContent, diffNewContent)
      //  代码高亮
      oldContent = oldContent && hljs.highlight(oldContent, { language: 'typescript' }).value
      newContent = newContent && hljs.highlight(newContent, { language: 'typescript' }).value
      // 高亮新旧差异的词
      changes.forEach(({ added, removed, value }) => {
        if (added) newContent = newContent.replace(value, `<span style="background-color: #97f295;">${value}</span>`)
        if (removed) oldContent = oldContent.replace(value, `<span style="background-color: #ffb6ba;">${value}</span>`)
      })
       result[areaIndex][rowIndex] = {
        oldContent,
        newContent
       }
    })
    return result
  }, [])
}
const getEmptyRenderUnit: () => RenderUnit = () => ({
  fileInfo: '',
  leftRows: [],
  rightRows: []
})
// 填充对齐的行没有序号
const getEmptyArea = () => ({
  seq: 0,
  content: ''
})

let leftStart = 0
let rightStart = 0

let storeLeftAreas: RowUnit[] = []
let storeRightAreas: RowUnit[] = []
onMounted(() => {
  getDiff().then(diffStrArr => {
    const {
      areas,
      fileInfo: theFileInfo
    } = handleDiffStrArr(diffStrArr)
    renderAreas.value = areas
    fileInfo.value = theFileInfo
    diffContents.value = getDiffContents()
  })
})

const getDiff = () => {
  return axios.get<{ data: { diff: string } }>('/api/files-diff', {
    withCredentials: true,
  }).then(res => {
    return res.data.data.diff.split('\n')
  })
}

/**
 * 处理得到渲染区域数组 renderArea
 * @param diffStrArr 后端返回的diff字符串切割换行得到的数组
 */
const handleDiffStrArr = (diffStrArr: string[]) => {
  let fileInfo = {
    oldFileName: '',
    newFileName: ''
  }
  const areas: RenderUnit[] = []
  for (const row of diffStrArr) {
      if (row.startsWith('===')) continue
      if (row.startsWith('Index')) {
        const fileName = row.split('Index:')[1].slice(1)
        fileInfo = {
          oldFileName: fileName,
          newFileName: fileName
        }
        continue
      }
      if (row.startsWith('+++')) {
        fileInfo.newFileName = row.slice(4)
        continue
      }
      if (row.startsWith('---')) {
        fileInfo.oldFileName = row.slice(4)
        continue
      }
      if (row.startsWith('@@')) {
        // 暂存区不相等，则打上空行补丁
        if (storeLeftAreas.length !== storeRightAreas.length) {
          patchRenderUnit(areas)
        }
        areas.push({
          ...getEmptyRenderUnit(),
          fileInfo: row
        })
        const match = row.match(/\W+(\d+),\d+\W+(\d+)/)
        leftStart = Number(match?.[1])
        rightStart = Number(match?.[2])
        continue
      }
      if (row.startsWith('-')) {
        storeLeftAreas.push({
          seq: leftStart++,
          content: row,
          delete: true
        })
        continue
      }
      if (row.startsWith('+')) {
        storeRightAreas.push({
          seq: rightStart++,
          content: row,
          add: true
        })
        continue
      }
      patchRenderUnit(areas)
      const lastRenderUnit = areas[areas.length - 1]
      const {
        leftRows,
        rightRows
      } = lastRenderUnit
      const leftRowUnit = {
        seq: leftStart,
        content: row
      }
      const rightRowUnit = {
        seq: rightStart,
        content: row
      }
      leftStart++
      rightStart++
      leftRows.push(leftRowUnit)
      rightRows.push(rightRowUnit)
    }
    patchRenderUnit(areas)
  return {
    areas,
    fileInfo
  }
}

/** 将左右两边的空行补上 */
const patchRenderUnit = (area: RenderUnit[]) => {
  const lastRenderUnit = area[area.length - 1]
  const {
    leftRows,
    rightRows
  } = lastRenderUnit
  const areaDiffLength = storeLeftAreas.length - storeRightAreas.length

  if (areaDiffLength === 0) {
    leftRows.push(...storeLeftAreas)
    rightRows.push(...storeRightAreas)
    storeLeftAreas = []
    storeRightAreas = []
    return
  }
  if (areaDiffLength > 0) {
    rightRows.push(
      ...getEmptyAreas(areaDiffLength),
      ...storeRightAreas
    )
    leftRows.push(...storeLeftAreas)
  } else {
    const absDiffLength = Math.abs(areaDiffLength)
    leftRows.push(
      ...getEmptyAreas(absDiffLength),
      ...storeLeftAreas
    )
    rightRows.push(...storeRightAreas)
  }
  leftStart = (leftRows[leftRows.length - 1]?.seq || leftStart) + 1
  rightStart = (rightRows[rightRows.length - 1]?.seq || rightStart) + 1
  storeLeftAreas = []
  storeRightAreas = []
}

const getEmptyAreas = (diffRowLength: number) => {
  return [...new Array(diffRowLength)].map(() => getEmptyArea())
}

/**
 * 针对一行的新旧内容逐“词”对比（效果为高亮被改动的单词）
 * @param oldContent
 * @param newContent
 */
const handleDiffWords = (oldContent: string, newContent: string) => {
  if (!oldContent || !newContent) return []
  return Diff.diffWordsWithSpace(oldContent, newContent)
}
</script>

<style lang="scss">
.file-diff {
  font-size: 12px;
  .file-header,
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
  .file-header {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 8px;
    font-size: 16px;
    font-weight: 700;
    border-width: 1px;
    background-color: #f7f7f7;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
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
}
</style>
