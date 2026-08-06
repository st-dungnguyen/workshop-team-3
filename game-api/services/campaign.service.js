'use strict'

function createCampaignService(knex) {
  async function getActiveConfig() {
    const campaign = await knex('campaigns').where({ is_active: true }).first()
    if (!campaign) return null

    return {
      campaignId: campaign.id,
      gameVariant: campaign.game_variant,
      winProbability: Number(campaign.win_probability),
    }
  }

  async function getRandomCoupon(campaignId) {
    const now = new Date().toISOString()
    const coupons = await knex('campaign_coupons')
      .where({ campaign_id: campaignId })
      .where('end_date', '>', now)
      .where('start_date', '<=', now)

    if (coupons.length === 0) return null

    const totalWeight = coupons.reduce((sum, c) => sum + c.weight, 0)
    let random = Math.random() * totalWeight

    for (const coupon of coupons) {
      random -= coupon.weight
      if (random <= 0) return coupon
    }

    return coupons[coupons.length - 1]
  }

  return { getActiveConfig, getRandomCoupon }
}

module.exports = { createCampaignService }
