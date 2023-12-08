<script setup>
// VueJS event handler
let toggle_popup = (popup_id) => {
	emit('open_popup', popup_id)
}

// VueJS event emitter
const emit = defineEmits(['open_popup'])

</script>

<template>
	<div class="nav container main_nav">
		<img src="../assets/calculator.png" class='nav element navobj' @click='toggle_popup(1)' />
		<img src="../assets/map.png" class='nav element navobj' @click='toggle_popup(2)' />
		<img src="../assets/notes.png" class='nav element navobj' @click='toggle_popup(3)' />
	</div>
</template>

<style scoped>
.main_nav {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	height: 95vh;
}
</style>


 
