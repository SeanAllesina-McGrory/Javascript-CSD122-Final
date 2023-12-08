<script setup>
import { ref, reactive, computed } from 'vue'
import { evaluate_equation } from '../scripts/equation_parsing.js'

// Props to hold various data from the component
const buffer = ref('')
const running_total = ref(0)
const clear_button = ref('C')
const paren_depth = ref(0)
const result = computed(() => {
	let split_buffer = buffer.value.split(' ')
})

// Gets the last 'piece' of a user's input
//	in this case a 'piece' is a any text between 2 of the following:
//		the start of the string
//		a space
//		the end of the string
let get_final_component = () => {
	return buffer.value.substring(buffer.value.lastIndexOf(' ') + 1)
}

// Inverts the sign of the final component, ignoring operators
function invert_sign_of_final_component() {
	// Gets the final component
	const final_component = get_final_component()

	// If it isnt a number do nothing
	if (!isNumeric(final_component)) return

	// Removes the final component
	remove_final_component()

	// If the final component starts with a - (negative sign)
	if (final_component.charAt(0) === `-`) {
		// Remove the negative sign and replace it with nothing
		buffer.value += ` ${final_component.substring(1, final_component.length)}`
	}
	else {
		// Replace the removed component with a leading -
		buffer.value += ` -${final_component}`
	}
	// In the case the component removed was the first component the buffer will now have a leading space
	// if thats the case we need to remove the leading space since it will break things later
	if (buffer.value.charAt(0) === ` `) buffer.value = buffer.value.substring(1, buffer.value.length)
}

// Removes the final component and consumes it
// Since we dont ever want to remove components that dont meet a specific criteria
//	there is no reason to return the removed component
//	so it is simply consumed instead
function remove_final_component(replacement) {
	buffer.value = `${buffer.value.substring(0, buffer.value.lastIndexOf(" "))}`
}

