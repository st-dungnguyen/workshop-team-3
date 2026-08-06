'use strict'

const { verifyToken, extractBearerToken } = require('../../helpers/jwt.helper')
const CouponService = require('../../services/coupon.service')
const { hasPlayedToday, getNextPlayAt, recordPlay } = require('../../services/draws.service')

module.exports = async function (fastify, opts) {
  const couponService = new CouponService(fastify.config)

  async function resolveUser(request, reply) {
    const token = extractBearerToken(request)
    if (!token) {
      reply.code(401).send({ code: 'unauthorized', message: 'Missing Authorization header' })
      return null
    }

    let payload
    try {
      payload = await verifyToken(token)
    } catch (err) {
      request.log.warn({ err: err.message }, 'Token invalid in game route')
      reply.code(401).send({ code: 'unauthorized', message: 'Invalid or expired token' })
      return null
    }

    if (!payload.sub) {
      reply.code(403).send({ code: 'TOKEN_INVALID', message: 'Token missing sub claim' })
      return null
    }

    return { userId: payload.sub, token }
  }

  fastify.get('/eligibility', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            eligible: { type: 'boolean' },
            nextPlayAt: { type: 'string', nullable: true },
          },
        },
      },
    },
  }, async function (request, reply) {
    const user = await resolveUser(request, reply)
    if (!user) return

    const eligible = !hasPlayedToday(user.userId)
    return { eligible, nextPlayAt: eligible ? null : getNextPlayAt(user.userId) }
  })

  fastify.post('/play', {
    schema: {
      body: {
        type: 'object',
        required: ['campaignId'],
        properties: { campaignId: { type: 'string', minLength: 1 } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            outcome: { type: 'string', enum: ['win', 'lose'] },
            coupon: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                discount: { type: 'string' },
                endDate: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async function (request, reply) {
    const user = await resolveUser(request, reply)
    if (!user) return

    if (hasPlayedToday(user.userId)) {
      return reply.code(403).send({ code: 'ALREADY_PLAYED', message: 'Already played today' })
    }

    const isWin = Math.random() < fastify.config.winProbability

    if (!isWin) {
      recordPlay(user.userId, { outcome: 'lose' })
      return { outcome: 'lose' }
    }

    try {
      const couponId = await couponService.issueCoupon({
        userId: user.userId,
        token: user.token,
      })
      recordPlay(user.userId, { outcome: 'win', couponId })

      return {
        outcome: 'win',
        coupon: {
          id: couponId,
          title: fastify.config.couponTitle,
          discount: fastify.config.couponDiscount,
          endDate: fastify.config.couponEndDate,
        },
      }
    } catch (err) {
      request.log.error({ err: err.message, status: err.response?.status }, 'Coupon API error')

      if (err.response?.status === 401) {
        return reply.code(401).send({ code: 'unauthorized' })
      }
      if (err.response?.status === 503) {
        return reply.code(503).send({ code: 'maintenance' })
      }
      return reply.code(500).send({ code: 'systemError', message: 'Failed to issue coupon' })
    }
  })
}
