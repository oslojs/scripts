const hardRejection = require('hard-rejection')
const pAll = require('p-all')
const meetup = require('./services/meetup')
const sanity = require('./services/sanity')
const inspect = require('./util/inspect')
const sanityDate = require('./util/sanityDate')
const referencify = require('./util/referencify')
const deepCamelCase = require('./util/deepCamelCase')
const {syncVenuesById} = require('./syncVenues')
const config = require('./config')

const isScript = require.main === module

async function syncEvents(names) {
  const groupNames = names || config.meetup.groupNames
  const events = await fetchEvents(groupNames)
  const res = await saveEvents(events.reduce((target, chunk) => target.concat(chunk), []))
  inspect(res)
}

function fetchEvents(names) {
  return Promise.all(names.map(fetchEventsForGroup))
}

async function fetchEventsForGroup(groupName) {
  const status = 'cancelled,past,upcoming'
  // eslint-disable-next-line camelcase
  const events = await meetup.getEvents({group_urlname: groupName, status, page: 200})

  const venues = events.results.map(event => event.venue && event.venue.id).filter(Boolean)
  await syncVenuesById(venues)

  return events.results.map(normalizeEvent)
}

function saveEvents(events) {
  return pAll(events.map(event => () => sanity.createOrReplace(event)), {concurrency: 5})
}

function normalizeEvent(rawEvent) {
  const event = deepCamelCase(rawEvent)

  return {
    _id: `event-${event.id}`,
    _type: 'event',
    sourceId: event.id,
    name: event.name,
    status: event.status,
    htmlDescription: event.description,
    time: sanityDate(event.time),
    howToFindUs: event.howToFindUs,

    rsvpLimit: event.rsvpLimit,
    rsvpYesCount: event.yesRsvpCount,
    waitlistCount: event.waitlistCount,

    venue: event.venue && referencify('venue', event.venue),
    group: referencify('group', event.group),
    link: event.link,
    visibility: event.visibility
  }
}

if (isScript) {
  hardRejection()
  syncEvents()
}

module.exports = syncEvents
