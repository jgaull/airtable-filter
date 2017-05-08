var assert = require('assert')
var moment = require('moment')

var Airtable = require('airtable')
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyoJ4414mR4nEftZ'
})

describe('AirtableQuery', function () {

	this.timeout(5000)

	var AirtableQuery = require('../index')
	var base = Airtable.base('appx65wZlf4173yqx')

	it('supports containedIn', function (done) {

		var ids = ['2', '101', '1']

		var query = new AirtableQuery(base('Pokemon'))
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

		var query = new AirtableQuery(base('Pokemon'))
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

		var query = new AirtableQuery(base('Pokemon'))
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

		var query = new AirtableQuery(base('Pokemon'))
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

	it('suports equalTo null', function (done) {

		var query = new AirtableQuery(base('Pokemon'))
		query.notEqualTo('Notes', null)
		query.firstPage().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)
				assert.equal(records[0].get('identifier'), 'snorlax')
				done()
			}
			catch (e) {
				done(e)
			}
		}, function (error) {
			done(error)
		})
	})

	it('supports isError', function (done) {

		var query = new AirtableQuery(base('Pokemon'))
		query.isError('Error')
		query.firstPage().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)
				assert.equal(records[0].get('identifier'), 'snorlax')
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

		var maxExp = 45

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.lessThanOrEqualTo('base experience', maxExp)

		var abilititesQuery = new AirtableQuery(base('Abilities'))
		abilititesQuery.matchesKeyInQuery('pokemon id', 'id', pokemonQuery)
		abilititesQuery.firstPage().then(function (records) {

			try {
				assert(records)
				//assert.equal(records.length, 3)

				records.forEach(function (record) {
					assert(record.get('pokemon'))
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

	it.skip('supports matchesKeyInQuery again', function (done) {

		var minLevel = 23

		var lineupQuery = new AirtableQuery(base('Lineup'))
		lineupQuery.greaterThan('Level', minLevel)

		var abilititesQuery = new AirtableQuery(base('Abilities'))
		abilititesQuery.matchesKeyInQuery('pokemon', 'Pokemon', lineupQuery)
		abilititesQuery.firstPage().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 5)

				records.forEach(function (record) {
					assert(record.get('pokemon id'))
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

	it('supports matchesQuery', function (done) {

		var maxExp = 45

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.lessThanOrEqualTo('base experience', maxExp)

		var abilititesQuery = new AirtableQuery(base('Abilities'))
		abilititesQuery.matchesQuery('pokemon', pokemonQuery)
		abilititesQuery.firstPage().then(function (records) {

			try {
				assert(records)
				//assert.equal(records.length, 3)

				records.forEach(function (record) {
					assert(record.get('pokemon id'))
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

	it('supports greaterThan', function (done) {

		var height = 25
		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.greaterThan('height', height)
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 39)

				records.forEach(function (record) {
					assert(record.get('height') > height)
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

	it('supports greaterThanOrEqualTo', function (done) {

		var height = 25
		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.greaterThanOrEqualTo('height', height)
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 47)

				records.forEach(function (record) {
					assert(record.get('height') >= height)
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

	it('supports lessThan', function (done) {

		var height = 3
		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.lessThan('height', height)
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 16)

				records.forEach(function (record) {
					assert(record.get('height') < height)
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

	it('supports lessThanOrEqualTo', function (done) {

		var height = 2
		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.lessThanOrEqualTo('height', height)
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 16)

				records.forEach(function (record) {
					assert(record.get('height') <= height)
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

	it('supports exists', function (done) {

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.exists('Notes')
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)

				records.forEach(function (record) {
					assert.equal(record.get('identifier'), 'snorlax')
				})

				done()
			}
			catch (e) {
				done(e)
			}
		})
	})

	it('supports doesNotExist', function (done) {

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.doesNotExist('Inverse Notes')
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)

				records.forEach(function (record) {
					assert.equal(record.get('identifier'), 'snorlax')
				})

				done()
			}
			catch (e) {
				done(e)
			}
		})
	})

	it('supports before', function (done) {

		var date = moment.utc('5-7-2017', 'M-D-YYYY')

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.exists('Birthday')
		pokemonQuery.isBefore('Birthday', date)
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)

				records.forEach(function (record) {
					var birthday = moment.utc(record.get('Birthday'))
					assert(birthday.isBefore(date))
				})

				done()
			}
			catch (e) {
				done(e)
			}
		})
	})

	it('supports after', function (done) {

		var date = moment.utc('5-7-2017', 'M-D-YYYY')

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.exists('Birthday')
		pokemonQuery.isAfter('Birthday', date)
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 2)

				records.forEach(function (record) {
					var birthday = moment.utc(record.get('Birthday'))
					assert(birthday.isAfter(date))
				})

				done()
			}
			catch (e) {
				done(e)
			}
		})
	})

	it('supports same', function (done) {

		var date = moment.utc('5-7-2017', 'M-D-YYYY')

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.exists('Birthday')
		pokemonQuery.isSame('Birthday', date)
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 2)

				records.forEach(function (record) {
					var birthday = moment.utc(record.get('Birthday'))
					assert(birthday.isSame(date))
				})

				done()
			}
			catch (e) {
				done(e)
			}
		})
	})

	it('supports same year', function (done) {

		var date = moment.utc('5-7-2017', 'M-D-YYYY')

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.exists('Birthday')
		pokemonQuery.isSame('Birthday', date, 'year')
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 3)

				records.forEach(function (record) {
					var birthday = moment.utc(record.get('Birthday'))
					assert.equal(birthday.year(), date.year())
				})

				done()
			}
			catch (e) {
				done(e)
			}
		})
	})

	it('supports search', function (done) {

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.search('identifier', 'oRl')
		pokemonQuery.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)

				records.forEach(function (record) {
					assert.equal(record.get('identifier'), 'snorlax')
				})

				done()
			}
			catch (e) {
				done(e)
			}
		})
	})

	it('supports each', function (done) {

		var name = 'snorlax'

		var numRecords = 0

		var pokemonQuery = new AirtableQuery(base('Pokemon'))
		pokemonQuery.equalTo('identifier', name)

		var abilititesQuery = new AirtableQuery(base('Abilities'))
		abilititesQuery.matchesKeyInQuery('pokemon id', 'id', pokemonQuery)

		abilititesQuery.each(function (record) {
			assert.equal(record.get('pokemon id'), 143)
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


