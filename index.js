
var unique = require('array-unique')
var _ = require('underscore')
var promise = require('promise')
var moment = require('moment')

function Query(table) {

	this.table = table

	this.conditions = []
}

Query.prototype.firstPage = function(params) {

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

Query.prototype.all = function(params) {

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

Query.prototype.each = function(params, eachCallback) {

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

Query.prototype.select = function (params) {

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

Query.prototype.exists = function(key) {

	key = sanitizeKey(key)
	return this.addCondition(not(equal(key, 'BLANK()')))
}

Query.prototype.doesNotExist = function(key) {

	key = sanitizeKey(key)
	return this.addCondition(equal(key, 'BLANK()'))
}

Query.prototype.equalTo = function(key, value) {

	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(equal(sanitizeKey(key), sanitizeValue(value)))
}

Query.prototype.notEqualTo = function (key, value) {

	if (isRecordId(key) && !value) {
		value = key
		key = 'RECORD_ID()'
	}

	return this.addCondition(not(equal(sanitizeKey(key), sanitizeValue(value))))
}

Query.prototype.greaterThan = function (key, value) {
	return this.addCondition(greaterThan(sanitizeKey(key), sanitizeValue(value)))
}

Query.prototype.greaterThanOrEqualTo = function (key, value) {
	return this.addCondition(greaterThanOrEqualTo(sanitizeKey(key), sanitizeValue(value)))
}

Query.prototype.lessThan = function (key, value) {
	return this.addCondition(lessThan(sanitizeKey(key), sanitizeValue(value)))
}

Query.prototype.lessThanOrEqualTo = function (key, value) {
	return this.addCondition(lessThanOrEqualTo(sanitizeKey(key), sanitizeValue(value)))
}

Query.prototype.isBefore = function (key, date) {
	return this.addDateCondition('IS_BEFORE', key, date)
}

Query.prototype.isAfter = function (key, date) {
	return this.addDateCondition('IS_AFTER', key, date)
}

Query.prototype.isSame = function (key, date, unit) {
	return this.addDateCondition('IS_SAME', key, date, sanitizeValue(unit))
}

Query.prototype.isError = function (key) {
	return this.addCondition(buildFunction('ISERROR', key))
}

Query.prototype.addDateCondition = function (functionName, key, date) {

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

Query.prototype.addCondition = function (condition) {
	this.conditions.push(condition)
	return this
}

Query.prototype.containedIn = function(key, array) {
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

Query.prototype.matchesKeyInQuery = function(key, queryKey, query) {

	key = sanitizeKey(key)
	queryKey = sanitizeKey(queryKey)

	var matchValues = []

	var promise = query.all().then(function (results) {

		results.forEach(function (result) {
			var operation = equal(key, result.get(queryKey))
			matchValues.push(operation)
		})

		return or(matchValues)

	})

	return this.addCondition(promise)
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

	return value
}

module.exports = Query