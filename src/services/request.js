const getIt = require('get-it')
const {promise, httpErrors} = require('get-it/middleware')

module.exports = getIt([
  promise(),
  httpErrors()
])
