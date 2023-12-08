<script setup>
import { ref, reactive, onBeforeMount, onMounted } from 'vue'
import "vue-map-ui/dist/normalize.css"
import "vue-map-ui/dist/style.css"
import "vue-map-ui/dist/theme-all.css"
import "leaflet/dist/leaflet.css"
import { VMap, VMapOsmTileLayer, VMapZoomControl, VMapPane, VMapPinMarker } from 'vue-map-ui'
import { get_asteroids_json } from "../scripts/fetch_data.js"
// Props for initial location values (VueJS stuff, not important)
const props = defineProps([
	'center',
	'zoom',
	'bounds'
])

// Refs to the passed props (VueJS stuff)
const center = ref(props.center)
const zoom = ref(props.zoom)
const bounds = ref(props.bounds)

const asteroids = reactive([])

// Floors the math cords into a certain bound so the user doesn't scroll infinently
let floor_map_cord = function (cord) {
	return Math.min(Math.max(cord, -180), 180)
}

// Runs whenever the map view is changed
let view_changed = function (event) {
	// If they were to go past the edge of the map their longitude would be > 180
	//    So check if its above and loop around minus 1 just to stop the view_changed function from
	//        recusing endlessly
	//    We also change the bounds, not completely necessary but better for overall appearance
	if (Math.abs(event.center.lng) > 180) {
		event.center.lng = floor_map_cord(event.center.lng) * -1
		event.bounds._northEast.lng = floor_map_cord(event.bounds._northEast.lng) * -1
		event.bounds._southWest.lng = floor_map_cord(event.bounds._southWest.lng) * -1
	}
	// Updates the center and bounds of the map
	center.value = event.center;
	bounds.value = event.bounds;
}

const asteroid_alert = function (string) {
	alert(string)
}


onMounted(() => {
	get_asteroids_json().then(response => {
		if (!response.ok) {
			throw new Error("Error " + repsonse.status)
		}
		return response.json()
	})
		.then(json => {
			return json.filter(e => e.geolocation !== undefined)
		})
		.then(filtered_json => {
			asteroids.value = filtered_json
		})
		.catch(function () {
			console.warn("Error while parsing")
		})
})


</script>

<template>
	<div id="map">
		<VMap :center='center' :zoom='zoom' theme='dark' @view-changed="event => view_changed(event)"
			:attributionControl="true">
			<VMapOsmTileLayer />
			<VMapZoomControl />
			<VMapPane name="asteroids_pane" :z-index="601" />
			<VMapPinMarker v-for="asteroid in  asteroids.value " :key="asteroid.id" pane="asteroids_pane"
				:latlng="[asteroid.geolocation.coordinates[1], asteroid.geolocation.coordinates[0]]"
				@click="asteroid_alert(`In ${asteroid.year.substring(0, 4)} an asteroid named ${asteroid.name} with mass ${asteroid.mass}g fell here!`)">
				<img class=" asteroid_icon" src="../assets/asteroid.png" />
			</VMapPinMarker>
		</VMap>
	</div>
</template>
<style scoped>
#map {
	height: 90%;
	width: 90%;
	background-color: black;
}
</style>