// The same isNumeric function ive been using all quarter
// As always here is the stackoverflow question i got it from:
//		https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
function isNumeric(str) {
	if (typeof str != "string") return false // we only process strings!  
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		!isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

// Appends a parenthesis (either opening or closing) to the end of the buffer
function append_paren() {
	// If there are ever more closing parens than opening parens,
	//	reset the paren depth and log an error
	//	not vital that this is handled immedietly since the worst case is the function evals to NaN
	if (paren_depth.value < 0) {
		paren_depth.value = 0
		console.error("Recieved negative value on parenthesis depth!!!")
	}
	// If this is the first paren
	//	check if this is the first char in the buffer
	//		if it isnt add a leading space
	//	app the opening paren
	//	and increment the paren depth
	if (paren_depth.value === 0) {
		if (buffer.value.length !== 0) buffer.value += ` `
		buffer.value += `(`
		paren_depth.value++
		return
	}

	// Get the final component
	const final_component = get_final_component()

	// Check if it is numeric or a closing paren
	if (isNumeric(final_component) || final_component === `)`) {
		// If it is that means we want to close the current block (mostly)
		buffer.value += ` )`
		// Then decrement the paren_depth
		paren_depth.value--
	}
	else {
		// If it isnt (the final component is an operator) we want to add an opening paren
		buffer.value += ` (`
		// And increment the paren depth
		paren_depth.value++
	}
}

// Append an operator the buffer
function append_operator(operator) {
	// If there are no numbers before it return
	if (buffer.value.length === 0) return
	// get the final component
	let final_component = get_final_component()
	// Since you can have a paren after an op, we need to loop backwards removing all components
	// 	until we find a number
	while (!isNumeric(final_component)) {
		// If its an opening paren we want to 
		if (final_component === `(`) paren_depth.value--
		// If its a closing paren we want to incrase the depth
		else if (final_component === `)`) paren_depth.value++
		// Remove the final component
		remove_final_component(operator)
		// Update the final component
		final_component = get_final_component()
	}
	// Append the desired opeator to the buffer
	buffer.value += ` ${operator}`
}

// Appends a number to the buffer
function append_number(value) {
	// Gets the current final component
	const val = get_final_component()
	// If it equals 0
	//	meaning a purposely entered 0
	if (val === "0") {
		// If the user tried to enter a non zero number
		if (value !== 0 && isNumeric(value)) {
			// Remove the 0 to keep formatting correct
			remove_final_component()
			// and append a trailing space
			buffer.value += ` `
		}
		else {
			// Return since the user is trying to append a zero and the last component is a zero
			return
		}
	}

	// If the last component isnt a zero and not nothing append a space
	if (!isNumeric(val) && val !== '') buffer.value += ` `
	// Then append the value
	buffer.value += `${value}`
}

// Appends a decimal point
function add_decimal() {
	const final_component = get_final_component()
	// If the last component isnt a number return
	if (!isNumeric(final_component)) return
	// If the last component doesnt already have a . add one
	if (final_component.indexOf(`.`) === -1) buffer.value += `.`
}

// Evaluates the buffer
function evaluate() {
	// Translates the buffer into an equation string
	const equation_string = (buffer.value.charAt(0) === ` ` ? buffer.value.substring(1) : buffer.value)
	// Sets the buffers value to the result of evaluating the equation
	buffer.value = evaluate_equation(equation_string).toString()
}

// Clears the buffer and resets the envrionment
function clear() {
	// Resets the paren depth
	paren_depth.value = 0

	// If there is nothing in the buffer,
	//	reset the running total and change the clear button text
	if (buffer.value.length === 0) {
		running_total.value = 0
		clear_button.value = 'C'
	}
	else {
		// Set the buffer value to ''
		buffer.value = ''
		// Change the clear button text
		clear_button.value = 'CE'
	}

}


</script>

<template>
	<div class='container'>
		<div class='calculator'>
			<div class='display'>
				<div type=text class='text'>{{ buffer }}<br>{{ result }}</div>
			</div>
			<div class='button-grid'>
				<input class='button clear' type='button' @click='clear' v-model='clear_button'>
				<input class='button operator' type='button' @click='append_paren()' value='()'>
				<input class='button operator' type='button' @click='append_operator(`%`)' value='%'>
				<input class='button operator' type='button' @click='append_operator(`/`)' value='/'>
				<input class='button number' type='button' @click='append_number(`7`)' value='7'>
				<input class='button number' type='button' @click='append_number(`8`)' value='8'>
				<input class='button number' type='button' @click='append_number(`9`)' value='9'>
				<input class='button operator' type='button' @click='append_operator(`*`)' value='*'>
				<input class='button number' type='button' @click='append_number(`4`)' value='4'>
				<input class='button number' type='button' @click='append_number(`5`)' value='5'>
				<input class='button number' type='button' @click='append_number(`6`)' value='6'>
				<input class='button operator' type='button' @click='append_operator(`-`)' value='-'>
				<input class='button number' type='button' @click='append_number(`1`)' value='1'>
				<input class='button number' type='button' @click='append_number(`2`)' value='2'>
				<input class='button number' type='button' @click='append_number(`3`)' value='3'>
				<input class='button operator' type='button' @click='append_operator(`+`)' value='+'>
				<input class='button number' type='button' @click='append_number(`0`)' value='0'>
				<input class='button number' type='button' @click='invert_sign_of_final_component()'
					value='+/-'>
				<input class='button number' type='button' @click='add_decimal()' value='.'>
				<input class='button equals' type='button' @click='evaluate()' value='='>
			</div>
		</div>
	</div>
</template>

<style scoped>
.container {
	width: 400px;
	padding: 30px 0px 40px 50px;
	margin: 100px auto;
	background: white;
	border-radius: 10px;
}

.calculator .display {
	display: flex;
	flex-direction: center;
	width: calc(20rem + 25px);
	height: 5rem;
}

.calculator .display .text {
	width: 100%;
	height: 50%;
	padding: 1rem;
	font-size: 20pt;
	border: 4px solid #ffffff;
	background-color: Grey;
}

.button-grid {
	display: inline-grid;
	grid-template-columns: auto auto auto auto;
	column-gap: 10px;
	row-gap: 10px;
}

.calculator .button {
	border-radius: 50px;
	width: 5rem;
	height: 5rem;
	padding: 5px;
	font-size: 25px;
	transition-duration: 0.4;
}

.calculator .button:active {
	font-size: 20px;
}
</style>
