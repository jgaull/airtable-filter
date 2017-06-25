
var unique = require('array-unique')
var _ = require('underscore')
var promise = require('promise')
var moment = require('moment')

var Operation = require('./operation')

function Filter(table) {

	this.table = table

	this.conditions = []

	this.id = this.get('RECORD_ID()')
	this.createdTime = this.get('CREATED_TIME()')
}

Filter.prototype.get = function (key) {
	return new Operation(this, key)
}

Filter.prototype.firstPage = function(params) {

	return this.select(params).then(function (select) {

		return new Promise(function (resolve, reject) {

			select.firstPage(function (error, records) {

				if (error) {
					reject(error)
				}

				resolve(records)
			})
		})
	})
}

Filter.prototype.all = function(params) {

	return this.select(params).then(function (select) {

		return new Promise(function (resolve, reject) {

			select.all(function (error, records) {

				if (error) {
					reject(error)
				}

				resolve(records)
			})
		})
	})
}

Filter.prototype.each = function(params, eachCallback) {

	if (typeof params === 'function') {
		eachCallback = params
		params = null
	}

	return this.select(params).then(function (select) {

		return new Promise(function (resolve, reject) {

			select.eachPage(function (records, next) {

				records.forEach(function(record) {
					eachCallback(record)
			    })

			    next()

			}, function (error) {

				if (error) {
					reject(error)
				}

				resolve()
			})
		})
	})
}

Filter.prototype.select = function (params) {

	if (!params) {
		params = {}
	}

	var self = this
	return Promise.all(this.conditions).then(function (conditions) {
		params.filterByFormula = and(conditions)
		console.log('filterByFormula: ' + params.filterByFormula)
		return self.table.select(params)
	})
}

Filter.prototype.matchesQuery = function (key, query) {
	return this.matchesKeyInQuery(key, 'RECORD_ID()', query)
}

Filter.prototype.matchesKeyInQuery = function(key, queryKey, query) {

	key = sanitizeKey(key)

	var matchValues = []

	var promise = query.all().then(function (results) {

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

Filter.prototype.exists = function(key) {

	key = sanitizeKey(key)
	return this.addCondition(not(equal(key, 'BLANK()')))
}

Filter.prototype.doesNotExist = function(key) {

	key = sanitizeKey(key)
	return this.addCondition(equal(key, 'BLANK()'))
}

Filter.prototype.equalTo = function(key, value) {

	key = sanitizeKey(key)

	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(equal(key, sanitizeValue(value)))
}

Filter.prototype.notEqualTo = function (key, value) {

	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(not(equal(sanitizeKey(key), sanitizeValue(value))))
}

Filter.prototype.greaterThan = function (key, value) {
	return this.addCondition(greaterThan(sanitizeKey(key), sanitizeValue(value)))
}

Filter.prototype.greaterThanOrEqualTo = function (key, value) {
	return this.addCondition(greaterThanOrEqualTo(sanitizeKey(key), sanitizeValue(value)))
}

Filter.prototype.lessThan = function (key, value) {
	return this.addCondition(lessThan(sanitizeKey(key), sanitizeValue(value)))
}

Filter.prototype.lessThanOrEqualTo = function (key, value) {
	return this.addCondition(lessThanOrEqualTo(sanitizeKey(key), sanitizeValue(value)))
}

Filter.prototype.isBefore = function (key, date) {
	return this.addDateCondition('IS_BEFORE', key, date)
}

Filter.prototype.isAfter = function (key, date) {
	return this.addDateCondition('IS_AFTER', key, date)
}

Filter.prototype.isSame = function (key, date, unit) {
	return this.addDateCondition('IS_SAME', key, date, sanitizeValue(unit))
}

Filter.prototype.isError = function (key) {
	return this.addCondition(buildFunction('ISERROR', key))
}

Filter.prototype.search = function (key, string) {

	key = sanitizeKey(key)
	string = sanitizeValue(string)

	return this.addCondition(buildFunction('SEARCH', [buildFunction('LOWER', string), buildFunction('LOWER', key)]))
}

Filter.prototype.addDateCondition = function (functionName, key, date) {

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

Filter.prototype.addCondition = function (condition) {
	this.conditions.push(condition)
	return this
}

Filter.prototype.containedIn = function(key, array) {
	//console.log('typeof key: ' + typeof key + ', key.length: ' + key.length + ', isRecordId(): ' + isRecordId(key[0]))
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

module.exports = Filter