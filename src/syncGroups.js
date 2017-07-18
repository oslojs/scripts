const hardRejection = require('hard-rejection')
const meetup = require('./services/meetup')
const sanity = require('./services/sanity')
const getImageReference = require('./util/getImageReference')
const deepCamelCase = require('./util/deepCamelCase')
const inspect = require('./util/inspect')
const {syncMember} = require('./syncMembers')
const config = require('./config')

const isScript = require.main === module

async function syncGroups(names) {
  const groupNames = names || config.meetup.groupNames
  const groups = await fetchGroups(groupNames)
  const res = await saveGroups(groups)
  inspect(res)
}

function fetchGroups(names) {
  return Promise.all(names.map(fetchGroup))
}

async function fetchGroup(groupName) {
  const rawGroup = await meetup.getGroup({urlname: groupName})
  if (!rawGroup) {
    return null
  }

  const group = deepCamelCase(rawGroup)
  await syncMember(group.organizer.id, group.id, {weakGroup: true})

  return {
    _id: `group-${group.id}`,
    _type: 'group',
    sourceId: group.id,
    name: group.name,
    urlName: group.urlname,
    htmlDescription: group.description,
    created: new Date(group.created),
    organizer: {_ref: `member-${group.id}-${group.organizer.id}`},
    who: group.who,
    groupPhoto: await getImageReference(group.groupPhoto),
    keyPhoto: await getImageReference(group.keyPhoto)
  }
}

function saveGroups(groups) {
  return groups.reduce(
    (transaction, group) => transaction.createOrReplace(group),
    sanity.transaction()
  ).commit()
}

if (isScript) {
  hardRejection()
  syncGroups()
}

module.exports = syncGroups
