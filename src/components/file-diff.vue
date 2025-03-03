<template>
  <div class="file-diff">
    <div class="file-header">{{ fileInfoDesc }}</div>
    <side-by-side
      v-if="renderType === RenderType.两栏"
      :render-areas-by-sides="renderAreasBySides"
      :diff-contents="diffContents"
    />
    <line-by-line v-else :render-areas-by-lines="renderAreasByLines"/>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import * as Diff from 'diff'
import { RenderType } from '@/enums/file-diff';
import type { RenderUnit, RenderUnitByLines, RowUnit } from '@/types/file-diff';

import lineByLine from './file-diff-components/line-by-line.vue';
import sideBySide from './file-diff-components/side-by-side.vue';

hljs.registerLanguage('typescript', typescript);

defineOptions({ name: 'FileDiff' })

defineProps<{
  renderType: RenderType;
}>()

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

/** 双栏模式 */
const renderAreasBySides = ref<RenderUnit[]>([])
const diffContents = ref<Array<Array<{ oldContent: string; newContent: string; }>>>()

/** 单栏模式 */
const renderAreasByLines = ref<RenderUnitByLines[]>([])

onMounted(() => {
  getDiff().then(diffStrArr => {
    const {
      areasBySides,
      areasByLines,
      fileInfo: theFileInfo
    } = handleDiffStrArr(diffStrArr)
    renderAreasByLines.value = areasByLines

    renderAreasBySides.value = areasBySides
    fileInfo.value = theFileInfo
    diffContents.value = getDiffContents()
  })
})

let leftStart = 0
let rightStart = 0

let storeLeftRows: RowUnit[] = []
let storeRightRows: RowUnit[] = []

/**
 * 处理得到渲染区域数组 renderArea
 * @param diffStrArr 后端返回的diff字符串切割换行得到的数组
 */
const handleDiffStrArr = (diffStrArr: string[]) => {
  let fileInfo = {
    oldFileName: '',
    newFileName: ''
  }
  const areasBySides: RenderUnit[] = []
  const areasByLines: RenderUnitByLines[] = []
  for (const row of diffStrArr) {
      const lastAreaByLines = areasByLines[areasByLines.length - 1]
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
        areasByLines.push({
          fileInfo: row,
          lines: []
        })
        // 暂存区不相等，则打上空行补丁
        if (storeLeftRows.length !== storeRightRows.length) {
          patchRenderUnit(areasBySides)
        }
        areasBySides.push({
          ...getEmptyRenderUnit(),
          fileInfo: row
        })
        const match = row.match(/\W+(\d+),\d+\W+(\d+)/)
        leftStart = Number(match?.[1])
        rightStart = Number(match?.[2])
        continue
      }
      if (row.startsWith('-')) {
        lastAreaByLines.lines.push({
          oldSeq: leftStart,
          content: row,
          delete: true
        })
        storeLeftRows.push({
          seq: leftStart,
          content: row,
          delete: true
        })
        leftStart++
        continue
      }
      if (row.startsWith('+')) {
        lastAreaByLines.lines.push({
          newSeq: rightStart,
          content: row,
          add: true
        })
        storeRightRows.push({
          seq: rightStart,
          content: row,
          add: true
        })
        rightStart++
        continue
      }
      lastAreaByLines.lines.push({
        oldSeq: leftStart,
        newSeq: rightStart,
        content: row,
        normal: true
      })
      patchRenderUnit(areasBySides)
      const lastRenderUnit = areasBySides[areasBySides.length - 1]
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
    patchRenderUnit(areasBySides)
  return {
    areasBySides,
    fileInfo,
    areasByLines
  }
}

const getDiffContents = () => {
  return renderAreasBySides.value.reduce<Array<Array<{ newContent: string; oldContent: string;}>>>((result, areaItem, areaIndex) => {
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

const getDiff = () => {
  return axios.get<{ data: { diff: string } }>('/api/files-diff', {
    withCredentials: true,
  }).then(res => {
    return res.data.data.diff.split('\n')
  })
}

/** 将左右两边的空行补上 */
const patchRenderUnit = (area: RenderUnit[]) => {
  const lastRenderUnit = area[area.length - 1]
  const {
    leftRows,
    rightRows
  } = lastRenderUnit
  const areaDiffLength = storeLeftRows.length - storeRightRows.length

  if (areaDiffLength === 0) {
    leftRows.push(...storeLeftRows)
    rightRows.push(...storeRightRows)
    storeLeftRows = []
    storeRightRows = []
    return
  }
  if (areaDiffLength > 0) {
    rightRows.push(
      ...getEmptyAreas(areaDiffLength),
      ...storeRightRows
    )
    leftRows.push(...storeLeftRows)
  } else {
    const absDiffLength = Math.abs(areaDiffLength)
    leftRows.push(
      ...getEmptyAreas(absDiffLength),
      ...storeLeftRows
    )
    rightRows.push(...storeRightRows)
  }
  leftStart = (leftRows[leftRows.length - 1]?.seq || leftStart) + 1
  rightStart = (rightRows[rightRows.length - 1]?.seq || rightStart) + 1
  storeLeftRows = []
  storeRightRows = []
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
  .file-header {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 6px;
    font-size: 16px;
    font-weight: 700;
    border: 1px solid #d8d8d8;
    background-color: rgba(229, 229, 229);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    text-align: center;
  }
}
</style>
