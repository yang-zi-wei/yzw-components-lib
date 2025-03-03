<template>
  <RenderAreas
    v-for="area in renderAreasByLines"
    :key="area.fileInfo"
    :area="area"
  />
</template>

<script lang="tsx" setup>
import type { RenderUnitByLines } from '@/types/file-diff';
import { computed, defineComponent, ref } from 'vue';

defineOptions({ name: 'LineByLine' })

const parentProps = withDefaults(defineProps<{
  areaMaxHeight?: number;
  renderAreasByLines: RenderUnitByLines[];
}>(), {
  areaMaxHeight: 260
})

const RenderAreas = defineComponent<{
  area: RenderUnitByLines;
}>(props => {
  const { area } = props
  const areaMaxHeight = parentProps.areaMaxHeight
  const renderLength = Math.ceil(areaMaxHeight / 20)
  // 是否开启虚拟滚动
  const visualScrollActive = renderLength < area.lines.length
  // 开启虚拟滚动后，设置lines-wrapper的最大高度
  const linesWrapperMaxHeight = visualScrollActive ? `${areaMaxHeight}px` : undefined

  // 虚拟滚动渲染的第一个元素下标
  const startVisualIndex = ref(0)
  const endVisualIndex = ref(renderLength)
  // 虚拟滚动开启后的内容偏移量
  const visualScrollOffsetTop = ref(0)

  const onScroll = (evt: Event) => {
    const target = evt.target
    if (!(target instanceof HTMLElement)) return
    const scrollTop: number = target?.scrollTop
    startVisualIndex.value = Math.floor(scrollTop / 20)
    endVisualIndex.value = Math.min(startVisualIndex.value + renderLength, area.lines.length)
    visualScrollOffsetTop.value = scrollTop - (scrollTop % 20)
  }

  const totalHeight = computed(() => area.lines.length * 20)
  /** 虚拟滚动开始后的占位元素（产生纵向滚动条） */
  const renderPhantom = () => visualScrollActive
    ? <div
      class="infinite-list-phantom"
      style={{height: `${totalHeight.value}px`}}
    ></div>
    : ''

  /** 可视元素 */
  const visibleData = computed(() => area.lines.slice(startVisualIndex.value, endVisualIndex.value))

  return () => (
    <div class={['line-by-line-area', { 'visual-scroll': visualScrollActive }]}>
      <div class="file-info">{ area.fileInfo }</div>
      <div
        class="lines-wrapper"
        style={{ height: linesWrapperMaxHeight }}
        onScroll={onScroll}
      >
        {renderPhantom()}
        <div
          class="area-wrapper"
          style={{
            top: `${visualScrollOffsetTop.value}px`,
          }}
        >
          {
            visibleData.value.map(line => (
              <div
                class={['d-flex row-by-lines', {
                  delete: line.delete,
                  add: line.add
                }]}
                key={`${line.oldSeq || 0}-${line.newSeq || 0}`}
              >
                <div class="left-row-index-by-lines row-index-by-lines d-inline-block flex-shrink-0">{ line.oldSeq || '' }</div>
                <div class="right-row-index-by-lines row-index-by-lines d-inline-block flex-shrink-0">{ line.newSeq || '' }</div>
                <div class="row-content d-inline-flex flex-nowrap"
                >{ line.content }</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}, {
  name: 'RenderRows',
  props: ['area']
})
</script>

<style lang="scss">
.line-by-line-area {
  .file-info {
    border: 1px solid #d8d8d8;
    border-top: none;
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
  &.visual-scroll {
    .area-wrapper {
      position: absolute;
      width: 100%;
    }
    .infinite-list-phantom {
      position: absolute;
      width: 100%;
    }
  }
  .lines-wrapper {
    overflow: auto;
    // 解决默认状态出现纵向滚动条问题
    padding-bottom: 2px;
    position: relative;
  }
}
</style>
