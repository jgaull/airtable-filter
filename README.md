# airtable-query
A programmatic interface for creating Airtable filter functions.

##Installation
```
$ npm install --save airtable-filter
```

##Usage
```javascript
//create an instance of Airtable
var Airtable = require('airtable')
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'YOUR_API_KEY'
})

//create a reference to your desired Table
var Pokemon = Airtable.base('appx65wZlf4173yqx').table('Pokemon')

//create a Filter  with the given table
var pokemon = new Filter(table('Pokemon'))

//add operations to a specific field
pokemon.field('name').isEqualTo(name)

//retreive all the records matching a query
pokemon.all().then(function(records) {
	//do some stuff
})

//retreive just the first page of records
pokemon.firstPage().then(function (records) {
	//do some stuff
})

//iterate over each record in a result
pokemon.each(function (record) {
	//called for each record in the result
}).then(function () {
	//called after all records have been iterated
})

//query for built in values like RECORD_ID()
var recordIds = ['rec26TzCrvUuZvKLC', 'recZjsPlLtKAwgK4I', 'reczBVQyj0iGlPNO5']
pokemon.id.containedIn(recordIds)
pokemon.all().then(function (records) {
	//all the pokemon where RECORD_ID() is in the array of recordIds
})

//or CREATED_TIME()
var now = Date.now()
pokemon.createdTime.lessThanOrEqualTo(now)
pokemon.all().then(function (records) {
	//all the pokemon where CREATED_AT() is before now
})

//use additional search parameters
var params = {
	pageSize: 3,
	view: 'My Lineup',
	sort: [{
		field: 'level',
		direction: 'desc'
	}],
	filterByFormula: undefined //this will be overwritten
}
pokemon.firstPage(params).then(function (records) {
	//the first 3 records in the My Lineup sorted from highest level to lowest level
})

```