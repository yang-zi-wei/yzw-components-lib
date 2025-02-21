<template>
  <div>
    <div ref="editorWrapperRef" class="w-100 h-100 d-flex direction-horizontal justify-center align-center">
      <div>
        <h2 class="d-flex justify-center">定制化工具栏区</h2>
        <quill-editor v-model:delta="normalQuillDelta"/>
      </div>
    </div>
    <div class="changed-display">
      <h2 class="d-flex justify-center">显示对比区</h2>
      <div class="d-flex justify-space-around">
        <div>
          <div>修改前</div>
            <quill-editor v-model:delta="beforeChangedDelta"/>
        </div>
        <div>
          <div>修改后</div>
          <quill-editor v-model:delta="afterChangedDelta"/>
          </div>
      </div>
      <div class="d-flex justify-center flex-column align-center" style="margin-top: 60px;">
        <div>对比差异</div>
        <div>
          <quill-editor disabled show-diff :diff-delta="[beforeChangedDelta, afterChangedDelta]"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Delta } from 'quill'
import 'quill/dist/quill.snow.css'
import '@/components/test-quill-components/blots/at-user'

import { ref } from 'vue'
import QuillEditor from '@/components/quill-editor.vue'



defineOptions({ name: 'TestPage' })

const normalQuillDelta = ref(new Delta())
const beforeChangedDelta = ref(new Delta())
const afterChangedDelta = ref(new Delta())
</script>
