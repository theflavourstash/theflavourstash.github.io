import {createApp} from 'vue';import {createPinia} from 'pinia';import {createRouter,createWebHashHistory} from 'vue-router';import App from './App.vue';import './style.css';
const router=createRouter({history:createWebHashHistory(),routes:[...['/','/recipes','/recipes/:id','/history','/prompts','/settings'].map(path=>({path,component:{template:'<span></span>'}})),{path:'/mix',redirect:'/recipes/new'}]});
createApp(App).use(createPinia()).use(router).mount('#app');
if('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
