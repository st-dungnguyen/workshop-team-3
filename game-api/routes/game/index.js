'use strict'

const { verifyToken, extractBearerToken } = require('../../helpers/jwt.helper')
const CouponService = require('../../services/coupon.service')
const PointService = require('../../services/point.service')
const { createDrawsService } = require('../../services/draws.service')
const { createCampaignService } = require('../../services/campaign.service')

module.exports = async function (fastify, opts) {
  const couponService = new CouponService(fastify.config)
  const pointService = new PointService(fastify.config)
  const { hasPlayedToday, getNextPlayAt, recordPlay } = createDrawsService(fastify.knex)
  const { getActiveConfig, getRandomCoupon } = createCampaignService(fastify.knex)

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

  // ── GET /game/config ─────────────────────────────────────────────────────────

  fastify.get('/config', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            campaignId: { type: 'string' },
            gameVariant: { type: 'string' },
          },
          required: ['campaignId', 'gameVariant'],
        },
      },
    },
  }, async function (request, reply) {
    const user = await resolveUser(request, reply)
    if (!user) return

    const config = await getActiveConfig()
    if (!config) {
      return reply.code(404).send({ code: 'NO_ACTIVE_CAMPAIGN', message: 'No active campaign found' })
    }

    return { campaignId: config.campaignId, gameVariant: config.gameVariant }
  })

  // ── GET /game/eligibility ─────────────────────────────────────────────────────

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

    const eligible = !(await hasPlayedToday(user.userId))
    return { eligible, nextPlayAt: eligible ? null : await getNextPlayAt(user.userId) }
  })

  // ── POST /game/play ───────────────────────────────────────────────────────────

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
            points: { type: 'integer', nullable: true },
          },
        },
      },
    },
  }, async function (request, reply) {
    const user = await resolveUser(request, reply)
    if (!user) return

    if (await hasPlayedToday(user.userId)) {
      return reply.code(403).send({ code: 'ALREADY_PLAYED', message: 'Already played today' })
    }

    const { campaignId } = request.body

    const campaignConfig = await getActiveConfig()
    if (!campaignConfig || campaignConfig.campaignId !== campaignId) {
      return reply.code(404).send({ code: 'CAMPAIGN_NOT_FOUND', message: 'Campaign not found or inactive' })
    }

    const isWin = Math.random() < campaignConfig.winProbability

    if (!isWin) {
      // Participation points for non-winners (global config, fire-and-forget)
      let pointsAwarded = null
      try {
        pointsAwarded = await pointService.grantPoints({
          userId: user.userId,
          point: fastify.config.pointLose,
        })
      } catch (err) {
        request.log.warn({ err: err.message, userId: user.userId }, 'Lose point grant failed (non-fatal)')
      }
      await recordPlay(user.userId, { outcome: 'lose', pointsAwarded })
      return { outcome: 'lose', coupon: null, points: pointsAwarded }
    }

    const selectedCoupon = await getRandomCoupon(campaignId)
    if (!selectedCoupon) {
      request.log.error({ campaignId }, 'No active coupons found for campaign')
      return reply.code(500).send({ code: 'systemError', message: 'No coupons available' })
    }

    // Win points come from the coupon tier, not a global config value
    let pointsAwarded = null
    try {
      if (selectedCoupon.points != null) {
        pointsAwarded = await pointService.grantPoints({
          userId: user.userId,
          point: selectedCoupon.points,
        })
      }
    } catch (err) {
      request.log.warn({ err: err.message, userId: user.userId }, 'Win point grant failed (non-fatal)')
    }

    try {
      const issuedCouponId = await couponService.issueCoupon({
        userId: user.userId,
        token: user.token,
        coupon: selectedCoupon,
      })
      await recordPlay(user.userId, { outcome: 'win', couponId: issuedCouponId, pointsAwarded })

      return {
        outcome: 'win',
        coupon: {
          id: issuedCouponId,
          title: selectedCoupon.title,
          discount: selectedCoupon.discount,
          endDate: selectedCoupon.end_date,
        },
        points: pointsAwarded,
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
