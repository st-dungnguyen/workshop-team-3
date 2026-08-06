'use strict'

const axios = require('axios')

const MOCK_DELAY_MS = 500

class CouponService {
  constructor(config, log) {
    this.config = config
    if (!config.couponApiUrl) {
      this.http = null
      return
    }
    this.http = axios.create({
      baseURL: config.couponApiUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-skylark-token': config.skylarkToken,
        'x-client-version': `webview-mini-app-${config.env}`,
      },
    })
    if (log) {
      this.http.interceptors.request.use((req) => {
        log.info({
          couponReq: {
            method: req.method?.toUpperCase(),
            url: `${req.baseURL}${req.url}`,
            headers: req.headers,
            body: req.data,
          },
        }, 'Coupon API request')
        return req
      })
      this.http.interceptors.response.use(
        (res) => {
          log.info({
            couponRes: { status: res.status, headers: res.headers, body: res.data },
          }, 'Coupon API response')
          return res
        },
        (err) => {
          log.error({
            couponRes: {
              status: err.response?.status,
              headers: err.response?.headers,
              body: err.response?.data,
            },
          }, 'Coupon API error response')
          return Promise.reject(err)
        },
      )
    }
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
