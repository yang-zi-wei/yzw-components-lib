import './assets/main.css'
import 'vuetify/styles'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { vuetify } from './utils/gloabl-config'

const app = createApp(App)

if (!window.rawWindow) {
  app.use(vuetify)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

window.unmount = () => {
  app.unmount()
}
window.mount = () => {
  const app = createApp(App)
  app.use(vuetify)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

