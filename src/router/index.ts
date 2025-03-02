import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(window.__MICRO_APP_BASE_ROUTE__ || '/'),
  routes: [
    {
      path: '/',
      redirect: '/quill-editor'
    },
    {
      path: '/quill-editor',
      name: 'quill-editor',
      component: () => import('@/views/quill-editor-play.vue'),
    }, {
      path: '/file-diff',
      name: 'file-diff',
      component: () => import('@/views/file-diff-play.vue'),
    }
  ],
})

export default router
