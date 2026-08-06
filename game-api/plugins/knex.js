'use strict'

const fp = require('fastify-plugin')
const Knex = require('knex')
const knexConfig = require('../knexfile')

module.exports = fp(async function (fastify, opts) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const knex = Knex(knexConfig)

  await knex.raw('SELECT 1')

  fastify.decorate('knex', knex)

  fastify.addHook('onClose', async () => {
    await knex.destroy()
  })
}, {
  name: 'knex',
})
