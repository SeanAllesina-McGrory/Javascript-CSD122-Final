<script setup>

import { ref, onUpdated, onMounted } from 'vue'

// If the user is dragging a card
let dragging_card = false

// Special sequences of characters that are displayed as a single char but are made of several
// Store the actual tag text and its length
const special_sequences = new Map([
	['<br>', 4],
	['&amp;', 5],
	['&gt;', 4],
	['&lt;', 4],
	['&quot;', 6],
	['&apos;', 6],
	['&nbsp;', 6],
	['<b>', 3],
	['</b>', 4],
	['<i>', 3],
	['</i>', 4],
	['<ins>', 5],
	['</ins>', 6],
	['<del>', 5],
	['</del>', 6]
])

// Formatting tag pairs
const tag_pairs = new Map([
	['<b>', '</b>'],
	['<i>', '</i>'],
	['<ins>', '</ins>'],
	['<del>', '</del>']
])

// Refs remembering if each format is enabled
const bold = ref(false)
const italic = ref(false)
const underlined = ref(false)
const strikethrough = ref(false)

// Callback function which toggles the specified format on or off
const toggle_bold = function () {
	bold.value = !bold.value
	bold.value ? document.getElementById("btn-bold").classList.add("pressed") : document.getElementById("btn-bold").classList.remove("pressed")
	console.log(document.getElementById("btn-bold"))
	return bold.value
}

const toggle_italics = function () {
	italic.value = !italic.value
	italic.value ? document.getElementById("btn-italics").classList.add("pressed") : document.getElementById("btn-italics").classList.remove("pressed")
	return italic.value
}

const toggle_underlined = function () {
	underlined.value = !underlined.value
	underlined.value ? document.getElementById("btn-underline").classList.add("pressed") : document.getElementById("btn-underline").classList.remove("pressed")
	return underlined.value
}

const toggle_strikethrough = function () {
	strikethrough.value = !strikethrough.value
	strikethrough.value ? document.getElementById("btn-strikethrough").classList.add("pressed") : document.getElementById("btn-strikethrough").classList.remove("pressed")
	return strikethrough.value
}

// The editor text (text user has input, opening tags, and fully closed tags)
const editor_text = ref("")
// End tags which match opening tags the user has enabled but not finished
const end_tags = ref("")

// Which tab is being viewed
const tab = ref(1)
// Holds all the users notes
const notes = ref([])
// Kanban array is as follows [key, name, entries[]]
// This isnt used after initialization, only for setup
const boards = ref([
	[0, "To-Do", []],
	[1, "In-Progress", []],
	[2, "Done", []]
])

// User selection
// NOTE: DEADCODE
const sel = ref(['', 0, 0])

// Updates the current tag being viewed
const update_tab = function (new_value) {

	const active_tab = document.getElementById(tab.value)
	const new_tab = document.getElementById(new_value)

	if (new_tab === active_tab) {
		return
	}

	tab.value = new_value

	active_tab.classList.remove("active")
	new_tab.classList.add("active")
}

// Adds a new note to the notes array
const add_note = function () {
	const note_text = document.getElementById("note_text")
	if (note_text.value.length > 0) {
		notes.value.push([notes.value.length, note_text.value])
	}
}

// Removes a not from the notes array
const remove_note = function (note_index) {
	notes.value = notes.value.filter((note) => note[0] !== note_index)
}

// Adds a new list of tasks to the kanban board
const add_list = function () {
	const list = document.getElementById("list_name")
	if (list.value.length === 0) return
	if (boards.value.filter((board) => board[1] === list.value).length > 0) return
	boards.value.push([boards.value.length, list.value, []])
	list.value = ''
}

// Adds a new card to the kanban board
const add_card = function (board_id) {
	const card = document.getElementById(`board${board_id}`)
	if (card.value === '') return
	const list = boards.value.filter((board) => board[1] === board_id)[0]
	list[2].push([list[2].length, card.value])
	card.value = ''

}

