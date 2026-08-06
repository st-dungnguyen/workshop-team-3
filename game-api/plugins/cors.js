'use strict'

const fp = require('fastify-plugin')
const cors = require('@fastify/cors')

module.exports = fp(async function (fastify, opts) {
  // Must be registered BEFORE @fastify/cors so this hook runs first.
  // Chrome's Private Network Access (PNA) policy blocks public HTTPS origins
  // (e.g. Cloudflare tunnel) from reaching loopback addresses unless the server
  // responds to the OPTIONS preflight with Access-Control-Allow-Private-Network: true.
  fastify.addHook('onRequest', (req, reply, done) => {
    if (req.headers['access-control-request-private-network']) {
      reply.header('Access-Control-Allow-Private-Network', 'true')
    }
    done()
  })

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  })
})
