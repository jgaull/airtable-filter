
var unique = require('array-unique')
var _ = require('underscore')
var promise = require('promise')
var moment = require('moment')

var Operation = require('./operation')
var logic = require('./logic')

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
		params.filterByFormula = logic.and(conditions)
		//console.log('filterByFormula: ' + params.filterByFormula)
		return self.table.select(params)
	})
}

module.exports = Filter