// Updates the draggable elements to refresh with newly added cards and notes
const update_draggable_elements = function () {
	const draggables = document.querySelectorAll(".draggable")


	draggables.forEach(draggable => {
		draggable.addEventListener('dragstart', () => {
			dragging_card = true
			draggable.classList.add("dragging")
		})

		draggable.addEventListener('dragend', () => {
			dragging_card = false
			draggable.classList.remove("dragging")
		})
	})

	const draggable_boards = document.querySelectorAll(".draggable_board")

	draggable_boards.forEach(draggable_board => {
		draggable_board.addEventListener('dragstart', () => {
			if (dragging_card) return
			draggable_board.classList.add("dragging_board")
		})
		draggable_board.addEventListener('dragend', () => {
			draggable_board.classList.remove('dragging_board')
		})
	})
}

// Updates draggable containers, same as above but specifically for lists
const update_draggable_container = function () {
	const containers = document.querySelectorAll(".draggable_container")

	containers.forEach(container => {
		container.addEventListener("dragover", e => {
			e.preventDefault()
			const after_element = get_drag_after_element(container, e.clientY)
			const draggable = document.querySelector('.dragging')
			if (after_element === null) {
				container.appendChild(draggable)
			} else {
				console.log(draggable)
				console.log(after_element)
				container.insertBefore(draggable, after_element)
			}
		})
	})

	const boards = document.querySelectorAll(".boards_container")

	boards.forEach(board => {
		board.addEventListener("dragover", e => {
			e.preventDefault()
			const after_board = get_next_board(board, e.clientX)
			const draggable = document.querySelector('.dragging_board')
			if (after_board === null) {
				board.appendChild(draggable)
			} else {
				board.insertBefore(draggable, after_board)
			}
		})
	})
}

