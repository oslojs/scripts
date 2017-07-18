const {isPlainObject} = require('lodash')

function referencify(type, obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => ({_ref: [type, item.id].join('-')}))
  }

  if (isPlainObject(obj)) {
    return {_ref: [type, obj.id].join('-')}
  }

  return obj
}

module.exports = referencify
