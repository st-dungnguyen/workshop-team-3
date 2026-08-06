'use strict'

require('dotenv').config()
const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  const env = process.env.ENV || 'local'
  const isLocal = env === 'local'

  if (!isLocal) {
    const required = ['COUPON_API_URL', 'X_SKYLARK_TOKEN', 'AUTH0_ISSUER']
    const missing = required.filter((k) => !process.env[k])
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`)
    }
  }

  const endDate = process.env.COUPON_END_DATE || (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString()
  })()

  fastify.decorate('config', {
    env,
    isLocal,
    couponApiUrl: process.env.COUPON_API_URL || '',
    skylarkToken: process.env.X_SKYLARK_TOKEN || '',
    auth0Issuer: process.env.AUTH0_ISSUER || '',
    winProbability: Number(process.env.WIN_PROBABILITY) || 0.5,
    couponId: process.env.COUPON_ID || '1000000001',
    couponTitle: process.env.COUPON_TITLE || 'すかいらーくグループ全店共通クーポン',
    couponDiscount: process.env.COUPON_DISCOUNT || '500円OFF',
    couponStartDate: process.env.COUPON_START_DATE || new Date().toISOString(),
    couponEndDate: endDate,
  })
})
