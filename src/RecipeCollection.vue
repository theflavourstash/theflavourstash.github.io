<script setup>
import {computed,ref} from 'vue';
import {availability,sortRecipes} from './availability.js';
import RecipeAvailability from './RecipeAvailability.vue';
const props=defineProps({recipes:Array,flavours:Array});
defineEmits(['open','review']);
const search=ref(''),sort=ref('newest'),filter=ref('all');
const visible=computed(()=>sortRecipes(props.recipes.filter(r=>{
 const a=availability(r,props.flavours);
 return r.name.toLowerCase().includes(search.value.toLowerCase()) &&
 (filter.value==='all'||filter.value==='ready'&&a.canMake||filter.value==='owned'&&a.total>0&&a.percent===100);
}),sort.value,props.flavours));
const date=r=>r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'Original date unknown';
</script>
<template>
 <section v-if="recipes.length" class="recipe-browser">
  <div class="recipe-controls">
   <label>Find a recipe<input v-model="search" type="search" placeholder="Search recipe names"/></label>
   <label>Show<select v-model="filter"><option value="all">All recipes</option><option value="owned">All flavours in stock</option><option value="ready">Enough for the saved batch</option></select></label>
   <label>Sort by<select v-model="sort"><option value="newest">Date: newest first</option><option value="oldest">Date: oldest first</option><option value="available">Most flavours in stock</option><option value="name">Name: A–Z</option></select></label>
  </div>
  <p class="muted">{{visible.length}} of {{recipes.length}} recipes · Availability uses flavour stock only. PG, VG and nicotine are not tracked.</p>
  <div class="recipe-list"><article v-for="r in visible" :key="r.id" class="recipe-list-item">
   <div class="recipe-list-main"><small class="eyebrow">{{date(r)}}<span v-if="r.dateYearInferred"> · year inferred</span></small><h2>{{r.name}}</h2><p>{{r.volume}} ml · {{Number(r.vg.toFixed(2))}}% VG · {{r.ingredients.length}} flavours</p><p class="recipe-excerpt">{{r.notes||'No tasting notes yet.'}}</p><p v-if="r.rating" class="personal-rating">My rating: {{r.rating}} / 5</p><div class="recipe-actions"><button class="primary" @click="$emit('open',r)">Open recipe</button><button @click="$emit('review',r)">Notes & rating</button></div></div>
   <RecipeAvailability :recipe="r" :flavours="flavours" :show-help="false"/>
  </article></div>
  <div v-if="!visible.length" class="empty-state"><h2>No matching recipes</h2><p>Try a different search or availability filter.</p><button @click="search='';filter='all'">Clear filters</button></div>
 </section>
</template>
