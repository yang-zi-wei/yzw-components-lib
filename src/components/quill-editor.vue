<template>
  <div ref="editorWrapperRef">
    <div :id="editorId" class="quill-editor"></div>
  </div>
</template>

<script lang="ts" setup>
import { v4 as uuidv4 } from 'uuid';

import Quill, { Delta, type QuillOptions } from 'quill'
import 'quill/dist/quill.snow.css'
import '@/components/test-quill-components/blots/at-user'
import '@/components/test-quill-components/attributors/diff'

import { computed, createApp, onBeforeMount, onMounted, ref, watch } from 'vue'
import { vuetify } from '@/utils/gloabl-config'

import AtUsersSelect from '@/components/test-quill-components/at-users-select.vue'
import EmojiSelect from '@/components/test-quill-components/emoji-select.vue'

import { getDocument, parseJson } from '@/utils';

defineOptions({ name: 'QuillEditor' })

const props = withDefaults(defineProps<{
  delta?: Delta
  disabled?: boolean
  showDiff?: boolean
  diffDelta?: [Delta, Delta]
}>(), {
  delta: () => new Delta(),
  diffDelta: () => [new Delta(), new Delta()]
})

const emit = defineEmits<{
  change: [Delta]
  'update:delta': [Delta]
}>()

const editorId = ref('')
onBeforeMount(() => {
  const id = `editor-${uuidv4()}`
  editorId.value =id
  const observer = new MutationObserver(() => {
    const editor = document.querySelector(`#${id}.ql-container`)
    // 挂载成功
    if (editor) {
      initAtIcon()
      initEmojiIcon()
    }
    observer.disconnect()
  })
  observer.observe(document.body, {
    attributes: true,
    subtree: true
  })
})

let quill: Quill

const options = computed<QuillOptions>(() => {
  const { disabled } = props
  return {
    theme: 'snow',
    placeholder: '在此处输入内容',
    readOnly: disabled,
    modules: {
      toolbar: {
        container: [
          { header: [1, 2, false] },
          'bold',
          'italic',
          'underline',
          'strike',
          'link',
          'at',
          'emoji',
        ],
        handlers: {
          /** 点击工具栏表情事件 */
          emoji() {
            const carePosition = getCarePosition()
            if (!carePosition) return
            const { caretX, caretY } = carePosition

            const div = document.createElement('div')
            Object.assign(div.style, {
              position: 'absolute',
              left: `${caretX}px`,
              top: `${caretY + 20}px`,
            })
            document.body.appendChild(div)
            const Contr = createApp(EmojiSelect, {
              native: true,
              handleClickOutside: () => {
                Contr.unmount()
              },
              onSelect(value: { i: string }) {
                const selection = quill?.getSelection()
                quill.insertText(selection?.index || 0, value.i)
              },
            })
            Contr.use(vuetify)
            Contr.mount(div)
          },
          /** 点击工具栏at事件 */
          at() {
            handleAt()
          },
        },
      }
    },
  }
})
const editorWrapperRef = ref<Element>()

// 监听显示对比数据的变化，同步更新富文本内容渲染
watch(
  [() => props.showDiff, () => props.diffDelta],
  () => initQuillContent()
)

onMounted(() => {
  quill = new Quill(`#${editorId.value}`, options.value)
  initQuillContent()
  initQuillListener()
  initQuillCustomModules()
})

/** 初始化编辑器内容 */
const initQuillContent = () => {
  const { showDiff } = props
  // 显示新旧内容对比
  if (showDiff) {
    const [oldDelta, newDelta] = props.diffDelta
    const diffDelta = getDiffDelta(
      clearProxy(oldDelta),
      clearProxy(newDelta)
    )
    console.log(diffDelta, 'diffDelta')
    quill.setContents(diffDelta)
  } else {
    // 常规内容
    quill.setContents(props.delta)
  }
}

/** 初始化编辑器的监听器 */
const initQuillListener = () => {
  quill.on('text-change', () => {
    emit('update:delta', quill.getContents())
    emit('change', quill.getContents())
  })
}

/** 初始化编辑器定制化模块 */
const initQuillCustomModules = () => {
  const initAtUserModule = () => {
    quill.keyboard.addBinding({
      key: '@',
      shiftKey: true,
      handler () {
        handleAt()
      }
    })
  }
  initAtUserModule()
}

const initAtIcon = () => {
  const atDom = editorWrapperRef.value?.querySelector('.ql-at')
  if (atDom) atDom.innerHTML = '@'

}
const initEmojiIcon = () => {
  const atDom = editorWrapperRef.value?.querySelector('.ql-emoji')
  if (atDom) atDom.className += ' mdi mdi-emoticon-happy-outline'
}

