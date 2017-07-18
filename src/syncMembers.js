const hardRejection = require('hard-rejection')
const pAll = require('p-all')
const pMap = require('p-map')
const meetup = require('./services/meetup')
const sanity = require('./services/sanity')
const inspect = require('./util/inspect')
const getImageReference = require('./util/getImageReference')
const config = require('./config')

const isScript = require.main === module

async function syncMembers(names) {
  const groupNames = names || config.meetup.groupNames
  const members = await fetchMembers(groupNames)
  const res = await saveMembers(members.reduce((target, chunk) => target.concat(chunk), []))
  inspect(res)
}

async function syncMember(id, groupId, opts) {
  const member = await meetup.getMember({id})
  const members = [await normalizeMember(member, groupId, opts)]
  return saveMembers(members)
}

function fetchMembers(names) {
  return Promise.all(names.map(fetchMembersForGroup))
}

async function fetchMembersForGroup(groupName) {
  const group = await meetup.getGroup({urlname: groupName, only: 'id'})
  const groupId = group.id

  const only = 'id,name,bio,photo,joined'
  const limit = 200
  let offset = 0
  let members = []
  let response
  do {
    // eslint-disable-next-line camelcase, no-await-in-loop
    response = await meetup.getMembers({group_urlname: groupName, page: limit, only, offset})
    members = members.concat(response.results)
    offset += limit
  } while (response.meta.total_count > Math.max(members.length, offset))

  const normalize = member => normalizeMember(member, groupId)
  return pMap(members, normalize, {concurrency: 5})
}

function saveMembers(members) {
  return pAll(members.map(member => () => sanity.createOrReplace(member)), {concurrency: 5})
}

async function normalizeMember(member, groupId, opts = {}) {
  return {
    _id: `member-${groupId}-${member.id}`,
    _type: 'member',
    sourceId: member.id,
    name: member.name,
    bio: member.bio,
    group: {_ref: `group-${groupId}`, _weak: opts.weakGroup},
    joined: (new Date(member.joined)).toISOString(),
    photo: await getImageReference(member.photo),
  }
}

if (isScript) {
  hardRejection()
  syncMembers()
}

module.exports = {syncMembers, syncMember}
