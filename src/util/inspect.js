/* eslint-disable no-console */
const util = require('util')

module.exports = (obj, opts = {}) =>
  console.log(util.inspect(obj, Object.assign({colors: true, depth: 5}, opts)))