// Gets the element which follows the end point of a users drag and drop
const get_drag_after_element = function (container, y) {
	const draggable_elements = [...container.querySelectorAll('.draggable:not(.dragging)')]
	return draggable_elements.reduce((closest, child) => {
		const box = child.getBoundingClientRect()
		const offset = y - box.top - box.height / 2
		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child }
		} else {
			return closest
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element
}

// Gets the next board which follows the end point of a users drag and drop
const get_next_board = function (board, x) {
	const draggable_boards = [...board.querySelectorAll(".draggable_board:not(.dragging_board)")]
	return draggable_boards.reduce((closest, child) => {
		const box = child.getBoundingClientRect()
		const offset = x - box.left - box.width / 2
		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child }
		} else {
			return closest
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element
}

// Takes an opening tag, and a reference to a prop which holds the state of that current tag in context (i.e. is that tag currently open)
//	and uses that to infer if the tag it should place in the text is an opening or closing tag
const process_tag = function (tag, callbackFunction, event) {
	const resp = callbackFunction.call()
	const closing_tag = tag_pairs.get(tag)
	if (resp) {
		editor_text.value += tag
		end_tags.value = closing_tag + end_tags.value
	} else {
		const closing_tag_position = end_tags.value.indexOf(closing_tag) + closing_tag.length
		const old_end_tags = end_tags.value.substring(0, closing_tag_position)
		end_tags.value = end_tags.value.substring(closing_tag_position)
		end_tags.value = old_end_tags.slice(0, 0 - closing_tag.length) + end_tags.value
		editor_text.value += old_end_tags
		const end_tags_array = old_end_tags.slice(0, 0 - closing_tag.length).split('>')
		end_tags_array.pop()
		const new_tags = end_tags_array.reverse().map(tag => tag.replace('/', '') + '>').join('')
		editor_text.value += new_tags
	}
}

// Determins if the buffer ends with a special sequence
// Suprisingly efficient so not going to find a better way
//	since the current overhead is 0ms
const ends_with_special_sequence = function (text) {
	// Create an array to track if a special sequence was found and the size of the found sequence
	let special_info = [false, -1]
	// Loop through all special sequences
	special_sequences.forEach((value, key) => {
		// If it ends with a special sequence
		if (text.endsWith(key)) {
			// Track needed info
			special_info = [true, value]
		}
	})

	return special_info
}

// Records a key press
const log_key = function (event) {
	// Stops event propagation
	event.preventDefault()
	const key = event.key
	const text = editor_text.value
	const len = editor_text.length

	// Do a specific thing depending on the key
	switch (key) {
		case "Delete":	// TODO: Should delete the char after the cursor
		case "Backspace":
			// If the text ends with a special sequence
			const [is_special, sequence_len] = ends_with_special_sequence(text)
			// Delete the special sequence in its entirety
			if (is_special) editor_text.value = text.slice(0, -(sequence_len))
			// Else just delete one character
			else editor_text.value = text.slice(0, -1)
			break
		case "Enter":
			// add a break
			editor_text.value += "<br>"
			break
		case "Tab":
			// Gets the needed characters to fill to the next block of 4 chars
			// BUG: Doesn't fully work since the character &nsbp; is six characters but shows up as 1
			const len = editor_text.value.length
			const filler = 4 - (len % 4)
			editor_text.value += "&nbsp;".repeat(filler)
			break
		// Skip these characters since they are not typed
		case "Home":
		case "End":
		case "Control":
		case "Alt":
		case "PageUp":
		case "PageDown":
		case "Shift":
		case "Meta":
		case "CapsLock":
		case "Escape":
		case "F1":
		case "F2":
		case "F3":
		case "F4":
		case "F5":
		case "F6":
		case "F7":
		case "F8":
		case "F9":
		case "F10":
		case "F11":
		case "F12":
		case "ArrowRight":
		case "ArrowLeft":
		case "ArrowUp":
		case "ArrowDown":
			break
		// The following chracters need to be displayed differently (as escaped sequences)
		//	since outputing them directly would result in xss vulnerability
		case "<":
			editor_text.value += "&lt;"
			break
		case ">":
			editor_text.value += "&gt;"
			break
		case "&":
			editor_text.value += "&amp;"
			break
		case "\"":
			editor_text.value += "&quot;"
			break
		case "'":
			editor_text.value += "&apos;"
			break
		default:
			// The key is alphanukeric, so add it directly
			editor_text.value += key
			break
	}
}

// DEADCODE
// Gets the users selection
// e.g. the text the user has visually selected on the screen
const selection = function (e) {
	const selection = window.getSelection()
	sel.value[0] = selection.toString()
	const focus = selection.focusOffset
	const anchor = selection.anchorOffset

	sel.value[1] = Math.min(focus, anchor)
	sel.value[2] = Math.max(focus, anchor)
}

onMounted(() => {
	update_draggable_elements()
	update_draggable_container()
})


onUpdated(() => {
	update_draggable_elements()
	update_draggable_container()
	document.getElementById("editor_text_area").innerHTML = editor_text.value
})


</script>

<template>
	<div class="container">
		<div class="tabs">
			<div class="tab active" id="1">
				<h2 @click="update_tab(1)">Notes</h2>
			</div>
			<div class="tab" id=2>
				<h2 @click="update_tab(2)">Kanban Board</h2>
			</div>
			<div class="tab" id="3">
				<h2 @click="update_tab(3)">Editor</h2>
			</div>
		</div>
		<div class="main">
			<div class="notes" v-show="tab === 1">
				<h1>Reminders</h1>
				<ul class="draggable_container">
					<li v-for="note of notes" :key="note[0]" class="note draggable" draggable="true">
						<i class="fa-solid fa-x x-button" @click="remove_note(note[0])"></i> {{ note[1]
						}}
					</li>
				</ul>
				<div class="note_creation">
					<input type="text" id="note_text" v-on:keyup.enter="add_note()" />
					<input type="button" @click='add_note()' class="button" value="Add Note" />
				</div>
			</div>
			<div class="kanban" v-show="tab === 2">
				<h1>Kanban</h1>
				<div class="boards">
					<ul class="boards_container">
						<li v-for="board of boards" :key="board[1]" class="draggable_board"
							draggable="true">
							<div class="board">
								<h2 class="board_title">{{ board[1] }}</h2>
								<div class="draggable_container">
									<p v-for="card of board[2]" :key="card[0]"
										class="card draggable" draggable="true">{{
											card[1] }}</p>
								</div>
								<div class="newcard">
									<span @click="add_card(board[1])"
										class="spacing-x">+</span>
									<input :id="`board${board[1]}`" type="text"
										placeholder="Add another card" class="textinput"
										v-on:keyup.enter="add_card(board[1])" />
								</div>
							</div>
						</li>
					</ul>
					<div class="board_creator">
						<span @click="add_list()" class="spacing-x">+</span>
						<input id="list_name" type="text" placeholder="Add another list"
							class="textinput" v-on:keyup.enter="add_list()" />
					</div>
				</div>
			</div>
			<div class="editor" v-show="tab === 3">
				<div class="options">
					<h1>Editor</h1>
					<div id="btn-bold" class="stylebutton"
						@click="(e) => process_tag('<b>', toggle_bold, e)">
						<b>Bold</b>
					</div>
					<div id="btn-italics" class="stylebutton"
						@click="(e) => process_tag('<i>', toggle_italics, e)">
						<i>Italics</i>
					</div>
					<div id="btn-underline" class="stylebutton"
						@click="(e) => process_tag('<ins>', toggle_underlined, e)">
						<ins>Underline</ins>
					</div>
					<div id="btn-strikethrough" class="stylebutton"
						@click="(e) => process_tag('<del>', toggle_strikethrough, e)">
						<del>Strike</del>
					</div>
				</div>
				<br>
				<div @mousemove.left="(e) => selection(e)" @keydown="(e) => log_key(e)" class="textarea"
					tabindex="0">
					<div id=editor_text_area>
						{{ editor_text }}{{ end_tags }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.editor {
	color: var(--base2);
}



.textarea {
	background-color: var(--base7);
	width: 100%;
	height: 65vh;
}

.options {
	display: flex;
	justify-content: left;
	align-items: center;
}


.options .stylebutton {
	width: 5rem;
	height: 2rem;
	display: flex;
	justify-content: center;
	color: var(--base2);
	background-color: var(--base6);
	border: solid 2px var(--base5);
	border-radius: 3px;
	margin-inline: 2rem;
}

.options .stylebutton.pressed {
	background-color: var(--base5);
	border-color: var(--base6);
}

h1 {
	font-size: 24pt;
}

.container {
	width: 90%;
	height: 90%;
	background-color: var(--base2);
}

.tabs {
	display: flex;
	justify-content: left;
	padding-left: 1rem;
	padding-top: 1rem;
}

.tab {
	border-top-right-radius: 10px;
	border-top-left-radius: 10px;
	font-size: 25pt;
	padding-inline: 10px;
	font: Rubik;
	font-size: 24pt;
	font-weight: 600;
	border-bottom: 0px;
	border-width: 5px;
	border-color: var(--base1);
	margin-inline: 5px;
}

.tab.active {
	background-color: var(--base5);
}

.draggable {}

.draggable.dragging {
	opacity: 0.5;

}

.draggable_container {
	padding: 5px 7px 5px 0px;
	overflow: auto;
	max-height: calc(65vh - 2rem - 10px);
}

.main {
	padding: 2rem;
	background-color: var(--base1);
	height: calc(96% - 2rem - 10px);
	margin: 0rem 1rem 1rem 1rem;
}

.boards {
	display: flex;
	justify-content: left;
	overflow: auto;
	max-height: calc(50% - 2rem - 10px);
}

.boards_container {
	display: flex;
	justify-content: left;
}

.board {
	width: 12rem;
	background-color: var(--purple_mod3);
	margin: 10px;
	border-radius: 5px;
	padding: 5px;
	min-height: 5rem;
	overflow-x: hidden;
	overflow-y: auto;
}

.board_creator {
	background-color: var(--purple_mod3);
	margin: 10px;
	border-radius: 5px;
	padding: 5px;
	height: 2rem;
	width: 12rem;
	display: flex;
	justify-content: left;
}

.card {
	width: 100%;
	background-color: var(--purple_mod2);
	margin: 4px;
	border-radius: 3px;
}

.newcard {
	display: flex;
	height: 24px;
}

.textinput {
	background-color: rgba(0, 0, 0, 0);
	outline: none;
}

.spacing-x {
	padding-inline: 5px;
}

.x-button {
	color: var(--base6);
}
</style>
