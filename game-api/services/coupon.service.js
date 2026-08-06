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

  // coupon: { coupon_id, start_date, end_date }
  async issueCoupon({ userId, token, coupon }) {
    if (!this.http) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY_MS))
      return coupon.coupon_id
    }

    const response = await this.http.post(
      '/segment',
      {
        userId,
        member: '1',
        coupons: [{ id: coupon.coupon_id, startDate: coupon.start_date, endDate: coupon.end_date }],
        information: [],
        banners: [],
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    return response.data.coupons[0].id
  }
}

module.exports = CouponService