const handleAt = () => {
  const carePosition = getCarePosition()
  if (!carePosition) return
  const { caretX, caretY, selection } = carePosition
  if (!caretX && !caretY) return
  const div = getDocument().createElement('div')
  Object.assign(div.style, {
    width: '100px',
    position: 'absolute',
    left: `${caretX}px`,
    top: `${caretY + 20}px`,
  })
  getDocument().body.appendChild(div)
  const Contr = createApp(AtUsersSelect, {
    handleClickOutside: () => {
      Contr.unmount()
    },
    onSelect(user: { userId: number; userName: string }) {
      if (selection) quill.insertEmbed(selection.index, 'atUser', user)
      Contr.unmount()
      quill.setSelection(selection.index + 1)
      quill.format('atUser', false)
    },
  })
  Contr.use(vuetify)
  Contr.mount(div)
}

const clearProxy = (delta: Delta) => new Delta(parseJson(JSON.stringify(delta)))
const getDiffDelta = (oldDelta: Delta, newDelta: Delta) => {
  const diffDelta = oldDelta.diff(newDelta)
  let resultDelta = new Delta()
  let oldDeltaIndex = 0
  for (const op of diffDelta.ops) {
    const {
      retain,
      insert = '',
      delete: deleteLength = 0
    } = op
    let flag = 1
    // 如果为图片
    if (typeof insert !== 'string') {
      resultDelta = resultDelta.concat(
        new Delta({ops: [{ ...op, attributes: { 'diff-bg-image': 'add' } }]})
      )
      continue
    }
    if (retain && typeof retain !== 'number') {
      const retainDelta = oldDelta.slice(oldDeltaIndex).compose(new Delta({ops: [{ retain }]}))
      resultDelta = resultDelta.concat(retainDelta)
      const retainLength = retainDelta.length()
      oldDeltaIndex += retainLength
      continue
    }
    if (deleteLength) flag = -1
    if (retain) flag = 0
    const insertLength = insert.length
    const handleMap: Record<number, () => void> = {
      [0]: () => {
        const oldSlice = oldDelta.slice(oldDeltaIndex, oldDeltaIndex + (retain || 0))
        resultDelta = resultDelta.concat(oldSlice)
        oldDeltaIndex += (retain || 0)
      },
      [1]: () => {
        const formatDelta = new Delta([op])
          .compose(new Delta({ops: [{ retain: insertLength }]}))
        formatDelta.forEach(op => {
          const { insert, attributes = {} } = op
          if (typeof insert === 'string') {
            op.attributes = {
              ...attributes,
              'diff-bg': 'add'
            }
          } else {
            op.attributes = {
              ...attributes,
              'diff-bg-image': 'add'
            }
          }
        })
        resultDelta = resultDelta.concat(formatDelta)
      },
      [-1]: () => {
        const oldSlice = oldDelta.slice(oldDeltaIndex, oldDeltaIndex + deleteLength)
        const oldSliceFormat = oldSlice.compose(new Delta({ops: [{ retain: deleteLength }]}))
        oldSliceFormat.forEach(op => {
          const { insert, attributes = {} } = op
          if (typeof insert === 'string') {
            op.attributes = {
              ...attributes,
              'diff-bg': 'delete'
            }
          } else {
            op.attributes = {
              ...attributes,
              'diff-bg-image': 'delete'
            }
          }
        })
        resultDelta = resultDelta.concat(oldSliceFormat)
        oldDeltaIndex += deleteLength
      }
    }
    handleMap[flag]()
  }
  /**
   * 如果oldDelta长度为10，只有最前面长度为5的delta发生了变化比如操作了删除
   * 那么diffDelta为: {ops: [{ delete: 5 }]}
   * 所以这里需要将剩余部分补充到resultDelta上去
   */
  if (oldDeltaIndex < oldDelta.length() - 1) {
    resultDelta = resultDelta.concat(oldDelta.slice(oldDeltaIndex))
  }
  return resultDelta
}

/** 获取光标的位置 */
const getCarePosition = () => {
  const selection = quill?.getSelection()
  if (!selection) return
  const editorBounds = quill.container.getBoundingClientRect()
  const caretBounds = quill.getBounds(selection.index)

  const caretX = editorBounds.left + (caretBounds?.left || 0) // 计算 X 绝对坐标
  const caretY = editorBounds.top + (caretBounds?.top || 0) // 计算 Y 绝对坐标
  return {
    caretX,
    caretY,
    selection,
  }
}
</script>

<style lang="scss">
.quill-editor {
  width: 400px;
  height: 200px;
  .diff-bg-image-add,
  .diff-bg-image-delete {
    position: relative;
    display: inline-block;
    &::after {
      content: '';
      opacity: .2;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
    }
  }
  .diff-bg-image-add::after {
    background-color: #4CAF50;
  }
  .diff-bg-image-delete::after {
    background-color: #F44336;
  }
  .diff-bg-add {
    background-color: #4CAF50;
  }
  .diff-bg-delete {
    background-color: #F44336;
  }
}
.ql-snow.ql-toolbar button {
  &.ql-at,
  &.ql-emoji,
  &.ql-custom-bg {
    display: flex;
    align-items: center;
  }
  &.ql-emoji {
    position: relative;
    top: 1px;
  }
}
</style>
