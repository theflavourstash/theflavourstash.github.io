import {ref,watch} from 'vue';
const KEY='flavour-lab-theme';
function initialTheme(){try{const saved=localStorage.getItem(KEY);if(saved==='light'||saved==='dark')return saved;}catch{}return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
export const theme=ref(initialTheme());
watch(theme,value=>{document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',value==='dark'?'#211c26':'#fff8f4');try{localStorage.setItem(KEY,value);}catch{}},{immediate:true});
export const toggleTheme=()=>{theme.value=theme.value==='dark'?'light':'dark';};
