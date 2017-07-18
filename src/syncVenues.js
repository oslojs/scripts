const hardRejection = require('hard-rejection')
const pAll = require('p-all')
const meetup = require('./services/meetup')
const sanity = require('./services/sanity')
const inspect = require('./util/inspect')
const deepCamelCase = require('./util/deepCamelCase')
const config = require('./config')

const isScript = require.main === module

async function syncVenues(names) {
  const groupNames = names || config.meetup.groupNames
  const venues = await fetchVenues(groupNames)
  const res = await saveVenues(venues.reduce((target, chunk) => target.concat(chunk), []))
  inspect(res)
}

async function syncVenuesById(ids) {
  // eslint-disable-next-line camelcase
  const response = await meetup.getVenues({venue_id: ids.join(',')})
  const venues = response.results
  if (!venues.length) {
    return null
  }

  return saveVenues(venues.map(normalizeVenue))
}

async function syncVenue(id) {
  // eslint-disable-next-line camelcase
  const venues = await meetup.getVenues({venue_id: id})
  const venue = venues.results[0]
  if (!venue) {
    return null
  }

  return saveVenues([normalizeVenue(venue)])
}

function fetchVenues(names) {
  return Promise.all(names.map(fetchVenuesForGroup))
}

async function fetchVenuesForGroup(groupName) {
  const limit = 200
  let offset = 0
  let venues = []
  let response
  do {
    // eslint-disable-next-line camelcase, no-await-in-loop
    response = await meetup.getVenues({group_urlname: groupName, page: limit, offset})
    venues = venues.concat(response.results)
    offset += limit
  } while (response.results.length === limit)

  return venues.map(normalizeVenue)
}

function saveVenues(venues) {
  return pAll(venues.map(venue => () => sanity.createOrReplace(venue)), {concurrency: 5})
}

function normalizeVenue(rawVenue) {
  const venue = deepCamelCase(rawVenue)
  return {
    _id: `venue-${venue.id}`,
    _type: 'venue',
    sourceId: venue.id,
    name: venue.name,
    location: venue.lat && venue.lon ? {
      lat: venue.lat,
      lng: venue.lon,
    } : undefined,
    address1: venue.address1,
    address2: venue.address2,
    address3: venue.address3
  }
}

if (isScript) {
  hardRejection()
  syncVenues()
}

module.exports = {syncVenues, syncVenue, syncVenuesById}
