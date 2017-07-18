/* eslint-disable no-process-env */
module.exports = {
  env: process.env.NODE_ENV || 'development',

  meetup: {
    apiKey: process.env.OSLOJS_MEETUP_API_KEY,
    groupNames: [
      'oslojs',
      'framsia'
    ],
  },

  sanity: {
    token: process.env.OSLOJS_SANITY_API_KEY,
    projectId: 'ex47uq3w',
    dataset: 'oslojs',
  }
}
