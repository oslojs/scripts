const moment = require('moment-timezone')

module.exports = timestamp => ({
  _type: 'date',
  local: moment.tz(timestamp, 'Europe/Oslo').format(),
  utc: moment.utc(timestamp).format(),
  timezone: 'Europe/Oslo',
  offset: moment.tz(timestamp, 'Europe/Oslo').utcOffset()
})
