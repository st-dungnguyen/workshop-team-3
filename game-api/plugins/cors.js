'use strict'

const fp = require('fastify-plugin')
const cors = require('@fastify/cors')

module.exports = fp(async function (fastify, opts) {
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  })
})
