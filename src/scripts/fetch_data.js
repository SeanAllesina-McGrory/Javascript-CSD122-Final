export const get_asteroids_json = async function () {
	const response = await fetch("https://data.nasa.gov/resource/y77d-th95.json")
	return response
}
