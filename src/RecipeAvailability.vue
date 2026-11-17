<script setup>
import {computed} from 'vue';
import {availability} from './availability.js';
const props=defineProps({recipe:Object,flavours:Array,showHelp:{type:Boolean,default:true}});
const stock=computed(()=>availability(props.recipe,props.flavours));
const ml=n=>Number(n.toFixed(2)).toLocaleString('en-GB');
</script>
<template>
 <section class="recipe-availability" aria-label="Flavour availability">
  <div class="availability-heading"><strong>{{Math.round(stock.percent)}}% of flavours in stock</strong><span>{{stock.owned}} of {{stock.total}}</span></div>
  <progress :value="stock.percent" max="100" :aria-label="`${stock.owned} of ${stock.total} flavours in stock`"/>
  <p class="availability-status" :class="{ready:stock.canMake}">{{stock.canMake ? `Enough for this ${ml(recipe.volume)} ml batch` : stock.total ? 'More stock needed for this batch' : 'Add ingredients to check availability'}}</p>
  <p v-if="stock.total && !stock.errors.length && stock.percent===100" class="availability-caption">Your flavour stock can make up to {{ml(Math.floor(stock.maxBatch*100)/100)}} ml.</p>
  <details v-if="stock.missing.length||stock.short.length" class="stock-details">
   <summary>{{stock.missing.length ? `${stock.missing.length} missing flavour${stock.missing.length===1?'':'s'}` : 'All flavours owned'}}<span v-if="stock.short.length"> · {{stock.short.length}} low for this batch</span></summary>
   <ul><li v-for="row in stock.missing" :key="row.id"><strong>{{row.name}}</strong> <span>{{row.company}}</span><small>Out of stock · need {{ml(row.ml)}} ml</small></li>
   <li v-for="row in stock.short" :key="row.id"><strong>{{row.name}}</strong> <span>{{row.company}}</span><small>{{ml(row.available)}} of {{ml(row.ml)}} ml available · short {{ml(row.shortBy)}} ml</small></li></ul>
  </details>
  <small v-if="showHelp" class="availability-caption">Flavour concentrates only. PG, VG and nicotine stock aren't tracked.</small>
 </section>
</template>
