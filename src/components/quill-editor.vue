<template>
  <div ref="editorWrapperRef">
    <div :id="editorId" class="editor"></div>
  </div>
</template>

<script lang="ts" setup>
import { v4 as uuidv4 } from 'uuid';

import Quill, { Delta, type QuillOptions } from 'quill'
import 'quill/dist/quill.snow.css'
import '@/components/test-quill-components/blots/at-user'

import { computed, createApp, onBeforeMount, onMounted, ref, watch } from 'vue'
import { vuetify } from '@/utils/gloabl-config'

import AtUsersSelect from '@/components/test-quill-components/at-users-select.vue'
import EmojiSelect from '@/components/test-quill-components/emoji-select.vue'

import DiffMatchPatch from "diff-match-patch";

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
const options = computed<QuillOptions>(() => {
  const { disabled } = props
  return {
    theme: 'snow',
    placeholder: '在此处输入内容',
    readOnly: disabled,
    modules: {
      toolbar: {
        container: [
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
    const diffDelta = getDiffDelta(oldDelta, newDelta)
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

const deltaToText = (delta: Delta) => {
  const div = document.createElement('div')
  const quill = new Quill(div, { theme: 'snow', readOnly: true })
  quill.setContents(delta)
  return {
    // 纯文本
    text: quill.getText(),
    // html字符串
    html: quill.root.innerHTML
  }
}

const handleAt = () => {
  const carePosition = getCarePosition()
  if (!carePosition) return
  const { caretX, caretY, selection } = carePosition
  if (!caretX && !caretY) return
  const div = document.createElement('div')
  Object.assign(div.style, {
    width: '100px',
    position: 'absolute',
    left: `${caretX}px`,
    top: `${caretY + 20}px`,
  })
  document.body.appendChild(div)
  const Contr = createApp(AtUsersSelect, {
    handleClickOutside: () => {
      Contr.unmount()
    },
    onSelect(user: { id: number; userName: string }) {
      if (selection) quill.insertEmbed(selection.index, 'atUser', user)
      Contr.unmount()
      quill.setSelection(selection.index + 1)
      quill.format('atUser', false)
    },
  })
  Contr.use(vuetify)
  Contr.mount(div)
}

const dmp = new DiffMatchPatch()
/** 获取对比后的富文本内容 */
const getDiffDelta = (oldDelta: Delta, newDelta: Delta) => {
  const oldText = deltaToText(oldDelta).text
  const newText = deltaToText(newDelta).text
  const diffData = dmp.diff_main(oldText, newText)
  let likeDelta = new Delta()
  let beforeIndex = 0
  let afterIndex = 0
  for (const [flag, text] of diffData) {
    const handleMap: Record<number, () => void> = {
      [0]: () => {
        const beforeSlice = oldDelta.slice(beforeIndex, beforeIndex + text.length)
        likeDelta = likeDelta.concat(beforeSlice)
        beforeIndex += text.length
        afterIndex += text.length
      },
      [1]: () => {
        likeDelta = likeDelta.concat(
          newDelta.slice(afterIndex, afterIndex + text.length)
            .compose(new Delta({ops: [{ retain: text.length, attributes: { background: '#4CAF50', color: '#fff' } }]}))
        )
        afterIndex += text.length
      },
      [-1]: () => {
        const beforeSlice = oldDelta.slice(beforeIndex, beforeIndex + text.length)
        const beforeSliceFormat = beforeSlice.compose(new Delta({ops: [{ retain: text.length, attributes: { background: '#F44336', color: '#fff' } }]}))
        likeDelta = likeDelta.concat(beforeSliceFormat)
        beforeIndex += text.length
      }
    }
    handleMap[flag]()
  }
  return likeDelta
}
</script>

<style lang="scss">
.editor {
  width: 400px;
  height: 200px;
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
#editor-diff {
  width: 800px;
  height: 200px;
}
#editor-before,
#editor-after {
  width: 500px;
  height: 150px;
}
</style>
