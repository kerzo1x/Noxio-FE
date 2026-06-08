import { createApp } from 'vue'
import './assets/styles/main.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// TODO: chyba tu handling errorov z vue komponentov, lebo teraz to vie crashnut celu appku a user nedostane ziadnu message
const app = createApp(App)
const pinia = createPinia()
app.use(router)
app.use(pinia)
app.mount('#app')