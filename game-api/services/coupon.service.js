'use strict'

const axios = require('axios')

const MOCK_DELAY_MS = 500

class CouponService {
  constructor(config) {
    this.config = config
    this.http = config.couponApiUrl
      ? axios.create({
          baseURL: config.couponApiUrl,
          headers: {
            'Content-Type': 'application/json',
            'x-skylark-token': config.skylarkToken,
            'x-client-version': `webview-mini-app-${config.env}`,
          },
        })
      : null
  }

  async issueCoupon({ userId, token }) {
    if (!this.http) {
      // Local dev: no COUPON_API_URL configured — return mock coupon ID
      await new Promise((r) => setTimeout(r, MOCK_DELAY_MS))
      return this.config.couponId
    }

    const { couponId, couponStartDate, couponEndDate } = this.config

    const response = await this.http.post(
      '/segment',
      {
        userId,
        member: '1',
        coupons: [{ id: couponId, startDate: couponStartDate, endDate: couponEndDate }],
        information: [],
        banners: [],
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    return response.data.coupons[0].id
  }
}

module.exports = CouponService
