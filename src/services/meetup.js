const pify = require('pify')
const meetupApi = require('meetup-api')
const config = require('../config')

const {apiKey} = config.meetup
const meetupCbApi = meetupApi({key: apiKey})
const meetup = pify(meetupCbApi)

module.exports = meetup
