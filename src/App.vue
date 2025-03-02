<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const pages = [{
  label: '富文本编辑器',
  routeName: 'quill-editor'
}, {
  label: '文件对比',
  routeName: 'file-diff'
}]
</script>

<template>
  <div class="d-flex h-100">
    <div class="tools-nav h-100 flex-shrink-0">
      <v-card class="h-100">
        <v-list density="compact" :selected="[route.name]">
          <v-list-item
            v-for="item in pages"
            :key="item.routeName"
            :value="item.routeName"
            @click="router.push({ name: item.routeName })"
            >
              {{ item.label }}
            </v-list-item>
        </v-list>
      </v-card>
    </div>
    <div class="h-100 flex-1-1 overflow-auto">
      <RouterView />
    </div>
  </div>
</template>

<style scoped lang="scss">
.tools-nav {
  width: 150px;
}
</style>
