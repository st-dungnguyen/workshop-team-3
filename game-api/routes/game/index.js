'use strict'

const { verifyToken, extractBearerToken } = require('../../helpers/jwt.helper')
const CouponService = require('../../services/coupon.service')
const { createDrawsService } = require('../../services/draws.service')
const { createCampaignService } = require('../../services/campaign.service')

module.exports = async function (fastify, opts) {
  const couponService = new CouponService(fastify.config, fastify.log)
  const { hasPlayedToday, getNextPlayAt, recordPlay, getWinSession, markClaimed } = createDrawsService(fastify.knex)
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
      await recordPlay(user.userId, { outcome: 'lose' })
      return { outcome: 'lose', coupon: null }
    }

    const selectedCoupon = await getRandomCoupon(campaignId)
    if (!selectedCoupon) {
      request.log.error({ campaignId }, 'No active coupons found for campaign')
      return reply.code(500).send({ code: 'systemError', message: 'No coupons available' })
    }

    await recordPlay(user.userId, { outcome: 'win', couponId: selectedCoupon.coupon_id })

    return {
      outcome: 'win',
      coupon: {
        id: selectedCoupon.coupon_id,
        title: selectedCoupon.title,
        discount: selectedCoupon.discount,
        endDate: selectedCoupon.end_date,
      },
    }
  })

  // ── POST /game/claim ──────────────────────────────────────────────────────────

  fastify.post('/claim', {
    schema: {
      body: {
        type: 'object',
        required: ['couponId'],
        properties: { couponId: { type: 'string', minLength: 1 } },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
      },
    },
  }, async function (request, reply) {
    const user = await resolveUser(request, reply)
    if (!user) return

    const { couponId } = request.body

    const session = await getWinSession(user.userId)
    if (!session) {
      return reply.code(404).send({ code: 'NO_WIN_SESSION', message: 'No winning session found for today' })
    }
    if (session.coupon_id !== couponId) {
      return reply.code(409).send({ code: 'COUPON_MISMATCH', message: 'couponId does not match session' })
    }

    // Idempotent: already claimed
    if (session.claimed_at) {
      return { ok: true }
    }

    const couponRow = await fastify.knex('campaign_coupons').where({ coupon_id: couponId }).first()

    try {
      await couponService.issueCoupon({
        userId: user.userId,
        token: user.token,
        coupon: couponRow ?? { coupon_id: couponId, start_date: new Date().toISOString(), end_date: new Date().toISOString() },
      })
      await markClaimed(session.id)
      return { ok: true }
    } catch (err) {
      request.log.error(
        { err: err.message, status: err.response?.status, body: err.response?.data },
        'Coupon API error in claim',
      )

      if (err.response?.status === 401) {
        return reply.code(401).send({ code: 'unauthorized' })
      }
      if (err.response?.status === 403) {
        return reply.code(403).send({ code: 'forbidden', message: 'Coupon API rejected the request' })
      }
      if (err.response?.status === 503) {
        return reply.code(503).send({ code: 'maintenance' })
      }
      return reply.code(500).send({ code: 'systemError', message: 'Failed to issue coupon' })
    }
  })
}
