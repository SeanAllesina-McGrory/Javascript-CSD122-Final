<script setup>
import Sidebar from '../components/Sidebar.vue'
import Calculator from '../components/Calculator.vue'
import Map from '../components/Map.vue'
import Note from '../components/Note.vue'
import { ref, reactive } from 'vue'

// Set the currently viewable pop-up
// Need to set it external from the html due to Vue not updating correctly
let set_popup = (popup_id) => {
	popup.value = popup_id
}

// Refs for various prop data
// Popup is the currently viewable popul
const popup = ref(0)
// Next 3 are the map starting cords, they aren't very useful
// 	since the map isn't very useful
const center = ref([47.672786, -122.420654])
const zoom = ref(9)
const bounds = ref([[46.475699386607516, -125.92529296875006], [48.84302835299519, -118.91601562500006]])

</script>

<template>
	<div class="popup" v-if="popup > 0" @click.self='set_popup(0)'>
		<Calculator class='calculator' v-show="popup === 1" />
		<Map class='map' v-show="popup === 2" :zoom="zoom" :center="center" :bounds="bounds" />
		<Note class='notes' v-show="popup === 3" />
	</div>
	<div class='sidebar'>
		<Sidebar @open_popup='(popup_id) => set_popup(popup_id)' class='perma' />
	</div>
</template>

<style scoped>
.popup {
	top: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	position: fixed;
	background: rgba(0, 0, 0, 0.5);
	width: 100%;
	height: 100%;
}
</style>
