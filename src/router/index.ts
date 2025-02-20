import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/quill-editor',
    },
    {
      path: '/quill-editor',
      name: 'quill-editor',
      component: () => import('@/views/quill-editor.vue'),
    },
  ],
})

export default router
