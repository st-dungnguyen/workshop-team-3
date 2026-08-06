'use strict'

// In-memory store keyed by userId. Replace with Firestore in production.
const store = new Map()

function todayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD in UTC
}

function hasPlayedToday(userId) {
  const records = store.get(userId) || []
  const today = todayKey()
  return records.some((r) => r.date === today)
}

function getNextPlayAt(userId) {
  if (!hasPlayedToday(userId)) return null
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}

function recordPlay(userId, { outcome, couponId = null }) {
  const records = store.get(userId) || []
  records.push({ date: todayKey(), outcome, couponId, createdAt: new Date().toISOString() })
  store.set(userId, records)
}

module.exports = { hasPlayedToday, getNextPlayAt, recordPlay }
