const client = require('@sanity/client')
const config = require('../config')

module.exports = client(config.sanity)
