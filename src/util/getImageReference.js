const crypto = require('crypto')
const sanity = require('../services/sanity')
const request = require('../services/request')

module.exports = async photo => {
  if (!photo || !photo.highresLink) {
    return undefined
  }

  const imageData = await request({url: photo.highresLink, rawBody: true})
  const hash = crypto.createHash('sha256').update(imageData.body).digest('hex')

  let assetId = await getAssetIdForHash(hash)
  if (!assetId) {
    const asset = await sanity.assets.upload('image', imageData.body, {label: hash})
    assetId = asset.document._id
  }

  return {_ref: assetId}
}

function getAssetIdForHash(label) {
  const dataType = 'sanity.imageAsset'
  const query = '*[_type == $dataType && label == $label][0]._id'
  return sanity.fetch(query, {dataType, label})
}
