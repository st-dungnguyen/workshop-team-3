'use strict'

/**
 * Seed a default campaign with example coupon tiers for local development.
 * In production, replace coupon_id, labels, and points values via the DB or a separate seed.
 *
 * Tier weights control relative draw probability (higher = more common).
 * Tier points control how many Skylark Points the winner receives (rarer = more points).
 * POINT_LOSE env var controls participation points for non-winners.
 */

/** @param {import('knex').Knex} knex */
exports.seed = async function (knex) {
  const campaignId = process.env.VITE_CAMPAIGN_ID || 'default-campaign'

  const existing = await knex('campaigns').where({ id: campaignId }).first()
  if (existing) return

  const startDate = process.env.COUPON_START_DATE || new Date().toISOString()
  const endDate = process.env.COUPON_END_DATE || (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString()
  })()

  const variants = (process.env.GAME_VARIANTS || 'scratch-card,flip-card')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  await knex('campaigns').insert({
    id: campaignId,
    name: process.env.COUPON_TITLE || 'すかいらーくグループ全店共通クーポン',
    game_variants: `{${variants.join(',')}}`,
    is_active: true,
    win_probability: Number(process.env.WIN_PROBABILITY) || 0.5,
  })

  // Example 8-tier coupon set — replace coupon_id, labels, weights, and points for each campaign.
  // weight: higher = drawn more often (relative probability)
  // points: Skylark Points awarded to the winner of this tier (null = no point grant)
  await knex('campaign_coupons').insert([
    {
      campaign_id: campaignId,
      coupon_id: '2000000001',
      title: 'キャンペーン 1等',
      discount: '1等賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 1,
    },
    {
      campaign_id: campaignId,
      coupon_id: '2000000002',
      title: 'キャンペーン 2等',
      discount: '2等賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 3,
    },
    {
      campaign_id: campaignId,
      coupon_id: '2000000003',
      title: 'キャンペーン 3等',
      discount: '3等賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 8,
    },
    {
      campaign_id: campaignId,
      coupon_id: '2000000004',
      title: 'キャンペーン 4等',
      discount: '4等賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 12,
    },
    {
      campaign_id: campaignId,
      coupon_id: '2000000005',
      title: 'キャンペーン 5等',
      discount: '5等賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 15,
    },
    {
      campaign_id: campaignId,
      coupon_id: '2000000006',
      title: 'キャンペーン 6等',
      discount: '6等賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 18,
    },
    {
      campaign_id: campaignId,
      coupon_id: '2000000007',
      title: 'キャンペーン 7等',
      discount: '7等賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 20,
    },
    {
      campaign_id: campaignId,
      coupon_id: '2000000008',
      title: 'キャンペーン シークレット',
      discount: 'シークレット賞品',
      start_date: startDate,
      end_date: endDate,
      weight: 1,
    },
  ])
}
