import {ref,watch} from 'vue';
function saved(){try{return localStorage.getItem('flavour-lab-density')==='compact';}catch{return false;}}
export const compact=ref(saved());
watch(compact,value=>{document.documentElement.dataset.density=value?'compact':'comfortable';try{localStorage.setItem('flavour-lab-density',value?'compact':'comfortable');}catch{}},{immediate:true});
export const toggleCompact=()=>{compact.value=!compact.value;};
