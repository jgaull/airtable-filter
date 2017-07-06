
var unique = require('array-unique')
var promise = require('promise')
var moment = require('moment')
var _ = require('underscore')

var Operation = require('./operation')
var logic = require('./logic')

function Filter(table) {

	this.table = table

	this.conditions = []
	this.includes = []

	this.id = this.where('RECORD_ID()')
	this.createdTime = this.where('CREATED_TIME()')
}

Filter.prototype.where = function (key) {
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

	var self = this
	return this.select(params).then(function (select) {

		return new Promise(function (resolve, reject) {

			select.all(function (error, records) {

				if (error) {
					reject(error)
				}

				resolve(records)
			})
		})

	}).then(function (records) {
		return replaceIncludes(records, self.includes)
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

Filter.prototype.include = function (key, table) {

	if (!key) {
		throw new Error('key is a required parameter')
	}

	if (typeof key != 'string') {
		throw new Error('typeof key ' + key + ' must be string')
	}

	if (!table) {
		throw new Error('fromTable is a required parameter')
	}

	this.includes.push({
		key: key,
		table: table
	})

	return this
}

function replaceIncludes(records, includes) {

	var serializedPromise = Promise.resolve()
	_.each(includes, function (include) {

		var key = include.key
		var table = include.table
		if (records.length > 0 && isPointer(records[0], key)) {

			var ids = []
			records.forEach(function (record) {
				ids = ids.concat(record.get(key))
			})

			serializedPromise = serializedPromise.then(function () {

				var filterRelatedRecords = new Filter(table)
				filterRelatedRecords.id.isContainedIn(ids)
				return filterRelatedRecords.all()

			}).then(function (relatedRecords) {

				var relatedRecordsHash = {}

				_.each(relatedRecords, function (relatedRecord) {
					relatedRecordsHash[relatedRecord.id] = relatedRecord
				})

				_.each(records, function (record) {

					var relations = record.get(key)
					for (var i = 0; i < relations.length; i++) {

						var relationId = relations[i]
						relations[i] = relatedRecordsHash[relationId]
					}
				})

				return Promise.resolve()
			})
		}
	})

	return serializedPromise.then(function () {
		return records
	})
}

function isPointer(record, key) {

	var pointers = record.get(key)
	if (pointers.constructor == Array && pointers.length > 0) {
		var firstPointer = pointers[0]
		return isRecordId(firstPointer)
	}

	return false
}

function isRecordId(value) {
	var regex = new RegExp('^rec[a-zA-Z0-9]{14}$')
	return typeof value == 'string' && regex.test(value)
}

module.exports = Filter