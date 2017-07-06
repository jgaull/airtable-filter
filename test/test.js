

var assert = require('assert')
var moment = require('moment')

var Airtable = require('airtable')
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY || ''
})

describe('Filter', function () {

	this.timeout(10000)

	var Filter = require('../filter')
	var table = Airtable.base('appx65wZlf4173yqx')

	it('supports containedIn', function (done) {

		var ids = ['2', '101', '1']

		var pokemon = new Filter(table('Pokemon'))
		pokemon.where('id').isContainedIn(ids)
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
		pokemon.id.isContainedIn(recordIds)
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
		pokemon.where('identifier').isEqualTo(name)
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
		pokemon.id.isEqualTo('rec26TzCrvUuZvKLC')
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
		pokemon.where('Notes').isNotEqualTo(null)
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
		pokemon.where('Error').isError()
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

	it('supports matchesFieldInFilter', function (done) {

		var maxExp = 45

		var pokemon = new Filter(table('Pokemon'))
		pokemon.where('base experience').isLessThanOrEqualTo(maxExp)

		var abilities = new Filter(table('Abilities'))
		abilities.where('pokemon id').matchesFieldInFilter('id', pokemon)
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
		lineupQuery.isGreaterThan('Level', minLevel)

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
		pokemon.where('base experience').isLessThanOrEqualTo(maxExp)

		var abilities = new Filter(table('Abilities'))
		abilities.where('pokemon').matchesFilter(pokemon)
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
		pokemon.where('height').isGreaterThan(height)
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
		pokemon.where('height').isGreaterThanOrEqualTo(height)
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
		pokemon.where('height').isLessThan(height)
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
		pokemon.where('height').isLessThanOrEqualTo(height)
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
		pokemon.where('Notes').exists()
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
		pokemon.where('Inverse Notes').doesNotExist()
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
		pokemon.where('Birthday').exists().isBefore(date)
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
		pokemon.where('Birthday').exists('Birthday').isAfter(date)
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
		pokemon.where('Birthday').exists().isSame(date)
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
		pokemon.where('Birthday').exists().isSame(date, 'year')
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
		pokemon.where('identifier').search('oRl')
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

	it.only('supports include', function (done) {

		var pokemon = new Filter(table('Pokemon'))
		pokemon.where('identifier').search('oRl')
		pokemon.include('Abilities', table('Abilities'))
		pokemon.all().then(function (records) {

			try {
				assert(records)
				assert.equal(records.length, 1)
				//console.log('records: ' + JSON.stringify(records))
				var abilityIds = [143.17,143.47,143.82]

				records.forEach(function (record) {
					assert.equal(record.get('identifier'), 'snorlax')

					var abilitites = record.get('Abilities')
					for (var i = 0; i < abilitites.length; i++) {
						var ability = abilitites[i]

						assert.equal(typeof ability, 'object')
						assert(ability.id)
						assert.equal(ability.get('id'), abilityIds[i])
					}
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

		var pokemon = new Filter(table('Pokemon'))
		pokemon.where('identifier').isEqualTo(name)

		var abilitites = new Filter(table('Abilities'))
		abilitites.where('pokemon id').matchesFieldInFilter('id', pokemon)
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


