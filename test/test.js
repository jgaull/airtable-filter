

var assert = require('assert')
var moment = require('moment')

var Airtable = require('airtable')
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY || ''
})

describe('Filter', function () {

	this.timeout(5000)

	var Filter = require('../filter')
	var table = Airtable.base('appx65wZlf4173yqx')

	it('supports containedIn', function (done) {

		var ids = ['2', '101', '1']

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('id').containedIn(ids)
		pokemon.firstPage().then(function(records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.id.containedIn(recordIds)
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('identifier').equalTo(name)
		pokemon.firstPage().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.id.equalTo('rec26TzCrvUuZvKLC')
		pokemon.firstPage().then(function (records) {

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

	it('suports notEqualTo null', function (done) {

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Notes').notEqualTo(null)
		pokemon.firstPage().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Error').isError()
		pokemon.firstPage().then(function (records) {

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

	it('supports matchesKeyInFilter', function (done) {

		var maxExp = 45

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('base experience').lessThanOrEqualTo(maxExp)

		var abilities = new Filter(table('Abilities'))
		abilities.field('pokemon id').matchesKeyInFilter('id', pokemon)
		abilities.firstPage().then(function (records) {

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

		var lineupQuery = new Filter(table('Lineup'))
		lineupQuery.greaterThan('Level', minLevel)

		var abilititesQuery = new Filter(table('Abilities'))
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

	it('supports matchesFilter', function (done) {

		var maxExp = 45

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('base experience').lessThanOrEqualTo(maxExp)

		var abilities = new Filter(table('Abilities'))
		abilities.field('pokemon').matchesFilter(pokemon)
		abilities.firstPage().then(function (records) {

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
		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('height').greaterThan(height)
		pokemon.all().then(function (records) {

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
		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('height').greaterThanOrEqualTo(height)
		pokemon.all().then(function (records) {

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
		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('height').lessThan(height)
		pokemon.all().then(function (records) {

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
		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('height').lessThanOrEqualTo(height)
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Notes').exists()
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Inverse Notes').doesNotExist()
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Birthday').exists().isBefore(date)
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Birthday').exists('Birthday').isAfter(date)
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Birthday').exists().isSame(date)
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('Birthday').exists().isSame(date, 'year')
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('identifier').search('oRl')
		pokemon.all().then(function (records) {

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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.field('identifier').equalTo(name)

		var abilitites = new Filter(table('Abilities'))
		abilitites.field('pokemon id').matchesKeyInFilter('id', pokemon)
		abilitites.each(function (record) {

			try {
				assert.equal(record.get('pokemon id'), 143)
				numRecords++
			}
			catch (e) {
				console.log(done(e))
			}

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


