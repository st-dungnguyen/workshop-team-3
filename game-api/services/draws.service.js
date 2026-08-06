'use strict'

function todayUTC() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
}

function nextMidnightUTC() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function createDrawsService(knex) {
  async function hasPlayedToday(userId) {
    const row = await knex('game_sessions')
      .where({ user_id: userId, play_date: todayUTC() })
      .first()
    return !!row
  }

  async function getNextPlayAt(userId) {
    const played = await hasPlayedToday(userId)
    return played ? nextMidnightUTC() : null
  }

  async function recordPlay(userId, { outcome, couponId = null, pointsAwarded = null }) {
    if (!userId) throw new Error('userId is required')
    if (outcome !== 'win' && outcome !== 'lose') throw new Error(`Invalid outcome: ${outcome}`)

    await knex('game_sessions').insert({
      user_id: userId,
      play_date: todayUTC(),
      outcome,
      coupon_id: couponId,
      points_awarded: pointsAwarded,
    })
  }

  async function getWinSession(userId) {
    return knex('game_sessions')
      .where({ user_id: userId, play_date: todayUTC(), outcome: 'win' })
      .first()
  }

  async function markClaimed(sessionId) {
    await knex('game_sessions')
      .where({ id: sessionId })
      .update({ claimed_at: knex.fn.now() })
  }

  return { hasPlayedToday, getNextPlayAt, recordPlay, getWinSession, markClaimed }
}

module.exports = { createDrawsService }
