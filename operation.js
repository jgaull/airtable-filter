
var unique = require('array-unique')
var _ = require('underscore')
var promise = require('promise')
var moment = require('moment')

function Operation(filter, key) {

	this.filter = filter
	this.key = sanitizeKey(key)
}

Operation.prototype.exists = function() {
	return this.addCondition(not(equal(this.key, 'BLANK()')))
}

Operation.prototype.doesNotExist = function() {
	return this.addCondition(equal(this.key, 'BLANK()'))
}

Operation.prototype.equalTo = function(value) {

	var key = this.key
	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(equal(key, sanitizeValue(value)))
}

Operation.prototype.notEqualTo = function (value) {

	var key = this.key
	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(not(equal(sanitizeKey(key), sanitizeValue(value))))
}

Operation.prototype.greaterThan = function (value) {
	return this.addCondition(greaterThan(sanitizeKey(this.key), sanitizeValue(value)))
}

Operation.prototype.greaterThanOrEqualTo = function (value) {
	return this.addCondition(greaterThanOrEqualTo(sanitizeKey(this.key), sanitizeValue(value)))
}

Operation.prototype.lessThan = function (value) {
	return this.addCondition(lessThan(sanitizeKey(this.key), sanitizeValue(value)))
}

Operation.prototype.lessThanOrEqualTo = function (value) {
	return this.addCondition(lessThanOrEqualTo(sanitizeKey(this.key), sanitizeValue(value)))
}

Operation.prototype.isBefore = function (date) {
	return this.addDateCondition('IS_BEFORE', date)
}

Operation.prototype.isAfter = function (date) {
	return this.addDateCondition('IS_AFTER', date)
}

Operation.prototype.isSame = function (date, unit) {
	return this.addDateCondition('IS_SAME', date, sanitizeValue(unit))
}

Operation.prototype.isError = function () {
	return this.addCondition(buildFunction('ISERROR', this.key))
}

Operation.prototype.search = function (string) {

	string = sanitizeValue(string)
	return this.addCondition(buildFunction('SEARCH', [buildFunction('LOWER', string), buildFunction('LOWER', this.key)]))
}

Operation.prototype.containedIn = function(array) {
	//console.log('typeof key: ' + typeof key + ', key.length: ' + key.length + ', isRecordId(): ' + isRecordId(key[0]))
	var key = this.key
	
	if (key.constructor == Array && key.length > 0 && isRecordId(key[0]) && !array) {
		array = key
		key = 'RECORD_ID()'
	}

	key = sanitizeKey(key)

	var uniqueArray = unique(array)

	var operations = []
	_.each(uniqueArray, function (value) {
		value = sanitizeValue(value)
		operations.push(equal(key, value))
	})

	return this.addCondition(or(operations))
}

Operation.prototype.matchesFilter = function (filter) {
	return this.matchesKeyInFilter('RECORD_ID()', filter)
}

Operation.prototype.matchesKeyInFilter = function(queryKey, filter) {

	key = this.key

	var matchValues = []

	var promise = filter.all().then(function (results) {

		results.forEach(function (result) {

			var value = queryKey
			if (!isFunction(queryKey)) {
				value = sanitizeValue(result.get(queryKey))
			}
			else if (queryKey == 'RECORD_ID()') {
				value = sanitizeValue(result.id)
			}

			var operation = ''
			if (value.constructor == Array) {

				var vals = value
				var operations = []
				_.each(vals, function (val) {
					operations.push(equal(key, val))
				})

				operation = or(operations)
			}
			else {
				operation = equal(key, value)
			}

			matchValues.push(operation)
		})

		return or(matchValues)

	})

	return this.addCondition(promise)
}

Operation.prototype.addDateCondition = function (functionName, date) {

	var key = this.key

	if (!date) {
		date = key
		key = null
	}

	if (!key) {
		key = 'CREATED_TIME()'
	}

	date = moment(date)
	if (!date.isValid()) {
		throw new Error('date is not a valid date')
	}

	var value = buildFunction('DATETIME_PARSE', sanitizeValue(date.format()))

	var params = [key, value]
	for (var i = 3; i < arguments.length; i++) {
		var argument = arguments[i]
		if (argument) {
			params.push(argument)
		}
	}

	return this.addCondition(buildFunction(functionName, params))
}

Operation.prototype.addCondition = function (condition) {
	this.filter.conditions.push(condition)
	return this
}

function and(args) {
	return logical('AND', args)
}

function or(args) {
	return logical('OR', args)
}

function logical(name, args) {

	if (args.length == 1) {
		return args[0]
	}

	return buildFunction(name, args)
}

function not(value) {
	return buildFunction('NOT', value)
}

function equal(val1, val2) {
	return logicalOperator(val1, '=', val2)
}

function notEqual(val1, val2) {
	return logicalOperator(val1, '!=', val2)
}

function greaterThan(val1, val2) {
	return logicalOperator(val1, '>', val2)
}

function greaterThanOrEqualTo(val1, val2) {
	return logicalOperator(val1, '>=', val2)
}

function lessThan(val1, val2) {
	return logicalOperator(val1, '<', val2)
}

function lessThanOrEqualTo(val1, val2) {
	return logicalOperator(val1, '<=', val2)
}

function logicalOperator(val1, operator, val2) {
	return val1 + operator + val2
}

function buildFunction(name, args) {

	if (!args) {
		args = ''
	}

	if (args.constructor == Array) {
		args = unique(args)

		var string = ''
		_.each(args, function (arg) {
			string += arg + ","
		})

		args = string.substring(0, string.length - 1)
	}

	return name + '(' + args + ')'
}

function isRecordId(value) {
	//console.log('typeof value: ' + typeof value + ", value.length: " + value.length + ", value.substring: " + value.substring(0, 3))
	//this should be a regex
	return typeof value == 'string' && value.length == 17 && value.substring(0, 3) == 'rec'
}

function isFunction(value) {
	//this should be a regex
	return typeof value == 'string' && value.length > 0 && value[value.length - 1] == ')'
}

function sanitizeKey(key) {

	if (typeof key !== 'string') {
		key = key.toString()
	}

	if (key.split(' ').length > 1) {
	
		if (key[0] != '{') {
			key = '{' + key
		}

		if (key[key.length - 1] != '}') {
			key = key + '}'
		}
	}

	return key
}

function sanitizeValue(value) {

	if (value === true) {
		return 'TRUE()'
	}

	if (value === false) {
		return 'FALSE()'
	}

	if (value === null) {
		return 'BLANK()'
	}

	if (typeof value == 'string' && !isFunction(value)) {
		return "\"" + value + "\""
	}

	if (value && value.constructor == Array) {
		for (var i = 0; i < value.length; i++) {
			value[i] = sanitizeValue(value[i])
		}
	}

	return value
}

module.exports = Operation