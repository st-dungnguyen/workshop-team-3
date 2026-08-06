'use strict'

const { verifyToken } = require('../../helpers/jwt.helper')

module.exports = async function (fastify, opts) {
  fastify.post('/validate', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string', minLength: 1 } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            userId: { type: 'string' },
          },
        },
      },
    },
  }, async function (request, reply) {
    const { token } = request.body

    let payload
    try {
      payload = await verifyToken(token)
    } catch (err) {
      request.log.warn({ err: err.message }, 'Token validation failed')
      return reply.code(401).send({ code: 'unauthorized', message: 'Invalid or expired token' })
    }

    const userId = payload.sub
    if (!userId) {
      return reply.code(403).send({ code: 'TOKEN_INVALID', message: 'Token missing sub claim' })
    }

    return { success: true, userId }
  })
}
