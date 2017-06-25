
var unique = require('array-unique')
var _ = require('underscore')
var promise = require('promise')
var moment = require('moment')

var logic = require('./logic')

function Operation(filter, key) {

	this.filter = filter
	this.key = sanitizeKey(key)
}

Operation.prototype.exists = function() {
	return this.addCondition(logic.not(logic.equal(this.key, 'BLANK()')))
}

Operation.prototype.doesNotExist = function() {
	return this.addCondition(logic.equal(this.key, 'BLANK()'))
}

Operation.prototype.isEqualTo = function(value) {

	var key = this.key
	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(logic.equal(key, sanitizeValue(value)))
}

Operation.prototype.isNotEqualTo = function (value) {

	var key = this.key
	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(logic.not(logic.equal(sanitizeKey(key), sanitizeValue(value))))
}

Operation.prototype.isGreaterThan = function (value) {
	return this.addCondition(logic.greaterThan(sanitizeKey(this.key), sanitizeValue(value)))
}

Operation.prototype.isGreaterThanOrEqualTo = function (value) {
	return this.addCondition(logic.greaterThanOrEqualTo(sanitizeKey(this.key), sanitizeValue(value)))
}

Operation.prototype.isLessThan = function (value) {
	return this.addCondition(logic.lessThan(sanitizeKey(this.key), sanitizeValue(value)))
}

Operation.prototype.isLessThanOrEqualTo = function (value) {
	return this.addCondition(logic.lessThanOrEqualTo(sanitizeKey(this.key), sanitizeValue(value)))
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
	return this.addCondition(logic.buildFunction('ISERROR', this.key))
}

Operation.prototype.search = function (string) {

	string = sanitizeValue(string)
	return this.addCondition(logic.buildFunction('SEARCH', [logic.buildFunction('LOWER', string), logic.buildFunction('LOWER', this.key)]))
}

Operation.prototype.isContainedIn = function(array) {
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
		operations.push(logic.equal(key, value))
	})

	return this.addCondition(logic.or(operations))
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
					operations.push(logic.equal(key, val))
				})

				operation = logic.or(operations)
			}
			else {
				operation = logic.equal(key, value)
			}

			matchValues.push(operation)
		})

		return logic.or(matchValues)

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

	var value = logic.buildFunction('DATETIME_PARSE', sanitizeValue(date.format()))

	var params = [key, value]
	for (var i = params.length; i < arguments.length; i++) {

		var argument = arguments[i]
		if (argument) {
			params.push(argument)
		}
	}

	var built = logic.buildFunction(functionName, params)
	return this.addCondition(logic.buildFunction(functionName, params))
}

Operation.prototype.addCondition = function (condition) {
	this.filter.conditions.push(condition)
	return this
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