function pre_parse_equation_string(equation_string) {

	// gets the location of the first )
	let pos_closing_paren = equation_string.indexOf(')')

	// My LSP yells when i modify the value of equation string in place
	// So copy it into a new variable
	let parsed_equation_string = equation_string
	
	// Parenthesis parsing loop
	// Does the following,
	// 	finds the last ( at index x before y (index of first ')')
	//	takes a substring 0..x called prefix
	//	takes a substring y+1.. called suffix
	//	evaluates the equation present between the two parens
	//	updates the parsed_equation_string with the evaluated value
	// 	finds the new first occurance of ) and sets y to its index
	while (pos_closing_paren !== -1) {
		// Finds first, and most deeply nested, parenthesis set
		const pos_opening_paren = parsed_equation_string.lastIndexOf('(', pos_closing_paren)
		const prefix = parsed_equation_string.substring(0, pos_opening_paren)
		const suffix = parsed_equation_string.substring(pos_closing_paren + 1)

		// Evaluates the equation array present by
			// Creating a substring of only the enclosed array 
			// Splits on spaces to create a valid equation array to evaluate
		const evaluated_expression = evaluate_equation_array(
			parsed_equation_string.substring(
				pos_opening_paren + 2, pos_closing_paren - 1
			).split(' ')
		)
	
		// Updates the parsed equation string
			// and updates the closing paren index
		parsed_equation_string = `${prefix}${evaluated_expression}${suffix}`
		pos_closing_paren = parsed_equation_string.indexOf(')')
	}
	
	// Find the first index of %
	// -> % is handled internally as dividing by 100 (e.g. x% -> (x/100) )
	// So we need to replace the % with the solved value of x/100
	let pos_percent = parsed_equation_string.indexOf('%')
	
	// Repeatedly solves for all %s
	// Does the following,
	// 	gets a substring of the equation string from 0..x where x is the pos of the first % -1
	//	gets a substring of the eq string from x + 2..
	//		we take x+2 since the start is inclusive and we need to skip the % and trailing space
	//	gets the value from the prefix and assigns it to value
	//	calculates the value by parsing it to a number and dividing by 100
	// 	updates the prefix to not include the value
	// 	updates the equation string to remove the x% and replaces it with the calculated value
	// 	updates the pos variable with the location of the next %
	while (pos_percent !== -1) {
		// splits the string into a prefix+value and suffix
		const prefix_with_value = parsed_equation_string.substring(0, pos_percent - 1)
		const suffix = parsed_equation_string.substring(pos_percent + 2)
		
		// extracts the value from the prefix
		const value = prefix_with_value.substring(prefix_with_value.lastIndexOf(' '))
		
		// calculates what the value% is
		const calculated_value = Number(value) / 100

		// updates the prefix
		const prefix = prefix_with_value.slice(0, 0 - value.length)

		// Updates the eq string
		parsed_equation_string = `${prefix} ${calculated_value} ${suffix}`

		// Updates the percent sign location
		pos_percent = parsed_equation_string.indexOf('%')
	}

	return parsed_equation_string
}

// Called on a parsed equation array that only includes the symbols +,-,*,and / and Numbers
// So we move all the elements into a new array, parsing the numbers to numbers
// Keeping the operators
function parse_array_ints(equation_array) {
	// Arrays dont need to be mutable to accept new elements
	// So we define it as a const
	const parsed_array = []
	
	// Loop through the array and for each element
	// WARNING: This implementation implys that all non operator symbols are numbers
	// If this is not the case it will be parsed into NaN
	// This will propogate to all other numbers mutating the entire equation into NaN
	// This is not great implementation, but does work since users cannot freely input values
	// However it might be worth looking into a better solution
	equation_array.forEach((element) => {
		// If it is a valid operator add it to the array
		if (['+', '-', '*', '/'].includes(element)) parsed_array.push(element)
		// If it isnt parse it to a number
		else parsed_array.push(Number(element))
	})

	return parsed_array
}

// Finds the first operator present in a given equation array using PEMDAS
// 	e.g. -> will return * given the following equation 1 + 2 + 3 * 4
// 		since * is to be evaluated before +
function find_first_operator_pemdas(equation_array) {
	// Set the index of the first op to -1
	// 	returns -1 if no ops are found
	let index_first_op = -1
	
	// Remember if we have found a * or / op so we dont override it with a +
	let multiplication_or_division = false

	// Enumerate each element
	equation_array.forEach((element, index) => {
		// Checking first if it is * or /
			// then if it is and we haven't found a *,/ yet set the index and flag
		if (['*','/'].includes(element) && (index_first_op === -1 || !multiplication_or_division) ) {
			index_first_op = index
			multiplication_or_division = true
		}
		// If it isnt a * or / check if it is a + or -
			// If it is and we havent found a * or / and havent found a previous operator set the index
		else if (!multiplication_or_division && ['+','-'].includes(element) && index_first_op === -1) {
			index_first_op = index
		}
	})

	return index_first_op
}

// Evaluates an equation array
// Does the following:
// 	parses the equation array into an array of operators (+,-,*,/) and numbers
// 	then continuously evaluates the equation using pemdas
// 	returns the first value in the end array
// 		this is required since the array is not resized in time
// 		meaning there are going to be several 'empty' slots with garbage data
function evaluate_equation_array(equation_array) {
	// parses the equation array into a valid int equation array
	const parsed_equation_array = parse_array_ints(equation_array)
	// gets the position of the first pemdas operator
	let pos_first_operator = find_first_operator_pemdas(equation_array)

	// Loops over the array until no operators are left
	while (pos_first_operator !== -1) {
		let evaluated_value = 0
		
		// Decides which operation to perform based on whicb operator is present
		// Long lines but is just doing basic math
		switch (parsed_equation_array[pos_first_operator]) {
			case '+':
				evaluated_value = parsed_equation_array[pos_first_operator - 1] + parsed_equation_array[pos_first_operator + 1]
				break
			case '-':
				evaluated_value = parsed_equation_array[pos_first_operator - 1] - parsed_equation_array[pos_first_operator + 1]
				break
			case '*':
				evaluated_value = parsed_equation_array[pos_first_operator - 1] * parsed_equation_array[pos_first_operator + 1]
				break
			case '/':
				evaluated_value = parsed_equation_array[pos_first_operator - 1] / parsed_equation_array[pos_first_operator + 1]
				break
		}
		// Splices the evaluated value back into the array at the position of the operator
		// 	removing the operator and the values on either side
		parsed_equation_array.splice(pos_first_operator - 1, 3, evaluated_value)
		// Updates the pos of the first op
		pos_first_operator = find_first_operator_pemdas(parsed_equation_array)
	}

	return parsed_equation_array[0]
}

// Parses an equation string to an equation array
function parse_equation_to_array(equation_string) {
	const pre_parsed_equation_string = pre_parse_equation_string(equation_string)
	return (pre_parsed_equation_string.split(' '))
}

// Recursively evaluates an expression given a valid equation string
// returning the result of the expression in its entirity
export function evaluate_equation(equation_string) {
	const equation_array = parse_equation_to_array(equation_string)
	const result = evaluate_equation_array(equation_array)
	return result
}
