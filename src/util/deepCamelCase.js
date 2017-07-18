const {camelCase, isPlainObject} = require('lodash')

function camelCaseKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelCaseKeys)
  }

  if (isPlainObject(obj)) {
    return Object.keys(obj).reduce((target, key) => {
      target[camelCase(key)] = camelCaseKeys(obj[key])
      return target
    }, {})
  }

  return obj
}

module.exports = camelCaseKeys
