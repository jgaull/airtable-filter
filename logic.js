
var unique = require('array-unique')
var _ = require('underscore')

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

module.exports.and = and
module.exports.or = or
module.exports.logical = logical
module.exports.not = not
module.exports.equal = equal
module.exports.notEqual = notEqual
module.exports.greaterThan = greaterThan
module.exports.greaterThanOrEqualTo = greaterThanOrEqualTo
module.exports.lessThan = lessThan
module.exports.lessThanOrEqualTo = lessThanOrEqualTo
module.exports.logicalOperator = logicalOperator
module.exports.buildFunction = buildFunction
