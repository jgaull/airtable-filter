var assert = require('assert')

var Airtable = require('airtable')
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyoJ4414mR4nEftZ'
})

describe('AirtableQuery', function () {

	this.timeout(5000)

	var AirtableQuery = require('../index')
	var base = Airtable.base('appx65wZlf4173yqx')
	var query

	beforeEach(function () {
		query = new AirtableQuery(base('Pokemon'))
	})

	afterEach(function () {
		query = null
	})

	it('supports containedIn', function (done) {

		var ids = ['2', '101', '1']

		query.containedIn("id", ids)
		query.firstPage().then(function(records) {

			try {
				assert(records)
		        assert.equal(records.length, 3)
		        done()
			}
			catch (e) {
				done(e)
			}

		}, function (error) {
			done(error)
		})
	})

	it('supports containedIn list of RECORD_ID()s', function (done) {

		var recordIds = ['rec26TzCrvUuZvKLC', 'recZjsPlLtKAwgK4I', 'reczBVQyj0iGlPNO5']
		query.containedIn(recordIds)
		query.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, recordIds.length)
				assert.equal(records[0].get('identifier'), 'bulbasaur')
				done()
			}
			catch (e) {
				done(e)
			}
		}, function (error) {
			done(error)
		})
	})

	it('supports equalTo', function (done) {

		var name = 'snorlax'

		query.equalTo('identifier', name)
		query.firstPage().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)
				assert.equal(records[0].get('identifier'), name)
				done()
			}
			catch (e) {
				done(e)
			}
		}, function (error) {
			done(error)
		})
	})

	it('supports equalTo RECORD_ID()', function (done) {

		query.equalTo('rec26TzCrvUuZvKLC')
		query.firstPage().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)
				assert.equal(records[0].get('identifier'), 'bulbasaur')
				done()
			}
			catch (e) {
				done(e)
			}
		}, function (error) {
			done(error)
		})
	})

	it('supports matchesKeyInQuery', function (done) {

		var name = 'snorlax'

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.equalTo('identifier', name)

		var abilititesQuery = new AirtableQuery(base('Abilities'))
		abilititesQuery.matchesKeyInQuery('pokemon_id', 'id', pokemonQuery)
		abilititesQuery.firstPage().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 3)

				records.forEach(function (record) {
					assert.equal(record.get('pokemon_id'), 143)
				})

				done()
			}
			catch (e) {
				done(e)
			}

		}, function (error) {
			done(error)
		})
	})

	it('supports each', function (done) {

		var name = 'snorlax'

		var numRecords = 0

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.equalTo('identifier', name)

		var abilititesQuery = new AirtableQuery(base('Abilities'))
		abilititesQuery.matchesKeyInQuery('pokemon_id', 'id', pokemonQuery)

		abilititesQuery.each(function (record) {
			assert.equal(record.get('pokemon_id'), 143)
			numRecords++

		}).then(function () {

			try {
				assert.equal(numRecords, 3)
				done()
			}
			catch (e) {
				done(e)
			}

		}, function (error) {
			done(error)
		})
	})
})


