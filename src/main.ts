import { createApp } from 'vue'
import './assets/styles/main.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

app.config.errorHandler = (err, _instance, info) => {
  console.error('Unhandled Vue error:', err, info)
}

app.use(router)
app.use(pinia)
app.mount('#app')