'use strict'

/** @param {import('knex').Knex} knex */
exports.up = async function (knex) {
  const has = await knex.schema.hasColumn('game_sessions', 'claimed_at')
  if (!has) {
    await knex.schema.table('game_sessions', (table) => {
      table.timestamp('claimed_at', { useTz: true }).nullable()
    })
  }
}

/** @param {import('knex').Knex} knex */
exports.down = async function (knex) {
  await knex.schema.table('game_sessions', (table) => {
    table.dropColumn('claimed_at')
  })
}
