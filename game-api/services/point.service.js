'use strict'

const axios = require('axios')

class PointService {
  constructor(config) {
    this.config = config
    this.enabled = !!(config.pointApiUrl && config.pointClientId && config.pointClientSecret)
  }

  async _getAccessToken() {
    const response = await axios.post(
      this.config.pointAuth0Url,
      {
        grant_type: 'client_credentials',
        client_id: this.config.pointClientId,
        client_secret: this.config.pointClientSecret,
        audience: this.config.pointApiUrl,
      },
      { headers: { 'Content-Type': 'application/json' } },
    )
    return response.data.access_token
  }

  async grantPoints({ userId, point }) {
    if (!this.enabled) {
      return point
    }

    const accessToken = await this._getAccessToken()

    const body = {
      userId,
      point,
      pointTypeId: this.config.pointTypeId,
      campaignCd: this.config.pointCampaignCd,
      campaignName: this.config.pointCampaignName,
    }
    if (this.config.pointExpiredAt) {
      body.expiredAt = this.config.pointExpiredAt
    }

    const response = await axios.post(`${this.config.pointApiUrl}/points/grant`, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data.point ?? point
  }
}

module.exports = PointService
