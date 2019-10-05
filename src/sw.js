'use strict'

global.window = self // hacky hacky patch

if (global.DEBUG) {
  global.EVENTLOG = []

  for (const prop in console) { // eslint-disable-line guard-for-in
    const o = console[prop].bind(console) // eslint-disable-line no-console
    console[prop] = (...a) => { // eslint-disable-line no-console
      global.EVENTLOG.push([Date.now(), prop, a])
      return o(...a)
    }
  }
}

const Router = require('sw-power-router')
const Arweave = require('./arweave')
const arweaveControl = require('./control')

const {schema} = require('./utils')

module.exports = async (config) => {
  /* Load config */

  const {value, error} = schema.validate(config)

  if (error) {
    throw error
  }

  config = value

  /* Init */
  const arweave = Arweave(config.arweave)

  const router = Router(self)

  if (global.DEBUG) {
    router.route({
      method: 'GET',
      path: '/_debug/eventlog',
      handler: () => global.EVENTLOG
    })
  }

  const staticProvider = await config.static.provider(config.static.config, arweave)

  router.route({
    method: 'GET',
    path: '/{asset*}',
    handler: staticProvider
  })

  const a = {
    route: router.route,
    arweave
  }

  arweaveControl(a, config.api.prefix)

  return a
}
