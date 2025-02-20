<template>
  <div>
    <div ref="editorWrapperRef" class="w-100 h-100 d-flex direction-horizontal justify-center align-center">
      <div>
        <h2 class="d-flex justify-center">定制化工具栏区</h2>
        <div id="editor"></div>
      </div>
    </div>
    <div class="changed-display">
      <h2 class="d-flex justify-center">显示对比区</h2>
      <div class="d-flex justify-space-around">
        <div>
          <div>修改前</div>
          <div id="editor-before"></div>
        </div>
        <div>
          <div>修改后</div>
          <div id="editor-after"></div>
        </div>
      </div>
      <div class="d-flex justify-center flex-column align-center" style="margin-top: 60px;">
        <div>对比差异</div>
        <div>
          <div id="editor-diff"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Quill, { Delta, type QuillOptions } from 'quill'
import 'quill/dist/quill.snow.css'
import '@/components/test-quill-components/blots/at-user'

import { createApp, nextTick, onMounted, ref } from 'vue'
import { vuetify } from '@/utils/gloabl-config'

import AtUsersSelect from '@/components/test-quill-components/at-users-select.vue'
import EmojiSelect from '@/components/test-quill-components/emoji-select.vue'

import DiffMatchPatch from "diff-match-patch";

const Parchment = Quill.import('parchment')

const CustomBg = new Parchment.StyleAttributor('custom-bg', 'background-color', {
  scope: Parchment.Scope.INLINE,
})
Quill.register(CustomBg)

defineOptions({ name: 'TestPage' })

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
const options: QuillOptions = {
  // debug: 'info',
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
        'custom-bg',
      ],
      handlers: {
        'custom-bg'() {
          const selection = quill.getSelection()
          const currentFormat = quill.getFormat()
          if (currentFormat['custom-bg']) {
            return quill.format('custom-bg', false)
          }
          if (selection) {
            quill.formatText(
              selection.index,
              selection.length,
              'custom-bg',
              '#F8BBD0',
            )
          }
        },
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
              if (selection) {
                quill.insertEmbed(selection.index, 'atUser', user)
                console.log('delta', quill.getContents())
              }
              Contr.unmount()
              quill.setSelection(selection.index + 1)
              quill.format('atUser', false)
            },
          })
          Contr.use(vuetify)
          Contr.mount(div)
        },
      },
    },
  },
  placeholder: 'Compose an epic...',
  theme: 'snow',
}
const editorWrapperRef = ref<Element>()

onMounted(() => {
  quill = new Quill('#editor', options)
  nextTick(() => {
    initAt()
    initEmoji()
    initBg()
  })
})

const initAt = () => {
  const atDom = editorWrapperRef.value?.querySelector('.ql-at')
  if (atDom) {
    atDom.innerHTML = '@'
  }
}
const initEmoji = () => {
  const atDom = editorWrapperRef.value?.querySelector('.ql-emoji')
  if (atDom) {
    atDom.className += ' mdi mdi-emoticon-happy-outline'
  }
}
const initBg = () => {
  const atDom = editorWrapperRef.value?.querySelector<HTMLElement>('.ql-custom-bg')
  if (atDom) {
    atDom.innerHTML = '背景'
    atDom.style.width = '48px'
  }
}

/** 显示对比区逻辑 */
let quillBefore: Quill
let quillAfter: Quill
let quillDiff: Quill
let breforeDelta: Delta = new Delta()
let afterDelta: Delta = new Delta()
let breforeText: string = ''
let afterText: string = ''
onMounted(() => {
  quillBefore = new Quill('#editor-before', {
    theme: 'snow'
  })
  quillAfter = new Quill('#editor-after', {
    theme: 'snow'
  })
  quillDiff = new Quill('#editor-diff', {
    theme: 'snow',
    readOnly: true
  })
  quillBefore.on('text-change', () => {
    breforeDelta = quillBefore.getContents()
    breforeText = quillBefore.getText()
    diffDelta()
  })
  quillAfter.on('text-change', () => {
    afterDelta = quillAfter.getContents()
    afterText = quillAfter.getText()
    diffDelta()
  })
})
const dmp = new DiffMatchPatch()

const getDiffDelta = () => {
  const diffData = dmp.diff_main(breforeText, afterText)
  let likeDelta = new Delta()
  let beforeIndex = 0
  let afterIndex = 0
  console.log(dmp.diff_main(breforeText, afterText), 'dmp.diff_main(breforeText, afterText)')
  for (const [flag, text] of diffData) {
    const handleMap: Record<number, () => void> = {
      [0]: () => {
        const beforeSlice = breforeDelta.slice(beforeIndex, beforeIndex + text.length)
        likeDelta = likeDelta.concat(beforeSlice)
        beforeIndex += text.length
        afterIndex += text.length
      },
      [1]: () => {
        likeDelta = likeDelta.concat(
          afterDelta.slice(afterIndex, afterIndex + text.length)
            .compose(new Delta({ops: [{ retain: text.length, attributes: { background: '#4CAF50', color: '#fff' } }]}))
        )
        afterIndex += text.length
      },
      [-1]: () => {
        const beforeSlice = breforeDelta.slice(beforeIndex, beforeIndex + text.length)
        const beforeSliceFormat = beforeSlice.compose(new Delta({ops: [{ retain: text.length, attributes: { background: '#F44336', color: '#fff' } }]}))
        likeDelta = likeDelta.concat(beforeSliceFormat)
        beforeIndex += text.length
      }
    }
    handleMap[flag]()
  }
  return likeDelta
}

const diffDelta = () => {
  const diffDelta = getDiffDelta()
  quillDiff.setContents(diffDelta)
  console.log(diffDelta, 'diffDelta')
}
</script>

<style lang="scss">
#editor {
  width: 800px;
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
